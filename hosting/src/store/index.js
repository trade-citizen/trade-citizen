import Vue from 'vue'
import Vuex from 'vuex'
import user from './user'
import shared from './shared'
import tradeinfo from './tradeinfo'
import { firebaseAction, firebaseMutations } from 'vuexfire'
import firebase from '@firebase/app'
import * as utils from '../utils'

Vue.use(Vuex)

const DEPLOYMENT_ID = utils.isProduction() ? 'production' : 'test'
const ROOT = `/deployments/${DEPLOYMENT_ID}`

export const store = new Vuex.Store({
  strict: process.env.NODE_ENV !== 'production',
  modules: {
    user,
    shared,
    tradeinfo
  },
  state: {
    users: []
  },
  mutations: {
    ...firebaseMutations
  },
  actions: {
    initialize: firebaseAction(({ bindFirebaseRef }) => {
      console.log('store initialize arguments', arguments)
      bindFirebaseRef('users', firebase.firestore().collection(`${ROOT}/users`))
        .then(result => {
          console.log('users loaded', result)
        })
        .catch(error => {
          console.log('error loading users', error)
        })
    })
  },
  getters: {
  }
})
