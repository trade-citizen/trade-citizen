<template>
  <v-container>
    <v-layout row v-if="error">
      <v-flex xs12 sm6 offset-sm3>
        <app-alert @dismissed="onDismissed" :text="error.message"></app-alert>
      </v-flex>
    </v-layout>
    <v-layout row>
      <v-flex xs12 sm6 offset-sm3>
        <v-card>
          <v-card-text>
            <v-container>
              <form @submit.prevent="signUserIn('generic')">
                <v-layout row>
                  <v-flex xs12>
                    <v-text-field
                      name="email"
                      label="Mail"
                      id="email"
                      v-model="email"
                      type="email"
                      required
                      :disabled="authenticating"
                      >
                    </v-text-field>
                  </v-flex>
                </v-layout>
                <v-layout row>
                  <v-flex xs12>
                    <v-text-field
                      name="password"
                      label="Password"
                      id="password"
                      v-model="password"
                      type="password"
                      required
                      :disabled="authenticating"
                      >
                    </v-text-field>
                  </v-flex>
                </v-layout>
                <v-layout row v-if="$route.path==='/signup'">
                  <v-flex xs12>
                    <v-text-field
                      name="confirmPassword"
                      label="Confirm Password"
                      id="confirmPassword"
                      v-model="confirmPassword"
                      type="password"
                      :rules="[comparePasswords]"
                      :disabled="authenticating"
                      >
                    </v-text-field>
                  </v-flex>
                </v-layout>
                <v-layout row>
                  <v-flex xs12>
                    <div class="text-xs-center">
                      <v-btn type="submit"
                        round :disabled="authenticating"
                        v-if="showButtons['generic']"
                        >{{ formatButtonText() }}
                        <v-icon right>lock_open</v-icon>
                      </v-btn>
                    </div>
                    <div class="text-xs-center">
                      <v-btn class="red"
                        round :disabled="authenticating"
                        @click.prevent="signUserIn('google')"
                        v-if="showButtons['google']"
                        >{{ formatButtonText('Google') }}
                        <v-icon right>lock_open</v-icon>
                      </v-btn>
                    </div>
                    <div class="text-xs-center">
                      <v-btn
                        round :disabled="authenticating"
                        @click.prevent="signUserIn('facebook')"
                        v-if="showButtons['facebook']"
                        >{{ formatButtonText('Facebook') }}
                        <v-icon right>lock_open</v-icon>
                      </v-btn>
                    </div>
                    <div class="text-xs-center">
                      <v-btn
                        round :disabled="authenticating"
                        @click.prevent="signUserIn('github')"
                        v-if="showButtons['github']"
                        >{{ formatButtonText('GitHub') }}
                        <v-icon right>lock_open</v-icon>
                      </v-btn>
                    </div>
                    <div class="text-xs-center">
                      <v-btn
                        round :disabled="authenticating"
                        @click.prevent="signUserIn('twitter')"
                        v-if="showButtons['twitter']"
                        >{{ formatButtonText('Twitter') }}
                        <v-icon right>lock_open</v-icon>
                      </v-btn>
                    </div>
                  </v-flex>
                </v-layout>
              </form>
            </v-container>
          </v-card-text>
        </v-card>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>

import Vue from 'vue'
import { mapGetters, mapState } from 'vuex'
const util = require('util')

const textSignIn = 'Sign in'
const textSignUp = 'Sign up'
const buttonTextSignInFormat = 'Sign in with %s'
const buttonTextSignUpFormat = 'Sign up with %s'

export default {
  data () {
    return {
      email: '',
      password: '',
      confirmPassword: '',
      showButtons: {
        'generic': true,
        'google': true,
        'facebook': false,
        'github': false,
        'twitter': false
      }
    }
  },

  computed: {
    ...mapState({
      user: state => state.user.user,
      error: state => state.user.error,
      authenticating: state => state.user.authenticating
    }),
    ...mapGetters([
    ]),
    comparePasswords () {
      return this.password !== this.confirmPassword ? 'Passwords do not match' : ''
    }
  },

  watch: {
    user (value) {
      // console.log('watch user', value)
      if (value !== null && value !== undefined) {
        // console.log('router push /')
        this.$router.push('/')
      }
    }
  },

  methods: {
    routePath () {
      return this.$route.path
    },
    isSignIn () {
      return this.routePath() === '/signin'
    },
    formatButtonText (providerName) {
      let buttonText
      if (providerName) {
        const format = this.isSignIn() ? buttonTextSignInFormat : buttonTextSignUpFormat
        buttonText = util.format(format, providerName)
      } else {
        buttonText = this.isSignIn() ? textSignIn : textSignUp
      }
      return buttonText
    },
    signUserIn (providerName) {
      this.showOnly(providerName)
      this.$store.dispatch('signUserIn', {
        mode: this.isSignIn() ? 'signin' : 'signup',
        providerName,
        email: this.email,
        password: this.password
      })
    },
    onDismissed () {
      this.showOnly(null)
      this.$store.dispatch('clearError')
    },
    showOnly (providerName) {
      Object.keys(this.showButtons).forEach(buttonName => {
        const show = !providerName || buttonName === providerName
        // console.log('showOnly buttonName', buttonName, 'show', show)
        Vue.set(this.showButtons, buttonName, show)
      })
    }
  }
}
</script>
