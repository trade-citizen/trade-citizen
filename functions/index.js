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

//
// https://firebase.google.com/docs/functions/write-firebase-functions
// https://firebase.google.com/docs/firestore/extend-with-functions
// https://github.com/firebase/functions-samples
//

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
  let priceBuy = undefined;
  let priceSell = undefined;
  if (prices) {
    Object.keys(prices).forEach(commodityId => {
      const price = prices[commodityId];
      priceBuy = price.priceBuy;
      priceSell = price.priceSell;
    });
  }
  let hasPrices = Boolean(priceBuy || priceSell);

  if (deploymentId === 'test') {
    const path = '/deployments/' + deploymentId + '/stations';
    firestoreClient
      .collection(path)
      .doc(stationId)
      .set({
        hasPrices: hasPrices,
        timestamp_last_priced: timestamp
      }, { merge: true });

    createBuySellRatios(deploymentId);//, stationId, priceId, newValue);      
  }

  return event.data.ref.set({
    hasPrices: hasPrices,
    timestamp_priced: timestamp,
  }, { merge: true });
}

function createBuySellRatios(deploymentId) {
  let stationCommodityPrices = {};
  const path = '/deployments/' + deploymentId + '/stations';
  firestoreClient.collection(path)
    .where('hasPrices', '==', true)
    .get()
    .then(snapshotStations => {
      snapshotStations.forEach(docStation => {
        // console.log('docStation', docStation.data());
        let stationId = docStation.id;
        docStation.ref.collection('prices')
          .where('hasPrices', '==', true)
          .orderBy('timestamp_priced', 'desc')
          .limit(1)
          .get()
          .then(snapshotPrices => {
            snapshotPrices.forEach(docPrice => {
              let docId = docPrice.id;
              // console.log('stationId', stationId, 'docId', docId, 'docPrice', docPrice.data());
              let prices = docPrice.get('prices');
              // console.log('stationId', stationId, 'prices', prices);
              if (!prices) {
                // 'hasPrices' should prevent this from ever happening
                return;
              }
              Object.keys(prices).forEach(commodityId => {
                let price = prices[commodityId];
                let priceBuy = price.priceBuy;
                let priceSell = price.priceSell;
                // console.log('stationId', stationId, 'commodityId', commodityId, 'priceBuy', priceBuy, 'priceSell', priceSell);
                addStationCommodityPrice(stationCommodityPrices, stationId, commodityId, 'buy', priceBuy);
                addStationCommodityPrice(stationCommodityPrices, stationId, commodityId, 'sell', priceSell);
              });
              console.log('stationCommodityPrices', stationCommodityPrices);
            });
          });
      });
    });
}

function addStationCommodityPrice(stationCommodityPrices,
                                  stationId,
                                  commodityId,
                                  buyOrSell,
                                  commodityPrice) {
  if (!commodityPrice) {
    return;
  }
  const side = 'price' + buyOrSell.charAt(0).toUpperCase() + buyOrSell.slice(1).toLowerCase();
  // console.log('side', side);
  let thisStationCommodityPrices = stationCommodityPrices[stationId];
  if (!thisStationCommodityPrices) {
    thisStationCommodityPrices = {};
    stationCommodityPrices[stationId] = thisStationCommodityPrices;
  }
  let commodityPrices = thisStationCommodityPrices[commodityId];
  if (!commodityPrices) {
    commodityPrices = {};
    thisStationCommodityPrices[commodityId] = commodityPrices;
  }
  commodityPrices[side] = commodityPrice;
}
