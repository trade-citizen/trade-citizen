

const admin = require('firebase-admin')
const functions = require('@firebase/functions')
const { firebasePushId } = require('../common/firebase-push-id')

const FIELD_TIMESTAMPED = 'timestamped'
const FIELD_TIMESTAMP = 'timestamp'
const FIELD_LATEST_PRICE_ID = 'latestPriceId'
const FIELD_LATEST_PRICE_TIMESTAMPED = 'latestPriceTimestamped'
const FIELD_LATEST_PRICE_TIMESTAMP = 'latestPriceTimestamp'
const FIELD_BUY_SELL_INFO_CACHE = '_buySellInfoCache'

module.exports = {
  addLocationPrice,
  getBuySellInfoCache,
  updateBuySellInfo,
  lastStep
}

function addLocationPrice(userId, data) {
  console.info('addLocationPrice userId', userId, 'data', data)

  if (!userId) {
    throw new functions.https.HttpsError('unauthenticated', 'Not authenticated')
  }

  const timestampNew = new Date()
  const deploymentId = data.deploymentId
  // console.log('addLocationPrice deploymentId', deploymentId)
  const locationId = data.locationId
  // console.log('addLocationPrice locationId', locationId)
  if (!deploymentId || !locationId) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid argument(s)')
  }
  const pricesNew = data.prices
  console.log('addLocationPrice pricesNew', pricesNew)
  console.log('addLocationPrice timestampNew', timestampNew)

  const firestore = admin.firestore()

  console.log('runTransaction(...)')
  return firestore.runTransaction(transaction => {
    //
    // NOTE:(pv) Transactions are limited to a maximum of 500 document *writes*
    //
    try {
      console.log('+runTransaction')
      //
      // Must call getBuySellInfoCache first to prevent:
      //  "Error: Firestore transactions require all reads to be executed before all writes."
      //
      return getBuySellInfoCache(firestore, transaction, deploymentId)
        .then(buySellInfoCache => {
          return _addLocationPrice(firestore, transaction, userId, timestampNew, deploymentId, locationId, pricesNew)
            .then(priceId => {
              // console.log('addLocationPrice _addLocationPrice priceId', priceId)
              if (!priceId) {
                throw new functions.https.HttpsError('internal', 'Unusable priceId')
              }
              return updateBuySellInfo(firestore, transaction, timestampNew, deploymentId, locationId, priceId, pricesNew, buySellInfoCache)
                .then(result => {
                  return lastStep()
                })
            })
        })
    } finally {
      console.log('-runTransaction')    
    }
  })
}


function lastStep() {
  console.log('lastStep TODO:(pv) Update statistical averages...')
  return Promise.resolve()
}


function _addLocationPrice(firestore, transaction, userId, timestamp, deploymentId, locationId, pricesNew, buySellInfoCache) {
  return getLatestLocationPriceData(firestore, transaction, deploymentId, locationId)
    .then(latestPriceData => {
      // console.log('_addLocationPrice latestPriceData', latestPriceData)
      let changed
      if (latestPriceData) {
        const pricesLatest = latestPriceData.prices
        console.log('_addLocationPrice pricesLatest', pricesLatest)
        const timestampLatest = latestPriceData.timestamp
        console.log('_addLocationPrice timestampLatest', timestampLatest)
        changes = diff(pricesLatest, pricesNew)
        console.log('_addLocationPrice changes', changes)
        changed = !!changes
      } else {
        changed = true
      }
      if (!changed) {
        throw new functions.https.HttpsError('cancelled', 'No prices changed')
      }

      const priceIdNew = firebasePushId(true)
      let docPath = `/deployments/${deploymentId}/locations/${locationId}/prices/${priceIdNew}`
      let docData = {
        userId,
        prices: pricesNew,
        [FIELD_TIMESTAMPED]: true,
        [FIELD_TIMESTAMP]: timestamp
        // TODO:(pv) Anything else useful/nice to set?
      }

      transactionSetPath(firestore, transaction, docPath, docData)

      docPath = `/deployments/${deploymentId}/locations/${locationId}`
      docData = {
        [FIELD_LATEST_PRICE_TIMESTAMPED]: true,
        [FIELD_LATEST_PRICE_TIMESTAMP]: timestamp,
        [FIELD_LATEST_PRICE_ID]: priceIdNew
        // TODO:(pv) Anything else useful/nice to set?
        // latestPriceUserId?
      }
      transactionSetPath(firestore, transaction, docPath, docData)

      return Promise.resolve(priceIdNew)
    })
}

