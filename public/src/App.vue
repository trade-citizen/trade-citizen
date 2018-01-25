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
          @change="onStationChanged"
        >
        </v-select>
        <template v-if="stationId != null">
          <template v-if="!userIsAuthenticated">
            <v-btn
              flat
              class="ml-0 mr-2"
              to="/signin">
              <v-icon class="mx-1">lock_open</v-icon>
              Sign in
            </v-btn>
          </template>
          <template v-else>
            <v-btn
              v-if="mayEdit"
              icon
              class="ml-0 mr-2"
              @click="editStation(stationId)"
            >
              <v-icon class="mx-1">edit</v-icon>
            </v-btn>
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
      if (this.stationId == null) {
        return false
      }
      let station = this.$store.getters.station(this.stationId)
      return !this.editing && Object.keys(station.prices).length !== 0
    },
    stations () {
      return this.$store.getters.stations
    }
  },
  methods: {
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
      if (stationId instanceof Event) {
        return
      }
      console.log('App onStationChanged stationId', stationId)
      this.editing = false
      this.$root.$emit('onStationChanged', stationId)
    },
    editStation (stationId) {
      // console.log('App editStation stationId:' + stationId)
      this.editing = true
      this.$root.$emit('editStation', stationId)
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
