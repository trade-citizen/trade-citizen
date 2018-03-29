//
// To Test:
//  https://firebase.google.com/docs/functions/local-emulator
//  https://firebase.google.com/docs/functions/local-emulator#invoke_firestore_functions
//  $ firebase experimental:functions:shell
//  firebase > 
//

'use strict'
const functions = require('firebase-functions')
const admin = require('firebase-admin')
admin.initializeApp(functions.config().firebase)

const addLocationPrice = require('./TradeCitizen').addLocationPrice

//
// https://firebase.google.com/docs/functions/write-firebase-functions
// https://firebase.google.com/docs/firestore/extend-with-functions
// https://github.com/firebase/functions-samples
// https://firebase.google.com/docs/functions/callable
// https://firebase.google.com/docs/reference/functions/functions.https.HttpsError
// https://github.com/googleapis/googleapis/blob/master/google/rpc/code.proto
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

//
// To Test:
//  firebase > helloRequest()
//
exports.helloRequest = functions.https.onRequest((req, res) => {
  res.send('world')
})

//
// To Test:
//  firebase > helloCall(?!?!?!!?)
//
exports.helloCall = functions.https.onCall((data, context) => {
  return {}
})

//
// To Test:
//  firebase > addLocationPrice(?!?!?!!?)
//
exports.addLocationPrice = functions.https.onCall((data, context) => {
  const userId = context.auth.uid
  return addLocationPrice(userId, data)
    .then(result => {
      console.log('addLocationPrice success!')
      return {}//{ path: docPath, data: docData }
    })
})

/*
// To Test:
//  firebase > onLocationPriceCreate( { prices: { '4PqeXIFIa47BFsKsjKLa': { priceBuy: 7, priceSell: 3 } } }, { params: { deploymentId: 'test', locationId: 'zsrxhjHzhfXxUCPs73EF', priceId: 'zdqkRhVhBcw8E9TvpCU4' } })
//  firebase > onLocationPriceCreate( { prices: { '4PqeXIFIa47BFsKsjKLa': { priceBuy: 7, priceSell: 4 } } }, { params: { deploymentId: 'test', locationId: 'zsrxhjHzhfXxUCPs73EF', priceId: 'zdqkRhVhBcw8E9TvpCU4' } })
exports.onLocationPriceCreate = functions.firestore
  .document('/deployments/{deploymentId}/locations/{locationId}/prices/{priceId}')
  .onCreate(onLocationPriceCreate)
*/
