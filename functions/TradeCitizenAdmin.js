
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

  deploymentId = 'test' // <- We should probably never run this against 'production'

  const firestore = admin.firestore()
  
  const pathRoot = `/deployments/${deploymentId}`
  return firestore.doc(pathRoot)
    .get()
    .then(snapshotRoot => {
      const refSnapshotRoot = snapshotRoot.ref
      console.log('removeBuySellInfo Remove field _buySellInfoCache')
      refSnapshotRoot.set({
        _buySellInfoCache: admin.firestore.FieldValue.delete()
      }, { merge: true })

      console.log('removeBuySellInfo Remove field buySellRatiosCount')
      refSnapshotRoot.set({
        buySellRatiosCount: admin.firestore.FieldValue.delete()
      }, { merge: true })

      console.log('removeBuySellInfo Remove collection buySellRatios')              
      const pathBuySellRatios = `${pathRoot}/buySellRatios`
      const refBuySellRatios = firestore.collection(pathBuySellRatios)
      return deleteCollection(refBuySellRatios)
    })
}


/**
 * DANGER, WILL ROBINSON!
 */
function removeAllPrices(deploymentId) {

  deploymentId = 'test' // <- We should probably never run this against 'production'

  const firestore = admin.firestore()

  const pathLocations = `/deployments/${deploymentId}/locations`
  return firestore.collection(pathLocations)
    .get()
    .then(snapshotLocations => {
      const promises = []
      snapshotLocations.forEach(docLocation => {
        const docLocationId = docLocation.id
        const pathPrices = `${pathLocations}/${docLocationId}/prices`
        console.log('removeAllPrices pathPrices', pathPrices)
        const refPrices = firestore.collection(pathPrices)
        const promise = deleteCollection(refPrices)
        promises.push(promise)
      })
      return Promise.all(promises)
    })
}


/**
 * Before calling this, delete buySellRatios and _buySellInfoCache via the web admin
 * 
 * @param {*} deploymentId 
 */
function createBuySellInfo(deploymentId) {

  const timestampNew = undefined
  const locationId = undefined
  const priceId = undefined
  const pricesNew = undefined

  const firestore = admin.firestore()

  console.log('createBuySellInfo runTransaction(...)')
  return firestore.runTransaction(transaction => {
    try {
      console.log('createBuySellInfo +runTransaction')
      //
      // Must call getBuySellInfoCache first to prevent:
      //  "Error: Firestore transactions require all reads to be executed before all writes."
      //
      return TradeCitizen.getBuySellInfoCache(firestore, transaction, deploymentId)
        .then(buySellInfoCache => {
          return TradeCitizen.updateBuySellInfo(firestore, transaction, timestampNew, deploymentId, locationId, priceId, pricesNew, buySellInfoCache)
            .then(result => {
              return TradeCitizen.lastStep()
            })
        })
    } finally {
      console.log('createBuySellInfo -runTransaction')    
    }
  })
}

//
//
//

const deploymentId = 'test'
removeBuySellInfo(deploymentId)
removeAllPrices(deploymentId)


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
