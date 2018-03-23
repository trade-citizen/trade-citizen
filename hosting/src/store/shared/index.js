export default {
  state: {
    offline: false,
    loading: false,
    error: null
  },
  mutations: {
    setOffline (state, payload) {
      // console.log('setOffline', payload)
      state.offline = payload
    },
    setLoading (state, payload) {
      // console.log('setLoading', payload)
      state.loading = payload
    },
    setError (state, payload) {
      // console.log('setError', payload)
      state.error = payload
    },
    clearError (state) {
      state.error = null
    }
  },
  actions: {
    clearError ({commit}) {
      commit('clearError')
    }
  },
  getters: {
    isDevelopment (state) {
      return process.env.NODE_ENV === 'development'
    },
    offline (state) {
      return state.offline
    },
    loading (state) {
      return state.loading
    },
    error (state) {
      return state.error
    }
  }
}
