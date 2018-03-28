// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import Vuetify from 'vuetify'
import App from './App'
import * as firebase from 'firebase'
import 'firebase/firestore'
import router from './router'
import { store } from './store'
import AlertCmp from './components/Shared/Alert.vue'

// Required for roboto & material-design-icons fonts to work offline
import 'roboto-fontface/css/roboto/roboto-fontface.css'
import 'material-design-icons-iconfont/dist/material-design-icons.css'
// TODO:(pv) Include http://fontawesome.io/icons/ and https://materialdesignicons.com/
//  https://next.vuetifyjs.com/components/icons#examples

Vue.prototype.$PACKAGE_VERSION = PACKAGE_VERSION

Vue.use(Vuetify)
Vue.config.productionTip = false

Vue.component('app-alert', AlertCmp)

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  template: '<App/>',
  components: { App },
  created () {
    firebaseInitialize(this)
  }
})

function firebaseInitialize (vue) {
  firebase.initializeApp({
    apiKey: 'AIzaSyDfKA77M6vyodG8_BprKviSgNtB0zLoVDU',
    authDomain: 'trade-citizen.firebaseapp.com',
    projectId: 'trade-citizen'
  })
  firebase.firestore().enablePersistence()
    .then(function () {
      // console.log('enablePersistence success')
      initializeUser(vue)
    })
    .catch(function (err) {
      console.log('enablePersistence ERROR', err)
      let offlineDisabled = false
      if (err.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled
        // in one tab at a a time.
        offlineDisabled = true
      } else if (err.code === 'unimplemented') {
        // The current browser does not support all of the
        // features required to enable persistence.
        offlineDisabled = true
      }
      if (offlineDisabled) {
      }
      initializeUser(vue)
    })
}

function initializeUser (vue) {
  firebase.auth().onAuthStateChanged(user => {
    // console.log('onAuthStateChanged', user)
    if (user) {
      vue.$store.dispatch('autoSignIn', user)
    }
    vue.$store.dispatch('initialize')
  })
}
