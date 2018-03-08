// npm i -g firebase-admin
const admin = require('firebase-admin');
const serviceAccount = require("../trade-citizen-firebase-adminsdk.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://trade-citizen.firebaseio.com"
});

// TODO:(pv) Move collection to doc
// TODO:(pv) Add categoryType/category
// TODO:(pv) Add itemCategory/itemType
// TODO:(pv) Add anchorType/anchor
// TODO:(pv) Add stationType/station

function copyCollectionToDocument(srcCollection, destDocument) {
    let srcCollectionName = srcCollection.match(/([^\/]*)\/*$/)[1]
    console.log('srcCollectionName', srcCollectionName)
    var srcCollectionRef = admin
        .firestore()
        .collection(srcCollection)
        .get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                let docData = doc.data();
                console.log(doc.id, '=>', docData);
                let destPath = destDocument + '/' + srcCollectionName
                console.log('destPath', destPath)
                admin
                    .firestore()
                    .collection(destPath)
                    .doc(doc.id)
                    .set(docData)
                    .then(snapshot => {
                        // console.log('copy SUCCESS')
                    })
                    .catch(err => {
                        console.error('copy ERROR', err)
                    })
                // TODO:(pv) doc.getCollections(...) if it has collections, copy them...
                //  https://firebase.google.com/docs/firestore/query-data/get-data#list_subcollections_of_a_document
                /*
                docData && Object.keys(docData).forEach(contentKey => {
                    console.log('contentKey', contentKey)
                    const nestedContent = docData[contentKey];
                    console.log('nestedContent', nestedContent)
                    if (typeof nestedContent === "object") {
                        Object.keys(nestedContent).forEach(docTitle => {
                            console.log('docTitle', docTitle)
                            let destPath = destDocument + '/' + contentKey
                            console.log('copy ' + doc.path + ' to ' + destPath)
                            admin
                                .firestore()
                                .collection(destPath)
                                .doc(docTitle)
                                .set(nestedContent[docTitle])
                                .then(snapshot => {
                                    console.log('copy SUCCESS')
                                })
                                .catch(err => {
                                    console.error('copy ERROR', err)
                                })
                        });
                    }
                });
                */
            });
        })
        .catch(err => {
            console.error('copyCollectionToDocument ERROR', err);
        });
}

let deployment = '/deployments/test'
copyCollectionToDocument('anchorTypes', deployment)
copyCollectionToDocument('anchors', deployment)
copyCollectionToDocument('itemCategories', deployment)
copyCollectionToDocument('itemTypes', deployment)
copyCollectionToDocument('stationTypes', deployment)
copyCollectionToDocument('stations', deployment)
