
const admin = require('firebase-admin')
const serviceAccount = require("../trade-citizen-firebase-adminsdk.json")

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

const TradeCitizen = require('./TradeCitizen')

function investigateBuySellRatioRecalculationIssue(setup) {

  const deploymentId = 'test'
  const userId = 'pZ9Zc7zHzzQsQbe3ZqZxYOaqt6G2'
  let data

  if (setup) {
    data = {
      deploymentId,
      locationId: 'zsrxhjHzhfXxUCPs73EF', // Gallette Family Farms
      prices: {
        '4PqeXIFIa47BFsKsjKLa': { priceBuy: 1 }, // Agricium
        '5IsHDe0vQYAHeVnz8Dty': { priceBuy: 2 } // Agricultural Supplies
      }
    }
    console.log()
    console.log('addLocationPrice', data)
    return TradeCitizen.addLocationPrice(userId, data)
      .then(result => {
        /*
        _buySellInfoCache
          buySellPrices
            zsrxhjHzhfXxUCPs73EF
              4PqeXIFIa47BFsKsjKLa
                priceBuy        1
              5IsHDe0vQYAHeVnz8Dty
                priceBuy        2
        */

        data = {
          deploymentId,
          locationId: 'PHtX8Hcf933fm4ZQBtt8', // Hickes Research Outpost
          prices: {
            '4PqeXIFIa47BFsKsjKLa': { priceSell: 2 }, // Agricium
            '6myz2mm42kSA8503xAsl': { priceSell: 4 } // Altruciatoxin
          }
        }
        console.log()
        console.log('addLocationPrice', data)
        return TradeCitizen.addLocationPrice(userId, data)
          .then(result => {
            /*
            _buySellInfoCache
              buySellPrices
                zsrxhjHzhfXxUCPs73EF    // Gallette
                  4PqeXIFIa47BFsKsjKLa  // Agricium
                    priceBuy        1
                  5IsHDe0vQYAHeVnz8Dty  // Agricultural Supplies
                    priceBuy        2
                PHtX8Hcf933fm4ZQBtt8    // Hickes Research Outpost
                  4PqeXIFIa47BFsKsjKLa  // Agricium
                    priceSell       2
                  6myz2mm42kSA8503xAsl  // Altruciatoxin
                    priceSell       4
            
              buySellRatios
                4PqeXIFIa47BFsKsjKLa:zsrxhjHzhfXxUCPs73EF:PHtX8Hcf933fm4ZQBtt8
                  buyLocationId     "zsrxhjHzhfXxUCPs73EF"
                  buyLocationName   "Gallette Family Farms"
                  buyPrice          1
                  itemId            "4PqeXIFIa47BFsKsjKLa"
                  itemName          "Agricium"
                  ratio             2
                  sellLocationId    "PHtX8Hcf933fm4ZQBtt8"
                  sellLocationName  "Hickes Research Output"
                  sellPrice         2
            */

            data = {
              deploymentId,
              locationId: '4kr56IsDxUk0TGGdpU6C', // Terra Mills Hydro Farm
              prices: {
                '4PqeXIFIa47BFsKsjKLa': { priceSell: 3 }, // Agricium
                '6myz2mm42kSA8503xAsl': { priceBuy: 3 } // Altruciatoxin
              }
            }
            console.log()
            console.log('addLocationPrice', data)
            return TradeCitizen.addLocationPrice(userId, data)
              .then(result => {
                /*
                _buySellInfoCache
                  buySellPrices
                    4kr56IsDxUk0TGGdpU6C    // Terra Mills Hydro Farm
                      4PqeXIFIa47BFsKsjKLa  // Agricium
                        priceSell       3
                      6myz2mm42kSA8503xAsl  // Altruciatoxin
                        priceBuy        3
                    PHtX8Hcf933fm4ZQBtt8    // Hickes Research Outpost
                      4PqeXIFIa47BFsKsjKLa  // Agricium
                        priceSell       2
                      6myz2mm42kSA8503xAsl  // Altruciatoxin
                        priceSell       4
                    zsrxhjHzhfXxUCPs73EF    // Gallette
                      4PqeXIFIa47BFsKsjKLa  // Agricium
                        priceBuy        1
                      5IsHDe0vQYAHeVnz8Dty  // Agricultural Supplies
                        priceBuy        2
                  buySellRatios
                    4PqeXIFIa47BFsKsjKLa:zsrxhjHzhfXxUCPs73EF:4kr56IsDxUk0TGGdpU6C
                      buyLocationId     "zsrxhjHzhfXxUCPs73EF"
                      buyLocationName   "Gallette Family Farms"
                      buyPrice          1
                      itemId            "4PqeXIFIa47BFsKsjKLa"
                      itemName          "Agricium"
                      ratio             3
                      sellLocationId    "4kr56IsDxUk0TGGdpU6C"
                      sellLocationName  "Terra Mills Hydro Farm"
                      sellPrice         3
                    4PqeXIFIa47BFsKsjKLa:zsrxhjHzhfXxUCPs73EF:PHtX8Hcf933fm4ZQBtt8
                      buyLocationId     "zsrxhjHzhfXxUCPs73EF"
                      buyLocationName   "Gallette Family Farms"
                      buyPrice          1
                      itemId            "4PqeXIFIa47BFsKsjKLa"
                      itemName          "Agricium"
                      ratio             2
                      sellLocationId    "PHtX8Hcf933fm4ZQBtt8"
                      sellLocationName  "Hickes Research Outpost"
                      sellPrice         2
                    6myz2mm42kSA8503xAsl:4kr56IsDxUk0TGGdpU6C:PHtX8Hcf933fm4ZQBtt8
                      buyLocationId     "4kr56IsDxUk0TGGdpU6C"
                      buyLocationName   "Terra Mills Hydro Farm"
                      buyPrice          3
                      itemId            "6myz2mm42kSA8503xAsl"
                      itemName          "Altruciatoxin"
                      ratio             1.333333333333333
                      sellLocationId    "PHtX8Hcf933fm4ZQBtt8"
                      sellLocationName  "Hickes Research Outpost"
                      sellPrice         4
                */

                return Promise.resolve()
              })
          })
      })
  }

  data = {
    deploymentId,
    locationId: 'PHtX8Hcf933fm4ZQBtt8', // Hickes Research Outpost
    prices: {
      //'4PqeXIFIa47BFsKsjKLa': { priceSell: 2 }, // Agricium
      '5IsHDe0vQYAHeVnz8Dty': { priceSell: 4 } // Agricultural Supplies
    }
  }
  return TradeCitizen.addLocationPrice(userId, data)
    .then(result => {
      /*
      _buySellInfoCache
        buySellPrices
          4kr56IsDxUk0TGGdpU6C
            4PqeXIFIa47BFsKsjKLa
              priceSell       3
            6myz2mm42kSA8503xAsl
              priceBuy        3
          PHtX8Hcf933fm4ZQBtt8
            4PqeXIFIa47BFsKsjKLa
              ?
            5IsHDe0vQYAHeVnz8Dty
              priceSell       4
            6myz2mm42kSA8503xAsl
              ?
          zsrxhjHzhfXxUCPs73EF
            4PqeXIFIa47BFsKsjKLa
              priceBuy        1
            5IsHDe0vQYAHeVnz8Dty
              priceBuy        2
        buySellRatios
          4PqeXIFIa47BFsKsjKLa:zsrxhjHzhfXxUCPs73EF:4kr56IsDxUk0TGGdpU6C
            buyLocationId     "zsrxhjHzhfXxUCPs73EF"
            buyLocationName   "Gallette Family Farms"
            buyPrice          1
            itemId            "4PqeXIFIa47BFsKsjKLa"
            itemName          "Agricium"
            ratio             3
            sellLocationId    "4kr56IsDxUk0TGGdpU6C"
            sellLocationName  "Terra Mills Hydro Farm"
            sellPrice         3
          4PqeXIFIa47BFsKsjKLa:zsrxhjHzhfXxUCPs73EF:PHtX8Hcf933fm4ZQBtt8
            buyLocationId     "zsrxhjHzhfXxUCPs73EF"
            buyLocationName   "Gallette Family Farms"
            buyPrice          1
            itemId            "4PqeXIFIa47BFsKsjKLa"
            itemName          "Agricium"
            ratio             2
            sellLocationId    "PHtX8Hcf933fm4ZQBtt8"
            sellLocationName  "Hickes Research Outpost"
            sellPrice         2
          5IsHDe0vQYAHeVnz8Dty:zsrxhjHzhfXxUCPs73EF:PHtX8Hcf933fm4ZQBtt8
            buyLocationId     "zsrxhjHzhfXxUCPs73EF"
            buyLocationName   "Gallette Family Farms"
            buyPrice          2
            itemId            "5IsHDe0vQYAHeVnz8Dty"
            itemName          "Agricultural Supplies"
            ratio             2
            sellLocationId    "PHtX8Hcf933fm4ZQBtt8"
            sellLocationName  "Hickes Research Outpost"
            sellPrice         4
          6myz2mm42kSA8503xAsl:4kr56IsDxUk0TGGdpU6C:PHtX8Hcf933fm4ZQBtt8
            buyLocationId     "4kr56IsDxUk0TGGdpU6C"
            buyLocationName   "Terra Mills Hydro Farm"
            buyPrice          3
            itemId            "6myz2mm42kSA8503xAsl"
            itemName          "Altruciatoxin"
            ratio             1.333333333333333
            sellLocationId    "PHtX8Hcf933fm4ZQBtt8"
            sellLocationName  "Hickes Research Outpost"
            sellPrice         4
      */
      return Promise.resolve()
    })
}

if (false) {
  const promise = investigateBuySellRatioRecalculationIssue(true)
  if (false) {
    return promise
      .then(result => {
        console.log()
        console.log()
        console.log()
        console.log()
        console.log()
        return investigateBuySellRatioRecalculationIssue(false)
      })
  }
  return promise
}


function testClearingAllLocationItemPrices(deploymentId) {
  const userId = 'pZ9Zc7zHzzQsQbe3ZqZxYOaqt6G2'
  let data = {
    deploymentId,
    locationId: 'PHtX8Hcf933fm4ZQBtt8'
  }
  console.log()
  console.log('addLocationPrice', data)
  return TradeCitizen.addLocationPrice(userId, data)
    .then(result => {
      console.log('added')
      return Promise.resolve()
    })
}
