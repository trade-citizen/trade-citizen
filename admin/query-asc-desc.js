// npm i -g firebase-admin
const admin = require('firebase-admin');
const serviceAccount = require("../trade-citizen-firebase-adminsdk.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://trade-citizen.firebaseio.com"
});

function foo(path, orderBy, descending, limit, pageNumber) {
    let direction = descending ? 'desc' : 'asc'
    let startAt = (pageNumber - 1) * limit
    console.log('query path', path, 'orderBy', orderBy, 'direction', direction, 'startAt', startAt, 'limit', limit)
    return admin.firestore().collection(path)
        .orderBy(orderBy, direction)
        // This works in `firebase-admin`, but not in `firebase/firestore`
        .offset(startAt)
        .limit(limit)
        .onSnapshot(querySnapshot => {
            console.log()
            console.log('onSnapshot direction', direction, 'querySnapshot', querySnapshot)
            let docChanges = querySnapshot.docChanges
            console.log('onSnapshot direction', direction, 'docChanges', docChanges)
            console.log()
        }, (error) => {
            console.error('queryBuySellRatios', error)
        })
}

foo('/deployments/test/buySellRatios', 'ratio', true, 10, 1)
// foo('/deployments/test/buySellRatios', 'ratio', false, 10, 1)
