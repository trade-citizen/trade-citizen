import firebase from '@firebase/app'
import '@firebase/auth'

export default {
  state: {
    authenticating: false,
    error: null,
    user: null
  },
  mutations: {
    setAuthenticating (state, payload) {
      // console.log('setAuthenticating', payload)
      state.authenticating = payload
    },
    setError (state, payload) {
      // console.log('setError', payload)
      state.error = payload
    },
    clearError (state) {
      state.error = null
    },
    setUser (state, payload) {
      state.user = payload
    }
  },
  actions: {
    clearError (context) {
      context.commit('clearError')
    },
    signUserIn (context, { mode, providerName, email, password }) {
      context.commit('setAuthenticating', true)
      context.commit('clearError')
      let authProvider
      switch (providerName) {
        case 'google':
          authProvider = new firebase.auth.GoogleAuthProvider()
          break
        case 'facebook':
          authProvider = new firebase.auth.FacebookAuthProvider()
          break
        case 'github':
          authProvider = new firebase.auth.GithubAuthProvider()
          break
        case 'twitter':
          authProvider = new firebase.auth.TwitterAuthProvider()
          break
      }
      let promise
      if (authProvider) {
        promise = firebase.auth().signInWithPopup(authProvider)
      } else {
        if (mode === 'signin') {
          promise = firebase.auth().signInWithEmailAndPassword(email, password)
        } else {
          promise = firebase.auth().createUserWithEmailAndPassword(email, password)
        }
      }
      return promise
        .then(user => {
          context.commit('setAuthenticating', false)
          const newUser = {
            id: user.uid,
            name: user.displayName,
            email: user.email,
            photoUrl: user.photoURL
          }
          context.commit('setUser', newUser)
        })
        .catch(error => {
          context.commit('setAuthenticating', false)
          context.commit('setError', error)
          console.log(error)
        })
    },
    autoSignIn (context, payload) {
      context.commit('setUser', {
        id: payload.uid,
        name: payload.displayName,
        email: payload.email,
        photoUrl: payload.photoURL
      })
    },
    logout (context) {
      firebase.auth().signOut()
      context.commit('setUser', null)
    }
  },
  getters: {
    userIsAuthenticated (state) {
      return state.user !== null && state.user !== undefined
    }
  }
}
