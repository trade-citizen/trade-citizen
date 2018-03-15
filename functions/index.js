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

exports.onStorePriceCreate = firestoreServer
  .document('/deployments/{deploymentId}/stations/{storeId}/prices/{priceId}')
  .onCreate(onStorePriceCreate);

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
function onStorePriceCreate(event) {
  console.log('onStorePriceCreate arguments', arguments);

  const eventTimestamp = new Date(event.timestamp);

  const params = event.params;
  // console.log('onStorePriceCreate params', params);
  const deploymentId = params.deploymentId;
  const storeId = params.storeId;
  const priceId = params.priceId;

  const newDocument = event.data.exists ? event.data.data() : null;
  if (newDocument === null) {
    console.error('onStorePriceCreate newDocument === null; unhandled document deletion');
    return;
  }
  // console.log('onStorePriceCreate newDocument', newDocument);

  const prices = newDocument.prices;
  const priceBuy = undefined;
  const priceSell = undefined;
  if (prices) {
    for (const itemId of Object.keys(prices)) {
      const price = prices[itemId];
      priceBuy = price.priceBuy;
      priceSell = price.priceSell;
    }
  }
  const hasPrices = Boolean(priceBuy || priceSell);

  return firestoreClient.batch()
    .set(event.data.ref, {
      storeId: storeId,
      hasPrices: hasPrices,
      timestamp_server_processed: eventTimestamp
    }, { merge: true })
    .set(firestoreClient.doc(`/deployments/${deploymentId}/stations/${storeId}`), {
        hasPrices: hasPrices,
        timestamp_server_processed: eventTimestamp
      }, { merge: true })
    .commit()
    .then(results => {

      if (deploymentId === 'test') {
        return rebuildBuySellRatios(deploymentId, storeId, priceId, prices)
          .then(result => {
            return lastStep();
          });
      }

      return lastStep();
    })
    .catch(error => {
      console.error('onStorePriceCreate error', error);
    });
}


function lastStep() {
  // TODO:(pv) Update statistical averages...
  return Promise.resolve();
}


function rebuildBuySellRatios(deploymentId, storeId, priceId, prices) {
  console.log('rebuildBuySellRatios deploymentId', deploymentId, 'storeId', storeId, 'priceId', priceId, 'prices', prices);


    return firestoreClient.collection(`/deployments/${deploymentId}/itemTypes`)
      .get()
      .then(snapshotItemTypes => {

        const itemIds = [];
        snapshotItemTypes.forEach(docItemType => {
          itemIds.push(docItemType.id);
        });

        return firestoreClient.collection(`/deployments/${deploymentId}/stations`)
          .get()
          .then(snapshotStores => {

            const buySellPrices = {};
            const snapshotStoresSize = snapshotStores.size;

            const promises = [];

            const storeIds = [];
            snapshotStores.forEach(docStore => {
              const docStoreId = docStore.id;

              promises.push(docStore.ref.collection('prices')
                //.where('hasPrices', '==', true)
                .orderBy('timestamp_server_processed', 'desc')
                .limit(1)
                .get()
                .then(snapshotPrices => {
                  snapshotPrices.forEach(docPrice => {
                    const prices = docPrice.get('prices');
                    itemIds.forEach(itemId => {
                      const price = prices && prices[itemId];
                      const priceBuy = price && price.priceBuy;
                      const priceSell = price && price.priceSell;
                      addBuySellPrice(buySellPrices, docStoreId, itemId, 'buy', priceBuy);
                      addBuySellPrice(buySellPrices, docStoreId, itemId, 'sell', priceSell);
                    });
                  });

                  storeIds.push(docStoreId);
                  if (storeIds.length < snapshotStoresSize) {
                    return Promise.resolve();
                  }

                  return writeBuySellRatios(deploymentId, storeIds, itemIds, buySellPrices);
                }));
            });

            return Promise.all(promises);
          });
      });
}

function addBuySellPrice(buySellPrices,
                         storeId,
                         itemId,
                         buyOrSell,
                         itemPrice) {
  const side = 'price' + buyOrSell.charAt(0).toUpperCase() + buyOrSell.slice(1).toLowerCase();
  // console.log('side', side);
  let thisStoreItemPrices = buySellPrices[storeId];
  if (!thisStoreItemPrices) {
    thisStoreItemPrices = {};
    buySellPrices[storeId] = thisStoreItemPrices;
  }
  let itemPrices = thisStoreItemPrices[itemId];
  if (!itemPrices) {
    itemPrices = {};
    thisStoreItemPrices[itemId] = itemPrices;
  }
  itemPrices[side] = itemPrice;
}

function writeBuySellRatios(deploymentId, storeIds, itemIds, buySellPrices) {
  const buySellRatios = {};

  const writeBatch = firestoreClient.batch();

  for (const storeIdBuy of storeIds) {

    const itemPricesBuy = buySellPrices[storeIdBuy];

    for (const itemId of itemIds) {

      const itemBuy = itemPricesBuy && itemPricesBuy[itemId];
      const priceBuy = itemBuy && itemBuy.priceBuy;

      for (const storeIdSell of storeIds) {
        if (storeIdSell === storeIdBuy) {
          return;
        }

        const itemPricesSell = buySellPrices[storeIdSell];
        const itemSell = itemPricesSell && itemPricesSell[itemId];
        const priceSell = itemSell && itemSell.priceSell;

        const docId = `${itemId}:${storeIdBuy}:${storeIdSell}`;
        const docPath = `/deployments/${deploymentId}/buySellRatios/${docId}`;
        const docRef = firestoreClient.doc(docPath);

        const ratio = priceSell / priceBuy;

        const docData = {
          itemId: itemId,
          buyStoreId: storeIdBuy,
          buyPrice: priceBuy,
          ratio: ratio,
          sellPrice: priceSell,
          sellStoreId: storeIdSell
        }

        writeBatch.set(docRef, docData);
      }
    }
  }

  console.log('writeBuySellRatios writeBatch COMMIT...', writeBatch);
  return writeBatch.commit()
    .then((results => {
      console.log('writeBuySellRatios writeBatch COMMITTED!', results);
    }));
}
