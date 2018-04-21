
const admin = require('firebase-admin')
const serviceAccount = require("../trade-citizen-firebase-adminsdk.json")

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

const TradeCitizen = require('./TradeCitizen')

/**
 * DANGER, WILL ROBINSON!
 * 
 * @param {*} deploymentId 
 */
function removeAllPrices(deploymentId) {

  deploymentId = 'test' // <- We should probably never run this against 'production'

  const firestore = admin.firestore()

  console.log('removeAllPrices runTransaction(...)')
  return firestore.runTransaction(tranaction => {
    try {
      console.log('removeAllPrices +runTransaction')
      // ...
      //
      // Must call getBuySellInfoCache first to prevent:
      //  "Error: Firestore transactions require all reads to be executed before all writes."
      //
      return TradeCitizen.getBuySellInfoCache(firestore, transaction, deploymentId)
        .then(buySellInfoCache => {
          console.log('removeAllPrices buySellInfoCache', buySellInfoCache)
          console.log('TODO:(pv) Remove collection locations/*/prices')
          console.log('TODO:(pv) Remove field _buySellInfoCache')
          console.log('TODO:(pv) Remove field buySellRatiosCount')
          console.log('TODO:(pv) Remove collection buySellRatios')
          // ...
          return Promise.resolve()
        })
    } finally {
      console.log('removeAllPrices -runTransaction')    
    }
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

removeAllPrices('test')
createBuySellInfo('test')
