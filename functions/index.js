//
// NOTE:(pv) There are two "firestore" classes.
//  1) firestoreServer: Manages the server-side function hooks
//  2) firestoreClient: Full firestore client
//      https://cloud.google.com/nodejs/docs/reference/firestore/latest/
//

const functions = require('firebase-functions')
const firestoreServer = functions.firestore
const admin = require('firebase-admin')
admin.initializeApp(functions.config().firebase)
const firestoreClient = admin.firestore()

const FIELD_IS_TIMESTAMPED = 'isTimestamped'
const FIELD_TIMESTAMP_SERVER_PRICED = 'timestampServerPriced'

//
// https://firebase.google.com/docs/functions/write-firebase-functions
// https://firebase.google.com/docs/firestore/extend-with-functions
// https://github.com/firebase/functions-samples
//

exports.onLocationPriceCreate = firestoreServer
  .document('/deployments/{deploymentId}/locations/{locationId}/prices/{priceId}')
  .onCreate(onLocationPriceCreate)

/*
 * https://firebase.google.com/docs/firestore/extend-with-functions#limitations_and_guarantees
 * "While developing your applications, keep in mind that both Cloud Firestore and Cloud Functions
 * for Firebase are currently in beta which may result in unexpected behavior.
 * 
 * A few known limitations include:
 *  * It may take more than 5 seconds for a function to be triggered after a change to Cloud
 *    Firestore data.
 *  * Delivery of function invocations is not currently guaranteed. As the Cloud Firestore and
 *    Cloud Functions integration improves, we plan to guarantee "at least once" delivery.
 *    However, this may not always be the case during beta. This may also result in multple
 *    invocations for a single event, so for the highest quality functions ensure that the
 *    functions are written to be idempotent.
 *  * Ordering is not guaranteed. It is possible that rapid changes could trigger function
 *    invocations in an unexpected order."
 */
function onLocationPriceCreate(event) {
  console.log('onLocationPriceCreate arguments', arguments)

  const eventTimestamp = new Date(event.timestamp)

  const params = event.params
  // console.log('onLocationPriceCreate params', params)
  const deploymentId = params.deploymentId
  const locationId = params.locationId
  const priceId = params.priceId

  const newDocumentSnapshot = event.data
  console.log('onLocationPriceCreate newDocumentSnapshot', newDocumentSnapshot)
  const newDocumentData = newDocumentSnapshot.exists ? newDocumentSnapshot.data() : null
  console.log('onLocationPriceCreate newDocumentData', newDocumentData)
  if (newDocumentData === null) {
    return
  }
  const newDocumentRef = newDocumentSnapshot.ref

  const newPrices = newDocumentData.prices

  // For now we rely on the client getting pushed the latest prices and self-validating setting any prices

  return firestoreClient.batch()
    .set(event.data.ref, {
      [FIELD_IS_TIMESTAMPED]: true,
      [FIELD_TIMESTAMP_SERVER_PRICED]: eventTimestamp
    }, { merge: true })
    .set(firestoreClient.doc(`/deployments/${deploymentId}/locations/${locationId}`), {
      [FIELD_IS_TIMESTAMPED]: true,
      [FIELD_TIMESTAMP_SERVER_PRICED]: eventTimestamp
    }, { merge: true })
    .commit()
    .then(results => {

      if (deploymentId === 'test') {
        //
        // The price can be deleted; it is simplest to rebuild the entire buySellRatios matrix every time.
        //
        return rebuildBuySellRatios(deploymentId, locationId, priceId, newPrices)
          .then(result => {
            return lastStep()
          })
      }

      return lastStep()
    })
    .catch(error => {
      console.error('onLocationPriceCreate error', error)
    })
}


function lastStep() {
  // TODO:(pv) Update statistical averages...
  return Promise.resolve()
}


