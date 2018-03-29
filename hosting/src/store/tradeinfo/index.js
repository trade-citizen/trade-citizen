import Vue from 'vue'
import * as firebase from 'firebase'
import 'firebase/firestore'
import 'firebase/functions'

class PriceError extends Error {
  constructor (itemId, buyOrSell, message) {
    super(message)
    this.itemId = itemId
    this.buyOrSell = buyOrSell
  }
}

const IS_PRODUCTION = process.env.NODE_ENV === 'production'
const DEPLOYMENT_ID = IS_PRODUCTION ? 'production' : 'test'
const ROOT = `/deployments/${DEPLOYMENT_ID}`
const FIELD_TIMESTAMPED = 'timestamped'
const FIELD_TIMESTAMP = 'timestamp'
/*
 * This is weird: import 'firebase/firestore' does not support Query.offset(...)...
 * https://firebase.google.com/docs/reference/js/firebase.firestore.Query
 * ...but import 'firebase-admin' does:
 * https://cloud.google.com/nodejs/docs/reference/firestore/0.13.x/Query#offset
 *
 * import 'firebase-admin' actually results in import '@google-cloud/firestore'.
 *
 * Maybe there is a [safe] way to use that or firebase-admin here.
 *
 * NOTE that there is also some '@firebase/firestore' package too:
 * https://www.npmjs.com/package/@firebase/firestore
 * But this appears to resolve to the same thing as import 'firebase/firestore'
 *
 * Set this to true if they ever add "offset" to Firestore's Web SDK.
 *
 * Finally, consider this problem too:
 * https://firebase.google.com/docs/firestore/pricing#operations
 * "Managing large result sets"
 * "... when you send a query that includes an offset, you are charged a read for each skipped document."
 * THAT SUCKS!
 * So, IS_QUERY_OFFSET_SUPPORTED may never be enabled for pricing reasons alone.
 */
const IS_QUERY_OFFSET_SUPPORTED = false

