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

exports.onStationPriceCreate = firestoreServer
  .document('/deployments/{deploymentId}/stations/{stationId}/prices/{priceId}')
  .onCreate(onStationPriceCreate);

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
function onStationPriceCreate(event) {
  const timestamp = new Date(event.timestamp);

  const params = event.params;
  // console.log('onStationPriceCreate params', params);
  const deploymentId = params.deploymentId;
  const stationId = params.stationId;
  const priceId = params.priceId;

  const newDocument = event.data.exists ? event.data.data() : null;
  if (newDocument === null) {
    console.error('onStationPriceCreate newDocument === null; unhandled document deletion');
    return;
  }
  // console.log('onStationPriceCreate newDocument', newDocument);

  const prices = newDocument.prices;
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

  return firestoreClient.batch()
    .set(event.data.ref, {
      stationId: stationId,
      hasPrices: hasPrices,
      timestamp_priced: timestamp
    }, { merge: true })
    .set(firestoreClient
      .collection('/deployments/' + deploymentId + '/stations')
      .doc(stationId), {
        hasPrices: hasPrices,
        timestamp_last_priced: timestamp
      }, { merge: true })
    .commit()
    .then(results => {

      if (deploymentId === 'test') {
        updateBuySellRatios(deploymentId, stationId, priceId, prices);
      }
    })
    .catch(reason => {
      console.error('onStationPriceCreate exception', reason);
    });
}

function updateBuySellRatios(deploymentId, stationId, priceId, prices) {
  console.log('updateBuySellRatios deploymentId', deploymentId, 'stationId', stationId, 'priceId', priceId, 'prices', prices);

    return firestoreClient.collection('/deployments/' + deploymentId + '/stations')
      .where('hasPrices', '==', true)
      .get()
      .then(snapshotStations => {
        snapshotStations.forEach(docStation => {
          let stationId = docStation.id;
          docStation.ref.collection('prices')
            .where('hasPrices', '==', true)
            .orderBy('timestamp_priced', 'desc')
            .limit(1)
            .get()
            .then(snapshotPrices => {
              let stationCommodityPrices = {};
              snapshotPrices.forEach(docPrice => {
                let docId = docPrice.id;
                let prices = docPrice.get('prices');
                if (!prices) {
                  // 'hasPrices' should prevent this from ever happening
                  return;
                }
                Object.keys(prices).forEach(commodityId => {
                  let price = prices[commodityId];
                  let priceBuy = price.priceBuy;
                  let priceSell = price.priceSell;
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