function rebuildBuySellRatios(deploymentId, locationId, priceId, prices) {
  console.log('rebuildBuySellRatios deploymentId', deploymentId, 'locationId', locationId, 'priceId', priceId, 'prices', prices)

  return firestoreClient.collection(`/deployments/${deploymentId}/itemTypes`)
    .get()
    .then(snapshotItemTypes => {

      const itemIds = []
      snapshotItemTypes.forEach(docItemType => {
        itemIds.push(docItemType.id)
      })

      return firestoreClient.collection(`/deployments/${deploymentId}/locations`)
        .get()
        .then(snapshotLocations => {

          const buySellPrices = {}
          const snapshotLocationsSize = snapshotLocations.size

          const promises = []

          const locationIds = []
          snapshotLocations.forEach(docLocation => {
            const docLocationId = docLocation.id

            promises.push(docLocation.ref.collection('prices')
              //.where('hasPrices', '==', true)
              .orderBy(FIELD_TIMESTAMP_SERVER_PRICED, 'desc')
              .limit(1)
              .get()
              .then(snapshotPrices => {
                snapshotPrices.forEach(docPrice => {
                  const prices = docPrice.get('prices')
                  itemIds.forEach(itemId => {
                    const price = prices && prices[itemId]
                    const priceBuy = price && price.priceBuy
                    const priceSell = price && price.priceSell
                    addBuySellPrice(buySellPrices, docLocationId, itemId, 'buy', priceBuy)
                    addBuySellPrice(buySellPrices, docLocationId, itemId, 'sell', priceSell)
                  })
                })

                locationIds.push(docLocationId)
                if (locationIds.length < snapshotLocationsSize) {
                  return Promise.resolve()
                }

                return writeBuySellRatios(deploymentId, locationIds, itemIds, buySellPrices)
              }))
          })

          return Promise.all(promises)
        })
    })
}

function addBuySellPrice(buySellPrices,
                         locationId,
                         itemId,
                         buyOrSell,
                         itemPrice) {
  const side = 'price' + buyOrSell.charAt(0).toUpperCase() + buyOrSell.slice(1).toLowerCase()
  // console.log('side', side)
  let thisLocationItemPrices = buySellPrices[locationId]
  if (!thisLocationItemPrices) {
    thisLocationItemPrices = {}
    buySellPrices[locationId] = thisLocationItemPrices
  }
  let itemPrices = thisLocationItemPrices[itemId]
  if (!itemPrices) {
    itemPrices = {}
    thisLocationItemPrices[itemId] = itemPrices
  }
  itemPrices[side] = itemPrice
}

function writeBuySellRatios(deploymentId, locationIds, itemIds, buySellPrices) {
  console.log('writeBuySellRatios', buySellPrices)

  const buySellRatios = {}

  const writeBatch = firestoreClient.batch()

  for (const locationIdBuy of locationIds) {

    const itemPricesBuy = buySellPrices[locationIdBuy]

    for (const itemId of itemIds) {

      const itemBuy = itemPricesBuy && itemPricesBuy[itemId]
      const priceBuy = itemBuy && itemBuy.priceBuy

      for (const locationIdSell of locationIds) {
        if (locationIdSell === locationIdBuy) {
          return
        }

        const itemPricesSell = buySellPrices[locationIdSell]
        const itemSell = itemPricesSell && itemPricesSell[itemId]
        const priceSell = itemSell && itemSell.priceSell

        const docId = `${itemId}:${locationIdBuy}:${locationIdSell}`
        const docPath = `/deployments/${deploymentId}/buySellRatios/${docId}`
        const docRef = firestoreClient.doc(docPath)

        const ratio = priceSell / priceBuy

        const docData = {
          itemId: itemId,
          buyLocationId: locationIdBuy,
          buyPrice: priceBuy,
          ratio: ratio,
          sellPrice: priceSell,
          sellLocationId: locationIdSell
        }

        writeBatch.set(docRef, docData)
      }
    }
  }

  console.log('writeBuySellRatios writeBatch COMMIT...', writeBatch)
  return writeBatch.commit()
    .then((results => {
      console.log('writeBuySellRatios writeBatch COMMITTED!', results)
    }))
}
