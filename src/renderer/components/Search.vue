<template>
  <div id="wrapper">
    <menu-bar></menu-bar>
    <div id="contents" class="inner">
      <vs-alert vs-color="danger" vs-active="true">
        This hasn't been implemented yet. Sorry.
      </vs-alert>
      <!--
      <div class="search">
        <vs-row style="margin-bottom: .5rem">
          <vs-col vs-type="flex" vs-align="center" vs-w="2">
            <vs-select
              label="Type"
              v-model="select1">
              <vs-select-item :key="index" :vs-value="item.value" :vs-text="item.text" v-for="(item,index) in options1" />
            </vs-select>
          </vs-col>
          <vs-col vs-type="flex" vs-align="center" vs-w="10">
            <vs-input vs-label-placeholder="Search for.." v-model="search"/>
          </vs-col>
        </vs-row>
        <vs-row style="margin-bottom: 1rem">
          <vs-col vs-type="flex" vs-align="center" vs-w="12">
            <vs-switch/> Hide 0 replay users
          </vs-col>
        </vs-row>
        <vs-button vs-color="primary" vs-type="filled">Search</vs-button>
      </div>
      <div class="results">
        asd
      </div>
      -->
    </div>
    <foot-bar></foot-bar>
  </div>
</template>

<script>
  import MenuBar from './Windows/MenuBar'
  import FootBar from './Windows/FootBar'
  
  // const async = require('async')
  // const prettyDate = require('pretty-date')
  
  export default {
    name: 'search-page',
    components: { MenuBar, FootBar },
    data () {
      return {
        search: '',
        type: '',
        select1: 0,
        options1: [
          { text: 'Video ID', value: 0 },
          { text: 'Video URL', value: 1 },
          { text: 'User ID', value: 2 },
          { text: 'User Short ID', value: 3 },
          { text: 'Username', value: 4 },
          { text: 'Hashtag', value: 5 }
        ]
      }
    },
    methods: {
      showUser: function (user) {
        this.$electron.ipcRenderer.send('router.push', {
          path: `/profile/${user.uid}`
        })
      },
      openWindow: function (page, data = undefined) {
        this.$electron.ipcRenderer.send(`open-${page}`, data)
      }
    },
    created () {}
  }
</script>

<style lang="sass">
  @import 'static/app'

  #contents
    top: 2.75rem
    bottom: 2rem
    left: 0
    right: 0
    border: 0 solid $app
    border-left-width: 0.3rem
    border-right-width: 0.3rem
    background: rgba(250, 250, 250, .1)
    position: absolute
    overflow: auto

  .search
    width: calc(100% - .6rem)
    padding: 1rem
    background: rgba(250, 250, 250, .05)
    position: fixed
    .con-select
      width: calc(100% - .6rem)
    .vs-switch
      width: 8px
      vertical-align: top
      display: inline-block
      margin-right: .3rem
  
  .results
    margin-top: 9.1rem !important
    padding: .5rem

</style>
