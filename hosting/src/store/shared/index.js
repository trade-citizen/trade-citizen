export default {
  state: {
    isDevelopment: process.env.NODE_ENV === 'development'
  },
  mutations: {
  },
  actions: {
  },
  getters: {
    isDevelopment (state) {
      return state.isDevelopment
    }
  }
}
