// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import Vuetify from 'vuetify'
import App from './App'
import router from './router'
import { store } from './store'

// Required for roboto & material-design-icons fonts to work offline
import 'roboto-fontface/css/roboto/roboto-fontface.css'
import 'material-design-icons-iconfont/dist/material-design-icons.css'
// TODO:(pv) Include http://fontawesome.io/icons/ and https://materialdesignicons.com/
//  https://next.vuetifyjs.com/components/icons#examples

Vue.prototype.$PACKAGE_VERSION = PACKAGE_VERSION

Vue.use(Vuetify)
Vue.config.productionTip = false

// eslint-disable-next-line no-new
new Vue({
  el: '#app',
  router,
  store,
  template: '<App/>',
  components: { App }
})
