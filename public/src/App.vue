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
      <v-select
        class="mx-2"
        append-icon="search"
        placeholder="Search"
        autofocus
        solo-inverted
        autocomplete
        v-model="station"
        v-bind:items="stations()"
        item-text="name"
        item-value="id"
      >
      </v-select>
      <div
        class="d-flex align-center mx-0"
        v-if="!userIsAuthenticated"
      >
        <v-btn
          flat
          class="ml-0 mr-2"
          to="/signup">
            <v-icon class="mx-1">face</v-icon>
            Sign up
        </v-btn>
        <v-btn
          flat
          class="ml-0 mr-2"
          to="/signin">
            <v-icon class="mx-1">lock_open</v-icon>
            Sign in
        </v-btn>
      </div>
      <div
        v-else-if="station !== null"
      >
        <v-btn
          icon
          class="ml-0 mr-2"
          @click="clearSearch()"
        >
          <v-icon class="mx-1">clear</v-icon>
        </v-btn>
        <v-btn
          icon
          class="ml-0 mr-2"
          @click="saveStation()"
        >
          <v-icon class="mx-1">save</v-icon>
        </v-btn>
      </div>
    </v-toolbar>
    <v-content>
      <router-view></router-view>
    </v-content>
  </v-app>
</template>

<script>
  export default {
    data () {
      return {
        drawer: false,
        title: 'Trade Citizen',
        station: null
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
        this.station = null
      },
      saveStation () {
        console.log('TODO:(pv) Save the station commodities to firebase firestore')
        this.$root.$emit('saveStation') // stationId
      }
    },
    watch: {
      station: function (newStation, oldStation) {
        // console.log('App newStation ' + newStation)
        this.$root.$emit('newStation', newStation)
      }
    }
  }
</script>

<style lang="stylus">
  @import './stylus/main'
</style>
