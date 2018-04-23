// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import Vuetify from 'vuetify'
import colors from 'vuetify/es5/util/colors'
import App from './App'
import router from './router'
import { store } from './store'

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
  }
})

Vue.config.productionTip = false

// eslint-disable-next-line no-new
new Vue({
  el: '#app',
  router,
  store,
  template: '<App/>',
  components: { App }
})
