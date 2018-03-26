import Vue from 'vue'
import * as firebase from 'firebase'
import 'firebase/functions'
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
    buySellRatios: [],
    initializing: true,
    initialized: false,
    saving: false
  },
  mutations: {
    setSelectedLocationId (state, payload) {
      state.selectedLocationId = payload
    },
    _setInitialized (state) {
      // console.log('_setInitialized')
      state.initializing = false
      state.initialized = true
    },
    _setSaving (state, payload) {
      // console.log('_setSaving', payload)
      state.saving = payload
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

    initialize (context) {
      context.dispatch('_queryItemCategories')
    },

    _queryItemCategories (context) {
      // console.log('_queryItemCategories')
      let path = `${ROOT}/itemCategories`
      // console.log('_queryItemCategories path', path)
      firebase.firestore().collection(path)
        .onSnapshot(/* { includeQueryMetadataChanges: true }, */ (querySnapshot) => {
          context.dispatch('_onQueriedItemCategories', querySnapshot)
        }, (error) => {
          console.error('_queryItemCategories', error)
        })
    },
    _onQueriedItemCategories (context, querySnapshot) {
      let docChanges = querySnapshot.docChanges
      // console.log('_onQueriedItemCategories docChanges', docChanges)
      if (docChanges.length === 0) {
        // console.warn('_onQueriedItemCategories docChanges.length === 0 ignoring')
        return
      }
      // console.log('_onQueriedItemCategories')
      docChanges.forEach((change) => {
        // console.log('_onQueriedItemCategories change.type', change.type)
        let doc = change.doc
        // console.log('_onQueriedItemCategories doc', doc)
        let itemCategoryId = doc.id
        // let fromCache = doc.metadata.fromCache
        // console.log('_onQueriedItemCategories ' + itemCategoryId + ' fromCache', fromCache)
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
        context.dispatch('_queryItems')
      }
    },

    _queryItems (context) {
      // console.log('_queryItems')
      let path = `${ROOT}/itemTypes`
      // console.log('_queryItems path', path)
      firebase.firestore().collection(path)
        .onSnapshot(/* { includeQueryMetadataChanges: true }, */ (querySnapshot) => {
          context.dispatch('_onQueriedItems', querySnapshot)
        }, (error) => {
          console.error('_queryItems', error)
        })
    },
    _onQueriedItems (context, querySnapshot) {
      let docChanges = querySnapshot.docChanges
      // console.log('_onQueriedItems docChanges', docChanges)
      if (docChanges.length === 0) {
        // console.warn('_onQueriedItems docChanges.length === 0 ignoring')
        return
      }
      // console.log('_onQueriedItems')
      docChanges.forEach((change) => {
        // console.log('_onQueriedItems change.type', change.type)
        let doc = change.doc
        // console.log('_onQueriedItems doc', doc)
        let itemId = doc.id
        // let fromCache = doc.metadata.fromCache
        // console.log('_onQueriedItems ' + itemId + ' fromCache', fromCache)
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
        context.dispatch('_queryAnchors')
      }
    },

    _queryAnchors (context) {
      // console.log('_queryAnchors')
      let path = `${ROOT}/anchors`
      // console.log('_queryAnchors path', path)
      firebase.firestore().collection(path)
        .onSnapshot(/* { includeQueryMetadataChanges: true }, */ (querySnapshot) => {
          context.dispatch('_onQueriedAnchors', querySnapshot)
        }, (error) => {
          console.error('_queryAnchors', error)
        })
    },
    _onQueriedAnchors (context, querySnapshot) {
      let docChanges = querySnapshot.docChanges
      // console.log('_onQueriedAnchors docChanges', docChanges)
      if (docChanges.length === 0) {
        // console.warn('_onQueriedAnchors docChanges.length === 0 ignoring')
        return
      }
      // console.log('_onQueriedAnchors')
      docChanges.forEach((change) => {
        // console.log('_onQueriedAnchors change.type', change.type)
        let doc = change.doc
        // console.log('_onQueriedAnchors doc', doc)
        let anchorId = doc.id
        // let fromCache = doc.metadata.fromCache
        // console.log('_onQueriedAnchors ' + anchorId + ' fromCache', fromCache)
        if (// !fromCache ||
          context.state.anchorsMap[anchorId] === undefined) {
          let docData = doc.data()
          // console.log('_onQueriedAnchors docData', docData)
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
        context.dispatch('_queryLocations')
      }
    },

    _queryLocations (context) {
      // console.log('_queryLocations')
      let path = `${ROOT}/locations`
      // console.log('_queryLocations path', path)
      firebase.firestore().collection(path)
        .onSnapshot(/* { includeQueryMetadataChanges: true }, */ (querySnapshot) => {
          context.dispatch('_onQueriedLocations', querySnapshot)
        }, (error) => {
          console.error('_queryLocations', error)
        })
    },
    _onQueriedLocations (context, querySnapshot) {
      let docChanges = querySnapshot.docChanges
      // console.log('_onQueriedLocations docChanges', docChanges)
      if (docChanges.length === 0) {
        // console.warn('_onQueriedLocations docChanges.length === 0 ignoring')
        return
      }
      // console.log('_onQueriedLocations')
      docChanges.forEach((change) => {
        // console.log('_onQueriedLocations change.type', change.type)
        let doc = change.doc
        // console.log('_onQueriedLocations doc', doc)
        let locationId = doc.id
        // let fromCache = doc.metadata.fromCache
        // console.log('_onQueriedLocations ' + locationId + ' fromCache', fromCache)
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

          context.dispatch('_queryLocationItemPrices', locationId)
        }
      })
    },

    queryBuySellRatios (context) {
      // console.log('queryBuySellRatios')
      let path = `${ROOT}/buySellRatios`
      // console.log('_getBuySellRatios path', path)
      firebase.firestore().collection(path)
        .onSnapshot(/* { includeQueryMetadataChanges: true }, */ (querySnapshot) => {
          context.dispatch('_onQueriedBuySellRatios', querySnapshot)
        }, (error) => {
          console.error('queryBuySellRatios', error)
        })
    },
    _onQueriedBuySellRatios (context, querySnapshot) {
      let docChanges = querySnapshot.docChanges
      // console.log('_onQueriedBuySellRatios docChanges', docChanges)
      if (docChanges.length === 0) {
        // console.warn('_onQueriedBuySellRatios docChanges.length === 0 ignoring')
        return
      }
      // console.log('_onQueriedBuySellRatios')

      let buySellRatios = []

      docChanges.forEach((change) => {
        // console.log('_gotBuySellRatios change.type', change.type)
        let doc = change.doc
        // console.log('_onQueriedBuySellRatios doc', doc)
        // let docId = doc.id
        // let fromCache = doc.metadata.fromCache
        // console.log('_onQueriedBuySellRatios ' + docId + ' fromCache', fromCache)
        let docData = doc.data()
        // console.log('_gotBuySellRatios docData', docData)

        let itemId = docData.itemId
        let itemName = context.state.itemsMap[itemId].name
        let buyLocationId = docData.buyLocationId
        // console.log('_onQueriedBuySellRatios buyLocationId', buyLocationId)
        let buyLocationName = context.state.locationsMap[buyLocationId].name
        let buyPrice = docData.buyPrice
        let ratio = docData.ratio
        let sellPrice = docData.sellPrice
        let sellLocationId = docData.sellLocationId
        // console.log('_onQueriedBuySellRatios sellLocationId', sellLocationId)
        let sellLocationName = context.state.locationsMap[sellLocationId].name

        let buySellRatio = {
          itemName: itemName,
          buyLocationName: buyLocationName,
          buyPrice: buyPrice,
          ratio: ratio,
          sellPrice: sellPrice,
          sellLocationName: sellLocationName
        }
        // console.log('_onQueriedBuySellRatios buySellRatio', buySellRatio)
        buySellRatios.push(buySellRatio)
      })

      // console.log('_onQueriedBuySellRatios buySellRatios', buySellRatios)
      context.commit('_setBuySellRatios', buySellRatios)
    },

    _queryLocationItemPrices (context, locationId) {
      // console.log('_queryLocationItemPrices locationId', locationId)
      let path = `${ROOT}/locations/${locationId}/prices`
      // console.log('_queryLocationItemPrices path', path)
      firebase.firestore().collection(path)
        .where(FIELD_IS_TIMESTAMPED, '==', true)
        .orderBy(FIELD_TIMESTAMP_SERVER_PRICED, 'desc')
        .limit(1)
        .onSnapshot(/* { includeQueryMetadataChanges: true }, */ (querySnapshot) => {
          context.dispatch('_onQueriedLocationItemPrices', { locationId, querySnapshot })
        }, (error) => {
          console.error('_queryLocationItemPrices', error)
          context.commit('_setLocationItemPrices', { locationId: locationId, locationItemPrices: undefined })
          context.dispatch('_testIfInitialized')
        })
    },
    _onQueriedLocationItemPrices (context, { locationId, querySnapshot }) {
      // let path = `${ROOT}/locations/${locationId}/prices`
      // console.log('_onQueriedLocationItemPrices path', path)
      let docChanges = querySnapshot.docChanges
      // console.log('_onQueriedLocationItemPrices docChanges', docChanges)
      if (docChanges.length === 0 && context.state.locationsItemsPricesMap[locationId] !== undefined) {
        // console.warn('_onQueriedLocationItemPrices ' + path + ' docChanges.length === 0 ignoring')
        return
      }
      let locationItemPrices = {}
      let metadata = {}
      docChanges.forEach((change) => {
        // console.log('_onQueriedLocationItemPrices change.type', change.type)
        if (change.type === 'removed' && docChanges.length !== 1) {
          return
        }
        let doc = change.doc
        // console.log('_onQueriedLocationItemPrices doc', doc)
        // let fromCache = doc.metadata.fromCache
        // console.log('_onQueriedLocationItemPrices fromCache', fromCache)
        let docData = doc.data()
        // console.log('_onQueriedLocationItemPrices docData', docData)
        metadata.timestamp = docData[FIELD_TIMESTAMP_SERVER_PRICED]
        metadata.userId = docData.userId
        let prices = docData.prices
        // console.log('_onQueriedLocationItemPrices prices', prices)
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
      // console.log('_onQueriedLocationItemPrices locationItemPrices', locationItemPrices)
      context.commit('_setLocationItemPrices', { locationId, locationItemPrices, metadata })

      context.dispatch('_testIfInitialized')
    },

    _testIfInitialized (context) {
      if (!context.state.initialized &&
        Object.keys(context.state.locationsItemsPricesMap).length === context.state.locationsList.length) {
        // Only _setInitialized after all prices have come back
        // console.info('%c_onQueriedLocationItemPrices INITIALIZED!', 'color: green;')
        context.commit('_setInitialized')

        if (context.state.buySellRatios.length === 0) {
          context.dispatch('queryBuySellRatios')
        }
      }
    },

    saveLocationItemPrices (context, { locationId, locationItemPrices }) {
      // console.log('saveLocationItemPrices locationId:', locationId)
      // console.log('saveLocationItemPrices locationItemPrices:', locationItemPrices)

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

      // eslint-disable-next-line no-constant-condition
      if (true) {
        let data = {
          locationId
        }
        if (Object.keys(prices).length) {
          data.prices = prices
        }
        // console.log('saveLocationItemPrices data', data)
        context.commit('_setSaving', true)
        return firebase.functions().httpsCallable('addLocationPrice')(data)
          .then(result => {
            console.log('addLocationPrice result', result)
            context.commit('_setSaving', false)
            return Promise.resolve(result)
          }, error => {
            context.commit('_setSaving', false)
            return Promise.reject(error)
          })
      }

      let docData = {
        userId: userId
      }
      if (Object.keys(prices).length) {
        docData.prices = prices
      }
      // console.log('saveLocationItemPrices docdata', docData)

      context.commit('setSaving', true)
      let path = `${ROOT}/locations/${locationId}/prices/${firebasePushId(true)}`
      console.log(`saveLocationItemPrices firestore.doc(${path}).set(${docData})...`)
      return firebase.firestore().doc(path)
        .set(docData)
        // NOTE:(pv) IF OFFLINE, THEN THE PROMISE DOES NOT RESOLVE UNTIL ONLINE
        .then(result => {
          console.log('saveLocationItemPrices SUCCESS!')
          context.commit('setSaving', false)
          return Promise.resolve(result)
        }, error => {
          console.error('saveLocationItemPrices ERROR', error)
          context.commit('setSaving', false)
          return Promise.reject(error)
        })
    }
  },
  getters: {
    initializing (state) {
      return state.initializing
    },
    initialized (state) {
      return state.initialized
    },
    saving (state) {
      return state.saving
    },
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
