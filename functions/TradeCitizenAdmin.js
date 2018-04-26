
const admin = require('firebase-admin')
const serviceAccount = require("../trade-citizen-firebase-adminsdk.json")
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

const TradeCitizen = require('./TradeCitizen')

const SEED = {
  anchorTypes: {
    'DjDbvaQPsK26FFm2L2pm': 'Moon',
    'gLtSfGjIbwek4IqRuemu': 'Gas Giant',
    'pXrKPeX1UGTLsfC1KD7E': 'System',
    'whT2EWthXvMzbT5M53TL': 'Asteroid'
  },
  anchors: {
    '04CI2NphwWJqSgb8ti7C': {
      anchor: '1b196RylA8Po1l1X2TuM',
      name: 'Delamar',
      type: 'whT2EWthXvMzbT5M53TL'
    },
    '1b196RylA8Po1l1X2TuM': {
      name: 'Nyx',
      type: 'pXrKPeX1UGTLsfC1KD7E'
    },
    '25hIDqcGiUqlSdbNhX6x': {
      anchor: 'hJf6bQSEa48xBdL0qYVx',
      name: 'Cellin',
      type: 'DjDbvaQPsK26FFm2L2pm'
    },
    '3ZbNqPX57ZviHScm9dAy': {
      anchor: 'hJf6bQSEa48xBdL0qYVx',
      name: 'Yela',
      type: 'DjDbvaQPsK26FFm2L2pm'
    },
    'RIEpFri7fWv1mAZxoYmz': {
      name: 'Stanton',
      type: 'pXrKPeX1UGTLsfC1KD7E'
    },
    'ZWueMY6ia4ke6S3P7gP5': {
      anchor: 'hJf6bQSEa48xBdL0qYVx',
      name: 'Daymar',
      type: 'DjDbvaQPsK26FFm2L2pm'
    },
    'hJf6bQSEa48xBdL0qYVx': {
      anchor: 'RIEpFri7fWv1mAZxoYmz',
      name: 'Crusader',
      type: 'gLtSfGjIbwek4IqRuemu'
    }
  },
  itemCategories: {
    '4hxaIzHfdN6PAosFWtJV': {
      name: 'Agricultural Supplies'
    },
    'BeAXjLbDCLtslDKldBxH': {
      name: 'Food'
    },
    'CJPqjRLm7OUeUnpo6p6U': {
      name: 'Gas'
    },
    'McqEX21Zm4Ty6LFPXtPt': {
      name: 'Medical Supplies'
    },
    'arSVx8hZzPmwgEXD5qi6': {
      name: 'Metal'
    },
    'irdfa8tey5anvwo7Ul6p': {
      name: 'Minerals'
    },
    'souaqpxHtya3tXdNtvFY': {
      name: 'Scrap'
    },
    'xM0PkB4oYlnzweUSC8qV': {
      name: 'Vice'
    },
    'yLQ2ec6ge1eMuubdFMR9': {
      name: 'Waste'
    },
  },
  itemTypes: {
  },
  locationTypes: {
    'VTVrTTBnsnrNLXtPg7cj': {
      name: 'Floating'
    },
    'uvO72B9wkb0A30swyerK': {
      name: 'Ground'
    },
    'uwManR2pL9qYSPQJ9jyz': {
      name: 'Orbital'
    }
  },
  locations: {
  }
}


/**
 * DANGER, WILL ROBINSON!
 */
function removeBuySellInfo(deploymentId) {

  // deploymentId = 'test' // <- We should probably never run this against 'production'

  const firestore = admin.firestore()
  
  const pathRoot = `/deployments/${deploymentId}`
  return firestore.doc(pathRoot)
    .get()
    .then(snapshotRoot => {
      const refSnapshotRoot = snapshotRoot.ref
      console.log(`removeBuySellInfo Remove ${pathRoot} field _buySellInfoCache`)
      refSnapshotRoot.set({
        _buySellInfoCache: admin.firestore.FieldValue.delete()
      }, { merge: true })

      console.log(`removeBuySellInfo Remove ${pathRoot} field buySellRatiosCount`)
      refSnapshotRoot.set({
        buySellRatiosCount: admin.firestore.FieldValue.delete()
      }, { merge: true })

      const pathBuySellRatios = `${pathRoot}/buySellRatios`
      console.log(`removeBuySellInfo Remove collection ${pathBuySellRatios}`)
      const refBuySellRatios = firestore.collection(pathBuySellRatios)
      return deleteCollection(refBuySellRatios)
    })
}


/**
 * DANGER, WILL ROBINSON!
 */
function removeAllPrices(deploymentId) {

  // deploymentId = 'test' // <- We should probably never run this against 'production'

  const firestore = admin.firestore()

  const pathLocations = `/deployments/${deploymentId}/locations`
  return firestore.collection(pathLocations)
    .get()
    .then(snapshotLocations => {
      const promises = []
      snapshotLocations.forEach(docLocation => {
        const docLocationId = docLocation.id
        const pathPrices = `${pathLocations}/${docLocationId}/prices`
        console.log(`removeAllPrices Remove collection ${pathPrices}`)
        const refPrices = firestore.collection(pathPrices)
        promises.push(deleteCollection(refPrices))
      })
      return Promise.all(promises)
    })
}


