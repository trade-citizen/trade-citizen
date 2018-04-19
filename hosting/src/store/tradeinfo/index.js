import Vue from 'vue'
import firebase from '@firebase/app'
import '@firebase/firestore'
import '@firebase/functions'
import * as utils from '../../utils'

class ErrorPricesInvalid extends Error {
  constructor (message, invalidPrices) {
    super(message)
    this.invalidPrices = invalidPrices
  }
}

const DEPLOYMENT_ID = utils.isProduction() ? 'production' : 'test'
const ROOT = `/deployments/${DEPLOYMENT_ID}`
const FIELD_TIMESTAMPED = 'timestamped'
const FIELD_TIMESTAMP = 'timestamp'
const ALLOW_EDIT_OFFLINE = false

let firestore = null

export default {
  state: {
    offline: false,
    persistenceError: null,
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
    buySellRatiosFilter: {
      items: [],
      locationsBuy: [],
      locationsSell: []
    },
    buySellRatiosUnsubscribes: [],
    buySellRatios: []
  },
  mutations: {
    setOffline (state, payload) {
      // console.log('setOffline', payload)
      let offline = payload
      // console.log('setOffline offline', offline)
      state.offline = offline
      if (firestore) {
        if (offline) {
          // console.log('setOffline firestore.disableNetwork()')
          firestore.disableNetwork()
        } else {
          // console.log('setOffline firestore.enableNetwork()')
          firestore.enableNetwork()
        }
      }
    },
    _setPersistenceError (state, payload) {
      state.persistenceError = payload
    },
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
          // console.log('item', item)

          let itemId = item.id
          let itemName = item.name
          let itemCategory = item.category
          let locationItemPrice = locationItemPrices[itemId]
          // console.log('locationItemPrice', locationItemPrice)

          locationItemPrice = Object.assign({
            id: itemId,
            name: itemName,
            category: itemCategory
          }, locationItemPrice)
          // console.log('locationItemPrice', locationItemPrice)

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
    _setLocationItemPriceInvalid (state, { locationId, itemId, buyOrSell, invalidPrice }) {
      let locationItemPrices = state.locationsItemsPricesMap[locationId]
      // console.log('_setLocationItemPriceInvalid locationItemPrices', locationItemPrices)
      let prices = locationItemPrices
        .find(item => {
          return item.id === itemId
        })
      // console.log('_setLocationItemPriceInvalid itemPrices', itemPrices)
      let errorKey = `invalidPrice${utils.uppercaseFirstLetter(buyOrSell)}`
      Vue.set(prices, errorKey, invalidPrice)
    },

    setBuySellRatiosPagination (state, payload) {
      // console.log('setBuySellRatiosPagination payload', payload)
      state.buySellRatiosPagination = payload
    },
    setBuySellRatiosFilter (state, payload) {
      // console.log('setBuySellRatiosFilter payload', payload)
      state.buySellRatiosFilter = payload
    },
    _setBuySellRatiosUnsubscribes (state, payload) {
      state.buySellRatiosUnsubscribes = payload
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
      firebase.initializeApp({
        apiKey: 'AIzaSyDfKA77M6vyodG8_BprKviSgNtB0zLoVDU',
        authDomain: 'trade-citizen.firebaseapp.com',
        projectId: 'trade-citizen'
      })
      firestore = firebase.firestore()
      firestore.settings({
        timestampsInSnapshots: true
      })
      firestore.enablePersistence()
        .then(result => {
          // console.log('enablePersistence resolve')
        }, error => {
          // console.warn('enablePersistence error', error)
          context.commit('_setPersistenceError', error)
        })
        .then(result => {
          firebase.auth().onAuthStateChanged(user => {
            // console.log('onAuthStateChanged user', user)
            if (user) {
              context.dispatch('autoSignIn', user)
            }
            context.dispatch('_queryItemCategories')
          })
        })
    },

    _queryItemCategories (context) {
      // console.log('_queryItemCategories')
      let path = `${ROOT}/itemCategories`
      // console.log('_queryItemCategories path', path)
      firestore.collection(path)
        .onSnapshot(/* { includeQueryMetadataChanges: true }, */ querySnapshot => {
          context.dispatch('_onQueriedItemCategories', querySnapshot)
        }, error => {
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
      docChanges.forEach(change => {
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
      firestore.collection(path)
        .onSnapshot(/* { includeQueryMetadataChanges: true }, */ querySnapshot => {
          context.dispatch('_onQueriedItems', querySnapshot)
        }, error => {
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
      docChanges.forEach(change => {
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
      firestore.collection(path)
        .onSnapshot(/* { includeQueryMetadataChanges: true }, */ querySnapshot => {
          context.dispatch('_onQueriedAnchors', querySnapshot)
        }, error => {
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
      docChanges.forEach(change => {
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
      firestore.collection(path)
        .onSnapshot(/* { includeQueryMetadataChanges: true }, */ querySnapshot => {
          context.dispatch('_onQueriedLocations', querySnapshot)
        }, error => {
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
      docChanges.forEach(change => {
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
      firestore.collection(path)
        .where(FIELD_TIMESTAMPED, '==', true)
        .orderBy(FIELD_TIMESTAMP, 'desc')
        .limit(1)
        .onSnapshot(/* { includeQueryMetadataChanges: true }, */ querySnapshot => {
          context.dispatch('_onQueriedLocationItemPrices', { locationId, querySnapshot })
        }, error => {
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
      docChanges.forEach(change => {
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
        const docDataTimestamp = docData[FIELD_TIMESTAMP]
        metadata.timestamp = docDataTimestamp && docDataTimestamp.toDate()
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
      // console.info('queryBuySellRatios')
      if (!context.state.initialized) {
        // console.log('queryBuySellRatios initialized == false; ignoring')
        return
      }

      let buySellRatiosUnsubscribes = context.state.buySellRatiosUnsubscribes
      for (let buySellRatiosUnsubscribe of buySellRatiosUnsubscribes) {
        // console.log('queryBuySellRatios buySellRatiosUnsubscribe()')
        buySellRatiosUnsubscribe()
      }
      context.commit('_setBuySellRatiosUnsubscribes', [])

      //
      // https://vuetifyjs.com/en/components/data-tables#example-server
      // https://github.com/vuetifyjs/vuetify/blob/master/src/mixins/data-iterable.js#L27
      //
      let buySellRatiosPagination = context.state.buySellRatiosPagination
      // console.log('queryBuySellRatios buySellRatiosPagination', buySellRatiosPagination)
      let { sortBy, descending, rowsPerPage } = buySellRatiosPagination
      let direction = descending ? 'desc' : 'asc'
      let path = `${ROOT}/buySellRatios`

      const queries = []

      let buySellRatiosFilter = context.state.buySellRatiosFilter
      // console.log('queryBuySellRatios buySellRatiosFilter', buySellRatiosFilter)
      buySellRatiosFilter.items.forEach(filterItem => {
        let query = firestore.collection(path)
          .where('itemName', '==', filterItem.name)
        if (sortBy !== 'itemName') {
          query = query.orderBy(sortBy, direction)
        }
        queries.push(query)
      })
      buySellRatiosFilter.locationsBuy.forEach(filterLocationBuy => {
        let query = firestore.collection(path)
          .where('buyLocationName', '==', filterLocationBuy.name)
        if (sortBy !== 'buyLocationName') {
          query = query.orderBy(sortBy, direction)
        }
        queries.push(query)
      })
      buySellRatiosFilter.locationsSell.forEach(filterLocationSell => {
        let query = firestore.collection(path)
          .where('sellLocationName', '==', filterLocationSell.name)
        if (sortBy !== 'sellLocationName') {
          query = query.orderBy(sortBy, direction)
        }
        queries.push(query)
      })
      if (!queries.length) {
        let query = firestore.collection(path)
          .orderBy(sortBy, direction)
        queries.push(query)
      }
      // console.log('queryBuySellRatios queries', queries)

      context.commit('_setBuySellRatios', [])
      buySellRatiosUnsubscribes = []
      for (let query of queries) {
        query = query
          .limit(rowsPerPage)
        // console.log('queryBuySellRatios query', getQueryString(query))
        let unsubscribe = query
          .onSnapshot({ includeQueryMetadataChanges: true }, querySnapshot => {
            context.dispatch('_onQueriedBuySellRatios', querySnapshot)
          }, error => {
            console.error('queryBuySellRatios', error)
          })
        buySellRatiosUnsubscribes.push(unsubscribe)
      }
      context.commit('_setBuySellRatiosUnsubscribes', buySellRatiosUnsubscribes)
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

      docChanges.forEach(change => {
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
          buyTimestamp: buyTimestamp && buyTimestamp.toDate(),
          ratio,
          sellPrice,
          sellTimestamp: sellTimestamp && sellTimestamp.toDate(),
          sellLocationName
        }
        // console.log('_onQueriedBuySellRatios buySellRatio', buySellRatio)
        buySellRatios.push(buySellRatio)
      })
      // console.log('_onQueriedBuySellRatios buySellRatios', buySellRatios)
      // console.log('_onQueriedBuySellRatios context.state.buySellRatios', context.state.buySellRatios)
      let buySellRatiosPagination = context.state.buySellRatiosPagination
      // console.log('_onQueriedBuySellRatios buySellRatiosPagination', buySellRatiosPagination)
      let { sortBy, descending, rowsPerPage } = buySellRatiosPagination
      let equals = (a, b) => {
        // console.log('equals a', a, 'b', b)
        let result = a.itemName === b.itemName
        // console.log('equals itemName', result)
        result = result && a.buyLocationName === b.buyLocationName
        // console.log('equals buyLocationName', result)
        result = result && a.buyPrice === b.buyPrice
        // console.log('equals buyPrice', result)
        // NOTE:(pv) For some reason comparing buyTimestamp returns false
        result = result && a.ratio === b.ratio
        // console.log('equals ratio', result)
        result = result && a.sellPrice === b.sellPrice
        // console.log('equals sellPrice', result)
        // NOTE:(pv) For some reason comparing sellTimestamp returns false
        result = result && a.sellLocationName === b.sellLocationName
        // console.log('equals sellLocationName', result)
        return result
      }
      let sort = (a, b) => {
        let valueA = a[sortBy]
        let valueB = b[sortBy]
        let result
        if (valueA > valueB) {
          result = 1
        } else if (valueA < valueB) {
          result = -1
        } else {
          result = 0
        }
        if (descending) {
          result = -result
        }
        return result
      }
      let result = concatUniqueSortLimit(buySellRatios, context.state.buySellRatios, equals, sort, rowsPerPage)
      // console.log('_onQueriedBuySellRatios result', result)
      context.commit('_setBuySellRatios', result)
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

      let invalidPrices = []

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
          let invalidPrice

          priceNewBuy = priceNew.priceBuy
          // console.log('saveLocationItemPrices priceNewBuy', priceNewBuy)
          if (priceNewBuy === null) {
            priceNewBuy = priceOriginalBuy
          }
          invalidPrice = priceNewBuy && isNaN(priceNewBuy)
          context.commit('_setLocationItemPriceInvalid', { locationId, itemId, buyOrSell: 'buy', invalidPrice: invalidPrice })
          if (invalidPrice) {
            invalidPrices.push({ itemId, buyOrSell: 'buy' })
          } else {
            priceNewBuy = Number(priceNewBuy)
          }

          priceNewSell = priceNew.priceSell
          // console.log('saveLocationItemPrices priceNewSell', priceNewSell)
          if (priceNewSell === null) {
            priceNewSell = priceOriginalSell
          }
          invalidPrice = priceNewSell && isNaN(priceNewSell)
          context.commit('_setLocationItemPriceInvalid', { locationId, itemId, buyOrSell: 'sell', invalidPrice: invalidPrice })
          if (invalidPrice) {
            invalidPrices.push({ itemId, buyOrSell: 'sell' })
          } else {
            priceNewSell = Number(priceNewSell)
          }
        }
        // console.log('saveLocationItemPrices priceNewBuy', priceNewBuy, 'priceNewSell', priceNewSell)

        if (invalidPrices.length) {
          continue
        }

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

      if (invalidPrices.length) {
        let message = 'Invalid price'
        if (invalidPrices.length === 1) {
          message += 's'
        }
        return Promise.reject(new ErrorPricesInvalid(message, invalidPrices))
      }

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
      const MOCK_ONLY = false
      if (MOCK_ONLY) {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            context.commit('_setSaving', false)
            resolve({ mocked: true })
          }, 1500)
        })
      } else {
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
    }
  },
  getters: {
    offline (state) {
      return state.offline
    },
    persistenceError (state) {
      return state.persistenceError
    },
    initializing (state) {
      return state.initializing
    },
    initialized (state) {
      return state.initialized
    },
    saveable (state, getters, rootState) {
      return getters.userIsAuthenticated && (ALLOW_EDIT_OFFLINE || !getters.offline)
    },
    saving (state) {
      return state.saving
    },
    getSelectedLocationId (state) {
      return state.selectedLocationId
    },
    itemCategory (state) {
      return itemCategoryId => {
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
      return locationId => {
        return state.locationsMap[locationId]
      }
    },
    locationItemPriceList (state) {
      return locationId => {
        return state.locationsItemsPricesMap[locationId]
      }
    },
    locationItemPriceMetadata (state) {
      return locationId => {
        return state.locationsItemsPricesMetadataMap[locationId]
      }
    },
    buySellRatiosPagination (state) {
      return state.buySellRatiosPagination
    },
    buySellRatiosFilter (state) {
      return state.buySellRatiosFilter
    },
    buySellRatios (state) {
      return state.buySellRatios
    }
  }
}

// eslint-disable-next-line no-unused-vars
function getQueryString (query) {
  // console.log('getQueryString query', query)

  let queryString = ''

  let _query = query._query

  let path = _query.path
  queryString = 'path ' + path

  let where = _query.filters
  if (where.length) {
    queryString += ' where ' + where
  }

  let orderBy = _query.explicitOrderBy
  if (orderBy.length) {
    queryString += ' orderBy ' + orderBy
  }

  let limit = _query.limit
  if (limit) {
    queryString += ' limit ' + limit
  }

  // offset

  return queryString
}

function concatUniqueSortLimit (arrayA, arrayB, equals, sort, limit) {
  let result = arrayA.concat(arrayB)
  for (var i = 0; i < result.length; ++i) {
    for (var j = i + 1; j < result.length; ++j) {
      if (equals(result[i], result[j])) {
        result.splice(j--, 1)
      }
    }
  }
  result.sort(sort)
  return result.slice(0, limit)
}
