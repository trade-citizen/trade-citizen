<template>
  <v-container v-if="!isAdmin">
    YOU ARE NOT AN ADMIN
  </v-container>
  <v-container v-else grid-list-md>
    ADMIN CONSOLE
    <v-layout row wrap>
      <v-flex xs6>
        <v-card>
          <v-card-title primary-title>
            <h3>Create Anchor Type</h3>
          </v-card-title>
          <v-card-actions>
            <v-btn>Foo!</v-btn>
          </v-card-actions>
        </v-card>
      </v-flex>
      <v-flex xs6>
        <v-card>
          <v-card-title primary-title>
            <h3>Create Anchor</h3>
          </v-card-title>
          <v-card-actions>
            <v-btn>Foo!</v-btn>
          </v-card-actions>
        </v-card>
      </v-flex>
      <v-flex xs6>
        <v-card>
          <v-card-title primary-title>
            <h3>Create Location Type</h3>
          </v-card-title>
          <v-card-actions>
            <v-btn>Foo!</v-btn>
          </v-card-actions>
        </v-card>
      </v-flex>
      <v-flex xs6>
        <v-card>
          <v-card-title primary-title>
            <h3>Create Location</h3>
          </v-card-title>
          <v-card-actions>
            <v-btn>Foo!</v-btn>
          </v-card-actions>
        </v-card>
      </v-flex>
      <v-flex xs4>
        <v-card>
          <v-card-title primary-title>
            <h3>Create Item Category</h3>
          </v-card-title>
          <v-card-actions>
            <v-btn>Foo!</v-btn>
          </v-card-actions>
        </v-card>
      </v-flex>
      <v-flex xs4>
        <v-card>
          <v-card-title primary-title>
            <h3>Create Item Type</h3>
          </v-card-title>
          <v-card-actions>
            <v-btn>Foo!</v-btn>
          </v-card-actions>
        </v-card>
      </v-flex>
      <v-flex xs4>
        <v-card>
          <v-card-title primary-title>
            <h3>Create Item</h3>
          </v-card-title>
          <v-card-actions>
            <v-btn>Foo!</v-btn>
          </v-card-actions>
        </v-card>
      </v-flex>
      <v-flex xs12>
        <v-card>
          <v-card-title primary-title>
            <h3>Other</h3>
          </v-card-title>
          <v-card-actions>
            <v-btn>Recalculate Buy:Sell Ratios</v-btn>
          </v-card-actions>
        </v-card>
      </v-flex>
      <v-flex xs12>
        <v-card>
          <v-container>
            <v-layout row>
              <v-flex xs12>
                <v-card-title primary-title>
                  <h3>Price History</h3>
                </v-card-title>
              </v-flex>
            </v-layout>
            <v-layout row>
              <v-flex xs12>
                <v-data-table
                  class="elevation-1"
                  hide-actions
                  :headers="headers"
                  :items="priceHistory"
                  >
                  <template slot="items" slot-scope="props">
                    <td>{{ props.item.time }}</td>
                  </template>
                </v-data-table>
              </v-flex>
            </v-layout>
          </v-container>
        </v-card>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>

import { mapGetters, mapState } from 'vuex'

export default {
  data () {
    return {
      isAdmin: false,
      headers: [
        { sortable: true, align: 'left', text: 'Time', value: 'time' }
      ],
      priceHistory: []
    }
  },

  created () {
    // console.log('Admin created this.user', this.user)
  },

  mounted () {
    // console.log('Admin mounted this.user', this.user)
    /*
    const path = this.firestorePath('')
    this.firestore.doc(path).get()
      .then(result => {
        // console.log('root doc result', result)
        const docData = result.exists && result.data()
        // console.log('root doc docData', docData)
        const _buySellInfoCache = docData._buySellInfoCache
        console.log('root doc _buySellInfoCache', _buySellInfoCache)
      })
    */
    // this.firestore.collection(this.firestorePath('/itemTypes'))
  },

  computed: {
    ...mapState({
      isDevelopment: state => state.shared.isDevelopment,
      user: state => state.user.user
      // firestore: state => state.tradeinfo.firestore
    }),
    ...mapGetters([
      'firestore',
      'firestorePath'
    ])
  },

  watch: {
    user: {
      handler () {
        console.log('Admin watch user this.user', this.user)
        const userId = this.user.id
        const path = this.firestorePath(`/users/${userId}`)
        console.log('get user doc', path)
        this.firestore.doc(path).get()
          .then(result => {
            console.log('user doc result', result)
            const docData = result.exists && result.data()
            console.log('user doc docData', docData)
            const { role } = docData
            this.isAdmin = role === 'admin'
          })
      }
    }
  }
}
</script>

<style>

</style>


