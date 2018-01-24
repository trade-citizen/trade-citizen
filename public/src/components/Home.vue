<template>
  <v-container
    v-if="stationId == null"
  >
    TODO:(pv) Show trade margins sorted highest to lowest
  </v-container>
  <v-container
    v-else
    grid-list-md
  >
    <v-layout row wrap>
      <v-flex
        xs4
        v-for="stationPrice in stationPrices"
        :key="stationPrice.id"
      >
        <v-card style="border:1px solid white; border-radius:6px;">
          <v-container fluid grid-list-lg>
            <v-layout row>
              <!--
              <v-flex xs4>
                <v-card-media
                  :src="`images/commodity-${commodity.type}.png`"
                  height="86px"
                  width="auto"
                >
                </v-card-media>
              </v-flex>
              -->
              <v-flex xs12>
                <!--
                  <v-container fluid fill-height>
                    <v-layout justify-left align-top>
                -->
                <v-card-title primary-title class="px-0 py-0">
                      <h3 class="headline">{{ stationPrice.name }}</h3>
                </v-card-title>
                <div>{{ stationPrice.category }}</div>
                <!--
                    </v-layout>
                  </v-container>
                -->
              </v-flex>
            </v-layout>
            <v-layout row>
              <v-flex xs6>
                <v-text-field
                  class="input-group--focused"
                  hide-details
                  label="Buy Price"
                  :color="userIsAuthenticated ? 'cyan lighten-2' : ''"
                  :disabled="!userIsAuthenticated"
                  v-model="stationPrice.buy"
                >
                </v-text-field>
              </v-flex>
              <v-flex xs6>
                <v-text-field
                  class="input-group--focused"
                  hide-details
                  label="Sell Price"
                  :color="userIsAuthenticated ? 'cyan lighten-2' : ''"
                  :disabled="!userIsAuthenticated"
                  v-model="stationPrice.sell"
                >
                </v-text-field>
              </v-flex>
            </v-layout>
            <!--
            <v-layout row>
              <v-card-actions>
                <v-btn flat>Approve</v-btn>
              </v-card-actions>
            </v-layout>
            -->
          </v-container>
        </v-card>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
export default {
  data () {
    return {
      stationId: null
    }
  },
  mounted: function () {
    // console.log('Home mounted')
    var vm = this
    vm.$root.$on('onStationChanged', function (stationId) {
      console.log('Home onStationChanged stationId:' + stationId)
      vm.onStationChanged(stationId)
    })
    vm.$root.$on('saveStation', function (stationId) {
      console.log('Home saveStation stationId:' + stationId)
      vm.saveStation(stationId)
    })
  },
  computed: {
    userIsAuthenticated () {
      return this.$store.getters.user !== null &&
        this.$store.getters.user !== undefined
    },
    commodities () {
      return this.$store.getters.commodities
    },
    stationPrices () {
      // console.log('Home stationPrices stationId:' + this.stationId)
      return this.$store.getters.stationPrices(this.stationId)
    }
  },
  methods: {
    onStationChanged (stationId) {
      console.log('Home onStationChanged stationId:' + stationId)
      this.stationId = stationId
    },
    saveStation (stationId) {
      // console.log('saveStation stationId:', stationId)
      let station = this.$store.getters.station(stationId)
      // console.log('saveStation station:', station)
      let stationPrices = {}
      this.stationPrices.forEach((stationPrice) => {
        let temp = {}
        if (stationPrice.buy !== undefined) {
          temp.buy = stationPrice.buy
        }
        if (stationPrice.sell !== undefined) {
          temp.sell = stationPrice.sell
        }
        if (Object.keys(temp).length !== 0) {
          stationPrices[stationPrice.id] = temp
        }
      })
      this.$store.dispatch('savePrices', {
        station: station,
        prices: stationPrices
      })
    }
  }
}
</script>
