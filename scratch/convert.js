/*
let locationPrices = {
  'Location A': {
    'Item 1': {
      priceBuy: 4,
      priceSell: 4
    },
    'Item 2': {
      priceBuy: 3,
      priceSell: 2
    }
  },
  'Location B': {
    'Item 1': {
      priceBuy: 6,
      priceSell: 2
    },
    'Item 2': {
      priceBuy: 3,
      priceSell: 1
    }
  },
  'Location C': {
    'Item 1': {
      priceBuy: 10,
      priceSell: 8
    },
    'Item 2': {
      priceBuy: 5,
      priceSell: 4
    }
  }
}
*/

let rawDatas = [
  {
    locationId: 'Location A',
    prices: {
      'Item 1': {
        priceBuy: 4,
        priceSell: 4
      },
      'Item 2': {
        priceBuy: 3,
        priceSell: 2
      }
    }
  },
  {
    locationId: 'Location B',
    prices: {
      'Item 1': {
        priceBuy: 6,
        priceSell: 2
      },
      'Item 2': {
        priceBuy: 3,
        priceSell: 1
      }
    }
  },
  {
    locationId: 'Location C',
    prices: {
      'Item 1': {
        priceBuy: 10,
        priceSell: 8
      },
      'Item 2': {
        priceBuy: 5,
        priceSell: 4
      }
    }
  }
]

let locationPrices = {}
let buySellMargins = []

function sortBuySellMargins(buySellMargins) {
  buySellMargins.sort((itemA, itemB) => {
    let valueA, valueB

    //
    // Primary sort
    //
    valueA = itemA.itemName
    valueB = itemB.itemName
    if (valueA < valueB) {
      return -1
    }
    if (valueA > valueB) {
      return 1
    }

    //
    // Secondary sort
    //
    valueA = itemA.buyLocation
    valueB = itemB.buyLocation
    if (valueA < valueB) {
      return -1
    }
    if (valueA > valueB) {
      return 1
    }

    return 0
  })
}

function addPrice(locationId, itemId, buyOrSell, itemPrice, batch) {
  let thisLocationPrices = locationPrices[locationId]
  if (!thisLocationPrices) {
    thisLocationPrices = {}
    locationPrices[locationId] = thisLocationPrices
  }
  let itemPrices = thisLocationPrices[itemId]
  if (!itemPrices) {
    itemPrices = {}
    thisLocationPrices[itemId] = itemPrices
  }
  itemPrices['price' + buyOrSell] = itemPrice
  // console.log('addPrice locationPrices', locationPrices)

  buySellMargins = createBuySellMargins(locationPrices, batch)
}

function createBuySellMargins(locationPrices, batch) {
  let result = []

  let locationIds = Object.keys(locationPrices)
  locationIds.forEach(locationIdOuter => {
    //console.log('locationIdOuter', locationIdOuter)

    let locationPriceOuter = locationPrices[locationIdOuter]
    //console.log('locationPriceOuter', locationPriceOuter)

    let itemIds = Object.keys(locationPriceOuter)
    itemIds.forEach(itemId => {
      //console.log('itemId', itemId)

      let itemOuter = locationPriceOuter[itemId]
      //console.log(locationIdOuter + ' itemOuter', itemOuter)
      if (!itemOuter.priceBuy) {
        return
      }
      
      locationIds.forEach(locationIdInner => {
        if (locationIdInner == locationIdOuter) {
          return
        }
        //console.log('locationIdInner', locationIdInner)

        let locationPriceInner = locationPrices[locationIdInner]
        //console.log('locationPriceInner', locationPriceInner)

        let itemInner = locationPriceInner[itemId]

        if (!itemInner || !itemInner.priceSell) {
          return
        }

        //console.log(locationIdOuter + ' itemOuter', itemOuter)
        //console.log(locationIdInner + ' itemInner', itemInner)

        let price = {
          itemName: itemId,
          buyLocation: locationIdOuter,
          buyPrice: itemOuter.priceBuy,
          sellPrice: itemInner.priceSell,
          sellLocation: locationIdInner
        }
        //console.log('price', price)
        result.push(price)
      })
    })
  })

  if (!batch) {
    sortBuySellMargins(result)
  }
  return result
}



function process() {

  rawDatas.forEach(rawData => {
    // console.log('process rawData', rawData)
    let locationId = rawData.locationId
    // console.log('convert locationId', locationId)
    let prices = rawData.prices
    // console.log('convert prices', prices)
    Object.keys(prices).forEach(itemId => {
      let price = prices[itemId]
      // console.log('process', locationId, itemId, price)
      let priceBuy = price.priceBuy
      if (priceBuy) {
        addPrice(locationId, itemId, 'Buy', priceBuy, true)
      }
      let priceSell = price.priceSell
      if (priceSell) {
        addPrice(locationId, itemId, 'Sell', priceSell, true)
      }
    })
    // console.log()
  })
  sortBuySellMargins(buySellMargins)
}

console.log()
//console.log()
process()
buySellMargins.forEach(row => {
  let buyPrice = row.buyPrice.toFixed(3)
  let sellPrice = row.sellPrice.toFixed(3)
  let ratio = (sellPrice / buyPrice).toFixed(3)
  console.log(row.itemName, ', ', row.buyLocation, ', ', buyPrice, ', ', ratio, ', ', sellPrice, ', ', row.sellLocation)
})
console.log()
