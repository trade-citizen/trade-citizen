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
              <form @submit.prevent="onSignin">
                <v-layout row>
                  <v-flex xs12>
                    <v-text-field
                      name="email"
                      label="Mail"
                      id="email"
                      v-model="email"
                      type="email"
                      required>
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
                      required>
                    </v-text-field>
                  </v-flex>
                </v-layout>
                <v-layout row>
                  <v-flex xs12>
                    <div class="text-xs-center">
                    <v-btn round  type="submit">
                      Sign in
                      <v-icon right>lock_open</v-icon>
                    </v-btn>
                    </div>
                    <div class="text-xs-center">
                      <v-btn round class="red" dark @click.prevent="onSigninGoogle">Sign in with Google
                        <v-icon right dark>lock_open</v-icon>
                      </v-btn>
                    </div>
                    <!--
                    <div class="text-xs-center">
                      <v-btn round primary dark :disabled="loading" :loading="loading" @click.prevent="onSigninFacebook">Sign in with Facebook
                        <v-icon right dark>lock_open</v-icon>
                          <span slot="loader" class="custom-loader">
                        <v-icon light>cached</v-icon>
                       </span>
                      </v-btn>
                    </div>
                    <div class="text-xs-center">
                      <v-btn round dark :disabled="loading" :loading="loading" @click.prevent="onSigninGithub">Sign in with Github
                        <v-icon right dark>lock_open</v-icon>
                          <span slot="loader" class="custom-loader">
                        <v-icon light>cached</v-icon>
                       </span>
                      </v-btn>
                    </div>
                    <div class="text-xs-center">
                      <v-btn round info dark :disabled="loading" :loading="loading" @click.prevent="onSigninTwitter">Sign in with Twitter
                        <v-icon right dark>lock_open</v-icon>
                          <span slot="loader" class="custom-loader">
                        <v-icon light>cached</v-icon>
                       </span>
                      </v-btn>
                    </div>
                    -->
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
  export default {
    data () {
      return {
        email: '',
        password: ''
      }
    },
    computed: {
      user () {
        return this.$store.getters.user
      },
      error () {
        return this.$store.getters.error
      },
      loading () {
        return this.$store.getters.loading
      }
    },
    watch: {
      user (value) {
        if (value !== null && value !== undefined) {
          this.$router.push('/')
        }
      }
    },
    methods: {
      onSignin () {
        this.$store.dispatch('signUserIn', {email: this.email, password: this.password})
      },
      onSigninGoogle () {
        this.$store.dispatch('signUserInGoogle')
      },
      /*
      onSigninFacebook () {
        this.$store.dispatch('signUserInFacebook')
      },
      onSigninGithub () {
        this.$store.dispatch('signUserInGithub')
      },
      onSigninTwitter () {
        this.$store.dispatch('signUserInTwitter')
      },
      */
      onDismissed () {
        this.$store.dispatch('clearError')
      }
    }
  }
</script>