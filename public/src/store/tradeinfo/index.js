import * as firebase from 'firebase'

export default {
  state: {
    commodityCategoriesList: [
    ],
    commoditiesList: [
    ],
    stationsList: [
    ]
  },
  mutations: {
    setCommodityCategories (state, payload) {
      state.commodityCategoriesList = payload.sort((a, b) => {
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
      state.stationsList = payload.sort((a, b) => {
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
    fetchTradeinfo ({commit}) {
      // commit('setLoading', true)

      firebase.firestore().collection('itemCategories')
        .onSnapshot((querySnapshot) => {
          console.log('got itemCategories')
          const commodityCategories = []
          querySnapshot.forEach((doc) => {
            // console.log(doc)
            let data = doc.data()
            let commodityCategory = {
              id: doc.id,
              name: data.name
            }
            // console.log('commodityCategory.name:' + commodityCategory.name)
            commodityCategories.push(commodityCategory)
          })
          commit('setCommodityCategories', commodityCategories)
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
            let commodity = {
              id: doc.id,
              name: data.name
            }
            // console.log('commodity.name:' + commodity.name)
            commodities.push(commodity)
          })
          commit('setCommodities', commodities)
        }, (error) => {
          console.error('Error getting itemTypes', error)
          // commit('setLoading', false)
        })

      firebase.firestore().collection('stations')
        .onSnapshot((querySnapshot) => {
          console.log('got stations')
          const stations = []
          querySnapshot.forEach((doc) => {
            // console.log(doc)
            let data = doc.data()
            let station = {
              id: doc.id,
              anchor: data.anchor,
              name: data.name,
              stationType: data.type
            }
            // console.log('station.name:' + station.name)
            stations.push(station)
          })
          commit('setStations', stations)
          // commit('setLoading', false)
        }, (error) => {
          console.error('Error getting stations', error)
          // commit('setLoading', false)
        })
    }
  },
  getters: {
    commodities (state) {
      return state.commoditiesList
    },
    stations (state) {
      return state.stationsList
    }
  }
}
