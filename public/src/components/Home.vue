<template>
  <v-container
    v-if="searchFilter.length == 0 || stationsFiltered.length == 0"
  >
    TODO:(pv) show trade margins sorted highest to lowest
  </v-container>
  <v-container
    v-else-if="stationsFiltered.length == 1"
    grid-list-md
  >
    <!--
    TODO:(pv) show single trade console prices for {{ stationsFiltered[0].name }}
    -->
    <h2>{{ stationsFiltered[0].name }}</h2>
    <v-layout row wrap>
      <v-flex
        xs4
        v-for="commodity in commodities"
        :key="commodity.id"
      >
        <v-card>
          <v-card-title>
            {{ commodity.name }}
          </v-card-title>
        </v-card>
      </v-flex>
    </v-layout>
  </v-container>
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
                  <!--
                  <v-list-tile-sub-title>{{ station.stationType }}</v-list-tile-sub-title>
                  -->
                </v-list-tile-content>
              </v-list-tile>
              <v-divider v-if="index + 1 < stationsFiltered.length" :key="index"></v-divider>
            </template>
          </v-list>
        </v-card>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
  export default {
    data () {
      return {
        searchFilter: ''
      }
    },
    computed: {
      stationsFiltered () {
        return this.$store.getters.stationsFiltered(this.searchFilter)
      },
      commodities () {
        return this.$store.getters.commodities
      }
    },
    mounted: function () {
      // console.log('Home mounted')
      var vm = this
      vm.$root.$on('newSearchFilter', function (newSearchFilter) {
        // console.log('Home newSearchFilter ' + newSearchFilter)
        vm.searchFilter = newSearchFilter
      })
    }
  }
</script>
