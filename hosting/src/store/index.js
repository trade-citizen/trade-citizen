import Vue from 'vue'
import Vuex from 'vuex'
import user from './user'
import shared from './shared'
import tradeinfo from './tradeinfo'

Vue.use(Vuex)

export const store = new Vuex.Store({
  strict: process.env.NODE_ENV !== 'production',
  modules: {
    user: user,
    shared: shared,
    tradeinfo: tradeinfo
  }
})
