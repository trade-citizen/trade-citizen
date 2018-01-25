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
    var srcCollectionRef = admin.firestore().collection(srcCollection)
        .get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                console.log(doc.id, '=>', doc.data());
                // ...
            });
        })
        .catch(err => {
            console.log('copyCollectionToDocument ERROR', err);
        });
}

copyCollectionToDocument('anchorTypes', '/deployments/production')
