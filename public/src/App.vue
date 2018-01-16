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
      <v-text-field
        solo-inverted
        autofocus
        append-icon="search"
        placeholder="Search"
        class="mx-2"
        v-model="searchFilter"
      >
      </v-text-field>
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
        searchFilter: ''
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
      }
    },
    watch: {
      searchFilter: function (newSearchFilter, oldSearchFilter) {
        // console.log('App newSearchFilter:' + newSearchFilter)
        this.$root.$emit('newSearchFilter', newSearchFilter)
      }
    }
  }
</script>

<style lang="stylus">
  @import './stylus/main'
</style>
