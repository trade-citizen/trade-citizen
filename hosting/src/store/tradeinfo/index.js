import * as firebase from 'firebase'

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
    addCommodityCategory (state, payload) {
      state.commodityCategoriesMap[payload.id] = payload
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
    addCommodity (state, payload) {
      state.commoditiesMap[payload.id] = payload
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
    addAnchor (state, payload) {
      state.anchorsMap[payload.id] = payload
    },
    addStation (state, payload) {
      state.stationsMap[payload.id] = payload
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
    setStationCommodityPrices (state, { stationId, stationCommodityPrices }) {
      state.stationsCommoditiesPricesMap[stationId] = state.commoditiesList
        .map(commodity => {

          let commodityId = commodity.id
          let stationCommodityPrice = stationCommodityPrices[commodityId]

          stationCommodityPrice = Object.assign({
            id: commodityId,
            name: commodity.name,
            category: commodity.category
          }, stationCommodityPrice)

          let priceBuy = stationCommodityPrice.priceBuy
          let priceSell = stationCommodityPrice.priceSell
          stationCommodityPrice.isPriceDefined =
            ((priceBuy !== undefined && priceBuy !== '') ||
            (priceSell !== undefined && priceSell !== ''))

          return stationCommodityPrice
        })
    }
  },
  actions: {

    setSelectedStationId (context, stationId) {
      context.commit('setSelectedStationId', stationId)
    },

    fetchTradeinfo (context) {
      context.commit('setLoading', true)

      context.dispatch('_getCommodityCategories')
    },

    _getCommodityCategories (context) {
      // console.log('_getCommodityCategories')
      firebase.firestore().collection('itemCategories')
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
            context.commit('addCommodityCategory', commodityCategory)
          }
        }
      })

      if (context.state.commoditiesList.length === 0) {
        context.dispatch('_getCommodities')
      }
    },

    _getCommodities (context) {
      // console.log('_getCommodities')
      firebase.firestore().collection('itemTypes')
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
            context.commit('addCommodity', commodity)
          }
        }
      })

      if (Object.keys(context.state.anchorsMap).length === 0) {
        context.dispatch('_getAnchors')
      }
    },

    _getAnchors (context) {
      // console.log('_getAnchors')
      firebase.firestore().collection('anchors')
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
          context.commit('addAnchor', anchor)
        }
      })

      if (context.state.stationsList.length === 0) {
        context.dispatch('_getStations')
      }
    },

    _getStations (context) {
      // console.log('_getStations')
      firebase.firestore().collection('stations')
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
          context.commit('addStation', station)

          context.dispatch('_getStationCommodityPrices', stationId)
        }
      })
    },

    _getStationCommodityPrices (context, stationId) {
      let path = '/stations/' + stationId + '/prices'
      // console.log('_getStationCommodityPrices query ' + path)
      firebase.firestore().collection(path)
        // .where('prices', '!==', null) // <- firestore does not support inequality queries :(
        .orderBy('timestamp_created', 'desc')
        .limit(1)
        .onSnapshot(/* { includeQueryMetadataChanges: true }, */ (querySnapshot) => {
          context.dispatch('_gotStationCommodityPrices', { stationId, querySnapshot })
        }, (error) => {
          console.error('_getStationCommodityPrices', error)
          context.commit('setStationCommodityPrices', { stationId: stationId, stationCommodityPrices: undefined })
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
              priceBuy: stationCommodityPrice.priceBuy,
              priceSell: stationCommodityPrice.priceSell
            }
          })
        }
      })
      // console.log('_gotStationCommodityPrices stationCommodityPrices', stationCommodityPrices)
      context.commit('setStationCommodityPrices', { stationId, stationCommodityPrices })

      if (context.rootState.shared.loading &&
        Object.keys(context.state.stationsCommoditiesPricesMap).length === context.state.stationsList.length) {
        // Only setLoading false after all prices have come back
        console.info('%c_gotStationCommodityPrices LOADED!', 'color: green;')
        context.commit('setLoading', false)
      }
    },

    saveStationCommodityPrices (context, payload) {
      let stationId = payload.stationId
      let stationCommodityPrices = payload.commodityPrices
      let user = context.rootState.user.user
      let docData = {
        // TODO:(pv) Remove this and set via server side function?
        timestamp_created: firebase.firestore.FieldValue.serverTimestamp(),
        userId: user.id,
        prices: {}
      }
      stationCommodityPrices.forEach((stationCommodityPrice) => {
        let docDataPrice = {}
        if (stationCommodityPrice.priceBuy !== undefined && stationCommodityPrice.priceBuy !== '') {
          docDataPrice.priceBuy = stationCommodityPrice.priceBuy
        }
        if (stationCommodityPrice.priceSell !== undefined && stationCommodityPrice.priceSell !== '') {
          docDataPrice.priceSell = stationCommodityPrice.priceSell
        }
        if (Object.keys(docDataPrice).length !== 0) {
          docData.prices[stationCommodityPrice.id] = docDataPrice
        }
      })
      if (Object.keys(docData.prices).length === 0) {
        delete docData.prices
      }
      let path = '/stations/' + stationId + '/prices'
      firebase.firestore().collection(path)
        .add(docData)
        .then((docRef) => {
          console.log('saveStationCommodityPrices SUCCESS!')
        })
        .catch((error) => {
          console.error('saveStationCommodityPrices ERROR', error)
          context.commit('setLoading', false)
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
    stationCommodityPrices (state) {
      return (stationId) => {
        let stationCommodityPrices = state.stationsCommoditiesPricesMap[stationId]
        if (stationCommodityPrices === undefined) {
          stationCommodityPrices = []
        }
        return stationCommodityPrices
      }
    }
  }
}
