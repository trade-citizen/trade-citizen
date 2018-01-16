import * as firebase from 'firebase'

export default {
  state: {
    stations: [
    ]
  },
  mutations: {
    setStations (state, payload) {
      state.stations = payload
    }
  },
  actions: {
    loadStations ({commit}) {
      commit('setLoading', true)
      firebase.firestore().collection('stations').get().then((querySnapshot) => {
        // console.log('got stations')
        const stations = []
        querySnapshot.forEach((doc) => {
          // console.log(doc)
          let data = doc.data()
          let station = {
            id: doc.id,
            anchor: data.anchor,
            name: data.name,
            type: data.type
          }
          console.log('station.name:' + station.name)
          stations.push(station)
        })
        commit('setStations', stations)
        commit('setLoading', false)
      })
    }
  },
  getters: {
    stations (state) {
      return state.stations.sort((stationA, stationB) => {
        return stationA.name > stationB.name
      })
    }
  }
}
