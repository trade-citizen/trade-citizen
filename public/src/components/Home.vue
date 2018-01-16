<template>
  <v-container
    v-if="searchFilter.length == 0"
  >
    searchFilter.length = {{ searchFilter.length }}<br>
    TODO:(pv) show trade margins sorted highest to lowest
  </v-container>
  <v-container
    v-else-if="stationsFiltered.length == 1"
  >
    searchFilter.length = {{ searchFilter.length }}<br>
    TODO:(pv) show single trade console prices for {{ stationsFiltered[0].name }}
  </v-container>
  <v-container
    v-else
  >
    searchFilter.length = {{ searchFilter.length }}<br>
    <v-layout row>
      <v-flex xs12 sm6 offset-sm3>
        <v-card>
          <v-list>
            <v-list-tile
              v-for="station in stationsFiltered"
              :key="station.id"
            >
              <v-list-tile-content>
                <v-list-tile-title>{{ station.name }}</v-list-tile-title>
              </v-list-tile-content>
            </v-list-tile>
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
        // todo: 'Waiting...'
      }
    },
    computed: {
      stationsFiltered () {
        return this.$store.getters.stationsFiltered(this.searchFilter)
      }
    },
    mounted: function () {
      // console.log('Home mounted')
      var vm = this
      vm.$root.$on('newSearchFilter', function (newSearchFilter) {
        // console.log('Home newSearchFilter ' + newSearchFilter)
        vm.searchFilter = newSearchFilter
      })
      vm.searchFilter = ''
    }
  }
</script>
