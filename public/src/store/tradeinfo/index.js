import * as firebase from 'firebase'

export default {
  state: {
  },
  mutations: {
  },
  actions: {
    loadTradeinfo ({commit}) {
      commit('setLoading', true)
      firebase.firestore().collection('stations').get().then((querySnapshot) => {
        // console.log('got stations')
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
        })
        commit('setLoading', false)
      })
    }
  },
  getters: {
  }
}
