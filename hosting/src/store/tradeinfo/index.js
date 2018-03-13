import Vue from 'vue'
import * as firebase from 'firebase'

const ROOT = '/deployments/' + (process.env.NODE_ENV === 'production' ? 'production' : 'test') + '/'

export default {
  state: {
    selectedStationId: null,
    commodityCategoriesMap: {},
    commodityCategoriesList: [],
    commoditiesMap: {},
    commoditiesList: [],
    anchorsMap: {},
    stationsMap: {},
    stationsList: [],
    stationsCommoditiesPricesMap: {}
  },
  mutations: {
    setSelectedStationId (state, payload) {
      state.selectedStationId = payload
    },
    _addCommodityCategory (state, payload) {
      Vue.set(state.commodityCategoriesMap, payload.id, payload)
      state.commodityCategoriesList = Object.values(state.commodityCategoriesMap)
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
    _addCommodity (state, payload) {
      Vue.set(state.commoditiesMap, payload.id, payload)
      state.commoditiesList = Object.values(state.commoditiesMap)
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
    _addStation (state, payload) {
      Vue.set(state.stationsMap, payload.id, payload)
      state.stationsList = Object.values(state.stationsMap)
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
    _setStationCommodityPrices (state, { stationId, stationCommodityPrices }) {
      let stationCommodityPricesList = state.commoditiesList
        .map(commodity => {
          let commodityId = commodity.id
          let commodityName = commodity.name
          let commodityCategory = commodity.category
          let stationCommodityPrice = stationCommodityPrices[commodityId]

          stationCommodityPrice = Object.assign({
            id: commodityId,
            name: commodityName,
            category: commodityCategory
          }, stationCommodityPrice)

          let priceBuy = stationCommodityPrice.priceBuy
          let priceSell = stationCommodityPrice.priceSell
          let isPriceDefined = !isNaN(priceBuy) || !isNaN(priceSell)
          stationCommodityPrice.isPriceDefined = isPriceDefined

          return stationCommodityPrice
        })
      Vue.set(state.stationsCommoditiesPricesMap, stationId, stationCommodityPricesList)
    },
    updateStationCommodityPrice (state, { stationId, commodityId, priceId, value }) {
      let stationCommodityPrices = state.stationsCommoditiesPricesMap[stationId]
        .find(commodity => {
          return commodity.id === commodityId
        })
      Vue.set(stationCommodityPrices, priceId, value)
    }
  },
  actions: {

    fetchTradeinfo (context) {
      context.commit('setLoading', true)

      context.dispatch('_getCommodityCategories')
    },

    _getCommodityCategories (context) {
      // console.log('_getCommodityCategories')
      let path = ROOT + 'itemCategories'
      // console.log('_getCommodityCategories path', path)
      firebase.firestore().collection(path)
        .onSnapshot(/* { includeQueryMetadataChanges: true }, */ (querySnapshot) => {
          context.dispatch('_gotCommodityCategories', querySnapshot)
        }, (error) => {
          console.error('_getCommodityCategories', error)
          context.commit('setLoading', false)
        })
    },

    _gotCommodityCategories (context, querySnapshot) {
      let docChanges = querySnapshot.docChanges
      // console.log('_gotCommodityCategories docChanges', docChanges)
      if (docChanges.length === 0) {
        // console.log('_gotCommodityCategories docChanges.length === 0 ignoring')
        return
      }
      // console.log('_gotCommodityCategories')
      docChanges.forEach((change) => {
        // console.log('_gotCommodityCategories change.type', change.type)
        let doc = change.doc
        // console.log('_gotCommodityCategories doc', doc)
        let commodityCategoryId = doc.id
        // let fromCache = doc.metadata.fromCache
        // console.log('_gotCommodityCategories ' + commodityCategoryId + ' fromCache', fromCache)
        if (// !fromCache ||
          context.state.commodityCategoriesMap[commodityCategoryId] === undefined) {
          let docData = doc.data()
          // console.log(docData)
          if (docData.name !== undefined) {
            let commodityCategory = {
              id: commodityCategoryId,
              name: docData.name
            }
            // console.log('commodityCategory.name:' + commodityCategory.name)
            context.commit('_addCommodityCategory', commodityCategory)
          }
        }
      })

      if (context.state.commoditiesList.length === 0) {
        context.dispatch('_getCommodities')
      }
    },

    _getCommodities (context) {
      // console.log('_getCommodities')
      let path = ROOT + 'itemTypes'
      // console.log('_getCommodities path', path)
      firebase.firestore().collection(path)
        .onSnapshot(/* { includeQueryMetadataChanges: true }, */ (querySnapshot) => {
          context.dispatch('_gotCommodities', querySnapshot)
        }, (error) => {
          console.error('_getCommodities', error)
          context.commit('setLoading', false)
        })
    },

    _gotCommodities (context, querySnapshot) {
      let docChanges = querySnapshot.docChanges
      // console.log('_gotCommodities docChanges', docChanges)
      if (docChanges.length === 0) {
        // console.log('_gotCommodities docChanges.length === 0 ignoring')
        return
      }
      // console.log('_gotCommodities')
      docChanges.forEach((change) => {
        // console.log('_gotCommodities change.type', change.type)
        let doc = change.doc
        // console.log('_gotCommodities doc', doc)
        let commodityId = doc.id
        // let fromCache = doc.metadata.fromCache
        // console.log('_gotCommodities ' + commodityId + ' fromCache', fromCache)
        if (// !fromCache ||
          context.state.commoditiesMap[commodityId] === undefined) {
          let docData = doc.data()
          // console.log(docData)
          if (docData.name !== undefined) {
            let commodityCategoryId = docData.category.id
            let commodity = {
              id: commodityId,
              name: docData.name,
              category: context.state.commodityCategoriesMap[commodityCategoryId].name
            }
            if (docData.illegal) {
              commodity.illegal = true
            }
            // console.log('commodity.name:' + commodity.name)
            context.commit('_addCommodity', commodity)
          }
        }
      })

      if (Object.keys(context.state.anchorsMap).length === 0) {
        context.dispatch('_getAnchors')
      }
    },

    _getAnchors (context) {
      // console.log('_getAnchors')
      let path = ROOT + 'anchors'
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
        // console.log('_gotAnchors docChanges.length === 0 ignoring')
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

      if (context.state.stationsList.length === 0) {
        context.dispatch('_getStations')
      }
    },

    _getStations (context) {
      // console.log('_getStations')
      let path = ROOT + 'stations'
      // console.log('_getStations path', path)
      firebase.firestore().collection(path)
        .onSnapshot(/* { includeQueryMetadataChanges: true }, */ (querySnapshot) => {
          context.dispatch('_gotStations', querySnapshot)
        }, (error) => {
          console.error('_getStations', error)
          context.commit('setLoading', false)
        })
    },

    _gotStations (context, querySnapshot) {
      let docChanges = querySnapshot.docChanges
      // console.log('_gotStations docChanges', docChanges)
      if (docChanges.length === 0) {
        // console.log('_gotStations docChanges.length === 0 ignoring')
        return
      }
      // console.log('_gotStations')
      docChanges.forEach((change) => {
        // console.log('_gotStations change.type', change.type)
        let doc = change.doc
        // console.log('_gotStations doc', doc)
        let stationId = doc.id
        // let fromCache = doc.metadata.fromCache
        // console.log('_gotStations ' + stationId + ' fromCache', fromCache)
        if (// !fromCache ||
          context.state.stationsMap[stationId] === undefined) {
          let docData = doc.data()
          let station = {
            id: stationId,
            name: docData.name,
            anchor: context.state.anchorsMap[docData.anchor.id],
            // stationType: docData.type,
            prices: {}
          }
          // console.log('station.name:' + station.name)
          context.commit('_addStation', station)

          context.dispatch('_getStationCommodityPrices', stationId)
        }
      })
    },

    _getStationCommodityPrices (context, stationId) {
      // console.log('_getStationCommodityPrices stationId', stationId)
      let path = ROOT + 'stations/' + stationId + '/prices'
      // console.log('_getStationCommodityPrices path', path)
      firebase.firestore().collection(path)
        .where('hasPrices', '==', true)
        .orderBy('timestamp_priced', 'desc')
        .limit(1)
        .onSnapshot(/* { includeQueryMetadataChanges: true }, */ (querySnapshot) => {
          context.dispatch('_gotStationCommodityPrices', { stationId, querySnapshot })
        }, (error) => {
          console.error('_getStationCommodityPrices', error)
          context.commit('_setStationCommodityPrices', { stationId: stationId, stationCommodityPrices: undefined })
          if (Object.keys(context.state.stationsCommoditiesPricesMap).length === context.state.stationsList.length) {
            // Only setLoading false after all prices have come back
            context.commit('setLoading', false)
          }
        })
    },

    _gotStationCommodityPrices (context, { stationId, querySnapshot }) {
      let docChanges = querySnapshot.docChanges
      // console.log('_gotStationCommodityPrices docChanges', docChanges)
      if (docChanges.length === 0 && context.state.stationsCommoditiesPricesMap[stationId] !== undefined) {
        // console.log('_gotStationCommodityPrices query /stations/' + stationId + '/prices docChanges.length === 0 ignoring')
        return
      }
      // console.log('_gotStationCommodityPrices query /stations/' + stationId + '/prices')
      let stationCommodityPrices = {}
      docChanges.forEach((change) => {
        // console.log('_gotStationCommodityPrices change.type', change.type)
        if (change.type === 'removed' && docChanges.length !== 1) {
          return
        }
        let doc = change.doc
        // console.log('_gotStationCommodityPrices doc', doc)
        // let fromCache = doc.metadata.fromCache
        // console.log('_gotStationCommodityPrices fromCache', fromCache)
        let docData = doc.data()
        let prices = docData.prices
        if (prices) {
          Object.keys(prices).forEach(commodityId => {
            let stationCommodityPrice = prices[commodityId]
            stationCommodityPrices[commodityId] = {
              timestamp_created: docData.timestamp_created,
              userId: docData.userId,
              priceBuy: Number(stationCommodityPrice.priceBuy),
              priceSell: Number(stationCommodityPrice.priceSell)
            }
          })
        }
      })
      // console.log('_gotStationCommodityPrices stationCommodityPrices', stationCommodityPrices)
      context.commit('_setStationCommodityPrices', { stationId, stationCommodityPrices })

      if (context.rootState.shared.loading &&
        Object.keys(context.state.stationsCommoditiesPricesMap).length === context.state.stationsList.length) {
        // Only setLoading false after all prices have come back
        console.info('%c_gotStationCommodityPrices LOADED!', 'color: green;')
        context.commit('setLoading', false)
      }
    },

    saveStationCommodityPrices (context, { stationId, stationCommodityPrices }) {
      let user = context.rootState.user.user
      let docData = {
        // TODO:(pv) Remove this and set via server side function?
        userId: user.id,
        prices: {}
      }
      stationCommodityPrices.forEach((stationCommodityPrice) => {
        let docDataPrice = {}
        let priceBuy = Number(stationCommodityPrice.priceBuy)
        if (!isNaN(priceBuy)) {
          docDataPrice.priceBuy = priceBuy
        }
        let priceSell = Number(stationCommodityPrice.priceSell)
        if (!isNaN(priceSell)) {
          docDataPrice.priceSell = priceSell
        }
        if (Object.keys(docDataPrice).length !== 0) {
          docData.prices[stationCommodityPrice.id] = docDataPrice
        }
      })
      if (Object.keys(docData.prices).length === 0) {
        delete docData.prices
      }
      let path = ROOT + 'stations/' + stationId + '/prices'
      firebase.firestore().collection(path)
        .add(docData)
        .then((docRef) => {
          console.log('saveStationCommodityPrices SUCCESS!')
        })
        .catch((error) => {
          console.error('saveStationCommodityPrices ERROR', error)
        })
    }
  },
  getters: {
    getSelectedStationId (state) {
      return state.selectedStationId
    },
    commodityCategory (state) {
      return (commodityCategoryId) => {
        return state.commodityCategoriesMap[commodityCategoryId].name
      }
    },
    commodities (state) {
      return state.commoditiesList
    },
    stations (state) {
      return state.stationsList
    },
    station (state) {
      return (stationId) => {
        return state.stationsMap[stationId]
      }
    },
    stationCommodityPriceList (state) {
      return (stationId) => {
        return state.stationsCommoditiesPricesMap[stationId]
      }
    }
  }
}
