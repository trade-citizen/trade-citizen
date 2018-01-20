import * as firebase from 'firebase'

export default {
  state: {
    commodityCategoriesMap: {
    },
    commodityCategoriesList: [
    ],
    commoditiesList: [
    ],
    stationsMap: {
    },
    stationsList: [
    ]
  },
  mutations: {
    setCommodityCategories (state, payload) {
      state.commodityCategoriesMap = payload
      let list = []
      for (let key in payload) {
        let value = payload[key]
        list.push(value)
      }
      state.commodityCategoriesList = list.sort((a, b) => {
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
    setCommodities (state, payload) {
      state.commoditiesList = payload.sort((a, b) => {
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
    setStations (state, payload) {
      state.stationsMap = payload
      let list = []
      for (let key in payload) {
        let value = payload[key]
        list.push(value)
      }
      state.stationsList = list.sort((a, b) => {
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
    }
  },
  actions: {
    fetchTradeinfo (context) {
      // commit('setLoading', true)

      firebase.firestore().collection('itemCategories')
        .onSnapshot((querySnapshot) => {
          console.log('got itemCategories')
          const commodityCategories = {}
          querySnapshot.forEach((doc) => {
            // console.log(doc)
            let data = doc.data()
            let commodityCategory = {
              id: doc.id,
              name: data.name
            }
            // console.log('commodityCategory.name:' + commodityCategory.name)
            commodityCategories[commodityCategory.id] = commodityCategory
          })
          context.commit('setCommodityCategories', commodityCategories)
        }, (error) => {
          console.error('Error getting itemCategories', error)
          // commit('setLoading', false)
        })

      firebase.firestore().collection('itemTypes')
        .onSnapshot((querySnapshot) => {
          console.log('got itemTypes')
          const commodities = []
          querySnapshot.forEach((doc) => {
            // console.log(doc)
            let data = doc.data()
            let commodityCategoryId = data.category.id
            let commodity = {
              id: doc.id,
              name: data.name,
              category: context.getters.commodityCategory(commodityCategoryId)
            }
            // console.log('commodity.name:' + commodity.name)
            commodities.push(commodity)
          })
          context.commit('setCommodities', commodities)
        }, (error) => {
          console.error('Error getting itemTypes', error)
          // commit('setLoading', false)
        })

      firebase.firestore().collection('stations')
        .onSnapshot((querySnapshot) => {
          console.log('got stations')
          const stations = {}
          querySnapshot.forEach((doc) => {
            // console.log(doc)
            let data = doc.data()
            let station = {
              id: doc.id,
              // anchor: data.anchor,
              name: data.name
              // stationType: data.type
            }
            // console.log('station.name:' + station.name)
            stations[station.id] = station
          })
          context.commit('setStations', stations)
          // commit('setLoading', false)
        }, (error) => {
          console.error('Error getting stations', error)
          // commit('setLoading', false)
        })
    },
    savePrices (context, {station, pricesBuy, pricesSell}) {
      console.log('savePrices station:', station)
      console.log('savePrices pricesBuy:', pricesBuy)
      console.log('savePrices pricesSell:', pricesSell)
      let stationDocRef = firebase.firestore().collection('stations').doc(station.id)
      // console.log('stationDocRef', stationDocRef)
      for (let commodityId in pricesBuy) {
        let price = pricesBuy[commodityId]
        console.log('saveStation add /itemTypes/' + commodityId + '/buy/%AUTO-ID% { price:' + price + ', station:' + stationDocRef.path + '}')
        firebase.firestore().collection('itemTypes/' + commodityId + '/buy')
          .add({
            value: Number.parseFloat(price),
            station: stationDocRef
          })
          .then((docRef) => {
            console.log('SUCCESS!')
          })
          .catch((error) => {
            console.error('ERROR', error)
          })
      }
      for (let commodityId in pricesSell) {
        let price = pricesSell[commodityId]
        console.log('saveStation add /itemTypes/' + commodityId + '/sell/%AUTO-ID% { price:' + price + ', station:' + stationDocRef.path + '}')
        firebase.firestore().collection('itemTypes/' + commodityId + '/sell')
          .add({
            price: Number.parseFloat(price),
            station: stationDocRef
          })
          .then((docRef) => {
            console.log('SUCCESS!')
          })
          .catch((error) => {
            console.error('ERROR', error)
          })
      }
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
        return state.stationsMap[stationId]
      }
    }
  }
}
