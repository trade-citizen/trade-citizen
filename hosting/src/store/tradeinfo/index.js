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
const MOCK_SAVING = false

let firestore = null

export default {
  state: {
    offline: false,
    persistenceError: null,
    initializing: true,
    initialized: false,
    saving: false,
    itemCategoriesMap: {},
    itemCategoriesList: [],
    itemsMap: {},
    itemsList: [],
    anchorsMap: {},
    locationsMap: {},
    locationsList: [],
    locationsItemsPricesMap: {},
    locationsItemsPricesMetadataMap: {},
    buySellRatiosFilter: {
      items: [],
      locationsBuy: [],
      locationsSell: []
    },
    buySellRatiosPagination: {
      descending: true,
      page: 1,
      rowsPerPage: 10,
      sortBy: 'ratio',
      rowsPerPageItems: [5, 10, 25, 50, 100]
    },
    buySellRatiosPaginationOld: {},
    buySellRatiosUnsubscribes: [],
    buySellRatiosResponseCount: 0,
    buySellRatiosAll: [],
    buySellRatiosFiltered: []
  },
  mutations: {
    setOffline (state, payload) {
      // console.log('setOffline', payload)
      const offline = payload
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
          const aName = a.name.toLowerCase()
          const bName = b.name.toLowerCase()
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
          const aName = a.name.toLowerCase()
          const bName = b.name.toLowerCase()
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
          const aName = a.name.toLowerCase()
          const bName = b.name.toLowerCase()
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
      const locationItemPricesList = state.itemsList
        .map(item => {
          // console.log('item', item)

          const itemId = item.id
          const itemName = item.name
          const itemCategory = item.category
          let locationItemPrice = locationItemPrices[itemId]
          // console.log('locationItemPrice', locationItemPrice)

          locationItemPrice = Object.assign({
            id: itemId,
            name: itemName,
            category: itemCategory
          }, locationItemPrice)
          // console.log('locationItemPrice', locationItemPrice)

          const priceBuy = locationItemPrice.priceBuy
          const priceSell = locationItemPrice.priceSell
          const isPriceDefined = !isNaN(priceBuy) || !isNaN(priceSell)
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
      const locationItemPrices = state.locationsItemsPricesMap[locationId]
      // console.log('_setLocationItemPriceInvalid locationItemPrices', locationItemPrices)
      const prices = locationItemPrices
        .find(item => {
          return item.id === itemId
        })
      // console.log('_setLocationItemPriceInvalid itemPrices', itemPrices)
      const errorKey = `invalidPrice${utils.uppercaseFirstLetter(buyOrSell)}`
      Vue.set(prices, errorKey, invalidPrice)
    },

    _setBuySellRatiosFilter (state, payload) {
      // console.log('_setBuySellRatiosFilter payload', payload)
      state.buySellRatiosFilter = Object.assign({}, payload)
    },
    _setBuySellRatiosPagination (state, payload) {
      // console.log('_setBuySellRatiosPagination payload', payload)
      state.buySellRatiosPaginationOld = state.buySellRatiosPagination
      state.buySellRatiosPagination = Object.assign({}, payload)
    },
    _clearBuySellRatios (state) {
      state.buySellRatiosUnsubscribes.splice(0)
      state.buySellRatiosResponseCount = 0
      state.buySellRatiosAll.splice(0)
      state.buySellRatiosFiltered.splice(0)
    },
    _addBuySellRatiosUnsubscribe (state, payload) {
      state.buySellRatiosUnsubscribes.push(payload)
    },
    _incrementBuySellRatiosResponseCount (state) {
      state.buySellRatiosResponseCount++
    },
    _setBuySellRatio (state, { id, buySellRatio }) {
      // console.log('_setBuySellRatio id', id, 'buySellRatio', JSON.stringify(buySellRatio))
      // console.log('_setBuySellRatio BEFORE state.buySellRatiosAll', JSON.stringify(state.buySellRatiosAll))
      const foundIndex = state.buySellRatiosAll.findIndex(buySellRatio => {
        return buySellRatio.id === id
      })
      if (foundIndex !== -1) {
        // console.log('_setBuySellRatio Remove item...')
        state.buySellRatiosAll.splice(foundIndex, 1)
      }
      if (buySellRatio) {
        // console.log('_setBuySellRatio Add item...')
        state.buySellRatiosAll.push(buySellRatio)
      }

      const buySellRatiosPagination = state.buySellRatiosPagination
      // console.log('_setBuySellRatio buySellRatiosPagination', buySellRatiosPagination)
      const { sortBy, descending, rowsPerPage } = buySellRatiosPagination
      state.buySellRatiosAll.sort((a, b) => {
        const valueA = a[sortBy]
        const valueB = b[sortBy]
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
      })
      // console.log('_setBuySellRatio AFTER state.buySellRatiosAll', JSON.stringify(state.buySellRatiosAll))

      state.buySellRatiosFiltered = state.buySellRatiosAll.slice(0, rowsPerPage)
    }
  },
  actions: {
    initialize (context) {
      // console.log('initialize')

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
      const path = `${ROOT}/itemCategories`
      // console.log('_queryItemCategories path', path)
      firestore.collection(path)
        .onSnapshot(/* { includeQueryMetadataChanges: true }, */ querySnapshot => {
          context.dispatch('_onQueriedItemCategories', querySnapshot)
        }, error => {
          console.error('_queryItemCategories', error)
        })
    },
    _onQueriedItemCategories (context, querySnapshot) {
      const docChanges = querySnapshot.docChanges
      // console.log('_onQueriedItemCategories docChanges', docChanges)
      if (docChanges.length === 0) {
        // console.warn('_onQueriedItemCategories docChanges.length === 0 ignoring')
        return
      }
      // console.log('_onQueriedItemCategories')
      docChanges.forEach(change => {
        // console.log('_onQueriedItemCategories change.type', change.type)
        const doc = change.doc
        // console.log('_onQueriedItemCategories doc', doc)
        const itemCategoryId = doc.id
        // const fromCache = doc.metadata.fromCache
        // console.log('_onQueriedItemCategories ' + itemCategoryId + ' fromCache', fromCache)
        if (// !fromCache ||
          context.state.itemCategoriesMap[itemCategoryId] === undefined) {
          const docData = doc.data()
          // console.log(docData)
          if (docData.name !== undefined) {
            const itemCategory = {
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
      const path = `${ROOT}/itemTypes`
      // console.log('_queryItems path', path)
      firestore.collection(path)
        .onSnapshot(/* { includeQueryMetadataChanges: true }, */ querySnapshot => {
          context.dispatch('_onQueriedItems', querySnapshot)
        }, error => {
          console.error('_queryItems', error)
        })
    },
    _onQueriedItems (context, querySnapshot) {
      const docChanges = querySnapshot.docChanges
      // console.log('_onQueriedItems docChanges', docChanges)
      if (docChanges.length === 0) {
        // console.warn('_onQueriedItems docChanges.length === 0 ignoring')
        return
      }
      // console.log('_onQueriedItems')
      docChanges.forEach(change => {
        // console.log('_onQueriedItems change.type', change.type)
        const doc = change.doc
        // console.log('_onQueriedItems doc', doc)
        const itemId = doc.id
        // const fromCache = doc.metadata.fromCache
        // console.log('_onQueriedItems ' + itemId + ' fromCache', fromCache)
        if (// !fromCache ||
          context.state.itemsMap[itemId] === undefined) {
          const docData = doc.data()
          // console.log(docData)
          if (docData.name !== undefined) {
            const itemCategoryId = docData.category.id
            const item = {
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
      const path = `${ROOT}/anchors`
      // console.log('_queryAnchors path', path)
      firestore.collection(path)
        .onSnapshot(/* { includeQueryMetadataChanges: true }, */ querySnapshot => {
          context.dispatch('_onQueriedAnchors', querySnapshot)
        }, error => {
          console.error('_queryAnchors', error)
        })
    },
    _onQueriedAnchors (context, querySnapshot) {
      const docChanges = querySnapshot.docChanges
      // console.log('_onQueriedAnchors docChanges', docChanges)
      if (docChanges.length === 0) {
        // console.warn('_onQueriedAnchors docChanges.length === 0 ignoring')
        return
      }
      // console.log('_onQueriedAnchors')
      docChanges.forEach(change => {
        // console.log('_onQueriedAnchors change.type', change.type)
        const doc = change.doc
        // console.log('_onQueriedAnchors doc', doc)
        const anchorId = doc.id
        // const fromCache = doc.metadata.fromCache
        // console.log('_onQueriedAnchors ' + anchorId + ' fromCache', fromCache)
        if (// !fromCache ||
          context.state.anchorsMap[anchorId] === undefined) {
          const docData = doc.data()
          // console.log('_onQueriedAnchors docData', docData)
          const anchor = {
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
      const path = `${ROOT}/locations`
      // console.log('_queryLocations path', path)
      firestore.collection(path)
        .onSnapshot(/* { includeQueryMetadataChanges: true }, */ querySnapshot => {
          context.dispatch('_onQueriedLocations', querySnapshot)
        }, error => {
          console.error('_queryLocations', error)
        })
    },
    _onQueriedLocations (context, querySnapshot) {
      const docChanges = querySnapshot.docChanges
      // console.log('_onQueriedLocations docChanges', docChanges)
      if (docChanges.length === 0) {
        // console.warn('_onQueriedLocations docChanges.length === 0 ignoring')
        return
      }
      // console.log('_onQueriedLocations')
      docChanges.forEach(change => {
        // console.log('_onQueriedLocations change.type', change.type)
        const doc = change.doc
        // console.log('_onQueriedLocations doc', doc)
        const locationId = doc.id
        // const fromCache = doc.metadata.fromCache
        // console.log('_onQueriedLocations ' + locationId + ' fromCache', fromCache)
        if (// !fromCache ||
          context.state.locationsMap[locationId] === undefined) {
          const docData = doc.data()
          // console.log(docData)

          const location = {
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
      const path = `${ROOT}/locations/${locationId}/prices`
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
      // const path = `${ROOT}/locations/${locationId}/prices`
      // console.log('_onQueriedLocationItemPrices path', path)
      const docChanges = querySnapshot.docChanges
      // console.log('_onQueriedLocationItemPrices docChanges', docChanges)
      if (docChanges.length === 0 && context.state.locationsItemsPricesMap[locationId] !== undefined) {
        // console.warn('_onQueriedLocationItemPrices ' + path + ' docChanges.length === 0 ignoring')
        return
      }
      const locationItemPrices = {}
      const metadata = {}
      docChanges.forEach(change => {
        // console.log('_onQueriedLocationItemPrices change.type', change.type)
        if (change.type === 'removed' && docChanges.length !== 1) {
          return
        }
        const doc = change.doc
        // console.log('_onQueriedLocationItemPrices doc', doc)
        // const fromCache = doc.metadata.fromCache
        // console.log('_onQueriedLocationItemPrices fromCache', fromCache)
        const docData = doc.data()
        // console.log('_onQueriedLocationItemPrices docData', docData)
        const docDataTimestamp = docData[FIELD_TIMESTAMP]
        metadata.timestamp = docDataTimestamp && docDataTimestamp.toDate()
        metadata.userId = docData.userId
        const prices = docData.prices
        // console.log('_onQueriedLocationItemPrices prices', prices)
        if (prices) {
          Object.keys(prices).forEach(itemId => {
            const locationItemPrice = prices[itemId]
            const thisPrices = {}

            const locationItemPriceBuy = locationItemPrice.priceBuy
            if (locationItemPriceBuy && !isNaN(locationItemPriceBuy)) {
              thisPrices.priceBuy = Number(locationItemPriceBuy)
            }

            const locationItemPriceSell = locationItemPrice.priceSell
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
        //
        // Only _setInitialized when *ALL* _queryLocationItemPrices have come back
        //
        // console.info('%c_testIfInitialized INITIALIZED!', 'color: green;')
        context.commit('_setInitialized')

        if (context.state.buySellRatiosAll.length === 0) {
          context.dispatch('queryBuySellRatios')
        }
      }
    },

    setBuySellRatiosFilter (context, payload) {
      // console.log('setBuySellRatiosFilter _setBuySellRatiosFilter && queryBuySellRatios')
      context.commit('_setBuySellRatiosFilter', payload)
      context.dispatch('queryBuySellRatios')
    },
    setBuySellRatiosPagination (context, payload) {
      //
      // Prevent double queryBuySellRatios...
      //
      const buySellRatiosPaginationOld = context.state.buySellRatiosPaginationOld
      if (payload.sortBy !== buySellRatiosPaginationOld.sortBy ||
        payload.descending !== buySellRatiosPaginationOld.descending ||
        payload.rowsPerPage !== buySellRatiosPaginationOld.rowsPerPage ||
        payload.page !== buySellRatiosPaginationOld.page) {
        // console.log('setBuySellRatiosPagination buySellRatiosPagination changed; _setBuySellRatiosPagination && queryBuySellRatios')
        context.commit('_setBuySellRatiosPagination', payload)
        context.dispatch('queryBuySellRatios')
      } else {
        // console.log('setBuySellRatiosPagination buySellRatiosPagination unchanged; ignore')
      }
    },
    queryBuySellRatios (context) {
      // console.info('queryBuySellRatios')
      if (!context.state.initialized) {
        // console.log('queryBuySellRatios initialized == false; ignoring')
        return
      }

      for (let buySellRatiosUnsubscribe of context.state.buySellRatiosUnsubscribes) {
        // console.log('queryBuySellRatios buySellRatiosUnsubscribe()')
        buySellRatiosUnsubscribe()
      }
      context.commit('_clearBuySellRatios')

      //
      // https://vuetifyjs.com/en/components/data-tables#example-server
      // https://github.com/vuetifyjs/vuetify/blob/master/src/mixins/data-iterable.js#L27
      //
      const buySellRatiosPagination = context.state.buySellRatiosPagination
      // console.log('queryBuySellRatios buySellRatiosPagination', buySellRatiosPagination)
      const { sortBy, descending, rowsPerPage } = buySellRatiosPagination
      const direction = descending ? 'desc' : 'asc'
      const path = `${ROOT}/buySellRatios`

      const queries = []

      const buySellRatiosFilter = context.state.buySellRatiosFilter
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
        const query = firestore.collection(path)
          .orderBy(sortBy, direction)
        queries.push(query)
      }
      // console.log('queryBuySellRatios queries', queries)

      for (let query of queries) {
        query = query
          .limit(rowsPerPage)
        // console.log('queryBuySellRatios query', getQueryString(query))
        const buySellRatiosUnsubscribe = query
          .onSnapshot({ includeQueryMetadataChanges: true }, querySnapshot => {
            context.dispatch('_onQueriedBuySellRatios', querySnapshot)
          }, error => {
            console.error('queryBuySellRatios', error)
          })
        context.commit('_addBuySellRatiosUnsubscribe', buySellRatiosUnsubscribe)
      }
    },
    _onQueriedBuySellRatios (context, querySnapshot) {
      // console.log('_onQueriedBuySellRatios querySnapshot', querySnapshot)
      const docChanges = querySnapshot.docChanges
      // console.log('_onQueriedBuySellRatios docChanges', docChanges)
      if (docChanges.length === 0) {
        // console.warn('_onQueriedBuySellRatios docChanges.length === 0 ignoring')
        return
      }
      // console.log('_onQueriedBuySellRatios')

      docChanges.forEach(change => {
        // console.log('_onQueriedBuySellRatios change', change)
        const changeType = change.type
        // console.log('_onQueriedBuySellRatios changeType', changeType)
        const doc = change.doc
        // console.log('_onQueriedBuySellRatios doc', doc)
        const docId = doc.id
        // const fromCache = doc.metadata.fromCache
        // console.log('_onQueriedBuySellRatios ' + docId + ' fromCache', fromCache)
        let buySellRatio
        if (changeType === 'removed') {
          buySellRatio = null
        } else {
          const docData = doc.data()
          // console.log('_onQueriedBuySellRatios docData', docData)

          const itemId = docData.itemId
          const itemName = context.state.itemsMap[itemId].name
          const buyLocationId = docData.buyLocationId
          // console.log('_onQueriedBuySellRatios buyLocationId', buyLocationId)
          const buyLocationName = context.state.locationsMap[buyLocationId].name
          const buyPrice = docData.buyPrice
          const buyTimestamp = docData.buyTimestamp
          const ratio = docData.ratio
          const sellPrice = docData.sellPrice
          const sellTimestamp = docData.sellTimestamp
          const sellLocationId = docData.sellLocationId
          // console.log('_onQueriedBuySellRatios sellLocationId', sellLocationId)
          const sellLocationName = context.state.locationsMap[sellLocationId].name

          buySellRatio = {
            id: docId,
            itemId,
            itemName,
            buyLocationId,
            buyLocationName,
            buyPrice,
            buyTimestamp: buyTimestamp && buyTimestamp.toDate(),
            ratio,
            sellPrice,
            sellTimestamp: sellTimestamp && sellTimestamp.toDate(),
            sellLocationId,
            sellLocationName
          }
        }
        // console.log('_onQueriedBuySellRatios buySellRatio', buySellRatio)
        context.commit('_setBuySellRatio', { id: docId, buySellRatio })
      })
      context.commit('_incrementBuySellRatiosResponseCount')
    },

    saveLocationItemPrices (context, { locationId, locationItemPrices }) {
      // console.log('saveLocationItemPrices locationId:', locationId)
      // console.log('saveLocationItemPrices locationItemPrices:', locationItemPrices)

      const user = context.rootState.user.user
      // console.log('saveLocationItemPrices user', user)
      const userId = user && user.id
      // console.log('saveLocationItemPrices userId', userId)
      if (!userId) {
        return Promise.reject(new Error('Not authenticated'))
      }

      const prices = {}

      let changed = false

      const mapPricesNew = {}
      locationItemPrices.forEach(item => {
        mapPricesNew[item.id] = item
      })
      // console.log('saveLocationItemPrices mapPricesNew', mapPricesNew)

      const invalidPrices = []

      const arrayPricesOriginalAll = context.state.locationsItemsPricesMap[locationId]
      // console.log('saveLocationItemPrices arrayPricesOriginalAll', arrayPricesOriginalAll)
      for (let priceOriginal of arrayPricesOriginalAll) {
        // console.log('saveLocationItemPrices priceOriginal', priceOriginal)
        const itemId = priceOriginal.id
        const priceOriginalBuy = priceOriginal.priceBuy
        const priceOriginalSell = priceOriginal.priceSell
        // console.log('saveLocationItemPrices priceOriginalBuy', priceOriginalBuy, 'priceOriginalSell', priceOriginalSell)
        const priceNew = mapPricesNew[itemId]
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

        const thisPrices = {}
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

      const data = {
        deploymentId: DEPLOYMENT_ID,
        locationId
      }
      if (Object.keys(prices).length) {
        data.prices = prices
      }
      // console.log('saveLocationItemPrices data', data)
      context.commit('_setSaving', true)
      if (MOCK_SAVING) {
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
    saveable (state, getters, rootState) {
      return getters.userIsAuthenticated && (MOCK_SAVING || !getters.offline)
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
    buySellRatiosFilter (state) {
      return state.buySellRatiosFilter
    },
    buySellRatiosPagination (state) {
      return state.buySellRatiosPagination
    },
    hasBuySellRatios (state) {
      const buySellRatiosUnsubscribesLength = state.buySellRatiosUnsubscribes.length
      // console.log('hasBuySellRatios state.initialized', state.initialized)
      // console.log('hasBuySellRatios state.buySellRatiosUnsubscribes.length', buySellRatiosUnsubscribesLength)
      // console.log('hasBuySellRatios state.buySellRatiosResponseCount', state.buySellRatiosResponseCount)
      const hasBuySellRatios = state.initialized && buySellRatiosUnsubscribesLength && buySellRatiosUnsubscribesLength === state.buySellRatiosResponseCount
      // console.log('hasBuySellRatios', hasBuySellRatios)
      return hasBuySellRatios
    }
  }
}

// eslint-disable-next-line no-unused-vars
function getQueryString (query) {
  // console.log('getQueryString query', query)

  let queryString = ''

  const _query = query._query

  const path = _query.path
  queryString = 'path ' + path

  const where = _query.filters
  if (where.length) {
    queryString += ' where ' + where
  }

  const orderBy = _query.explicitOrderBy
  if (orderBy.length) {
    queryString += ' orderBy ' + orderBy
  }

  const limit = _query.limit
  if (limit) {
    queryString += ' limit ' + limit
  }

  // offset

  return queryString
}

/*
function buySellRatiosEqual(a, b) {
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
*/

/*
function concatUniqueSortLimit (arrayA, arrayB, equals, sort, limit) {
  const result = arrayA.concat(arrayB)
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
*/
