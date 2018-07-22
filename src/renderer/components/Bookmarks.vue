<template>
  <div id="wrapper">
    <menu-bar title="Bookmarks"></menu-bar>
    <div class="toolbar">
      <vs-button vs-color="dark" vs-type="filled" vs-icon="refresh" @click="fetchBookmarks()"></vs-button>
      <vs-button vs-color="dark" vs-type="filled" vs-icon="remove_red_eye" @click="toggleShowNew()"></vs-button>
      <vs-input placeholder="Search by name or ID" v-model="search" style="margin-left: 6rem; width: 60%"/>
    </div>
    <div id="contents">
      <ul class="bookmarks">
        <li v-for="user in list" :class="newReplayAvailable(user)">
          <vs-avatar :vs-src="user.face" class="avatar" @click="showUser(user)"/>
          <div class="title" :class="userSex(user)" @click="showUser(user)">{{ user.nickname }}</div>
          <vs-row class="text">
            <vs-col vs-type="flex" vs-w="7">
              Last stream <strong>{{ formatDate(user.newest_replay) }}</strong>
            </vs-col>
            <vs-col vs-type="flex" vs-w="5">
              Viewed <strong>{{ formatDate(user.last_viewed) }}</strong>
            </vs-col>
          </vs-row>
          <vs-button vs-color="dark" vs-type="filled" @click="showUser(user)">
            {{ Number(user.counts.replays).toLocaleString() }} replays
          </vs-button>
          <vs-button vs-color="dark" vs-type="filled" @click="openWindow('followers', { user })">
            {{ Number(user.counts.followers).toLocaleString() }} fans
          </vs-button>
          <vs-button vs-color="dark" vs-type="filled" @click="openWindow('followings', { user })">
            Following {{ Number(user.counts.followings).toLocaleString() }}
          </vs-button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
  import MenuBar from './Windows/SmallMenuBar'

  const prettyDate = require('pretty-date')

  export default {
    name: 'bookmarks',
    components: { MenuBar },
    data () {
      return {
        search: '',
        bookmarks: [],
        showOnlyNew: false
      }
    },
    computed: {
      list: function () {
        return this.bookmarks.filter((user) => {
          const search = this.search.toLowerCase()
          const showNew = ((user.newest_replay > user.last_viewed) || !this.showOnlyNew)

          if (!search) return showNew
          if (user.nickname.toLowerCase().indexOf(search) !== -1) return showNew && true
          if (user.uid && user.uid.indexOf(search) !== -1) return showNew && true
          if (user.shortid && user.shortid.indexOf(search) !== -1) return showNew && true

          return false
        })
      }
    },
    methods: {
      userSex: (user) => {
        if (user.sex === '-1') return ''
        return (user.sex === '0' || user.sex === 'female') ? 'female' : 'male'
      },
      formatDate: (timestamp) => {
        return prettyDate.format(new Date(timestamp * 1000))
      },
      newReplayAvailable: (user) => {
        return user.newest_replay > user.last_viewed ? 'new' : ''
      },
      fetchBookmarks: function () {
        this.$vs.loading({
          background: 'rgba(0, 0, 0, .5)'
        })
        const DataManager = this.$electron.remote.getGlobal('DataManager')
        this.showOnlyNew = false
        this.bookmarks = DataManager.getAllBookmarks()
        setTimeout(() => this.$vs.loading.close(), 1000)
      },
      toggleShowNew: function () {
        this.showOnlyNew = !this.showOnlyNew
      },
      showUser: function (user) {
        this.$electron.ipcRenderer.send('router.push', {
          path: `/profile/${user.uid}`
        })
      },
      openWindow: function (page, data = undefined) {
        this.$electron.ipcRenderer.send(`open-${page}`, data)
      }
    },
    created () {
      this.fetchBookmarks()
    }
  }
</script>

<style lang="sass">
  @import 'static/app'

  #contents
    top: 5rem
    bottom: 0
    left: 0
    right: 0
    border: .3rem solid $app
    border-top-width: 0
    background: rgba(250, 250, 250, .1)
    position: absolute
    overflow: auto
  .toolbar
    width: 100%
    background: $app
    padding: .5rem
    button
      margin-right: .3rem
      &:last-child
        margin-right: 1rem

  ul.bookmarks
    list-style: none
    margin-top: 10px
    padding: 0 .5rem
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
        font-size: .8rem
        font-weight: 300
      strong
        color: $tertiary
        margin-left: .2rem
        margin-bottom: .3rem
        font-weight: 400
      button
        font-size: .75rem
        padding: 5px 10px
</style>