export default {
  state: {
    initializing: true,
    initialized: false,
    saving: false,
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
    buySellRatiosPagination: {
      descending: true,
      page: 1,
      rowsPerPage: 10,
      sortBy: 'ratio',
      totalItems: 0,
      rowsPerPageItems: [5, 10, 25, 50, 100]
    },
    buySellRatiosUnsubscribe: null,
    buySellRatios: []
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
    },

    setBuySellRatiosPagination (state, payload) {
      // console.log('setBuySellRatiosPagination payload', payload)
      state.buySellRatiosPagination = payload
    },
    _setBuySellRatiosUnsubscribe (state, payload) {
      state.buySellRatiosUnsubscribe = payload
    },
    _setBuySellRatios (state, payload) {
      state.buySellRatios = payload
      let totalItems = payload ? payload.length : 0
      Vue.set(state.buySellRatiosPagination, 'totalItems', totalItems)
    },
    _setBuySellRatiosCount (state, payload) {
      Vue.set(state.buySellRatiosPagination, 'totalItems', payload)
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

    _queryLocationItemPrices (context, locationId) {
      // console.log('_queryLocationItemPrices locationId', locationId)
      let path = `${ROOT}/locations/${locationId}/prices`
      // console.log('_queryLocationItemPrices path', path)
      firebase.firestore().collection(path)
        .where(FIELD_TIMESTAMPED, '==', true)
        .orderBy(FIELD_TIMESTAMP, 'desc')
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
        metadata.timestamp = docData[FIELD_TIMESTAMP]
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
        // console.info('%c_testIfInitialized INITIALIZED!', 'color: green;')
        context.commit('_setInitialized')

        if (context.state.buySellRatios.length === 0) {
          context.dispatch('queryBuySellRatios')
        }
      }
    },

    queryBuySellRatios (context) {
      if (!context.state.initialized) {
        // console.log('queryBuySellRatios initialized == false; ignoring')
        return
      }

      let buySellRatiosUnsubscribe = context.state.buySellRatiosUnsubscribe
      if (buySellRatiosUnsubscribe) {
        // console.log('queryBuySellRatios buySellRatiosUnsubscribe()')
        buySellRatiosUnsubscribe()
      }

      //
      // https://vuetifyjs.com/en/components/data-tables#example-server
      // https://github.com/vuetifyjs/vuetify/blob/master/src/mixins/data-iterable.js#L27
      //
      let buySellRatiosPagination = context.state.buySellRatiosPagination
      // console.log('queryBuySellRatios buySellRatiosPagination', buySellRatiosPagination)
      let orderBy = buySellRatiosPagination.sortBy
      switch (orderBy) {
        case 'itemName':
          orderBy = 'itemId'
          break
        case 'buyLocationName':
          orderBy = 'buyLocationId'
          break
        case 'sellLocationName':
          orderBy = 'sellLocationId'
          break
      }
      let descending = buySellRatiosPagination.descending
      let direction = descending ? 'desc' : 'asc'
      let limit = buySellRatiosPagination.rowsPerPage
      let pageNumber = buySellRatiosPagination.page
      let offset
      if (IS_QUERY_OFFSET_SUPPORTED) {
        offset = (pageNumber - 1) * limit
      }
      let path = `${ROOT}/buySellRatios`
      // console.log('queryBuySellRatios path', path, 'orderBy', orderBy, 'direction', direction, 'offset', offset, 'limit', limit)
      let query = firebase.firestore().collection(path)
        .orderBy(orderBy, direction)
      if (offset) {
        query.offset(offset)
      }
      buySellRatiosUnsubscribe = query
        .limit(limit)
        .onSnapshot(/* { includeQueryMetadataChanges: true }, */ (querySnapshot) => {
          context.dispatch('_onQueriedBuySellRatios', querySnapshot)
        }, (error) => {
          console.error('queryBuySellRatios', error)
        })
      context.commit('_setBuySellRatiosUnsubscribe', buySellRatiosUnsubscribe)

      if (IS_QUERY_OFFSET_SUPPORTED) {
        firebase.firestore().doc(`${ROOT}`)
          .onSnapshot(/* { includeQueryMetadataChanges: true }, */ (docSnapshot) => {
            // console.log(`queryBuySellRatios ${ROOT} docSnapshot`, docSnapshot)
            let buySellRatiosCount = docSnapshot.get('buySellRatiosCount')
            context.commit('_setBuySellRatiosCount', buySellRatiosCount)
          }, (error) => {
            console.error(`queryBuySellRatios ${ROOT}`, error)
          })
      }
    },
    _onQueriedBuySellRatios (context, querySnapshot) {
      // console.log('_onQueriedBuySellRatios querySnapshot', querySnapshot)
      let docChanges = querySnapshot.docChanges
      // console.log('_onQueriedBuySellRatios docChanges', docChanges)
      if (docChanges.length === 0) {
        // console.warn('_onQueriedBuySellRatios docChanges.length === 0 ignoring')
        return
      }
      // console.log('_onQueriedBuySellRatios')

      let buySellRatios = []

      docChanges.forEach((change) => {
        // console.log('_onQueriedBuySellRatios change', change)
        let doc = change.doc
        // console.log('_onQueriedBuySellRatios doc', doc)
        // let docId = doc.id
        // let fromCache = doc.metadata.fromCache
        // console.log('_onQueriedBuySellRatios ' + docId + ' fromCache', fromCache)
        let docData = doc.data()
        // console.log('_onQueriedBuySellRatios docData', docData)

        let itemId = docData.itemId
        let itemName = context.state.itemsMap[itemId].name
        let buyLocationId = docData.buyLocationId
        // console.log('_onQueriedBuySellRatios buyLocationId', buyLocationId)
        let buyLocationName = context.state.locationsMap[buyLocationId].name
        let buyPrice = docData.buyPrice
        let buyTimestamp = docData.buyTimestamp
        let ratio = docData.ratio
        let sellPrice = docData.sellPrice
        let sellTimestamp = docData.sellTimestamp
        let sellLocationId = docData.sellLocationId
        // console.log('_onQueriedBuySellRatios sellLocationId', sellLocationId)
        let sellLocationName = context.state.locationsMap[sellLocationId].name

        let buySellRatio = {
          itemName,
          buyLocationName,
          buyPrice,
          buyTimestamp,
          ratio,
          sellPrice,
          sellTimestamp,
          sellLocationName
        }
        // console.log('_onQueriedBuySellRatios buySellRatio', buySellRatio)
        buySellRatios.push(buySellRatio)
      })

      // console.log('_onQueriedBuySellRatios buySellRatios', buySellRatios)
      context.commit('_setBuySellRatios', buySellRatios)
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

      let data = {
        deploymentId: DEPLOYMENT_ID,
        locationId
      }
      if (Object.keys(prices).length) {
        data.prices = prices
      }
      // console.log('saveLocationItemPrices data', data)
      context.commit('_setSaving', true)
      return firebase.functions().httpsCallable('addLocationPrice')(data)
        .then(result => {
          // console.log('addLocationPrice result', result)
          context.commit('_setSaving', false)
          return Promise.resolve(result)
        }, error => {
          console.error('addLocationPrice ERROR', error)
          context.commit('_setSaving', false)
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
    buySellRatiosPagination (state) {
      return state.buySellRatiosPagination
    },
    buySellRatios (state) {
      return state.buySellRatios
    }
  }
}
