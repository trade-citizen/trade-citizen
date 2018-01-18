import * as firebase from 'firebase'

export default {
  state: {
    commodityCategories: [
    ],
    commodities: [
    ],
    stations: [
    ]
  },
  mutations: {
    setCommodityCategories (state, payload) {
      state.commodityCategories = payload
    },
    setCommodities (state, payload) {
      state.commodities = payload
    },
    setStations (state, payload) {
      state.stations = payload
    }
  },
  actions: {
    fetchTradeinfo ({commit}) {
      commit('setLoading', true)
      firebase.firestore().collection('itemCategories')
        .get()
        .then((querySnapshot) => {
          console.log('got itemCategories')
          const commodityCategories = []
          querySnapshot.forEach((doc) => {
            let data = doc.data()
            let commodityCategory = {
              id: doc.id,
              name: data.name
            }
            // console.log('commodityCategory.name:' + commodityCategory.name)
            commodityCategories.push(commodityCategory)
          })
          commit('setCommodityCategories', commodityCategories)

          firebase.firestore().collection('itemTypes')
            .get()
            .then((querySnapshot) => {
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

              firebase.firestore().collection('stations')
                .get()
                .then((querySnapshot) => {
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

                  commit('setLoading', false)
                })
                .catch((error) => {
                  console.error('Error getting stations', error)
                  commit('setLoading', false)
                })
            })
            .catch((error) => {
              console.error('Error getting itemTypes', error)
              commit('setLoading', false)
            })
        })
        .catch((error) => {
          console.error('Error getting itemCategories', error)
          commit('setLoading', false)
        })
    }
  },
  getters: {
    commodities (state) {
      return state.commodities.sort((commodityA, commodityB) => {
        if (commodityA.name < commodityB.name) {
          return -1
        }
        if (commodityA.name > commodityB.name) {
          return 1
        }
        return 0
      })
    },
    stations (state) {
      return state.stations.sort((stationA, stationB) => {
        if (stationA.name < stationB.name) {
          return -1
        }
        if (stationA.name > stationB.name) {
          return 1
        }
        return 0
      })
    }
  }
}
