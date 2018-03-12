const functions = require('firebase-functions');

// https://firebase.google.com/docs/functions/write-firebase-functions
// https://firebase.google.com/docs/firestore/extend-with-functions
// https://github.com/firebase/functions-samples

const ROOT = '/deployments/test/'

exports.onPriceCreated = firestore
  .document(ROOT + 'stations/{stationId}/prices/{priceId}')
  .onCreate(onPriceCreated)
  // TODO:(pv) .onUpdate, .onDelete, .onWrite?
  ;

function onPriceCreated(event) {
    // TODO:(pv) Update statistical averages...
    // ...
    // Get station id
    // Get commodity id

    return event.data.ref.set({
      server_timestamp_created: event.timestamp,
    }, {merge: true});
}
