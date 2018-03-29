export default {
  state: {
    isDevelopment: process.env.NODE_ENV === 'development',
    offline: false
  },
  mutations: {
    setOffline (state, payload) {
      // console.log('setOffline', payload)
      state.offline = payload
    }
  },
  actions: {
  },
  getters: {
    isDevelopment (state) {
      return state.isDevelopment
    },
    offline (state) {
      return state.offline
    }
  }
}
