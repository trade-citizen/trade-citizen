// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import Vuetify from 'vuetify'
import colors from 'vuetify/es5/util/colors'
import App from './App'
import router from './router'
import { store } from './store'
import firebase from '@firebase/app'
import '@firebase/firestore'

// Required for roboto & material-design-icons fonts to work offline
import 'roboto-fontface/css/roboto/roboto-fontface.css'
import 'material-design-icons-iconfont/dist/material-design-icons.css'
// TODO:(pv) Include http://fontawesome.io/icons/ and https://materialdesignicons.com/
//  https://next.vuetifyjs.com/components/icons#examples

// Used in App.vue to show app version in footer
Vue.prototype.$PACKAGE_VERSION = PACKAGE_VERSION

Vue.use(Vuetify, {
  theme: {
    //
    // https://github.com/vuetifyjs/vuetify/blob/master/src/stylus/settings/_colors.styl
    //
    primary: colors.cyan.lighten2
    // secondary: '#424242',
    // accent: '#82B1FF',
    // error: '#FF5252',
    // info: '#2196F3',
    // success: '#4CAF50',
    // warning: '#FFC107'
  }
})

Vue.config.productionTip = false

firebase.initializeApp({
  apiKey: 'AIzaSyDfKA77M6vyodG8_BprKviSgNtB0zLoVDU',
  authDomain: 'trade-citizen.firebaseapp.com',
  projectId: 'trade-citizen'
})
const firestore = firebase.firestore()
firestore.settings({
  timestampsInSnapshots: true
})

// eslint-disable-next-line no-new
new Vue({
  el: '#app',
  router,
  store,
  template: '<App/>',
  components: { App },
  created () {
    // console.log('Vue created')
    firestore.enablePersistence()
      .then(result => {
        // console.log('Vue enablePersistence resolve')
      }, reason => {
        // console.warn('Vue enablePersistence reject', reason)
        this.$store.commit('_setPersistenceError', reason)
      })
      .then(result => {
        this.$store.dispatch('initialize')
      })
    firebase.auth().onAuthStateChanged(user => {
      // console.log('Vue onAuthStateChanged user', user)
      if (user) {
        this.$store.dispatch('autoSignIn', user)
      }
    })
  },
  mounted () {
    // console.log('Vue mounted')
    const vm = this
    window.addEventListener('load', function () {
      vm.updateNetworkStatus()
      window.addEventListener('online', vm.updateNetworkStatus)
      window.addEventListener('offline', vm.updateNetworkStatus)
    })
  },
  beforeDestroy () {
    // console.log('Vue beforeDestroy')
    window.removeEventListener('online', this.updateNetworkStatus)
    window.removeEventListener('offline', this.updateNetworkStatus)
  },
  methods: {
    updateNetworkStatus () {
      const offline = !navigator.onLine
      // console.log('Vue updateNetworkStatus offline', offline)
      if (offline) {
        // console.log('Vue updateNetworkStatus firestore.disableNetwork()')
        firestore.disableNetwork()
      } else {
        // console.log('Vue updateNetworkStatus firestore.enableNetwork()')
        firestore.enableNetwork()
      }
      this.$store.commit('setOffline', offline)
    }
  }
})
