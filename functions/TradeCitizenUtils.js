
const admin = require('firebase-admin')
const serviceAccount = require("../trade-citizen-firebase-adminsdk.json")

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

const TradeCitizen = require('./TradeCitizen')

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
  console.log('createBuySellInfo firestore', firestore)

  console.log('createBuySellInfo runTransaction(...)')
  return firestore.runTransaction(transaction => {
    console.log('createBuySellInfo +runTransaction')
    try {
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

createBuySellInfo('test')
