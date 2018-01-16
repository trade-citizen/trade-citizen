<template>
  <v-container>
    <p>{{ todo }}</p>
  </v-container>
</template>

<script>
  export default {
    data () {
      return {
        // searchFilter: '',
        todo: 'Waiting...'
      }
    },
    methods: {
      onNewSearchFilter (newSearchFilter) {
        // console.log('Home searchFilter ' + newSearchFilter)
        var todo
        if (newSearchFilter === '') {
          todo = 'TODO:(pv) show trade margins sorted highest to lowest.'
        } else {
          todo = 'TODO:(pv) search for "' + newSearchFilter + '".' +
          ' if ambiguous (result > 1) then show list of trade consoles.' +
          ' if not ambiguous (result == 1) then show single trade console prices.'
        }
        this.todo = todo
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
