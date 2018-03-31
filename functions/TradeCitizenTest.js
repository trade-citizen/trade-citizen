
const admin = require('firebase-admin')
const serviceAccount = require("../trade-citizen-firebase-adminsdk.json")

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

const TradeCitizen = require('./TradeCitizen')

const deploymentId = 'test'
const userId = 'pZ9Zc7zHzzQsQbe3ZqZxYOaqt6G2'
let data

if (true) {
  data = {
    deploymentId,
    locationId: 'zsrxhjHzhfXxUCPs73EF',
    prices: { '4PqeXIFIa47BFsKsjKLa': { priceBuy: 7, priceSell: 3 } }
  }
  TradeCitizen.addLocationPrice(userId, data)
}

if (true) {
  data = {
    deploymentId,
    locationId: 'zi0W2vHJOpMeYgR1sm3U',
    prices: { '4PqeXIFIa47BFsKsjKLa': { priceBuy: 10, priceSell: 5 } }
  }
  TradeCitizen.addLocationPrice(userId, data)
}
