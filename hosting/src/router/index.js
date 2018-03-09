import Vue from 'vue'
import Router from 'vue-router'
import Home from '@/components/Home'
// import Profile from '@/components/User/Profile'
import Signup from '@/components/User/Signup'
import Signin from '@/components/User/Signin'
// import AuthGuard from './auth-guard'

Vue.use(Router)

export default new Router({
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
      component: Signup
    },
    {
      path: '/signin',
      name: 'Sign in',
      component: Signin
    }
  ],
  mode: 'history'
})
