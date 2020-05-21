console.log('BEGIN');
const admin = require('firebase-admin')
const serviceAccount = require("../trade-citizen-firebase-adminsdk.json")

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

const TradeCitizen = require('./trade-citizen')


console.log('END');
