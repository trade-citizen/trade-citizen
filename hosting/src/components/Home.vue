<template>
  <v-container
    v-if="stationId == null"
    fluid
    class="pt-0"
    >
    <v-layout row d-flex align-center>
      <v-icon class="mx-2">filter_list</v-icon><span class="mr-2">Filter</span>
      <v-select
        label="Commodities"
        clearable
        multiple
        single-line
        hide-details
        hide-selected
        :items="commodities"
        v-model="filter.commodities"
        item-value="id"
        item-text="name"
        return-object
        >
      </v-select>
      <v-checkbox
        label="Illegal"
        v-model="filter.illegal"
        @change="refresh()"
        hide-details
        >
      </v-checkbox>
    </v-layout>
    <v-layout row d-flex>
      <!--
        NOTE: pagination.sync is needed to define non-default sort column
      -->
      <v-data-table
        class="elevation-1"
        hide-actions
        must-sort
        v-bind:pagination.sync="pagination"
        :headers="headers"
        :custom-sort="sortMarginPrices"
        :items="margins"
        no-data-text="Soon™..."
        >
        <template slot="items" slot-scope="props">
          <td class="text-xs-right">{{ props.item.commodity }}</td>
          <td class="text-xs-right">{{ props.item.stationBuy }}</td>
          <td class="text-xs-right">{{ props.item.priceBuy.toFixed(3) }}</td>
          <td class="text-xs-center">{{ calculateMargin(props.item) }}</td>
          <td class="text-xs-left">{{ props.item.priceSell.toFixed(3) }}</td>
          <td class="text-xs-left">{{ props.item.stationSell }}</td>
        </template>
      </v-data-table>
    </v-layout>
  </v-container>
  <v-container
    v-else
    grid-list-md
    fluid
    class="pa-0"
    >
    <v-layout
      v-if="stationCommodityPriceList.length"
      row wrap
      class="pa-2"
      >
      <v-flex
        xs4
        v-for="(stationCommodityPrice, index) in stationCommodityPriceList"
        :key="stationCommodityPrice.id"
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
                  <h3 class="headline">{{ stationCommodityPrice.name }}</h3>
                </v-card-title>
                <div>{{ stationCommodityPrice.category }}</div>
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
                  autofocus="index === 0"
                  @focus="$event.target.select()"
                  :color="userIsAuthenticated ? 'cyan lighten-2' : ''"
                  :disabled="!userIsAuthenticated"
                  :value="stationCommodityPrice.priceBuy"
                  @input="updateStationCommodityPrice(stationCommodityPrice.id, 'priceBuy', $event)"
                  >
                </v-text-field>
              </v-flex>
              <v-flex xs6>
                <v-text-field
                  class="input-group--focused"
                  hide-details
                  label="Sell Price"
                  @focus="$event.target.select()"
                  :color="userIsAuthenticated ? 'cyan lighten-2' : ''"
                  :disabled="!userIsAuthenticated"
                  :value="stationCommodityPrice.priceSell"
                  @input="updateStationCommodityPrice(stationCommodityPrice.id, 'priceSell', $event)"
                  >
                </v-text-field>
              </v-flex>
            </v-layout>
          </v-container>
        </v-card>
      </v-flex>
    </v-layout>
    <v-layout
      v-else
      justify-center
      >
      <p class="pa-2">No prices set</p>
    </v-layout>
    <v-snackbar
      :timeout="toastTimeoutMillis"
      bottom
      v-model="toast"
      >
      {{ toastMessage }}
    </v-snackbar>    
  </v-container>
</template>

