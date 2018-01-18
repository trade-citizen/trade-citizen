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
        v-for="(commodity, index) in commodities"
        :key="commodity.id"
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
                      <h3 class="headline">{{ commodity.name }}</h3>
                </v-card-title>
                <div>{{ commodity.category }}</div>
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
                  v-model="pricesBuy[commodity.id]"
                  label="Buy Price"
                  :color="userIsAuthenticated ? 'cyan lighten-2' : ''"
                  :disabled="!userIsAuthenticated"
                >
                </v-text-field>
              </v-flex>
              <v-flex xs6>
                <v-text-field
                  class="input-group--focused"
                  hide-details
                  v-model="pricesSell[commodity.id]"
                  label="Sell Price"
                  :color="userIsAuthenticated ? 'cyan lighten-2' : ''"
                  :disabled="!userIsAuthenticated"
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
    computed: {
      userIsAuthenticated () {
        return this.$store.getters.user !== null &&
          this.$store.getters.user !== undefined
      },
      commodities () {
        return this.$store.getters.commodities
      },
      pricesBuy () {
        return {}
      },
      pricesSell () {
        return {}
      }
    },
    methods: {
      newStationId (stationId) {
        console.log('newStationId stationId:' + stationId)
        this.stationId = stationId
        let station = this.$store.getters.station(stationId)
        console.log('newStationId station:', station)
        console.log('newStationId TODO:(pv) Load station data from local or firestore')
      },
      saveStationId (stationId) {
        console.log('saveStationId stationId:', stationId)
        let station = this.$store.getters.station(stationId)
        console.log('saveStationId station:', station)
        console.log('saveStationId pricesBuy:', this.pricesBuy)
        console.log('saveStationId pricesSell:', this.pricesSell)
        console.log('saveStationId TODO:(pv) Save the station commodities to firebase firestore')
      }
    },
    mounted: function () {
      // console.log('Home mounted')
      var vm = this
      vm.$root.$on('newStationId', function (stationId) {
        console.log('Home newStationId stationId:' + stationId)
        vm.newStationId(stationId)
      })
      vm.$root.$on('saveStationId', function (stationId) {
        console.log('Home saveStationId stationId:' + stationId)
        vm.saveStationId(stationId)
      })
    }
  }
</script>
