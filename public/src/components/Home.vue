<template>
  <v-container
    v-if="station == null"
  >
    TODO:(pv) Show trade margins sorted highest to lowest
  </v-container>
  <v-container
    v-else
    grid-list-md
  >
    <!--
    Show single trade console prices for {{ stationsFiltered[0].name }}
    -->
    <v-layout row wrap>
      <v-flex
        xs4
        v-for="commodity in commodities"
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
                <div>{ commodity.type }</div>
                <!--
                    </v-layout>
                  </v-container>
                -->
              </v-flex>
            </v-layout>
            <v-layout row>
              <v-flex xs6>
                <v-text-field
                  color="cyan lighten-2"
                  hide-details
                  label="Buy Price"
                  placeholder="aUEC / Unit"
                >
                </v-text-field>
              </v-flex>
              <v-flex xs6>
                <v-text-field
                  color="cyan lighten-2"
                  hide-details
                  label="Sell Price"
                  placeholder="aUEC / Unit"
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
  <!--
  <v-container
    v-else
  >
    <v-layout row>
      <v-flex xs12>
        <v-card>
          <v-list>
            <template v-for="(station, index) in stationsFiltered">
              <v-list-tile
                ripple
                :key="station.id"
              >
                <v-list-tile-content>
                  <v-list-tile-title>{{ station.name }}</v-list-tile-title>
                  <!- -
                  <v-list-tile-sub-title>{{ station.stationType }}</v-list-tile-sub-title>
                  - ->
                </v-list-tile-content>
              </v-list-tile>
              <v-divider v-if="index + 1 < stationsFiltered.length" :key="index"></v-divider>
            </template>
          </v-list>
        </v-card>
      </v-flex>
    </v-layout>
  </v-container>
  -->
</template>

<script>
  export default {
    data () {
      return {
        station: null
      }
    },
    computed: {
      commodities () {
        return this.$store.getters.commodities
      }
    },
    mounted: function () {
      // console.log('Home mounted')
      var vm = this
      vm.$root.$on('newStation', function (newStation) {
        // console.log('Home newStation ' + newStation)
        vm.station = newStation
      })
    }
  }
</script>
