//
// NOTE:(pv) There are two "firestore" classes.
//  1) firestoreServer: Manages the server-side function hooks
//  2) firestoreClient: Full firestore client
//      https://cloud.google.com/nodejs/docs/reference/firestore/latest/
//
const functions = require('firebase-functions');
const firestoreServer = functions.firestore
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
const firestoreClient = admin.firestore();

// https://firebase.google.com/docs/functions/write-firebase-functions
// https://firebase.google.com/docs/firestore/extend-with-functions
// https://github.com/firebase/functions-samples

exports.onPriceCreated = firestoreServer
  .document('/deployments/{deploymentId}/stations/{stationId}/prices/{priceId}')
  .onCreate(onPriceCreated)
  // TODO:(pv) .onUpdate, .onDelete, .onWrite?
  ;

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
function onPriceCreated(event) {
  // console.log('onPriceCreated event', event);
  const timestamp = new Date(event.timestamp);
  const params = event.params;
  // console.log('onPriceCreated params', params);
  const deploymentId = params.deploymentId;
  const stationId = params.stationId;
  const priceId = params.priceId;
  const newValue = event.data.data();
  // console.log('onPriceCreated #TEST newValue', newValue);
  const prices = newValue.prices;
  let hasPrices = false;
  if (prices) {
    Object.keys(prices).forEach(commodityId => {
      const price = prices[commodityId];
      const priceBuy = price.priceBuy;
      const priceSell = price.priceSell;
      hasPrices |= priceBuy || priceSell
    });
  }

  return event.data.ref.set({
    hasPrices: hasPrices,
    server_timestamp_created: timestamp,
  }, { merge: true });
}
