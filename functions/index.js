//
// NOTE:(pv) There are two "firestore" classes.
//  1) firestoreServer: Manages the server-side function hooks
//  2) firestoreClient: Full firestore client
//      https://cloud.google.com/nodejs/docs/reference/firestore/latest/
//
// To Test:
//  https://firebase.google.com/docs/functions/local-emulator
//  https://firebase.google.com/docs/functions/local-emulator#invoke_firestore_functions
//  $ firebase experimental:functions:shell
//  firebase > onLocationPriceCreate( { prices: { '4PqeXIFIa47BFsKsjKLa': { priceBuy: 7, priceSell: 3 } } }, { params: { deploymentId: 'test', locationId: 'zsrxhjHzhfXxUCPs73EF', priceId: 'zdqkRhVhBcw8E9TvpCU4' } })
//

const functions = require('firebase-functions')
const firestoreServer = functions.firestore
const admin = require('firebase-admin')
admin.initializeApp(functions.config().firebase)
const firestoreClient = admin.firestore()

const FIELD_IS_TIMESTAMPED = 'isTimestamped'
const FIELD_TIMESTAMP_SERVER_PRICED = 'timestampServerPriced'
const FIELD_CACHED_BUY_SELL_INFO = '_cachedBuySellInfo'

//
// https://firebase.google.com/docs/functions/write-firebase-functions
// https://firebase.google.com/docs/firestore/extend-with-functions
// https://github.com/firebase/functions-samples
//

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

exports.onLocationPriceCreate = firestoreServer
  .document('/deployments/{deploymentId}/locations/{locationId}/prices/{priceId}')
  .onCreate(onLocationPriceCreate)

