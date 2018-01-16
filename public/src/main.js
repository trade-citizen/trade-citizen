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
    firebase.initializeApp({
      apiKey: 'AIzaSyDfKA77M6vyodG8_BprKviSgNtB0zLoVDU',
      authDomain: 'trade-citizen.firebaseapp.com',
      databaseURL: 'https://trade-citizen.firebaseio.com',
      projectId: 'trade-citizen',
      storageBucket: 'trade-citizen.appspot.com',
      messagingSenderId: '676462601414'
    })
    firebase.firestore().enablePersistence()
      .then(function () {
        console.log('enablePersistence success')
      })
      .catch(function (err) {
        console.log('enablePersistence error ' + err.code)
      })
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        this.$store.dispatch('autoSignIn', user)
        this.$store.dispatch('fetchTradeinfo')
      }
    })
  }
})
