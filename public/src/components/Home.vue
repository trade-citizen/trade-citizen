<template>
  <v-container>
    <v-layout>
      <v-flex xs12 sm6 offset-sm3>
        <v-card>
          <v-card-title primary-title>
            <ul class="mx-2">
              <li>Watch search text-field for changes:<br>
              Example: https://vuejs.org/v2/guide/computed.html#Watchers
              </li>
              <li>if empty, then show trade margins sorted highest to lowest</li>
              <li>if not empty
                <ul>
                  <li>if ambiguous (result > 1) then show list of trade consoles</li>
                  <li>if not ambiguous (result == 1) then show single trade console prices</li>
                </ul>
              </li>
            </ul>
          </v-card-title>
        </v-card>
      </v-flex>
    </v-layout>
  </v-container>
</template>