<script>
export default {
  data () {
    return {
      headers: [
        { sortable: true, align: 'right', text: 'Commodity', value: 'commodity' },
        { sortable: true, align: 'right', text: 'Buy Station', value: 'stationBuy' },
        { sortable: true, align: 'right', text: 'Buy Price', value: 'priceBuy' },
        { sortable: true, align: 'center', text: 'Margin', value: 'margin' },
        { sortable: true, align: 'left', text: 'Sell Price', value: 'priceSell' },
        { sortable: true, align: 'left', text: 'Sell Station', value: 'stationSell' }
      ],
      pagination: {
        sortBy: 'margin',
        descending: false
      },
      filter: {
        illegal: false,
        commodities: [],
        anchors: [],
        stationsBuy: [],
        stationsSell: []
      },
      editing: false,
      toast: false,
      toastMessage: null,
      toastTimeoutMillis: 3000
    }
  },
  mounted: function () {
    // console.log('Home mounted')
    var vm = this
    vm.$root.$on('onStationChanged', function (stationId) {
      // console.log('Home vm.onStationChanged stationId', stationId)
      vm.onStationChanged(stationId)
    })
    vm.$root.$on('editStation', function (stationId, editing) {
      // console.log('Home vm.editStation stationId:' + stationId)
      vm.editStation(stationId, editing)
    })
    vm.$root.$on('saveStation', function (stationId) {
      // console.log('Home vm.saveStation stationId:' + stationId)
      vm.saveStation(stationId)
    })
  },
  computed: {
    stationId: {
      get: function () {
        return this.$store.getters.getSelectedStationId
      }
    },
    userIsAuthenticated () {
      return this.$store.getters.user !== null &&
        this.$store.getters.user !== undefined
    },
    commodities () {
      let commodities = this.$store.getters.commodities
      let result = []
      Object.keys(commodities).forEach((commodityId) => {
        let commodity = commodities[commodityId]
        if (!commodity.illegal || this.filter.illegal) {
          result.push({ id: commodityId, name: commodity.name })
        }
      })
      return result
    },
    margins () {
    },
    stationCommodityPriceList () {
      let stationCommodityPriceList = this.$store.getters.stationCommodityPriceList(this.stationId)
      if (stationCommodityPriceList && !this.editing) {
        let stationCommodityPriceListDefined = stationCommodityPriceList.filter((stationCommodityPrice) => {
          return stationCommodityPrice.isPriceDefined
        })
        stationCommodityPriceList = (stationCommodityPriceListDefined.length > 0 || !this.userIsAuthenticated) ? stationCommodityPriceListDefined : stationCommodityPriceList
      }
      return stationCommodityPriceList
    }
  },
  methods: {
    refresh () {
      // console.log('refresh()')
      if (!this.filter.illegal) {
        // Clear illegal items from this.filter.commodities
        let commodities = this.$store.getters.commodities
        let i = this.filter.commodities.length
        while (i--) {
          let commodity = this.filter.commodities[i]
          if (commodities[commodity.id].illegal) {
            this.filter.commodities.splice(i, 1)
          }
        }
      }
    },
    calculateMargin (item) {
      return (item.priceSell / item.priceBuy).toFixed(3)
    },
    sortMarginPrices (items, index, isDescending) {
      return items.sort((itemA, itemB) => {
        let valueA, valueB
        switch (index) {
          case 'margin':
            valueA = this.calculateMargin(itemA)
            valueB = this.calculateMargin(itemB)
            break
          default:
            valueA = itemA[index]
            valueB = itemB[index]
        }

        if (valueA < valueB) {
          return isDescending ? -1 : 1
        }
        if (valueA > valueB) {
          return isDescending ? 1 : -1
        }
        return 0
      })
    },
    onStationChanged (stationId) {
      // console.log('Home onStationChanged stationId:' + stationId)
      this.editing = false
    },
    editStation (stationId, editing) {
      // console.log('Home editStation stationId:' + stationId)
      // console.log('Home editStation editing:' + editing)
      this.editing = editing
    },
    saveStation (stationId) {
      // console.log('Home saveStation this.stationId:' + this.stationId)
      // console.log('Home saveStation this.stationCommodityPriceList', this.stationCommodityPriceList)
      let promise = this.$store.dispatch('saveStationCommodityPrices', {
        stationId: this.stationId,
        stationCommodityPrices: this.stationCommodityPriceList
      })
      if (promise) {
        promise
          .then(result => {
            console.log('saveStation SUCCESS!')
            this.toastMessage = 'Prices Saved.'
            this.toast = true
          },
          error => {
            console.log('saveStation ERROR', error)
            this.toastMessage = 'Error; Try Again.'
            this.toast = true
          })
          .catch(error => {
            console.log('saveStation ERROR', error)
            this.toastMessage = 'Error; Try Again.'
            this.toast = true
          })
      }
      this.editing = false
    },
    updateStationCommodityPrice (commodityId, priceId, value) {
      this.$store.commit('updateStationCommodityPrice', {
        stationId: this.stationId,
        commodityId: commodityId,
        priceId: priceId,
        value: value
      })
    }
  }
}
</script>
