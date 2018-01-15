<template>
  <v-app dark>
    <!--
    <v-navigation-drawer
      fixed
      :clipped="clipped"
      v-model="sideNav"
      app>
      <v-list>
        <v-list-tile
          v-for="item in menuItems"
          :key="item.title"
          :to="item.link">
          <v-list-tile-action>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>{{ item.title }}</v-list-tile-content>
        </v-list-tile>
        <v-list-tile
          v-if="userIsAuthenticated"
          @click="onLogout">
          <v-list-tile-action>
            <v-icon>exit_to_app</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>Logout</v-list-tile-content>
        </v-list-tile>
      </v-list>
    </v-navigation-drawer>
    -->
    <v-toolbar
      app
      fixed
    >
      <!--
      <v-toolbar-side-icon
        @click.stop="sideNav = !sideNav"
        class="hidden-sm-and-up ">
      </v-toolbar-side-icon>
      -->
      <v-toolbar-title>
        <router-link to="/" tag="span" style="cursor: pointer">{{ title }}</router-link>
      </v-toolbar-title>
      <v-text-field
        solo-inverted
        append-icon="search"
        placeholder="Search"
        class="ml-2"
      >
      </v-text-field>
      <div class="d-flex align-center mr-0">
        <v-btn
          icon
          v-for="item in menuItems"
          :key="item.title"
          :to="item.link">
          <v-icon>{{ item.icon }}</v-icon>
          {{ item.title }}
        </v-btn>
        <v-btn
          icon
          v-if="userIsAuthenticated"
          @click="onLogout">
          <v-icon>exit_to_app</v-icon>
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
        sideNav: false,
        title: 'Trade Citizen'
      }
    },
    computed: {
      userIsAuthenticated () {
        return this.$store.getters.user !== null &&
          this.$store.getters.user !== undefined
      },
      menuItems () {
        let menuItems
        if (this.userIsAuthenticated) {
          menuItems = [
          ]
        } else {
          menuItems = [
            {icon: 'face', title: 'Sign up', link: '/signup'},
            {icon: 'lock_open', title: 'Sign in', link: '/signin'}
          ]
        }
        return menuItems
      }
    },
    methods: {
      onLogout () {
        this.$store.dispatch('logout')
        this.$router.push('/')
      }
    }
  }
</script>

<style lang="stylus">
  @import './stylus/main'
</style>
