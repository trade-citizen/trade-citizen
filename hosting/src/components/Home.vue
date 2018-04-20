<template>
  <v-container
    v-if="locationId == null"
    fluid
    class="pt-0"
    >
    <!--
    NOTE: With "Max Results" logic paradigm it is even more important to get this working...
    -->
    <v-layout row d-flex align-center>
      <!--
      <v-icon class="mx-2">filter_list</v-icon><span class="mr-2">Filter</span>
      -->
      <v-select
        label="Item"
        clearable
        multiple
        single-line
        hide-details
        hide-selected
        dense
        :items="items"
        v-model="buySellRatiosFilter.items"
        item-value="id"
        item-text="name"
        return-object
        >
      </v-select>
      <!-- TODO:(pv) Filter Category... -->
      <!--
      <v-select
        label="Anchors"
        clearable
        multiple
        hide-details
        :items="anchors"
        v-model="buySellRatiosFilter.anchors"
        >
      </v-select>
      -->
      <v-select
        label="Buy Location"
        clearable
        multiple
        single-line
        hide-details
        hide-selected
        dense
        :items="locations"
        v-model="buySellRatiosFilter.locationsBuy"
        item-value="id"
        item-text="name"
        return-object
        >
      </v-select>
      <v-select
        label="Sell Location"
        clearable
        multiple
        single-line
        hide-details
        hide-selected
        dense
        :items="locations"
        v-model="buySellRatiosFilter.locationsSell"
        item-value="id"
        item-text="name"
        return-object
        >
      </v-select>
      <!--
      <v-checkbox
        label="Illegal"
        v-model="buySellRatiosFilter.illegal"
        @change="refresh()"
        hide-details
        >
      </v-checkbox>
      -->
    </v-layout>
    <v-layout row d-flex>
      <!--
        NOTE: pagination.sync is needed to define non-default sort column
      -->
      <v-data-table
        class="elevation-1"
        must-sort
        sort-icon="arrow_downward"
        :hide-actions="!initialized"
        :no-data-text="initialized ? 'No data available' : 'Loading...'"
        :headers="headers"
        :pagination.sync="buySellRatiosPagination"
        :rows-per-page-items="buySellRatiosPagination.rowsPerPageItems"
        rows-per-page-text="Max Results"
        :total-items="buySellRatiosPagination.totalItems"
        :items="buySellRatios"
        >
        <template slot="items" slot-scope="props">
          <td class="text-xs-right">{{ props.item.itemName }}</td>
          <td class="text-xs-right">{{ props.item.buyLocationName }}</td>
          <td class="text-xs-right">
            <v-tooltip bottom>
              <span slot="activator">{{ props.item.buyPrice.toFixed(3) }}</span>
              <span>{{ formatDateYMDHMS(props.item.buyTimestamp) }}</span>
            </v-tooltip>
          </td>
          <td class="text-xs-center">{{ props.item.ratio.toFixed(3) }}</td>
          <td class="text-xs-left">
            <v-tooltip bottom>
              <span slot="activator">{{ props.item.sellPrice.toFixed(3) }}</span>
              <span>{{ formatDateYMDHMS(props.item.sellTimestamp) }}</span>
            </v-tooltip>
          </td>
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
      v-if="locationItemPriceListCopy.length"
      row wrap
      class="pa-2"
      >
      <v-flex
        xs4
        v-for="(locationItemPrice, index) in locationItemPriceListCopy"
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
                <v-number-field
                  label="Buy Price"
                  class="input-group--focused inputPrice"
                  :autofocus="index === 0"
                  :color="saveable ? 'cyan lighten-2' : ''"
                  :disabled="!saveable || saving"
                  :clearable="saveable && !saving"
                  v-model.number="locationItemPrice.priceBuy"
                  :hide-details="!locationItemPrice.invalidPriceBuy"
                  :error-messages="locationItemPrice.invalidPriceBuy ? 'Invalid price' : undefined"
                  @input="locationItemPrice.invalidPriceBuy = false"
                  @click="$event.target.select()"
                  >
                </v-number-field>
              </v-flex>
              <v-flex xs6>
                <v-number-field
                  label="Sell Price"
                  class="input-group--focused inputPrice"
                  :color="saveable ? 'cyan lighten-2' : ''"
                  :disabled="!saveable || saving"
                  :clearable="saveable && !saving"
                  v-model.number="locationItemPrice.priceSell"
                  :hide-details="!locationItemPrice.invalidPriceSell"
                  :error-messages="locationItemPrice.invalidPriceSell ? 'Invalid price' : undefined"
                  @input="locationItemPrice.invalidPriceSell = false"
                  @click="$event.target.select()"
                  >
                </v-number-field>
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
      <p class="pa-4">No prices set</p>
    </v-layout>
  </v-container>
