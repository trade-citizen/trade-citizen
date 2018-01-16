<template>
  <v-container>
    <!--
    <p>{{ todo }}</p>
    -->
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
        // searchFilter: '',
        // todo: 'Waiting...'
      }
    },
    methods: {
      onNewSearchFilter (newSearchFilter) {
        // console.log('Home searchFilter ' + newSearchFilter)
        /*
        var todo
        if (newSearchFilter === '') {
          todo = 'TODO:(pv) show trade margins sorted highest to lowest.'
        } else {
          todo = 'TODO:(pv) search for "' + newSearchFilter + '".' +
          ' if ambiguous (result > 1) then show list of trade consoles.' +
          ' if not ambiguous (result == 1) then show single trade console prices.'
        }
        this.todo = todo
        */
      }
    },
    computed: {
      stationsFiltered () {
        return this.$store.getters.stations
      }
    },
    mounted: function () {
      // console.log('Home mounted')
      var vm = this
      vm.$root.$on('newSearchFilter', function (newSearchFilter) {
        vm.onNewSearchFilter(newSearchFilter)
      })
      this.onNewSearchFilter('')
    }
  }
</script>
