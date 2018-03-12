const functions = require('firebase-functions');

// https://firebase.google.com/docs/functions/write-firebase-functions
// https://firebase.google.com/docs/firestore/extend-with-functions
// https://github.com/firebase/functions-samples

exports.onPriceCreated = functions.firestore
  .document('/deployments/{deploymentId}/stations/{stationId}/prices/{priceId}')
  .onCreate(onPriceCreated)
  // TODO:(pv) .onUpdate, .onDelete, .onWrite?
  ;

function onPriceCreated(event) {
    const newValue = event.data.data();
    console.log('onPriceCreated newValue', newValue);
    // TODO:(pv) Update statistical averages...
    // ...
    // Get station id
    // Get commodity id
    return event.data.ref.set({
      server_timestamp_created: new Date(event.timestamp),
    }, {merge: true});
}
