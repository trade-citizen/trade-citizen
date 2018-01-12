// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import Vuetify from 'vuetify'
import 'vuetify/dist/vuetify.css'

import App from './App'
import router from './router'

// https://next.vuetifyjs.com/style/theme#customizing
// https://next.vuetifyjs.com/theme-generator
/*
import colors from 'vuetify/src/util/colors'
const theme = {
  primary: colors.grey.darken3,
  secondary: colors.grey.darken2,
  accent: '#DD2C00', // colors.#DD2C00
  error: colors.red.base,
  warning: colors.yellow.base,
  info: colors.blue.base,
  success: colors.green.base
}
*/

Vue.use(Vuetify /*, {
  theme: theme
} */)

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  template: '<App/>',
  components: { App }
})
