<template>
  <v-app dark>
    <v-navigation-drawer
      app
      fixed
      v-model="drawer"
      >
      <v-list>
        <v-list-tile to="/">
          <v-list-tile-action>
            <v-icon>home</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>Home</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>
        <template v-if="userIsAuthenticated">
          <v-list-tile @click="signout">
            <v-list-tile-action>
              <v-icon>exit_to_app</v-icon>
            </v-list-tile-action>
            <v-list-tile-content>Sign out</v-list-tile-content>
          </v-list-tile>
        </template>
        <template v-else>
          <v-list-tile @click="signin">
            <v-list-tile-action>
              <v-icon>lock_open</v-icon>
            </v-list-tile-action>
            <v-list-tile-content>Sign in</v-list-tile-content>
          </v-list-tile>
        </template>
      </v-list>
    </v-navigation-drawer>
    <v-toolbar
      app
      fixed
      >
      <v-toolbar-side-icon
        @click.stop="drawer = !drawer"
        >
      </v-toolbar-side-icon>
      <v-toolbar-title
        class="ml-0 mr-2"
        tag="span"
        style="cursor: pointer"
        @click="home"
        >
      {{ title }}
      </v-toolbar-title>
      <template v-if="$route.path==='/signin'">
        <v-spacer></v-spacer>
        <v-btn
          flat
          class="ml-0 mr-2"
          to="/signup"
          >
          <v-icon class="mx-1">face</v-icon>
          Sign up
        </v-btn>
      </template>
      <template v-else-if="$route.path==='/signup'">
        <v-spacer></v-spacer>
        <v-btn
          flat
          class="ml-0 mr-2"
          to="/signin"
          >
          <v-icon class="mx-1">lock_open</v-icon>
          Sign in
        </v-btn>
      </template>
      <template v-else-if="$route.path==='/'">
        <v-select
          class="mx-2"
          color="cyan lighten-2"
          append-icon="search"
          placeholder="Search"
          solo-inverted
          autocomplete
          clearable
          :disabled="this.initializing"
          :dense="$vuetify.breakpoint.xsOnly"
          :items="locations"
          item-text="name"
          item-value="id"
          v-model="locationId"
          >
        </v-select>
        <template v-if="locationId">
          <template v-if="userIsAuthenticated">
            <template v-if="showEdit">
              <v-tooltip
                v-if="editing"
                bottom>
                <span
                  slot="activator">
                  <v-btn
                    icon
                    class="ml-0 mr-2"
                    @click="editLocation(false)"
                    >
                    <v-icon class="mx-1">cancel</v-icon>
                  </v-btn>
                </span>
                <span>Cancel</span>
              </v-tooltip>
              <v-tooltip
                v-else
                bottom>
                <span
                  slot="activator">
                  <v-btn
                    icon
                    class="ml-0 mr-2"
                    @click="editLocation(true)"
                    >
                    <v-icon class="mx-1">edit</v-icon>
                  </v-btn>
                </span>
                <span>Edit</span>
              </v-tooltip>
            </template>
            <v-tooltip bottom>
              <span slot="activator">
                <v-btn
                  icon
                  class="ml-0 mr-2"
                  :disabled="!saveable"
                  @click="saveLocation"
                  >
                  <v-icon class="mx-1">save</v-icon>
                </v-btn>
              </span>
              <span>{{ 'Save (' + (offline ? 'OFFLINE' : 'Control-S or ⌘-S') + ')' }}</span>
            </v-tooltip>
            
          </template>
          <template v-else>
            <v-btn
              flat
              class="ml-0 mr-2"
              :disabled="offline"
              @click="signin"
              >
              <v-icon class="mx-1">lock_open</v-icon>
              Sign in
            </v-btn>
          </template>
        </template>
      </template>
    </v-toolbar>
    <v-content>
      <v-progress-linear :indeterminate="true" class="ma-0" v-if="showProgress"></v-progress-linear>      
      <v-fade-transition mode="out-in">
        <router-view></router-view>
      </v-fade-transition>
    </v-content>
    <v-footer app class="pa-3">
      <div v-if="locationId">
        {{ locationItemPriceTimestamp }}
      </div>
      <v-spacer></v-spacer>
      <div>{{ offline ? 'OFFLINE' : '' }}</div>
      <div class="pl-2">v{{ $PACKAGE_VERSION }} &copy; 2018</div>
    </v-footer>
    <v-snackbar
      :timeout="toast.timeoutMillis"
      bottom
      v-model="toast.show"
      >
      {{ toast.message }}
      <v-btn
        icon
        @click.native="toast.show = false"
        >
        <v-icon>close</v-icon>
      </v-btn>
    </v-snackbar>    
  </v-app>