function onLocationPriceCreate(event) {
  //console.log('onLocationPriceCreate arguments', arguments)

  const eventTimestamp = new Date(event.timestamp)

  const params = event.params
  // console.log('onLocationPriceCreate params', params)
  const deploymentId = params.deploymentId
  const locationId = params.locationId
  const priceId = params.priceId

  const newDocumentSnapshot = event.data
  //console.log('onLocationPriceCreate newDocumentSnapshot', newDocumentSnapshot)
  const newDocumentData = newDocumentSnapshot.exists ? newDocumentSnapshot.data() : null
  //console.log('onLocationPriceCreate newDocumentData', newDocumentData)
  if (newDocumentData === null) {
    console.error('onLocationPriceCreate newDocumentData === null; unhandled document deletion')
    return
  }
  const newDocumentRef = newDocumentSnapshot.ref

  const newPrices = newDocumentData.prices
  console.log('onLocationPriceCreate newPrices', newPrices)

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
      //console.log('onLocationPriceCreate batch timestamp commited; next step...')

      if (deploymentId === 'test') {
        //
        // The price can be deleted; it is simplest to rebuild the entire BuySellInfo every time.
        //
        return updateBuySellInfo(deploymentId, locationId, priceId, newPrices)
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


/**
 * "BuySellRatios" is a paginateable *LIST* of all item buy/sell combinations across all locations.
 * This list format is efficient to display, but not very efficient to update.
 * It is in this format so that the client can easily paginate through the sortable values.
 * There is little to no real way to direct access elements and "update row X column Y" whenever a single price is changed.
 * I have asked about this here:
 * https://stackoverflow.com/q/49202059/252308 (Stupid stackoverflow mizers poo-pooed on it)
 * I am stll looking for a lightweight way to calculate this, but so far have not thought of one.
 * The current technique is to build the list from scratch every time the price data changes.
 * Hopefully, before the matrix gets too big, I will come up with a way to update only affected values.
 * 
 * Example (2 items sold in 2 locations):
 * Item 1 ,  Location A ,  4.000 ,  0.500 ,  2.000 ,  Location B
 * Item 1 ,  Location B ,  6.000 ,  0.667 ,  4.000 ,  Location A
 * Item 2 ,  Location A ,  3.000 ,  0.333 ,  1.000 ,  Location B
 * Item 2 ,  Location B ,  3.000 ,  0.667 ,  2.000 ,  Location A
 * {
 *  'item1:buyLocationA:sellLocationB':
 *  {
 *    item: 'Item 1',
 *    buyLocation: 'Location A',
 *    buyPrice: 4,
 *    ratio: 2 / 4,
 *    sellPrice: 2,
 *    sellLocation: 'Location B',
 *    timePriced: '20180314 12:01PM...'
 *    timeUpdated: ?
 *    _timeUpdated: ?
 *  },
 *  'item1:buyLocationB:sellLocationA':
 *  {
 *    item: 'Item 1',
 *    buyLocation: 'Location B',
 *    buyPrice: 6,
 *    ratio: 4 / 6,
 *    sellPrice: 4,
 *    sellLocation: 'Location A',
 *    timePriced: '20180314 12:01PM...'
 *  },
 *  'item2:buyLocationA:sellLocationB':
 *  {
 *    item: 'Item 1',
 *    buyLocation: 'Location A',
 *    buyPrice: 3,
 *    ratio: 1 / 3,
 *    sellPrice: 1,
 *    sellLocation: 'Location B',
 *    timePriced: '20180314 12:01PM...'
 *  },
 *  'item2:buyLocationB:sellLocationA':
 *  {
 *    item: 'Item 1',
 *    buyLocation: 'Location B',
 *    buyPrice: 3,
 *    ratio: 2 / 3,
 *    sellPrice: 2,
 *    sellLocation: 'Location A',
 *    timePriced: '20180314 12:01PM...'
 *  }
 * }
 * @param {*} deploymentId 
 * @param {*} locationId
 * @param {*} priceId
 * @param {*} newPrices
 * @param {*} _cachedBuySellInfo
 */
function updateBuySellInfo(deploymentId, locationId, priceId, newPrices, _cachedBuySellInfo) {
  //console.log('updateBuySellInfo deploymentId', deploymentId, 'locationId', locationId, 'priceId', priceId, 'newPrices', newPrices,
  //            '_cachedBuySellInfo', _cachedBuySellInfo)

  if (!_cachedBuySellInfo) {
    return firestoreClient.doc(`/deployments/${deploymentId}`)
      .get()
      .then(snapshotDeployment => {
        let _cachedBuySellInfo = snapshotDeployment.get(FIELD_CACHED_BUY_SELL_INFO)
        // console.log('updateBuySellInfo _cachedBuySellInfo', _cachedBuySellInfo)
        if (_cachedBuySellInfo) {
          return updateBuySellInfo(deploymentId, locationId, priceId, newPrices, _cachedBuySellInfo)
        } else {
          return createBuySellInfoCache(deploymentId)
            .then(result => {
              return updateBuySellInfo(deploymentId, locationId, priceId, newPrices)
            })
        }
      })
  }

  //console.log('updateBuySellInfo _cachedBuySellInfo', _cachedBuySellInfo)

  const locationIds = _cachedBuySellInfo.locationIds
  //console.log('updateBuySellInfo locationIds', locationIds)
  const itemIds = _cachedBuySellInfo.itemIds
  //console.log('updateBuySellInfo itemIds', itemIds)
  const buySellPrices = _cachedBuySellInfo.buySellPrices
  //console.log('updateBuySellInfo buySellPrices', buySellPrices)
  const buySellRatiosPrevious = _cachedBuySellInfo.buySellRatios
  //console.log('updateBuySellInfo buySellRatiosPrevious', buySellRatiosPrevious)

  if (newPrices) {
    //console.log('updateBuySellInfo locationId', locationId, 'newPrices', newPrices)
    itemIds.forEach(itemId => {
      const newPrice = newPrices && newPrices[itemId]
      const priceBuy = newPrice && newPrice.priceBuy
      const priceSell = newPrice && newPrice.priceSell
      if (priceBuy || priceSell) {
        console.log('updateBuySellInfo locationId', locationId, 'itemId', itemId, 'priceBuy', priceBuy, 'priceSell', priceSell)
      }
      addBuySellPrice(buySellPrices, locationId, itemId, 'buy', priceBuy)
      addBuySellPrice(buySellPrices, locationId, itemId, 'sell', priceSell)
    })
  } else {
    delete buySellPrices[locationId]
  }

  const buySellRatiosNew = {}

  for (const locationIdBuy of locationIds) {
    //console.log('updateBuySellInfo locationIdBuy', locationIdBuy)
    const itemPricesBuy = buySellPrices[locationIdBuy]
    //console.log('updateBuySellInfo itemPricesBuy', itemPricesBuy)
    if (!itemPricesBuy) {
      //console.warn(`No prices @ ${locationIdBuy}`)
      continue
    }

    for (const locationIdSell of locationIds) {
      //console.log('updateBuySellInfo locationIdSell', locationIdSell)
      if (locationIdSell === locationIdBuy) {
        continue
      }
      const itemPricesSell = buySellPrices[locationIdSell]
      //console.log('updateBuySellInfo itemPricesSell', itemPricesSell)
      if (!itemPricesSell) {
        //console.warn(`No prices @ ${locationIdSell}`)
        continue
      }
  
      for (const itemId of itemIds) {
        //console.log('updateBuySellInfo itemId', itemId)
        const itemBuy = itemPricesBuy && itemPricesBuy[itemId]
        const priceBuy = itemBuy && itemBuy.priceBuy
        if (!priceBuy) {
          continue
        }

        const itemSell = itemPricesSell && itemPricesSell[itemId]
        const priceSell = itemSell && itemSell.priceSell
        if (!priceSell) {
          continue
        }

        const ratio = priceSell / priceBuy

        const docId = `${itemId}:${locationIdBuy}:${locationIdSell}`

        let buySellRatio = {
          itemId: itemId,
          buyLocationId: locationIdBuy,
          buyPrice: priceBuy,
          ratio: ratio,
          sellPrice: priceSell,
          sellLocationId: locationIdSell
        }
        //console.log('updateBuySellInfo buySellRatio', buySellRatio)

        buySellRatiosNew[docId] = buySellRatio
      }
    }
  }
  //console.log('updateBuySellInfo buySellRatiosNew', buySellRatiosNew)

  _cachedBuySellInfo.buySellRatios = buySellRatiosNew

  const changes = diff(buySellRatiosPrevious, buySellRatiosNew)
  //console.log('updateBuySellInfo changes', changes)

  const writeBatch = firestoreClient.batch()
  
  if (changes) {
    Object.keys(changes).forEach(key => {
      //console.log('updateBuySellInfo key', key)
      const change = changes[key]
      //console.log('updateBuySellInfo change', change)
      const docId = `/deployments/${deploymentId}/buySellRatios/${key}`
      //console.log('updateBuySellInfo docId', docId)
      const docRef = firestoreClient.doc(docId)
      if (change.left && !change.right) {
        console.log('updateBuySellInfo delete', docId)
        writeBatch.delete(docRef)
      } else {
        const docData = buySellRatiosNew[key]
        console.log('updateBuySellInfo set', docId, docData)
        writeBatch.set(docRef, docData)
      }
    })
  }

  writeBatch.set(firestoreClient.doc(`/deployments/${deploymentId}`), {
      [FIELD_CACHED_BUY_SELL_INFO]: _cachedBuySellInfo
    }, { merge: true })

  console.log('updateBuySellInfo writeBatch COMMIT...')//, writeBatch)
  return writeBatch.commit() 
    .then((results => { 
      console.log('updateBuySellInfo writeBatch COMMITTED!')//, results) 
    }))     
}

function diff(left, right) {
  //console.log('diff left', left, 'right', right)
  let changes = {}
  if (left !== right) {
    //console.log('left !== right')
    if (typeof left == 'object' && typeof right == 'object') {
      //console.log('object')
      let keys = new Set(Object.keys(left).concat(Object.keys(right)))
      //console.log('diff keys', keys)
      for (const key of keys) {
        const valueLeft = left[key]
        const valueRight = right[key]
        //console.log('diff key', key, 'valueLeft', valueLeft, 'valueRight', valueRight)
        const temp = diff(valueLeft, valueRight)
        //console.log('diff temp', temp)
        if (temp) {
          changes[key] = temp
        }
      }
    } else {
      //console.log('not object')
      changes = {
        left: left,
        right: right
      }
    }
  }
  //console.log('diff changes', changes)
  if (!Object.keys(changes).length) {
    changes = undefined
  }
  return changes
}

function createBuySellInfoCache(deploymentId) {
  // console.log('createBuySellInfoCache deploymentId', deploymentId)
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
          // console.log('createBuySellInfoCache snapshotLocations', snapshotLocations)

          const buySellPrices = {}
          const snapshotLocationsSize = snapshotLocations.size

          const promises = []

          const locationIds = []
          snapshotLocations.forEach(docLocation => {
            const docLocationId = docLocation.id
            // console.log('createBuySellInfoCache docLocation.data()', docLocation.data())
            
            promises.push(docLocation.ref.collection('prices')
              .where(FIELD_IS_TIMESTAMPED, '==', true)
              .orderBy(FIELD_TIMESTAMP_SERVER_PRICED, 'desc')
              .limit(1)
              .get()
              .then(snapshotPrices => {
                // console.log('createBuySellInfoCache snapshotPrices', snapshotPrices)
                snapshotPrices.forEach(docPrice => {
                  // const docPriceId = docPrice.id
                  // console.log('createBuySellInfoCache docLocationId', docLocationId, 'docPriceId', docPriceId, 'docPrice', docPrice.data())
                  const prices = docPrice.get('prices')
                  // console.log('createBuySellInfoCache docLocationId', docLocationId, 'prices', prices)
                  itemIds.forEach(itemId => {
                    const price = prices && prices[itemId]
                    const priceBuy = price && price.priceBuy
                    const priceSell = price && price.priceSell
                    // console.log('createBuySellInfoCache docLocationId', docLocationId, 'itemId', itemId, 'priceBuy', priceBuy, 'priceSell', priceSell)
                    addBuySellPrice(buySellPrices, docLocationId, itemId, 'buy', priceBuy)
                    addBuySellPrice(buySellPrices, docLocationId, itemId, 'sell', priceSell)
                  })
                })

                locationIds.push(docLocationId)
                if (locationIds.length < snapshotLocationsSize) {
                  return Promise.resolve()
                }

                //console.log('createBuySellInfoCache read last location')

                const _cachedBuySellInfo = {
                  locationIds: locationIds,
                  itemIds: itemIds,
                  buySellPrices: buySellPrices
                }
                //console.log('createBuySellInfoCache _cachedBuySellInfo', _cachedBuySellInfo)

                return firestoreClient.doc(`/deployments/${deploymentId}`)
                  .set({
                    [FIELD_CACHED_BUY_SELL_INFO]: _cachedBuySellInfo
                  }, { merge: true })
              }))
          })

          //console.log('createBuySellInfoCache Promise.all(promises)', promises)
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
  if (itemPrice) {
    itemPrices[side] = itemPrice
  } else {
    delete itemPrices[side]
  }
}


function lastStep() {
  return Promise.resolve()
}
