<template>
  <div id="wrapper">
    <menu-bar></menu-bar>
    <div id="contents" class="inner">
      <div class="search">
        <vs-row style="margin-bottom: .5rem">
          <vs-col vs-type="flex" vs-align="center" vs-w="2">
            <vs-select
              label="Type"
              v-model="type">
              <vs-select-item :key="index" :vs-value="item.value" :vs-text="item.text" v-for="(item,index) in types" />
            </vs-select>
          </vs-col>
          <vs-col vs-type="flex" vs-align="center" vs-w="10">
            <vs-input vs-label-placeholder="Search for.." v-model="search"/>
          </vs-col>
        </vs-row>
        <!--
        <vs-row style="margin-bottom: 1rem">
          <vs-col vs-type="flex" vs-align="center" vs-w="12">
            <vs-switch/> Hide 0 replay users
          </vs-col>
        </vs-row>
        -->
        <vs-button vs-color="primary" vs-type="filled" @click="doSearch">Search</vs-button>
      </div>
      <div class="results">
        <ul class="users">
          <li v-for="user in list">
            <vs-avatar :src="user.user_info.face" class="avatar" @click="showUser(user.user_info)"/>
            <div class="title" :class="user.sex" @click="showUser(user.user_info)">{{ user.user_info.nickname }}</div>
            <vs-row class="text">
              <vs-col vs-type="flex" vs-w="3">
                ID: {{ user.user_info.uid }}
              </vs-col>
              <vs-col vs-type="flex" vs-w="3">
                Short ID: {{ user.user_info.short_id }}
              </vs-col>
              <vs-col vs-type="flex" vs-w="3">
                Level: {{ user.user_info.level }} ({{ user.user_info.countryCode }})
              </vs-col>
            </vs-row>
            <vs-button vs-color="dark" vs-type="filled" @click="showUser(user)">
              {{ Number(user.count_info.replay_count).toLocaleString() }} replays
            </vs-button>
            <vs-button vs-color="dark" vs-type="filled" @click="openWindow('followers', { user })">
              {{ Number(user.count_info.follower_count).toLocaleString() }} fans
            </vs-button>
            <vs-button vs-color="dark" vs-type="filled" @click="openWindow('followings', { user })">
              Following {{ Number(user.count_info.following_count).toLocaleString() }}
            </vs-button>
          </li>
        </ul>
      </div>
    </div>
    <foot-bar></foot-bar>
  </div>
</template>

<script>
  import MenuBar from './Windows/MenuBar'
  import FootBar from './Windows/FootBar'
  
  // const async = require('async')
  // const prettyDate = require('pretty-date')
  const lookup = require('../../main/search').default
  
  export default {
    name: 'search-page',
    components: { MenuBar, FootBar },
    data () {
      return {
        search: '',
        type: 'videoID',
        types: [
          { text: 'Video ID', value: 'videoID' },
          // { text: 'Video URL', value: 1 },
          { text: 'User ID', value: 'userID' },
          { text: 'User Short ID', value: 'shortID' },
          { text: 'Username', value: 'username' }
          // { text: 'Hashtag', value: 'hashtag' }
        ],
        results: []
      }
    },
    computed: {
      list: function () {
        return this.results
      }
    },
    methods: {
      doSearch: function () {
        console.log(lookup, this.type, this.search)
        lookup[this.type](this.search)
          .then(res => {
            switch (this.type) {
              case 'userID':
                this.showUser(res.user_info)
                break
              case 'shortID':
                this.showUser(res.user_info)
                break
              case 'videoID':
                this.showUser(res.user_info, {
                  highlight: this.search
                })
                break
              case 'username':
                this.results = res
                break
              case 'hashtag':
                this.results = res
            }
          })
          .catch(err => {
            console.log(err.msg)
          })
      },
      showUser: function (user, query = {}) {
        this.$electron.ipcRenderer.send('router.push', {
          path: `/profile/${user.uid}`,
          query
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
  @import '~@/assets/app'

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
    width: 100%
    padding: 1rem
    background: rgba(250, 250, 250, .05)
    .con-select
      width: calc(100% - .6rem)
    .vs-switch
      width: 8px
      vertical-align: top
      display: inline-block
      margin-right: .3rem
  
  .results
    margin-top: .5rem
    margin-bottom: 5rem

  ul.users
    list-style: none
    margin-top: 10px
    padding: 0
    li
      width: 100%
      margin-bottom: .5rem
      background: rgba(250, 250, 250, .1)
      border-bottom: 1px solid #444
      padding: .5rem .5rem
      padding-left: calc(64px + .5rem)
      position: relative
      border-radius: .3rem
      transition: .1s background
      &:hover
        background: rgba(250, 250, 250, .075)
        & .avatar
          // border-width: 0
      &.new
        background: rgba(0, 250, 0, .2)
        &:hover
          background: rgba(0, 250, 0, .15)
      .avatar
        width: 55px
        height: 55px
        background-size: contain
        background-repeat: no-repeat
        position: absolute
        left: .5rem
        top: 0
        bottom: 0
        margin: auto
        padding: 0
        cursor: pointer
        overflow: hidden
        border: .3rem solid #1a1a1a
        transition: .1s border
        img
          width: 100%
        &:hover + .title
          color: $tertiary
      .title
        color: #eaeaea
        font-weight: 400
        cursor: pointer
        display: inline
        &.male
          color: lightblue
        &.female
          color: $secondary
        &:hover
          color: $tertiary
      .text
        color: #eaeaea
        font-size: 1rem
        font-weight: 300
        line-height: 180%
      strong
        color: $tertiary
        margin-left: .2rem
        margin-bottom: .3rem
        font-weight: 400
      button
        font-size: .75rem
        padding: 5px 10px
</style>
