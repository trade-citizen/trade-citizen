<template>
  <v-container
    v-if="locationId == null"
    fluid
    class="pt-0"
    >
    <!--
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
    -->
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
        :custom-sort="sortBuySellRatios"
        :items="buySellRatios"
        no-data-text="Soon™..."
        >
        <template slot="items" slot-scope="props">
          <td class="text-xs-right">{{ props.item.itemName }}</td>
          <td class="text-xs-right">{{ props.item.buyLocationName }}</td>
          <td class="text-xs-right">{{ props.item.buyPrice.toFixed(3) }}</td>
          <td class="text-xs-center">{{ props.item.ratio.toFixed(3) }}</td>
          <td class="text-xs-left">{{ props.item.sellPrice.toFixed(3) }}</td>
          <td class="text-xs-left">{{ props.item.sellLocationName }}</td>
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
      v-if="locationItemPriceList.length"
      row wrap
      class="pa-2"
      >
      <v-flex
        xs4
        v-for="(locationItemPrice, index) in locationItemPriceList"
        :key="locationItemPrice.id"
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
                  <h3 class="headline">{{ locationItemPrice.name }}</h3>
                </v-card-title>
                <div>{{ locationItemPrice.category }}</div>
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
                  :autofocus="index === 0"
                  :color="userIsAuthenticated ? 'cyan lighten-2' : ''"
                  :disabled="!userIsAuthenticated"
                  :value="locationItemPrice.priceBuy"
                  @input="updateLocationItemPrice(locationItemPrice.id, 'priceBuy', $event)"
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
                  :value="locationItemPrice.priceSell"
                  @input="updateLocationItemPrice(locationItemPrice.id, 'priceSell', $event)"
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
        { sortable: true, align: 'right', text: 'Item', value: 'itemName' },
        { sortable: true, align: 'right', text: 'Buy Location', value: 'buyLocationName' },
        { sortable: true, align: 'right', text: 'Buy Price', value: 'buyPrice' },
        { sortable: true, align: 'center', text: 'Ratio', value: 'ratio' },
        { sortable: true, align: 'left', text: 'Sell Price', value: 'sellPrice' },
        { sortable: true, align: 'left', text: 'Sell Location', value: 'sellLocationName' }
      ],
      pagination: {
        sortBy: 'ratio',
        descending: false
      },
      filter: {
        illegal: false,
        commodities: [],
        anchors: [],
        locationsBuy: [],
        locationsSell: []
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
    vm.$root.$on('onSelectedLocationChanged', function (locationId) {
      // console.log('Home vm.onSelectedLocationChanged locationId', locationId)
      vm.onSelectedLocationChanged(locationId)
    })
    vm.$root.$on('editLocation', function (locationId, editing) {
      // console.log('Home vm.editLocation locationId:' + locationId)
      vm.editLocation(locationId, editing)
    })
    vm.$root.$on('saveLocation', function (locationId) {
      // console.log('Home vm.saveLocation locationId:' + locationId)
      vm.saveLocation(locationId)
    })
  },
  computed: {
    locationId: {
      get: function () {
        return this.$store.getters.getSelectedLocationId
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
    buySellRatios () {
      return this.$store.getters.buySellRatios
    },
    locationItemPriceList () {
      let prices = this.$store.getters.locationItemPriceList(this.locationId)
      if (prices && !this.editing) {
        let pricesDefined = prices.filter((price) => {
          return price.isPriceDefined
        })
        prices = (pricesDefined.length > 0 || !this.userIsAuthenticated) ? pricesDefined : prices
      }
      this.locationItemPriceListCopy = []
      prices.forEach(price => {
        // console.log('locationItemPriceListCopy item', item)
        let copy = Object.assign({}, price)
        this.locationItemPriceListCopy.push(copy)
      })
      return this.locationItemPriceListCopy
    }
  },
  methods: {
    isDevelopment () {
      return (process.env.NODE_ENV === 'development')
    },
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
    sortBuySellRatios (items, index, isDescending) {
      return items.sort((itemA, itemB) => {
        let valueA, valueB
        switch (index) {
          /*
          case 'ratio':
            valueA = this.calculateMargin(itemA)
            valueB = this.calculateMargin(itemB)
            break
            */
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

        // TODO:(pv) Secondary sorting...

        return 0
      })
    },
    onSelectedLocationChanged (locationId) {
      // console.log('Home onSelectedLocationChanged locationId:' + locationId)
      this.editing = false
    },
    editLocation (locationId, editing) {
      // console.log('Home editLocation locationId:' + locationId)
      // console.log('Home editLocation editing:' + editing)
      this.editing = editing
    },
    saveLocation (locationId) {
      // console.log('Home saveLocation this.locationId:' + this.locationId)
      // console.log('Home saveLocation this.locationItemPriceListCopy', this.locationItemPriceListCopy)
      this.$store
        .dispatch('saveLocationItemPrices', {
          locationId: this.locationId,
          locationItemPrices: this.locationItemPriceListCopy
        })
        .then(result => {
          // console.log('saveLocation SUCCESS!')
          this.toastMessage = 'Prices Saved.'
          this.toast = true
        },
        error => {
          // console.log('saveLocation ERROR', error)
          let toastMessage = error.message ? error.message : error
          if (this.isDevelopment) {
            if (error.itemId) {
              toastMessage += ` {${error.itemId}} {${error.buyOrSell}}`
            }
          }
          this.toastMessage = toastMessage
          this.toast = true
        })
        .catch(error => {
          console.log('saveLocation ERROR', error)
          let toastMessage = error.message ? error.message : error
          if (this.isDevelopment) {
            if (error.itemId) {
              toastMessage += ` {${error.itemId}} {${error.buyOrSell}}`
            }
          }
          this.toastMessage = toastMessage
          this.toast = true
        })
    },
    updateLocationItemPrice (itemId, priceId, value) {
      let prices = this.locationItemPriceListCopy
        .find(item => {
          return item.id === itemId
        })
      prices[priceId] = value
    }
  }
}
</script>