</template>

<script>

import { mapGetters, mapState } from 'vuex'
import * as utils from '../utils'

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
      buySellRatiosFilter: Object.assign({}, this.$store.getters.buySellRatiosFilter),
      buySellRatiosPagination: Object.assign({}, this.$store.getters.buySellRatiosPagination),
      buySellRatiosPaginationOld: Object.assign({}, this.$store.getters.buySellRatiosPagination),
      locationItemPriceListCopy: [],
      editing: false
    }
  },

  created () {
    // console.log('Home created')
    this.updateLocationItemPriceListCopy()
  },

  mounted () {
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
    ...mapState({
      isDevelopment: state => state.shared.isDevelopment,
      persistenceError: state => state.tradeinfo.persistenceError,
      offline: state => state.tradeinfo.offline,
      initialized: state => state.tradeinfo.initialized,
      saving: state => state.tradeinfo.saving
    }),
    ...mapGetters([
      'userIsAuthenticated',
      'saveable'
    ]),
    locationId: {
      get: function () {
        return this.$store.getters.getSelectedLocationId
      }
    },
    items () {
      return this.$store.getters.items
        .map(item => {
          // if (item.illegal && !this.buySellRatiosFilter.illegal) {
          //   return
          // }
          const id = item.id
          const name = item.name
          /*
          if (this.isDevelopment) {
            name += ' {' + id + '}'
          }
          */
          return { id, name }
        })
        .sort((a, b) => {
          const aName = a.name.toLowerCase()
          const bName = b.name.toLowerCase()
          if (aName < bName) {
            return -1
          }
          if (aName > bName) {
            return 1
          }
          return 0
        })
    },
    locations () {
      return this.$store.getters.locations
        .map(location => {
          const id = location.id
          const name = location.name
          // name = location.anchor.name + ' - ' + name
          /*
          if (this.isDevelopment) {
            name += ' {' + id + '}'
          }
          */
          return { id, name }
        })
        .sort((a, b) => {
          const aName = a.name.toLowerCase()
          const bName = b.name.toLowerCase()
          if (aName < bName) {
            return -1
          }
          if (aName > bName) {
            return 1
          }
          return 0
        })
    },
    buySellRatios () {
      return this.$store.getters.buySellRatios
    },
    locationItemPriceList () {
      return this.$store.getters.locationItemPriceList(this.locationId)
    }
  },

  watch: {
    persistenceError: {
      handler () {
        this.onPersistenceError()
      }
    },
    buySellRatiosPagination: {
      deep: true,
      handler () {
        // console.error('Home watch buySellRatiosPagination arguments', arguments)
        // console.error('Home watch buySellRatiosPagination buySellRatiosPagination', this.buySellRatiosPagination)
        // console.error('Home watch buySellRatiosPagination buySellRatiosPaginationOld', this.buySellRatiosPaginationOld)
        const buySellRatiosPagination = this.buySellRatiosPagination
        const buySellRatiosPaginationOld = this.buySellRatiosPaginationOld
        if (buySellRatiosPagination.sortBy !== buySellRatiosPaginationOld.sortBy ||
            buySellRatiosPagination.descending !== buySellRatiosPaginationOld.descending ||
            buySellRatiosPagination.rowsPerPage !== buySellRatiosPaginationOld.rowsPerPage ||
            buySellRatiosPagination.page !== buySellRatiosPaginationOld.page) {
          // console.log('Home watch buySellRatiosPagination changed; setBuySellRatiosPagination && queryBuySellRatios')
          this.$store.commit('setBuySellRatiosPagination', Object.assign({}, this.buySellRatiosPagination))
          this.$store.dispatch('queryBuySellRatios')
        } else {
          // console.log('Home watch buySellRatiosPagination unchanged; ignore')
        }
        this.buySellRatiosPaginationOld = this.buySellRatiosPagination
      }
    },
    buySellRatiosFilter: {
      deep: true,
      handler () {
        // console.error('Home watch buySellRatiosFilter arguments', arguments)
        // console.error('Home watch buySellRatiosFilter setBuySellRatiosFilter && queryBuySellRatios')
        this.$store.commit('setBuySellRatiosFilter', Object.assign({}, this.buySellRatiosFilter))
        this.$store.dispatch('queryBuySellRatios')
      }
    },
    locationItemPriceList: {
      deep: true,
      handler: 'updateLocationItemPriceListCopy'
    },
    editing: 'updateLocationItemPriceListCopy'
  },

  methods: {
    toastMessage (payload) {
      this.$root.$emit('toastMessage', payload)
    },
    onPersistenceError () {
      // console.log('Home onPersistenceError error', error)
      const error = this.persistenceError
      if (!error) {
        return
      }
      let toastMessage
      if (error.code === 'failed-precondition') {
        toastMessage = 'Multiple tabs open; Offline mode disabled.'
      } else if (error.code === 'unimplemented') {
        toastMessage = 'Offline mode not supported.'
      } else {
        if (error.message) {
          toastMessage = error.message
        } else {
          toastMessage = `Offline mode disabled: "${error.code}"`
        }
      }
      this.toastMessage({ message: toastMessage })
    },
    formatDateYMDHMS (date) {
      return utils.formatDateYMDHMS(date)
    },
    refresh () {
      // console.log('Home refresh()')
      if (!this.buySellRatiosFilter.illegal) {
        // Clear illegal items from this.buySellRatiosFilter.items
        const items = this.$store.getters.items
        let i = this.buySellRatiosFilter.items.length
        while (i--) {
          const item = this.buySellRatiosFilter.items[i]
          if (items[item.id].illegal) {
            this.buySellRatiosFilter.item.splice(i, 1)
          }
        }
      }
    },
    updateLocationItemPriceListCopy () {
      // console.log('Home updateLocationItemPriceListCopy')
      if (this.saving) {
        //
        // We're saving new values.
        // Don't update with the soon to be old values.
        // Do hide any blank/0 valued items.
        //
        let i = this.locationItemPriceListCopy.length
        while (i--) {
          const itemPrice = this.locationItemPriceListCopy[i]
          // console.log('updateLocationItemPriceListCopy itemPrice', JSON.stringify(itemPrice))
          if ((itemPrice.priceSell === 0 || itemPrice.priceSell === undefined) &&
            (itemPrice.priceSell === 0 || itemPrice.priceSell === undefined)) {
            this.locationItemPriceListCopy.splice(i, 1)
          }
        }
        return
      }
      this.locationItemPriceListCopy.splice(0)
      let prices = this.locationItemPriceList
      // console.log('Home updateLocationItemPriceListCopy prices BEFORE', prices)
      if (prices && !this.editing) {
        const pricesDefined = prices.filter((price) => {
          return price.isPriceDefined
        })
        // console.log('Home updateLocationItemPriceListCopy pricesDefined', pricesDefined)
        if (pricesDefined.length > 0 || !this.userIsAuthenticated) {
          // console.log('Home updateLocationItemPriceListCopy A')
          prices = pricesDefined
        } else {
          // console.log('Home updateLocationItemPriceListCopy B')
        }
      } else {
        // console.log('Home updateLocationItemPriceListCopy C')
      }
      // console.log('Home updateLocationItemPriceListCopy prices AFTER', prices)
      if (prices) {
        prices.forEach(price => {
          const copy = Object.assign({}, price)
          this.locationItemPriceListCopy.push(copy)
        })
      }
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
          // console.log('Home saveLocation SUCCESS!')
          this.editing = false
          let message = 'Prices Saved.'
          if (result && result.mocked) {
            message = 'Mock ' + message
          }
          this.toastMessage({ message })
        })
        .catch(error => {
          // console.log('Home saveLocation ERROR', error)
          const toastMessage = error.message ? error.message : error
          this.toastMessage({ message: toastMessage })
        })
    }
  }
}
</script>

<style scoped>

.inputPrice >>> input {
  text-align: right;
  -moz-appearance:textfield;
}
.inputPrice >>> input::-webkit-outer-spin-button,
.inputPrice >>> input::-webkit-inner-spin-button {
  -webkit-appearance: none;
}

</style>
