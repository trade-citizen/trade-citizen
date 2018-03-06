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
        <v-list-tile
          v-if="userIsAuthenticated"
          @click="signout">
          <v-list-tile-action>
            <v-icon>exit_to_app</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>Sign out</v-list-tile-content>
        </v-list-tile>
      </v-list>
    </v-navigation-drawer>
    <v-toolbar
      app
      fixed
    >
      <v-toolbar-side-icon
        @click.stop="drawer = !drawer">
      </v-toolbar-side-icon>
      <v-toolbar-title
        class="ml-0 mr-2"
        tag="span"
        style="cursor: pointer"
        @click="home">
      {{ title }}
      </v-toolbar-title>
      <template v-if="$route.path==='/signin'">
        <v-spacer></v-spacer>
        <v-btn
          flat
          class="ml-0 mr-2"
          to="/signup">
          <v-icon class="mx-1">face</v-icon>
          Sign up
        </v-btn>
      </template>
      <template v-if="$route.path==='/signup'">
        <v-spacer></v-spacer>
        <v-btn
          flat
          class="ml-0 mr-2"
          to="/signin">
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
          autofocus
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
        <template v-if="stationId != null">
          <template v-if="!userIsAuthenticated">
            <v-btn
              flat
              class="ml-0 mr-2"
              @click="signin"
            >
              <v-icon class="mx-1">lock_open</v-icon>
              Sign in
            </v-btn>
          </template>
          <template v-else>
            <template v-if="mayEdit">
              <v-btn
                v-if="editing"
                icon
                class="ml-0 mr-2"
                @click="editStation(stationId, false)"
              >
                <v-icon class="mx-1">cancel</v-icon>
              </v-btn>
              <v-btn
                v-else
                icon
                class="ml-0 mr-2"
                @click="editStation(stationId, true)"
              >
                <v-icon class="mx-1">edit</v-icon>
              </v-btn>
            </template>
            <v-btn
              icon
              class="ml-0 mr-2"
              @click="saveStation(stationId)"
            >
              <v-icon class="mx-1">save</v-icon>
            </v-btn>
          </template>
        </template>
      </template>
    </v-toolbar>
    <v-content>
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
      stationId: null,
      editing: false
    }
  },
  computed: {
    userIsAuthenticated () {
      return this.$store.getters.user !== null &&
        this.$store.getters.user !== undefined
    },
    mayEdit () {
      if (!this.stationId || this.editing) {
        return false
      }
      let stationCommodityPricesAll = this.$store.getters.stationCommodityPrices(this.storeId)
      return stationCommodityPricesAll && stationCommodityPricesAll
        .reduce((accumulator, stationCommodityPrice) => {
          if (stationCommodityPrice.isPriceDefined) {
            accumulator++
          }
          return accumulator
        }, 0) > 0
    },
    stations () {
      return this.$store.getters.stations
        .map((station) => {
          return {
            id: station.id,
            name: station.anchor.name + ' - ' + station.name
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
  watch: {
    stationId (value) {
      this.onStationChanged(this.stationId)
    }
  },
  methods: {
    signin () {
      this.stationId = null
      this.editing = false
      this.$router.push('/signin')
    },
    signout () {
      this.stationId = null
      this.editing = false
      this.$store.dispatch('logout')
      this.home()
    },
    home () {
      this.$router.push('/')
    },
    onStationChanged (stationId) {
      this.editing = false
      this.$root.$emit('onStationChanged', this.stationId)
    },
    editStation (stationId, editing) {
      console.log('App editStation', arguments)
      this.editing = editing
      this.$root.$emit('editStation', stationId, editing)
    },
    saveStation (stationId) {
      // console.log('App saveStation stationId:' + stationId)
      this.editing = false
      this.$root.$emit('saveStation', stationId)
    }
  }
}
</script>

<style lang="stylus">
  @import './stylus/main'
</style>
