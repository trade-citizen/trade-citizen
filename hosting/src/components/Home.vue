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
      <v-select
        v-if="FEATURE_FILTER_ANCHOR"
        label="Buy Anchor"
        clearable
        multiple
        single-line
        hide-details
        hide-selected
        dense
        :items="anchors"
        v-model="buySellRatiosFilter.anchorsBuy"
        item-value="id"
        item-text="name"
        return-object
        >
      </v-select>
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
        v-if="FEATURE_FILTER_ANCHOR"
        label="Sell Anchor"
        clearable
        multiple
        single-line
        hide-details
        hide-selected
        dense
        :items="anchors"
        v-model="buySellRatiosFilter.anchorsSell"
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
    </v-layout>
    <v-layout row d-flex>
      <!--
        NOTE: pagination.sync is needed to define non-default sort column
      -->
      <v-data-table
        class="elevation-1"
        must-sort
        sort-icon="arrow_downward"
        :hide-actions="!hasBuySellRatios"
        :no-data-text="hasBuySellRatios ? 'No data available' : 'Loading...'"
        :headers="headers"
        :pagination.sync="buySellRatiosPagination"
        :rows-per-page-items="buySellRatiosPagination.rowsPerPageItems"
        rows-per-page-text="Max Results"
        :items="buySellRatiosFiltered"
        >
        <template slot="items" slot-scope="props">
          <td class="text-xs-right">{{ props.item.itemName }}</td>
          <td class="text-xs-right"
            v-if="FEATURE_FILTER_ANCHOR"
            >
            {{ props.item.buyAnchorName }}
          </td>
          <td class="text-xs-right">
            <router-link :to="getLocationRoute(props.item.buyLocationId)">
              {{ props.item.buyLocationName }}
            </router-link>
          </td>
          <td class="text-xs-right">
            <router-link :to="getLocationRoute(props.item.buyLocationId, props.item.itemId)">
              <v-tooltip bottom>
                <span slot="activator">{{ props.item.buyPrice.toFixed(3) }}</span>
                <span>{{ formatDateYMDHMS(props.item.buyTimestamp) }}</span>
              </v-tooltip>
            </router-link>
          </td>
          <td class="text-xs-center">{{ props.item.ratio.toFixed(3) }}</td>
          <td class="text-xs-left">
            <router-link :to="getLocationRoute(props.item.sellLocationId, props.item.itemId)">
              <v-tooltip bottom>
                <span slot="activator">{{ props.item.sellPrice.toFixed(3) }}</span>
                <span>{{ formatDateYMDHMS(props.item.sellTimestamp) }}</span>
              </v-tooltip>
            </router-link>
          </td>
          <td class="text-xs-left"
            v-if="FEATURE_FILTER_ANCHOR"
            >
            {{ props.item.sellAnchorName }}
          </td>
          <td class="text-xs-left">
            <router-link :to="getLocationRoute(props.item.sellLocationId)">
              {{ props.item.sellLocationName }}
            </router-link>
          </td>
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
      v-if="initialized && locationItemPriceListCopy.length"
      row wrap
      class="pa-2"
      >
      <v-flex
        xs4
        v-for="(locationItemPrice, index) in locationItemPriceListCopy"
        :key="locationItemPrice.id"
        >
        <v-card
          :style="getItemBorder()"
          :id="locationItemPrice.id"
          >
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
                  :disabled="!saveable"
                  :clearable="saveable"
                  :clearValue="locationItemPrice.priceBuy === 0 ? null : 0"
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
                  :disabled="!saveable"
                  :clearable="saveable"
                  :clearValue="locationItemPrice.priceSell === 0 ? null : 0"
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
      <p class="pa-4">{{ initialized ? 'No prices set' : 'Loading...' }}</p>
    </v-layout>
  </v-container>
</template>

<script>

import { mapGetters, mapState } from 'vuex'
import * as utils from '../utils'