function updateBuySellInfo(deploymentId) {

  // deploymentId = 'test' // <- We should probably never run this against 'production'

  const timestampNew = undefined
  const locationId = undefined
  const priceId = undefined
  const pricesNew = undefined

  const firestore = admin.firestore()

  console.log('updateBuySellInfo runTransaction(...)')
  return firestore.runTransaction(transaction => {
    try {
      console.log('updateBuySellInfo +runTransaction')
      //
      // Must call getBuySellInfoCache first to prevent:
      //  "Error: Firestore transactions require all reads to be executed before all writes."
      //
      return TradeCitizen.getBuySellInfoCache(firestore, transaction, deploymentId)
        .then(buySellInfoCache => {
          const pathBuySellInfo = TradeCitizen.getPathBuySellInfoCache(deploymentId)

          //
          //
          //
          // console.log('updateBuySellInfo buySellInfoCache', buySellInfoCache)
          if (!buySellInfoCache) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid argument(s)')
          }
          const { locations, items, buySellPrices, buySellRatios:buySellRatiosPrevious } = buySellInfoCache
          // console.log('updateBuySellInfo locations', locations)
          // console.log('updateBuySellInfo items', items)
          // console.log('updateBuySellInfo buySellPrices', JSON.stringify(buySellPrices))
          // console.log('updateBuySellInfo buySellRatiosPrevious', JSON.stringify(buySellRatiosPrevious))

          //
          //
          //

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

          let changes = TradeCitizen.diff(buySellRatiosPrevious, buySellRatiosNew)
          console.log('updateBuySellInfo changes', changes)
          if (changes) {
            if (changes.current && !changes.previous) {
              changes = changes.current
            }
            Object.keys(changes).forEach(key => {
              const change = changes[key]
              // console.log('updateBuySellInfo key', key, 'change', change)
              const docId = `/deployments/${deploymentId}/buySellRatios/${key}`
              // console.log('updateBuySellInfo docId', docId)
              const docRef = firestore.doc(docId)
              if (change && change.previous && !change.current) {
                console.log('updateBuySellInfo delete', docId)
                transaction.delete(docRef)
              } else {
                const docData = buySellRatiosNew[key]
                console.log('updateBuySellInfo set', docId, docData)
                TradeCitizen.transactionSetRef(transaction, docRef, docData)
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

          TradeCitizen.transactionSetPath(firestore, transaction, pathBuySellInfo, {
            [TradeCitizen.FIELD_BUY_SELL_INFO_CACHE]: buySellInfoCache
          })
      
          //
          //
          //
        
          const buySellRatiosCount = Object.keys(buySellRatiosNew).length
        
          const pathBuySellRatiosCount = `/deployments/${deploymentId}`
          TradeCitizen.transactionSetPath(firestore, transaction, pathBuySellRatiosCount, {
            buySellRatiosCount
          }, { merge: true })

          return Promise.resolve()
        })
    } finally {
      console.log('updateBuySellInfo -runTransaction')
    }
  })
}

//
//
//

const deploymentId = 'test'

if (false) {
  return removeBuySellInfo(deploymentId)
  /*
    .then(result => {
      return removeAllPrices(deploymentId)
    })
    */
}

if (false) {
  updateBuySellInfo(deploymentId)
}


//
// Utility methods...
//

//
// From https://firebase.google.com/docs/firestore/manage-data/delete-data#collections
//
function deleteCollection(refCollection, batchSize) {
  if (!batchSize || batchSize > 500) {
    //
    // https://firebase.google.com/docs/firestore/manage-data/transactions
    // "Each transaction or batch of writes can write to a maximum of 500 documents."
    //
    batchSize = 500
  }
  return new Promise((resolve, reject) => {
    return _deleteQueryBatch(refCollection.limit(batchSize),
      batchSize,
      resolve,
      reject)
  })
}

//
// From https://firebase.google.com/docs/firestore/manage-data/delete-data#collections
//
function _deleteQueryBatch(query, batchSize, resolve, reject) {
  return query.get()
    .then(snapshot => {
      // When there are no documents left, we are done
      if (snapshot.size === 0) {
        return Promise.resolve(0)
      }

      // Delete documents in a batch
      const batch = query.firestore.batch()
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref)
      })

      return batch.commit()
        .then(() => {
          return Promise.resolve(snapshot.size)
        })
    })
    .then(numDeleted => {
      if (numDeleted === 0) {
        resolve()
        return
      }

      // Recurse on the next process tick, to avoid exploding the stack.
      return _deleteQueryBatch(query, batchSize, resolve, reject)
    })
    .catch(reject)
}
