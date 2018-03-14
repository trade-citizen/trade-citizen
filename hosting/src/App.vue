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
          :dense="$vuetify.breakpoint.xsOnly"
          :items="stations"
          item-text="name"
          item-value="id"
          v-model="stationId"
          >
        </v-select>
        <template v-if="stationId">
          <template v-if="userIsAuthenticated">
            <template v-if="showEdit">
              <v-btn
                v-if="editing"
                icon
                class="ml-0 mr-2"
                @click="editStation(false)"
                >
                <v-icon class="mx-1">cancel</v-icon>
              </v-btn>
              <v-btn
                v-else
                icon
                class="ml-0 mr-2"
                @click="editStation(true)"
                >
                <v-icon class="mx-1">edit</v-icon>
              </v-btn>
            </template>
            <v-btn
              icon
              class="ml-0 mr-2"
              @click="saveStation"
              >
              <v-icon class="mx-1">save</v-icon>
            </v-btn>
          </template>
          <template v-else>
            <v-btn
              flat
              class="ml-0 mr-2"
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
      <v-progress-linear :indeterminate="true" class="ma-0" v-if="loading"></v-progress-linear>      
      <v-fade-transition mode="out-in">
        <router-view></router-view>
      </v-fade-transition>
    </v-content>
    <v-footer app class="pa-3">
      <v-spacer></v-spacer>
      <div>v{{ $PACKAGE_VERSION }} &copy; 2018</div>
    </v-footer>
  </v-app>
</template>

<script>
export default {
  data () {
    return {
      drawer: false,
      title: 'Trade Citizen',
      editing: false
    }
  },
  mounted: function () {
    var vm = this
    window.addEventListener('keydown', function (event) {
      // NOTE: metaKey == Command on Mac
      if ((event.metaKey || event.ctrlKey) && event.keyCode === 'S'.charCodeAt(0)) {
        event.preventDefault()
        vm.saveStation()
      }
    })
  },
  computed: {
    loading () {
      return this.$store.getters.loading
    },
    stationId: {
      get: function () {
        return this.$store.getters.getSelectedStationId
      },
      set: function (value) {
        this.editing = false
        this.$store.commit('setSelectedStationId', value)
        this.$root.$emit('onStationChanged', value)
      }
    },
    userIsAuthenticated () {
      return this.$store.getters.user !== null &&
        this.$store.getters.user !== undefined
    },
    showEdit () {
      if (!this.stationId) {
        return false
      }
      let stationCommodityPriceList = this.$store.getters.stationCommodityPriceList(this.stationId)
      let accumulator = 0
      if (stationCommodityPriceList) {
        accumulator = stationCommodityPriceList
          .reduce((accumulator, stationCommodityPrice) => {
            if (stationCommodityPrice.isPriceDefined) {
              accumulator++
            }
            return accumulator
          }, accumulator)
      }
      return accumulator > 0
    },
    stations () {
      return this.$store.getters.stations
        .map((station) => {
          let id = station.id
          let name = station.anchor.name + ' - ' + station.name
          if (process.env.NODE_ENV === 'development') {
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
    }
  },
  methods: {
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
    editStation (editing) {
      // console.log('App editStation editing', editing)
      this.editing = editing
      this.$root.$emit('editStation', this.stationId, this.editing)
    },
    saveStation () {
      // console.log('App saveStation this.stationId:' + this.stationId)
      if (!(this.stationId && this.userIsAuthenticated)) {
        return
      }
      this.editStation(false)
      this.$root.$emit('saveStation', this.stationId)
    }
  }
}
</script>

<style lang="stylus">
  @import './stylus/main'
</style>
