import * as firebase from 'firebase'

export default {
  state: {
    commodityCategoriesMap: {},
    commodityCategoriesList: [],
    commoditiesMap: {},
    commoditiesList: [],
    stationsMap: {},
    stationsList: [],
    stationsPricesMap: {}
  },
  mutations: {
    addCommodityCategory (state, payload) {
      state.commodityCategoriesMap[payload.id] = payload
      state.commodityCategoriesList = Object.values(state.commodityCategoriesMap).sort((a, b) => {
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
      state.commoditiesList = Object.values(state.commoditiesMap).sort((a, b) => {
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
    addStation (state, payload) {
      state.stationsMap[payload.id] = payload
      state.stationsList = Object.values(state.stationsMap).sort((a, b) => {
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
    setStationPrices (state, { stationId, stationPrices }) {
      state.stationsMap[stationId].prices = stationPrices
      state.stationsPricesMap[stationId] = stationPrices
      // console.log('setStationPrices state.stationsMap', state.stationsMap)
      // console.log('setStationPrices state.stationsPricesMap', state.stationsPricesMap)
    }
  },
  actions: {
    fetchTradeinfo (context) {
      context.commit('setLoading', true)

      context.dispatch('_getCommodityCategories')
    },

    _getCommodityCategories (context) {
      console.log('_getCommodityCategories')
      firebase.firestore().collection('itemCategories')
        .onSnapshot({ includeQueryMetadataChanges: true }, (querySnapshot) => {
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
      console.log('_gotCommodityCategories')
      docChanges.forEach((change) => {
        // console.log('_gotCommodityCategories change', change)
        let doc = change.doc
        // console.log('_gotCommodityCategories doc', doc)
        let commodityCategoryId = doc.id
        let fromCache = doc.metadata.fromCache
        // console.log('_gotCommodityCategories ' + commodityCategoryId + ' fromCache', fromCache)
        if (!fromCache ||
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

      if (Object.keys(context.state.commoditiesMap).length === 0) {
        context.dispatch('_getCommodities')
      }
    },

    _getCommodities (context) {
      console.log('_getCommodities')
      firebase.firestore().collection('itemTypes')
        .onSnapshot({ includeQueryMetadataChanges: true }, (querySnapshot) => {
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
      console.log('_gotCommodities')
      docChanges.forEach((change) => {
        // console.log('_gotCommodities change', change)
        let doc = change.doc
        // console.log('_gotCommodities doc', doc)
        let commodityId = doc.id
        let fromCache = doc.metadata.fromCache
        // console.log('_gotCommodities ' + commodityId + ' fromCache', fromCache)
        if (!fromCache ||
          context.state.commoditiesMap[commodityId] === undefined) {
          let docData = doc.data()
          // console.log(docData)
          if (docData.name !== undefined) {
            let commodityCategoryId = docData.category.id
            let commodity = {
              id: commodityId,
              name: docData.name,
              category: context.state.commodityCategoriesMap[commodityCategoryId].name,
              illegal: docData.illegal
            }
            // console.log('commodity.name:' + commodity.name)
            context.commit('addCommodity', commodity)
          }
        }
      })

      if (Object.keys(context.state.stationsMap).length === 0) {
        context.dispatch('_getStations')
      }
    },

    _getStations (context) {
      console.log('_getStations')
      firebase.firestore().collection('stations')
        .onSnapshot({ includeQueryMetadataChanges: true }, (querySnapshot) => {
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
      console.log('_gotStations')
      docChanges.forEach((change) => {
        // console.log('_gotStations change', change)
        let doc = change.doc
        // console.log('_gotStations doc', doc)
        let stationId = doc.id
        let fromCache = doc.metadata.fromCache
        // console.log('_gotStations ' + stationId + ' fromCache', fromCache)
        if (!fromCache ||
          context.state.stationsMap[stationId] === undefined) {
          let docData = doc.data()
          let station = {
            id: stationId,
            // anchor: docData.anchor,
            name: docData.name,
            // stationType: docData.type,
            prices: undefined
          }
          // console.log('station.name:' + station.name)
          context.commit('addStation', station)

          context.dispatch('_getStationPrices', stationId)
        }
      })
    },

    _getStationPrices (context, stationId) {
      let path = '/stations/' + stationId + '/prices'
      console.log('_getStationPrices query ' + path)
      firebase.firestore().collection(path)
        .orderBy('timestamp_created', 'desc')
        .limit(1)
        .onSnapshot({ includeQueryMetadataChanges: true }, (querySnapshot) => {
          context.dispatch('_gotStationPrices', { stationId, querySnapshot })
        }, (error) => {
          console.error('_getStationPrices', error)
          context.commit('setStationPrices', { stationId: stationId, stationPrices: undefined })
          if (Object.keys(context.state.stationsPricesMap).length === Object.keys(context.state.stationsMap).length) {
            // Only setLoading false after all prices have come back
            context.commit('setLoading', false)
          }
        })
    },

    _gotStationPrices (context, { stationId, querySnapshot }) {
      let docChanges = querySnapshot.docChanges
      // console.log('_gotStationPrices docChanges', docChanges)
      if (docChanges.length === 0 && context.state.stationsPricesMap[stationId] !== undefined) {
        // console.log('_gotStationPrices query /stations/' + stationId + '/prices docChanges.length === 0 ignoring')
        return
      }
      console.log('_gotStationPrices query /stations/' + stationId + '/prices')
      let stationPrices = {}
      docChanges.forEach((change) => {
        // console.log('_gotStationPrices change', change)
        let doc = change.doc
        // console.log('_gotStationPrices doc', doc)
        // let fromCache = doc.metadata.fromCache
        // console.log('_gotStationPrices fromCache', fromCache)
        let docData = doc.data()
        // console.log('_gotStationPrices docData', docData)
        for (let commodityId in docData.prices) {
          stationPrices[commodityId] = docData.prices[commodityId]
        }
      })
      context.commit('setStationPrices', { stationId, stationPrices })
      if (Object.keys(context.state.stationsPricesMap).length === Object.keys(context.state.stationsMap).length) {
        // Only setLoading false after all prices have come back
        console.info('%c_gotStationPrices LOADED!', 'color: green;')
        context.commit('setLoading', false)
      }
    },

    saveStationPrices (context, { stationId, prices }) {
      console.log('saveStationPrices prices:', prices)
      for (var commodityId in prices) {
        let price = prices[commodityId]
        let temp = {}
        if (price.buy !== undefined && price.buy !== '') {
          temp.buy = price.buy
        }
        if (price.sell !== undefined && price.sell !== '') {
          temp.sell = price.sell
        }
        if (Object.keys(temp).length === 0) {
          delete prices[commodityId]
        } else {
          prices[commodityId] = temp
        }
      }
      let docData = {
        // TODO:(pv) Remove this and set via server side function?
        timestamp_created: firebase.firestore.FieldValue.serverTimestamp(),
        prices: prices
      }
      let path = '/stations/' + stationId + '/prices'
      console.log('saveStationPrices add ' + path + '/%AUTO-ID%', docData)
      firebase.firestore().collection(path)
        .add(docData)
        .then((docRef) => {
          console.log('saveStationPrices SUCCESS!')
        })
        .catch((error) => {
          console.error('saveStationPrices ERROR', error)
          context.commit('setLoading', false)
        })
    }
  },
  getters: {
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
        // console.log('getters.station ' + stationId)
        // console.log('getters.station ', state.stationsMap)
        let station = state.stationsMap[stationId]
        // console.log('getters.station ', station)
        return station
      }
    },
    stationPrices (state) {
      return (stationId, all) => {
        let station = state.stationsMap[stationId]
        let stationPrices = station.prices

        let result = []

        let commodityIdsMap
        if (all || Object.keys(stationPrices).length === 0) {
          commodityIdsMap = state.commoditiesMap
        } else {
          commodityIdsMap = stationPrices
        }
        Object.keys(commodityIdsMap).forEach((commodityId) => {
          let commodity = state.commoditiesMap[commodityId]
          if (stationPrices !== undefined) {
            let stationPrice = Object.assign({}, commodity)
            let stationCommodityPrice = stationPrices[commodity.id]
            if (stationCommodityPrice !== undefined) {
              stationPrice.buy = stationCommodityPrice.buy
              stationPrice.sell = stationCommodityPrice.sell
            }
            result.push(stationPrice)
          }
        })

        return result.sort((a, b) => {
          if (a.name < b.name) {
            return -1
          }
          if (a.name > b.name) {
            return 1
          }
          return 0
        })
      }
    }
  }
}