// TODO:(pv) When ready for production, remove FEATURE_FILTER_ANCHOR and consolidate HEADERS direcly in to data
const FEATURE_FILTER_ANCHOR = false
const HEADERS = []
HEADERS.push({ sortable: true, align: 'right', text: 'Item', value: 'itemName' })
if (FEATURE_FILTER_ANCHOR) {
  HEADERS.push({ sortable: true, align: 'right', text: 'Buy Anchor', value: 'buyAnchorName' })
}
HEADERS.push({ sortable: true, align: 'right', text: 'Buy Location', value: 'buyLocationName' })
HEADERS.push({ sortable: true, align: 'right', text: 'Buy Price', value: 'buyPrice' })
HEADERS.push({ sortable: true, align: 'center', text: 'Ratio', value: 'ratio' })
HEADERS.push({ sortable: true, align: 'left', text: 'Sell Price', value: 'sellPrice' })
if (FEATURE_FILTER_ANCHOR) {
  HEADERS.push({ sortable: true, align: 'left', text: 'Sell Anchor', value: 'sellAnchorName' })
}
HEADERS.push({ sortable: true, align: 'left', text: 'Sell Location', value: 'sellLocationName' })

export default {
  data () {
    return {
      FEATURE_FILTER_ANCHOR: FEATURE_FILTER_ANCHOR,
      headers: HEADERS,
      buySellRatiosFilter: Object.assign({}, this.$store.getters.buySellRatiosFilter),
      buySellRatiosPagination: Object.assign({}, this.$store.getters.buySellRatiosPagination),
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
      initialized: state => state.tradeinfo.initialized,
      saving: state => state.tradeinfo.saving,
      buySellRatiosFiltered: state => state.tradeinfo.buySellRatiosFiltered
    }),
    ...mapGetters([
      'userIsAuthenticated',
      'saveable',
      'hasBuySellRatios'
    ]),
    locationId: {
      get: function () {
        // Example(s):
        //  http://localhost:8080/?locationId=zsrxhjHzhfXxUCPs73EF
        const locationId = this.$route.query.locationId
        // console.log('Home locationId this.$route.query.locationId', locationId)
        return locationId
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
    anchors () {
      return this.$store.getters.anchors
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
    locationId: {
      handler () {
        // console.log('Home watch locationId')
        this.editing = false
      }
    },
    buySellRatiosPagination: {
      deep: true,
      handler (value) {
        this.$store.dispatch('setBuySellRatiosPagination', value)
      }
    },
    buySellRatiosFilter: {
      deep: true,
      handler (value) {
        this.$store.dispatch('setBuySellRatiosFilter', value)
      }
    },
    locationItemPriceList: {
      deep: true,
      handler () {
        // console.log('Home watch locationItemPriceList')
        this.updateLocationItemPriceListCopy()
      }
    },
    editing: {
      handler () {
        // console.log('Home watch editing')
        this.updateLocationItemPriceListCopy()
      }
    }
  },

  methods: {
    getLocationRoute (locationId, itemId) {
      let path = '/'
      const query = {}
      if (locationId) {
        query.locationId = locationId
      }
      if (itemId) {
        path += `#${itemId}`
      }
      const route = { path, query }
      // console.log('getLocationRoute locationId', locationId, 'itemId', itemId, 'route', route)
      return route
    },
    getItemBorder () {
      return 'border:1px solid white; border-radius:6px;'
    },
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
        // console.log('Home updateLocationItemPriceListCopy saving')
        //
        // We're saving new values.
        // Don't update with the soon to be old values.
        // Do hide any blank/0 valued items.
        //
        let i = this.locationItemPriceListCopy.length
        // console.log('Home updateLocationItemPriceListCopy this.locationItemPriceListCopy.length', i)
        while (i--) {
          const itemPrice = this.locationItemPriceListCopy[i]
          // console.log('updateLocationItemPriceListCopy itemPrice', JSON.stringify(itemPrice))
          if ((itemPrice.priceBuy === 0 || itemPrice.priceBuy === undefined) &&
            (itemPrice.priceSell === 0 || itemPrice.priceSell === undefined)) {
            this.locationItemPriceListCopy.splice(i, 1)
          }
        }
      } else {
        // console.log('Home updateLocationItemPriceListCopy *NOT* saving')
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
      }
      // console.log('Home updateLocationItemPriceListCopy AFTER this.locationItemPriceListCopy', JSON.stringify(this.locationItemPriceListCopy))
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
