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
        <v-card style="border:1px solid white; border-radius:6px; display:flex; flex-direction:column; justify-content:space-between;">
          <!--
          <v-card-title>
            {{ commodity.name }} TODO...
          </v-card-title>
          -->
          <div style="display:flex;">
            <img style="width:auto; height:86px; margin-left:4px; margin-top:4px;" src="images/1-1.jpg">
            <div style="align-self:center; margin:4px; width:100%; height:100%; min-height:100%; display:flex; flex-direction:column; justify-content:space-between;">
              <h1 class="mdc-card__title mdc-card__title--large" style="flex:1; align-items:stretch;">{{ commodity.name }}</h1>
              <h2 class="mdc-card__subtitle">{ Type }</h2>
            </div>
          </div>
          <div style="display:flex; margin:0px 4px 4px 4px;">
            <div class="mdc-text-field" style="margin:0px 2px 0px 0px;">
              <input id="price-buy-agricium" type="text" class="mdc-text-field__input">
              <label for="price-buy-agricium" class="mdc-text-field__label">Buy Price</label>
              <div class="mdc-text-field__bottom-line"></div>
            </div>
            <div class="mdc-text-field" style="margin:0px 0px 0px 2px;">
              <input id="price-sell-agricium" type="text" class="mdc-text-field__input">
              <label for="price-sell-agricium" class="mdc-text-field__label">Sell Price</label>
              <div class="mdc-text-field__bottom-line"></div>
            </div>
          </div>
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