</template>

<script>

import * as utils from './utils'

export default {
  data () {
    return {
      drawer: false,
      title: 'Trade Citizen',
      editing: false,
      toast: {
        show: false,
        message: null,
        timeoutMillis: 3000
      }
    }
  },

  created () {
    // console.log('App created')
    this.$store.dispatch('initialize')
  },

  mounted () {
    // console.log('App mounted')
    const vm = this
    window.addEventListener('load', function () {
      vm.updateOnlineStatus()
      window.addEventListener('online', vm.updateOnlineStatus)
      window.addEventListener('offline', vm.updateOnlineStatus)
      window.addEventListener('keydown', vm.onKeyDown)
    })
    vm.$root.$on('toastMessage', payload => {
      // console.log('App vm.toastMessage payload', payload)
      vm.toastMessage(payload)
    })
  },

  beforeDestroy () {
    // console.log('App beforeDestroy')
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('online', this.updateOnlineStatus)
    window.removeEventListener('offline', this.updateOnlineStatus)
  },

  computed: {
    isDevelopment () {
      return this.$store.getters.isDevelopment
    },
    offline () {
      return this.$store.getters.offline
    },
    initializing () {
      return this.$store.getters.initializing
    },
    showProgress () {
      let showProgress = this.initializing || this.$store.getters.saving
      return showProgress
    },
    saveable () {
      // console.log('saveable this.offline', this.offline, 'this.showProgress', this.showProgress)
      let saveable = !this.offline && !this.showProgress
      // console.log('saveable saveable', saveable)
      return saveable
    },
    locationId: {
      get: function () {
        return this.$store.getters.getSelectedLocationId
      },
      set: function (value) {
        this.editing = false
        this.$store.commit('setSelectedLocationId', value)
        this.$root.$emit('onSelectedLocationChanged', value)
      }
    },
    userIsAuthenticated () {
      return this.$store.getters.user !== null &&
        this.$store.getters.user !== undefined
    },
    showEdit () {
      if (!this.locationId) {
        return false
      }
      let locationItemPriceList = this.$store.getters.locationItemPriceList(this.locationId)
      let accumulator = 0
      if (locationItemPriceList) {
        accumulator = locationItemPriceList
          .reduce((accumulator, locationItemPrice) => {
            if (locationItemPrice.isPriceDefined) {
              accumulator++
            }
            return accumulator
          }, accumulator)
      }
      return accumulator > 0
    },
    locations () {
      return this.$store.getters.locations
        .map((location) => {
          let id = location.id
          let name = location.anchor.name + ' - ' + location.name
          if (this.isDevelopment) {
            name += ' {' + id + '}'
          }
          return {
            id: id,
            name: name
          }
        })
        .sort((a, b) => {
          let aName = a.name.toLowerCase()
          let bName = b.name.toLowerCase()
          if (aName < bName) {
            return -1
          }
          if (aName > bName) {
            return 1
          }
          return 0
        })
    },
    locationItemPriceTimestamp () {
      let metadata = this.$store.getters.locationItemPriceMetadata(this.locationId)
      let timestamp = metadata && metadata.timestamp
      // console.log('timestamp', timestamp)
      timestamp = utils.formatDateYMDHMS(timestamp)
      if (!timestamp) {
        timestamp = 'Never'
      }
      return `Priced at: ${timestamp}`
    }
  },
  methods: {
    updateOnlineStatus () {
      let online = navigator.onLine
      // console.log('App updateOnlineStatus online', online)
      this.$store.commit('setOffline', !online)
    },
    onKeyDown (event) {
      // NOTE: metaKey == Command on Mac
      if ((event.metaKey || event.ctrlKey) && event.keyCode === 'S'.charCodeAt(0)) {
        event.preventDefault()
        this.saveLocation()
      }
    },
    toastMessage (payload) {
      this.toast = Object.assign({ show: true }, payload)
    },
    signin () {
      this.editing = false
      this.$router.push('/signin')
    },
    signout () {
      this.editing = false
      this.$store.dispatch('logout')
      this.home()
    },
    home () {
      this.$router.push('/')
    },
    editLocation (editing) {
      // console.log('App editLocation editing', editing)
      this.editing = editing
      this.$root.$emit('editLocation', this.locationId, this.editing)
    },
    saveLocation () {
      // console.log('App saveLocation this.locationId', this.locationId)
      if (!this.userIsAuthenticated || !this.locationId || this.offline) {
        return
      }
      this.editLocation(false)
      this.$root.$emit('saveLocation', this.locationId)
    }
  }
}
</script>

<style lang="stylus">
  @import './stylus/main'
</style>