function getLatestLocationPriceData(firestore, transaction, deploymentId, locationId) {
  let path = `/deployments/${deploymentId}/locations/${locationId}`
  return transaction.get(firestore.doc(path))
    .then(snapshotDocLocation => {
      const latestPriceId = snapshotDocLocation.get(FIELD_LATEST_PRICE_ID)
      if (!latestPriceId) {
        return Promise.resolve()
      }
      path = `/deployments/${deploymentId}/locations/${locationId}/prices/${latestPriceId}`
      return transaction.get(firestore.doc(path))
        .then(snapshotLatestPriceData => {
          let latestPriceData
          if (snapshotLatestPriceData.exists) {
            latestPriceData = snapshotLatestPriceData.data()
          }
          return Promise.resolve(latestPriceData)
        })
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
 */
function updateBuySellInfo(firestore, transaction, timestamp, deploymentId, locationId, priceId, newPrices, buySellInfoCache) {
  // console.log('updateBuySellInfo timestamp', timestamp, 'deploymentId', deploymentId, 'locationId', locationId, 'priceId', priceId, 'newPrices', newPrices,
  //            'buySellInfoCache', buySellInfoCache)

  const pathBuySellInfo = getPathBuySellInfoCache(deploymentId)

  if (!buySellInfoCache) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid argument(s)')
  }

  // console.log('updateBuySellInfo buySellInfoCache', buySellInfoCache)

  const { locations, items, buySellPrices, buySellRatiosPrevious } = buySellInfoCache
  // console.log('updateBuySellInfo locations', locations)
  // console.log('updateBuySellInfo items', items)
  // console.log('updateBuySellInfo buySellPrices', buySellPrices)
  // console.log('updateBuySellInfo buySellRatiosPrevious', buySellRatiosPrevious)

  // console.log('updateBuySellInfo locationId', locationId, 'newPrices', newPrices)
  if (timestamp && locationId && priceId) {
    if (newPrices) {
      Object.keys(items).forEach(itemId => {
        const newPrice = newPrices && newPrices[itemId]
        const priceBuy = newPrice && newPrice.priceBuy
        const priceSell = newPrice && newPrice.priceSell
        if (priceBuy || priceSell) {
          console.log('updateBuySellInfo locationId', locationId, 'itemId', itemId, 'priceBuy', priceBuy, 'priceSell', priceSell)
        }
        addBuySellPrice(buySellPrices, locationId, itemId, 'buy', priceBuy, timestamp)
        addBuySellPrice(buySellPrices, locationId, itemId, 'sell', priceSell, timestamp)
      })
    } else {
      buySellPrices[locationId] = { timestamp }
    }
  } else {
  }

  const buySellRatiosNew = {}

  Object.keys(locations).forEach(locationIdBuy => {
    // console.log('updateBuySellInfo locationIdBuy', locationIdBuy)
    const itemPricesBuy = buySellPrices[locationIdBuy]
    // console.log('updateBuySellInfo itemPricesBuy', itemPricesBuy)
    if (!itemPricesBuy) {
      // console.warn(`No prices @ ${locationIdBuy}`)
      return
    }

    Object.keys(locations).forEach(locationIdSell => {
      // console.log('updateBuySellInfo locationIdSell', locationIdSell)
      if (locationIdSell === locationIdBuy) {
        return
      }
      const itemPricesSell = buySellPrices[locationIdSell]
      // console.log('updateBuySellInfo itemPricesSell', itemPricesSell)
      if (!itemPricesSell) {
        // console.warn(`No prices @ ${locationIdSell}`)
        return
      }
  
      Object.keys(items).forEach(itemId => {
        // console.log('updateBuySellInfo itemId', itemId)
        const itemBuy = itemPricesBuy && itemPricesBuy[itemId]
        const priceBuy = itemBuy && itemBuy.priceBuy
        const timestampBuy = itemPricesBuy.timestamp
        if (!priceBuy) {
          return
        }

        const itemSell = itemPricesSell && itemPricesSell[itemId]
        const priceSell = itemSell && itemSell.priceSell
        const timestampSell = itemPricesSell.timestamp
        if (!priceSell) {
          return
        }

        const ratio = priceSell / priceBuy

        const docId = `${itemId}:${locationIdBuy}:${locationIdSell}`

        const itemName = items[itemId]
        const buyLocationName = locations[locationIdBuy]
        const sellLocationName = locations[locationIdSell]

        const buySellRatio = {
          itemId,
          itemName,
          buyLocationId: locationIdBuy,
          buyLocationName,
          buyPrice: priceBuy,
          buyTimestamp: timestampBuy,
          ratio,
          sellPrice: priceSell,
          sellTimestamp: timestampSell,
          sellLocationId: locationIdSell,
          sellLocationName
        }
        // console.log('updateBuySellInfo buySellRatio', buySellRatio)

        buySellRatiosNew[docId] = buySellRatio
      })
    })
  })
  // console.log('updateBuySellInfo buySellRatiosNew', buySellRatiosNew)

  buySellInfoCache.buySellRatios = buySellRatiosNew

  //
  //
  //

  let changes = diff(buySellRatiosPrevious, buySellRatiosNew)
  console.log('updateBuySellInfo changes', changes)
  if (changes) {
    if (changes.right && !changes.left) {
      changes = changes.right
    }
    Object.keys(changes).forEach(key => {
      const change = changes[key]
      // console.log('updateBuySellInfo key', key, 'change', change)
      const docId = `/deployments/${deploymentId}/buySellRatios/${key}`
      // console.log('updateBuySellInfo docId', docId)
      const docRef = firestore.doc(docId)
      if (change && change.left && !change.right) {
        console.log('updateBuySellInfo delete', docId)
        transaction.delete(docRef)
      } else {
        const docData = buySellRatiosNew[key]
        console.log('updateBuySellInfo set', docId, docData)
        transactionSetRef(transaction, docRef, docData)
      }
    })
  }

  //
  //
  //

  //
  // PROBLEM: Firestore documents are limited to 1MiB in size!
  // https://firebase.google.com/docs/firestore/quotas#limits
  // https://firebase.google.com/docs/firestore/storage-size
  //
  // TODO:(pv) Compute the size of buySellInfoCache
  // TODO:(pv) If the size of buySellInfoCache gets near 1MiB then design shard-like solution
  //  https://firebase.google.com/docs/firestore/solutions/counters
  // 
  transactionSetPath(firestore, transaction, pathBuySellInfo, {
      [FIELD_BUY_SELL_INFO_CACHE]: buySellInfoCache
    })

  //
  //
  //

  const buySellRatiosCount = Object.keys(buySellRatiosNew).length

  const pathBuySellRatiosCount = `/deployments/${deploymentId}`
  transactionSetPath(firestore, transaction, pathBuySellRatiosCount, {
    buySellRatiosCount: buySellRatiosCount
  }, { merge: true })

  return Promise.resolve()
}


function getPathBuySellInfoCache(deploymentId) {
  return `/deployments/${deploymentId}`
}

function getBuySellInfoCache(firestore, transaction, deploymentId) {
  const pathBuySellInfoCache = getPathBuySellInfoCache(deploymentId)
  return transaction.get(firestore.doc(pathBuySellInfoCache))
    .then(snapshotBuySellInfoCache => {
      const buySellInfoCache = snapshotBuySellInfoCache.get(FIELD_BUY_SELL_INFO_CACHE)
      // console.log('getBuySellInfoCache buySellInfoCache', buySellInfoCache)
      if (!buySellInfoCache) {
        return createBuySellInfoCache(firestore, deploymentId)
      }
      return Promise.resolve(buySellInfoCache)
    })
}

function createBuySellInfoCache(firestore, deploymentId) {
  // console.log('createBuySellInfoCache deploymentId', deploymentId)
  return firestore.collection(`/deployments/${deploymentId}/itemTypes`)
    .get()
    .then(snapshotItemTypes => {
      const items = {}
      snapshotItemTypes.forEach(docItemType => {
        const itemName = docItemType.get('name')
        items[docItemType.id] = itemName
      })

      return firestore.collection(`/deployments/${deploymentId}/locations`)
        .get()
        .then(snapshotLocations => {
          // console.log('createBuySellInfoCache snapshotLocations', snapshotLocations)

          const buySellPrices = {}
          const snapshotLocationsSize = snapshotLocations.size

          const promises = []

          const locations = {}
          snapshotLocations.forEach(docLocation => {
            const docLocationId = docLocation.id
            // console.log('createBuySellInfoCache docLocation.data()', docLocation.data())
            const locationName = docLocation.get('name')
            
            promises.push(docLocation.ref.collection('prices')
              .where(FIELD_TIMESTAMPED, '==', true)
              .orderBy(FIELD_TIMESTAMP, 'desc')
              .limit(1)
              .get()
              .then(snapshotPrices => {
                // console.log('createBuySellInfoCache snapshotPrices', snapshotPrices)
                snapshotPrices.forEach(docPrice => {
                  // const docPriceId = docPrice.id
                  // console.log('createBuySellInfoCache docLocationId', docLocationId, 'docPriceId', docPriceId, 'docPrice', docPrice.data())
                  const prices = docPrice.get('prices')
                  const timestamp = docPrice.get(FIELD_TIMESTAMP)
                  // console.log('createBuySellInfoCache docLocationId', docLocationId, 'prices', prices)
                  Object.keys(items).forEach(itemId => {
                    const price = prices && prices[itemId]
                    const priceBuy = price && price.priceBuy
                    const priceSell = price && price.priceSell
                    // console.log('createBuySellInfoCache docLocationId', docLocationId, 'itemId', itemId, 'priceBuy', priceBuy, 'priceSell', priceSell)
                    addBuySellPrice(buySellPrices, docLocationId, itemId, 'buy', priceBuy, timestamp)
                    addBuySellPrice(buySellPrices, docLocationId, itemId, 'sell', priceSell, timestamp)
                  })
                })

                locations[docLocationId] = locationName
                if (Object.keys(locations).length < snapshotLocationsSize) {
                  return Promise.resolve()
                }

                // console.log('createBuySellInfoCache read last location')

                const buySellInfoCache = {
                  comment: 'TODO:(pv) Explain the purpose of the buySellInfoCache field and how to maintain it...',
                  locations,
                  items,
                  buySellPrices
                }
                // console.log('createBuySellInfoCache buySellInfoCache', buySellInfoCache)

                return Promise.resolve(buySellInfoCache)
              }))
          })

          // console.log('createBuySellInfoCache Promise.all(promises)', promises)
          return Promise.all(promises)
            .then(results => {
              // console.log('createBuySellInfoCache results', results)
              const buySellInfoCache = results.find(item => {
                return !!item
              })
              return Promise.resolve(buySellInfoCache)
            })
        })
    })
}

//
// Utilities...
//

function addBuySellPrice(buySellPrices,
                         locationId,
                         itemId,
                         buyOrSell,
                         itemPrice,
                         timestamp) {
  const side = 'price' + buyOrSell.charAt(0).toUpperCase() + buyOrSell.slice(1).toLowerCase()
  // console.log('side', side)

  let thisLocationItemPrices = buySellPrices[locationId]
  if (!thisLocationItemPrices) {
    thisLocationItemPrices = {}
    buySellPrices[locationId] = thisLocationItemPrices
  }

  thisLocationItemPrices.timestamp = timestamp

  let itemPrices = thisLocationItemPrices[itemId]
  if (!itemPrices) {
    if (!itemPrice) {
      return
    }
    itemPrices = {}
    thisLocationItemPrices[itemId] = itemPrices
  }

  if (itemPrice) {
    itemPrices[side] = itemPrice
  } else {
    delete itemPrices[side]
  }
}

function diff(left, right) {
  // console.log('diff left', left, 'right', right)
  let changes = {}
  if (left !== right) {
    // console.log('left !== right')
    if (typeof left == 'object' && typeof right == 'object') {
      // console.log('object')
      let keys = new Set(Object.keys(left).concat(Object.keys(right)))
      // console.log('diff keys', keys)
      for (const key of keys) {
        const valueLeft = left[key]
        const valueRight = right[key]
        // console.log('diff key', key, 'valueLeft', valueLeft, 'valueRight', valueRight)
        const temp = diff(valueLeft, valueRight)
        // console.log('diff temp', temp)
        if (temp) {
          changes[key] = temp
        }
      }
    } else {
      // console.log('not object')
      changes = {
        left: left,
        right: right
      }
    }
  }
  // console.log('diff changes', changes)
  if (!Object.keys(changes).length) {
    changes = undefined
  }
  return changes
}

function transactionSetPath(firestore, transaction, docPath, docData) {
  return transactionSetRef(transaction, firestore.doc(docPath), docData)
}

function transactionSetRef(transaction, docRef, docData) {
  // console.log('transactionSetRef docRef.path', docRef.path, 'docData', docData)
  return transaction.set(docRef, docData, { merge: true })
}
