import Vue from 'vue'
import * as firebase from 'firebase'
import firebasePushId from './firebase-push-id'

class PriceError extends Error {
  constructor (itemId, buyOrSell, message) {
    super(message)
    this.itemId = itemId
    this.buyOrSell = buyOrSell
  }
}

const ROOT = '/deployments/' + (process.env.NODE_ENV === 'production' ? 'production' : 'test')
const FIELD_IS_TIMESTAMPED = 'isTimestamped'
const FIELD_TIMESTAMP_SERVER_PRICED = 'timestampServerPriced'

export default {
  state: {
    selectedLocationId: null,
    itemCategoriesMap: {},
    itemCategoriesList: [],
    itemsMap: {},
    itemsList: [],
    anchorsMap: {},
    locationsMap: {},
    locationsList: [],
    locationsItemsPricesMap: {},
    locationsItemsPricesMetadataMap: {},
    buySellRatios: []
  },
  mutations: {
    setSelectedLocationId (state, payload) {
      state.selectedLocationId = payload
    },
    _addItemCategory (state, payload) {
      Vue.set(state.itemCategoriesMap, payload.id, payload)
      state.itemCategoriesList = Object.values(state.itemCategoriesMap)
        .sort((a, b) => {
          let aName = a.name.toLowerCase()
          let bName = b.name.toLowerCase()
          if (aName < bName) {
            return -1
          }
          if (aName > bName) {
            return 1
          }
          return 0
        })
    },
    _addItem (state, payload) {
      Vue.set(state.itemsMap, payload.id, payload)
      state.itemsList = Object.values(state.itemsMap)
        .sort((a, b) => {
          let aName = a.name.toLowerCase()
          let bName = b.name.toLowerCase()
          if (aName < bName) {
            return -1
          }
          if (aName > bName) {
            return 1
          }
          return 0
        })
    },
    _addAnchor (state, payload) {
      Vue.set(state.anchorsMap, payload.id, payload)
    },
    _addLocation (state, payload) {
      Vue.set(state.locationsMap, payload.id, payload)
      state.locationsList = Object.values(state.locationsMap)
        .sort((a, b) => {
          let aName = a.name.toLowerCase()
          let bName = b.name.toLowerCase()
          if (aName < bName) {
            return -1
          }
          if (aName > bName) {
            return 1
          }
          return 0
        })
    },
    _setBuySellRatios (state, payload) {
      state.buySellRatios = payload
    },
    _setLocationItemPrices (state, { locationId, locationItemPrices, metadata }) {
      let locationItemPricesList = state.itemsList
        .map(item => {
          let itemId = item.id
          let itemName = item.name
          let itemCategory = item.category
          let locationItemPrice = locationItemPrices[itemId]
          locationItemPrice = Object.assign({
            id: itemId,
            name: itemName,
            category: itemCategory
          }, locationItemPrice)

          let priceBuy = locationItemPrice.priceBuy
          let priceSell = locationItemPrice.priceSell
          let isPriceDefined = !isNaN(priceBuy) || !isNaN(priceSell)
          locationItemPrice.isPriceDefined = isPriceDefined

          return locationItemPrice
        })
      Vue.set(state.locationsItemsPricesMap, locationId, locationItemPricesList)
      if (metadata) {
        Vue.set(state.locationsItemsPricesMetadataMap, locationId, metadata)
      } else {
        Vue.set(state.locationsItemsPricesMetadataMap, locationId, undefined)
      }
    }
  },
  actions: {

    fetchTradeinfo (context) {
      context.commit('setLoading', true)

      context.dispatch('_getItemCategories')
    },

    _getItemCategories (context) {
      // console.log('_getItemCategories')
      let path = `${ROOT}/itemCategories`
      // console.log('_getItemCategories path', path)
      firebase.firestore().collection(path)
        .onSnapshot(/* { includeQueryMetadataChanges: true }, */ (querySnapshot) => {
          context.dispatch('_gotItemCategories', querySnapshot)
        }, (error) => {
          console.error('_getItemCategories', error)
          context.commit('setLoading', false)
        })
    },
    _gotItemCategories (context, querySnapshot) {
      let docChanges = querySnapshot.docChanges
      // console.log('_gotItemCategories docChanges', docChanges)
      if (docChanges.length === 0) {
        // console.warn('_gotItemCategories docChanges.length === 0 ignoring')
        return
      }
      // console.log('_gotItemCategories')
      docChanges.forEach((change) => {
        // console.log('_gotItemCategories change.type', change.type)
        let doc = change.doc
        // console.log('_gotItemCategories doc', doc)
        let itemCategoryId = doc.id
        // let fromCache = doc.metadata.fromCache
        // console.log('_gotItemCategories ' + itemCategoryId + ' fromCache', fromCache)
        if (// !fromCache ||
          context.state.itemCategoriesMap[itemCategoryId] === undefined) {
          let docData = doc.data()
          // console.log(docData)
          if (docData.name !== undefined) {
            let itemCategory = {
              id: itemCategoryId,
              name: docData.name
            }
            // console.log('itemCategory.name:' + itemCategory.name)
            context.commit('_addItemCategory', itemCategory)
          }
        }
      })

      if (context.state.itemsList.length === 0) {
        context.dispatch('_getItems')
      }
    },

    _getItems (context) {
      // console.log('_getItems')
      let path = `${ROOT}/itemTypes`
      // console.log('_getItems path', path)
      firebase.firestore().collection(path)
        .onSnapshot(/* { includeQueryMetadataChanges: true }, */ (querySnapshot) => {
          context.dispatch('_gotItems', querySnapshot)
        }, (error) => {
          console.error('_getItems', error)
          context.commit('setLoading', false)
        })
    },
    _gotItems (context, querySnapshot) {
      let docChanges = querySnapshot.docChanges
      // console.log('_gotItems docChanges', docChanges)
      if (docChanges.length === 0) {
        // console.warn('_gotItems docChanges.length === 0 ignoring')
        return
      }
      // console.log('_gotItems')
      docChanges.forEach((change) => {
        // console.log('_gotItems change.type', change.type)
        let doc = change.doc
        // console.log('_gotItems doc', doc)
        let itemId = doc.id
        // let fromCache = doc.metadata.fromCache
        // console.log('_gotItems ' + itemId + ' fromCache', fromCache)
        if (// !fromCache ||
          context.state.itemsMap[itemId] === undefined) {
          let docData = doc.data()
          // console.log(docData)
          if (docData.name !== undefined) {
            let itemCategoryId = docData.category.id
            let item = {
              id: itemId,
              name: docData.name,
              category: context.state.itemCategoriesMap[itemCategoryId].name
            }
            if (docData.illegal) {
              item.illegal = true
            }
            // console.log('item.name:' + item.name)
            context.commit('_addItem', item)
          }
        }
      })

      if (Object.keys(context.state.anchorsMap).length === 0) {
        context.dispatch('_getAnchors')
      }
    },

    _getAnchors (context) {
      // console.log('_getAnchors')
      let path = `${ROOT}/anchors`
      // console.log('_getAnchors path', path)
      firebase.firestore().collection(path)
        .onSnapshot(/* { includeQueryMetadataChanges: true }, */ (querySnapshot) => {
          context.dispatch('_gotAnchors', querySnapshot)
        }, (error) => {
          console.error('_getAnchors', error)
          context.commit('setLoading', false)
        })
    },
    _gotAnchors (context, querySnapshot) {
      let docChanges = querySnapshot.docChanges
      // console.log('_gotAnchors docChanges', docChanges)
      if (docChanges.length === 0) {
        // console.warn('_gotAnchors docChanges.length === 0 ignoring')
        return
      }
      // console.log('_gotAnchors')
      docChanges.forEach((change) => {
        // console.log('_gotAnchors change.type', change.type)
        let doc = change.doc
        // console.log('_gotAnchors doc', doc)
        let anchorId = doc.id
        // let fromCache = doc.metadata.fromCache
        // console.log('_gotAnchors ' + anchorId + ' fromCache', fromCache)
        if (// !fromCache ||
          context.state.anchorsMap[anchorId] === undefined) {
          let docData = doc.data()
          // console.log('_gotAnchors docData', docData)
          let anchor = {
            id: anchorId,
            name: docData.name,
            type: docData.type.id,
            anchor: (docData.anchor !== undefined) ? docData.anchor.id : undefined
          }
          // console.log('anchor.name:' + anchor.name)
          context.commit('_addAnchor', anchor)
        }
      })

      if (context.state.locationsList.length === 0) {
        context.dispatch('_getLocations')
      }
    },

    _getLocations (context) {
      // console.log('_getLocations')
      let path = `${ROOT}/locations`
      // console.log('_getLocations path', path)
      firebase.firestore().collection(path)
        .onSnapshot(/* { includeQueryMetadataChanges: true }, */ (querySnapshot) => {
          context.dispatch('_gotLocations', querySnapshot)
        }, (error) => {
          console.error('_getLocations', error)
          context.commit('setLoading', false)
        })
    },
    _gotLocations (context, querySnapshot) {
      let docChanges = querySnapshot.docChanges
      // console.log('_gotLocations docChanges', docChanges)
      if (docChanges.length === 0) {
        // console.warn('_gotLocations docChanges.length === 0 ignoring')
        return
      }
      // console.log('_gotLocations')
      docChanges.forEach((change) => {
        // console.log('_gotLocations change.type', change.type)
        let doc = change.doc
        // console.log('_gotLocations doc', doc)
        let locationId = doc.id
        // let fromCache = doc.metadata.fromCache
        // console.log('_gotLocations ' + locationId + ' fromCache', fromCache)
        if (// !fromCache ||
          context.state.locationsMap[locationId] === undefined) {
          let docData = doc.data()
          // console.log(docData)

          let location = {
            id: locationId,
            name: docData.name,
            anchor: context.state.anchorsMap[docData.anchor.id],
            // locationType: docData.type,
            prices: {}
          }
          // console.log('location.name:' + location.name)
          context.commit('_addLocation', location)

          context.dispatch('_getLocationItemPrices', locationId)
        }
      })

      if (context.state.buySellRatios.length === 0) {
        context.dispatch('_getBuySellRatios')
      }
    },

    _getBuySellRatios (context) {
      // console.log('_getBuySellRatios')
      let path = `${ROOT}/buySellRatios`
      // console.log('_getBuySellRatios path', path)
      firebase.firestore().collection(path)
        .onSnapshot(/* { includeQueryMetadataChanges: true }, */ (querySnapshot) => {
          context.dispatch('_gotBuySellRatios', querySnapshot)
        }, (error) => {
          console.error('_getBuySellRatios', error)
          context.commit('setLoading', false)
        })
    },
    _gotBuySellRatios (context, querySnapshot) {
      let docChanges = querySnapshot.docChanges
      // console.log('_gotBuySellRatios docChanges', docChanges)
      if (docChanges.length === 0) {
        // console.warn('_gotBuySellRatios docChanges.length === 0 ignoring')
        return
      }
      // console.log('_gotBuySellRatios')

      let buySellRatios = []

      docChanges.forEach((change) => {
        // console.log('_gotBuySellRatios change.type', change.type)
        let doc = change.doc
        // console.log('_gotBuySellRatios doc', doc)
        // let docId = doc.id
        // let fromCache = doc.metadata.fromCache
        // console.log('_gotBuySellRatios ' + docId + ' fromCache', fromCache)
        let docData = doc.data()
        // console.log('_gotBuySellRatios docData', docData)

        let itemId = docData.itemId
        let itemName = context.state.itemsMap[itemId].name
        let buyLocationId = docData.buyLocationId
        // console.log('_gotBuySellRatios buyLocationId', buyLocationId)
        let buyLocationName = context.state.locationsMap[buyLocationId].name
        let buyPrice = docData.buyPrice
        let ratio = docData.ratio
        let sellPrice = docData.sellPrice
        let sellLocationId = docData.sellLocationId
        // console.log('_gotBuySellRatios sellLocationId', sellLocationId)
        let sellLocationName = context.state.locationsMap[sellLocationId].name

        let buySellRatio = {
          itemName: itemName,
          buyLocationName: buyLocationName,
          buyPrice: buyPrice,
          ratio: ratio,
          sellPrice: sellPrice,
          sellLocationName: sellLocationName
        }
        // console.log('_gotBuySellRatios buySellRatio', buySellRatio)
        buySellRatios.push(buySellRatio)
      })

      // console.log('_gotBuySellRatios buySellRatios', buySellRatios)
      context.commit('_setBuySellRatios', buySellRatios)
    },

    _getLocationItemPrices (context, locationId) {
      // console.log('_getLocationItemPrices locationId', locationId)
      let path = `${ROOT}/locations/${locationId}/prices`
      // console.log('_getLocationItemPrices path', path)
      firebase.firestore().collection(path)
        .where(FIELD_IS_TIMESTAMPED, '==', true)
        .orderBy(FIELD_TIMESTAMP_SERVER_PRICED, 'desc')
        .limit(1)
        .onSnapshot(/* { includeQueryMetadataChanges: true }, */ (querySnapshot) => {
          context.dispatch('_gotLocationItemPrices', { locationId, querySnapshot })
        }, (error) => {
          console.error('_getLocationItemPrices', error)
          context.commit('_setLocationItemPrices', { locationId: locationId, locationItemPrices: undefined })
          if (Object.keys(context.state.locationsItemsPricesMap).length === context.state.locationsList.length) {
            // Only setLoading false after all prices have come back
            context.commit('setLoading', false)
          }
        })
    },
    _gotLocationItemPrices (context, { locationId, querySnapshot }) {
      // let path = `${ROOT}/locations/${locationId}/prices`
      // console.log('_gotLocationItemPrices path', path)
      let docChanges = querySnapshot.docChanges
      // console.log('_gotLocationItemPrices docChanges', docChanges)
      if (docChanges.length === 0 && context.state.locationsItemsPricesMap[locationId] !== undefined) {
        // console.warn('_gotLocationItemPrices ' + path + ' docChanges.length === 0 ignoring')
        return
      }
      let locationItemPrices = {}
      let metadata = {}
      docChanges.forEach((change) => {
        // console.log('_gotLocationItemPrices change.type', change.type)
        if (change.type === 'removed' && docChanges.length !== 1) {
          return
        }
        let doc = change.doc
        // console.log('_gotLocationItemPrices doc', doc)
        // let fromCache = doc.metadata.fromCache
        // console.log('_gotLocationItemPrices fromCache', fromCache)
        let docData = doc.data()
        // console.log('_gotLocationItemPrices docData', docData)
        metadata.timestamp = docData[FIELD_TIMESTAMP_SERVER_PRICED]
        metadata.userId = docData.userId
        let prices = docData.prices
        // console.log('_gotLocationItemPrices prices', prices)
        if (prices) {
          Object.keys(prices).forEach(itemId => {
            let locationItemPrice = prices[itemId]
            let thisPrices = {}

            let locationItemPriceBuy = locationItemPrice.priceBuy
            if (locationItemPriceBuy && !isNaN(locationItemPriceBuy)) {
              thisPrices.priceBuy = Number(locationItemPriceBuy)
            }

            let locationItemPriceSell = locationItemPrice.priceSell
            if (locationItemPriceSell && !isNaN(locationItemPriceSell)) {
              thisPrices.priceSell = Number(locationItemPriceSell)
            }

            locationItemPrices[itemId] = thisPrices
          })
        }
      })
      // console.log('_gotLocationItemPrices locationItemPrices', locationItemPrices)
      context.commit('_setLocationItemPrices', { locationId, locationItemPrices, metadata })

      if (context.rootState.shared.loading &&
        Object.keys(context.state.locationsItemsPricesMap).length === context.state.locationsList.length) {
        // Only setLoading false after all prices have come back
        // console.info('%c_gotLocationItemPrices LOADED!', 'color: green;')
        context.commit('setLoading', false)
      }
    },

    saveLocationItemPrices (context, { locationId, locationItemPrices }) {
      // console.log('saveLocationItemPrices locationId:', locationId)
      // console.log('saveLocationItemPrices locationItemPrices:', locationItemPrices)

      let user = context.rootState.user.user
      // console.log('saveLocationItemPrices user', user)
      let userId = user && user.id
      // console.log('saveLocationItemPrices userId', userId)
      if (!userId) {
        return Promise.reject(new Error('Not authenticated'))
      }

      let prices = {}

      let changed = false

      let mapPricesNew = {}
      locationItemPrices.forEach(item => {
        mapPricesNew[item.id] = item
      })
      // console.log('saveLocationItemPrices mapPricesNew', mapPricesNew)

      let arrayPricesOriginalAll = context.state.locationsItemsPricesMap[locationId]
      // console.log('saveLocationItemPrices arrayPricesOriginalAll', arrayPricesOriginalAll)
      for (let priceOriginal of arrayPricesOriginalAll) {
        // console.log('saveLocationItemPrices priceOriginal', priceOriginal)
        let itemId = priceOriginal.id
        let priceOriginalBuy = priceOriginal.priceBuy
        let priceOriginalSell = priceOriginal.priceSell
        // console.log('saveLocationItemPrices priceOriginalBuy', priceOriginalBuy, 'priceOriginalSell', priceOriginalSell)
        let priceNew = mapPricesNew[itemId]
        // console.log('saveLocationItemPrices priceNew', priceNew)
        let priceNewBuy
        let priceNewSell
        if (priceNew) {
          priceNewBuy = priceNew.priceBuy
          if (priceNewBuy && isNaN(priceNewBuy)) {
            return Promise.reject(new PriceError(itemId, 'buy', 'Invalid price'))
          }
          priceNewBuy = Number(priceNewBuy)

          priceNewSell = priceNew.priceSell
          if (priceNewSell && isNaN(priceNewSell)) {
            return Promise.reject(new PriceError(itemId, 'sell', 'Invalid price'))
          }
          priceNewSell = Number(priceNewSell)
        }
        // console.log('saveLocationItemPrices priceNewBuy', priceNewBuy, 'priceNewSell', priceNewSell)

        let thisPrices = {}
        changed |= priceOriginalBuy !== priceNewBuy
        if (priceNewBuy) {
          thisPrices.priceBuy = priceNewBuy
        }
        changed |= priceOriginalSell !== priceNewSell
        if (priceNewSell) {
          thisPrices.priceSell = priceNewSell
        }
        if (Object.keys(thisPrices).length > 0) {
          prices[itemId] = thisPrices
        }
      }
      // console.log('saveLocationItemPrices prices', prices)

      if (!changed) {
        return Promise.reject(new Error('No prices changed'))
      }

      let docData = {
        userId: userId
      }
      if (Object.keys(prices).length) {
        docData.prices = prices
      }
      // console.log('saveLocationItemPrices docdata', docData)

      context.commit('setLoading', true)
      let path = `${ROOT}/locations/${locationId}/prices/${firebasePushId(true)}`
      console.log(`saveLocationItemPrices firestore.doc(${path}).set(${docData})...`)
      return firebase.firestore().doc(path)
        .set(docData)
        // NOTE:(pv) IF OFFLINE, THEN THE PROMISE DOES NOT RESOLVE UNTIL ONLINE
        .then(result => {
          console.log('saveLocationItemPrices SUCCESS!')
          context.commit('setLoading', false)
        }, error => {
          console.error('saveLocationItemPrices ERROR', error)
          context.commit('setLoading', false)
          return Promise.reject(error)
        })
    }
  },
  getters: {
    getSelectedLocationId (state) {
      return state.selectedLocationId
    },
    itemCategory (state) {
      return (itemCategoryId) => {
        return state.itemCategoriesMap[itemCategoryId].name
      }
    },
    items (state) {
      return state.itemsList
    },
    locations (state) {
      return state.locationsList
    },
    location (state) {
      return (locationId) => {
        return state.locationsMap[locationId]
      }
    },
    locationItemPriceList (state) {
      return (locationId) => {
        return state.locationsItemsPricesMap[locationId]
      }
    },
    locationItemPriceMetadata (state) {
      return (locationId) => {
        return state.locationsItemsPricesMetadataMap[locationId]
      }
    },
    buySellRatios (state) {
      return state.buySellRatios
    }
  }
}
