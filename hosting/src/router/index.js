import Vue from 'vue'
import Router from 'vue-router'
import Home from '@/components/Home'
// import Profile from '@/components/User/Profile'
import Signin from '@/components/User/Signin'
// import AuthGuard from './auth-guard'

Vue.use(Router)

export default new Router({
  mode: 'history',
  scrollBehavior: function (to, from, savedPosition) {
    if (to.hash) {
      return { selector: to.hash }
    } else {
      return { x: 0, y: 0 }
    }
  },
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home
    },
    /*
    {
      path: '/profile',
      name: 'Profile',
      component: Profile,
      beforeEnter: AuthGuard
    },
    */
    {
      path: '/signup',
      name: 'Sign up',
      component: Signin
    },
    {
      path: '/signin',
      name: 'Sign in',
      component: Signin
    }
  ]
})
