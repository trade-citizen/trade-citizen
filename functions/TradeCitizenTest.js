
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
    locationId: 'zsrxhjHzhfXxUCPs73EF', // Gallette Family Farms
    prices: {
      '4PqeXIFIa47BFsKsjKLa': { priceBuy: 1 }, // Agricium
      '5IsHDe0vQYAHeVnz8Dty': { priceBuy: 2 } // Agricultural Supplies
    }
  }
  TradeCitizen.addLocationPrice(userId, data)
}

if (true) {
  data = {
    deploymentId,
    locationId: 'PHtX8Hcf933fm4ZQBtt8', // Hickes Research Outpost
    prices: {
      '4PqeXIFIa47BFsKsjKLa': { priceSell: 2 }, // Agricium
      '6myz2mm42kSA8503xAsl': { priceSell: 4 } // Altruciatoxin
    }
  }
  TradeCitizen.addLocationPrice(userId, data)
}

if (true) {
  data = {
    deploymentId,
    locationId: '4kr56IsDxUk0TGGdpU6C', // Terra Mills Hydro Farm
    prices: {
      '4PqeXIFIa47BFsKsjKLa': { priceSell: 3 }, // Agricium
      '6myz2mm42kSA8503xAsl': { priceBuy: 3 } // Altruciatoxin
    }
  }
  TradeCitizen.addLocationPrice(userId, data)
}

if (true) {
  data = {
    deploymentId,
    locationId: 'PHtX8Hcf933fm4ZQBtt8', // Hickes Research Outpost
    prices: {
      '5IsHDe0vQYAHeVnz8Dty': { priceSell: 4 } // Agricultural Supplies
    }
  }
  TradeCitizen.addLocationPrice(userId, data)
}

