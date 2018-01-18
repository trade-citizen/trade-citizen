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
          append-icon="search"
          placeholder="Search"
          autofocus
          solo-inverted
          autocomplete
          v-model="stationId"
          v-bind:items="stations()"
          item-text="name"
          item-value="id"
        >
        </v-select>
        <v-btn
          icon
          class="ml-0 mr-2"
          @click="clearSearch()"
        >
          <v-icon class="mx-1">clear</v-icon>
        </v-btn>
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
  </v-app>
</template>

<script>
  export default {
    data () {
      return {
        drawer: false,
        title: 'Trade Citizen',
        stationId: null
      }
    },
    computed: {
      userIsAuthenticated () {
        return this.$store.getters.user !== null &&
          this.$store.getters.user !== undefined
      }
    },
    methods: {
      signout () {
        this.stationId = null
        this.$store.dispatch('logout')
        this.home()
      },
      home () {
        this.$router.push('/')
      },
      stations () {
        return this.$store.getters.stations
      },
      clearSearch () {
        this.stationId = null
      },
      saveStation (stationId) {
        // console.log('App saveStation stationId:' + stationId)
        this.$root.$emit('saveStationId', stationId)
      }
    },
    watch: {
      stationId: function (newStationId, oldStationId) {
        // console.log('App newStationId newStationId:' + newStationId)
        this.$root.$emit('newStationId', newStationId)
      }
    }
  }
</script>

<style lang="stylus">
  @import './stylus/main'
</style>
