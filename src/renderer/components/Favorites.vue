<template>
  <div id="wrapper">
    <menu-bar :title="name + ' ' + type"></menu-bar>
    <div class="toolbar">
      <vs-button vs-color="dark" vs-type="filled" vs-icon="remove_red_eye" @click="toggleShowNew()"></vs-button>
      <vs-input placeholder="Search by name or ID" v-model="search" style="margin-left: 6rem; width: 60%"/>
    </div>
    <div id="contents">
      <ul class="favorites">
        <li v-for="user in list" :class="user.viewedNow ? 'active' : ''">
          <vs-avatar :vs-src="user.user_info.face" class="avatar" @click="showUser(user.user_info)"/>
          <div class="title" :class="userSex(user.user_info)" @click="showUser(user.user_info)">{{ user.user_info.nickname }}
            <vs-chip vs-color="danger" v-if="user.user_info.isAdmin !== '0'">Admin</vs-chip>
            <vs-chip vs-color="warning" v-if="user.user_info.isVIP !== '0'">VIP</vs-chip>
          </div>
          <div class="states">
            <i class="material-icons" :class="user.bookmarked ? 'red' : ''">favorite</i>
            <i class="material-icons" :class="user.viewed ? 'blue' : ''">remove_red_eye</i>
          </div>
          <vs-row class="text">
            <vs-col vs-type="flex" vs-w="6">
              ID: <strong>{{ user.user_info.uid }}</strong>
            </vs-col>
            <vs-col vs-type="flex" vs-w="6">
              Short ID: <strong>{{ user.user_info.short_id }}</strong>
            </vs-col>
            <vs-col vs-type="flex" vs-w="4">
              Country: <strong>{{ user.user_info.countryCode }}</strong>
            </vs-col>
            <vs-col vs-type="flex" vs-w="4">
              Level: <strong>{{ user.user_info.level }}</strong>
            </vs-col>
            <vs-col vs-type="flex" vs-w="4">
              Status: <strong>{{ user.user_info.status }}</strong>
            </vs-col>
          </vs-row>
          <vs-button vs-color="dark" vs-type="filled" @click="showUser(user.user_info)">
            {{ Number(user.count_info.replay_count).toLocaleString() }} replays
          </vs-button>
          <vs-button vs-color="dark" vs-type="filled" @click="openWindow('followers', { user: user.user_info })">
            {{ Number(user.count_info.follower_count).toLocaleString() }} fans
          </vs-button>
          <vs-button vs-color="dark" vs-type="filled" @click="openWindow('followings', { user: user.user_info })">
            Following {{ Number(user.count_info.following_count).toLocaleString() }}
          </vs-button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
  import MenuBar from './Windows/SmallMenuBar'

  const async = require('async')

  export default {
    name: 'favorites',
    components: { MenuBar },
    data () {
      return {
        search: '',
        name: '',
        type: false,
        favorites: [],
        currentFavoritesPage: 1,
        maxFavoritesPerPage: 50
      }
    },
    computed: {
      list: function () {
        return this.favorites
      }
    },
    methods: {
      userSex: (user) => {
        if (user.sex === '-1') return ''
        return (user.sex === '0' || user.sex === 'female') ? 'female' : 'male'
      },
      showUser: function (user) {
        this.markUserSeen(user)
        this.$electron.ipcRenderer.send('router.push', {
          path: `/profile/${user.uid}`
        })
      },
      markUserSeen: function (user) {
        for (const i in this.favorites) {
          if (this.favorites[i].user_info.uid === user.uid) {
            this.favorites[i].viewed = true
            this.favorites[i].viewedNow = true
            console.log(this.favorites[i].user_info.uid, user.uid)
            break
          }
        }
      },
      getFavorites: function () {
        const Liveme = this.$electron.remote.getGlobal('Liveme')
        const DataManager = this.$electron.remote.getGlobal('DataManager')

        this.$vs.loading({
          background: 'rgba(0, 0, 0, .5)'
        })

        Liveme[`get${this.type}`](this.$route.params.id, this.currentFavoritesPage, this.maxFavoritesPerPage)
          .then(results => {
            const data = []
            async.eachLimit(results, 20, (result, next) => {
              Liveme.getUserInfo(result.uid)
                .then(user => {
                  user.viewed = DataManager.wasProfileViewed(user.user_info.uid)
                  user.viewedNow = false
                  user.bookmarked = DataManager.isBookmarked(user.user_info)
                  data.push(user)
                  next()
                })
                .catch(err => {
                  console.log(err)
                  next()
                })
            }, () => {
              this.favorites.push(...data)
              this.$vs.loading.close()
            })
          })
          .catch(err => {
            console.log(err)
            this.$vs.loading.close()
          })
      },
      openWindow: function (page, data = undefined) {
        this.$electron.ipcRenderer.send(`open-${page}`, data)
      }
    },
    created () {
      this.name = this.$route.query.name
      this.type = this.$route.query.type

      this.getFavorites()
    }
  }
</script>

<style lang="sass">
  @import '~@/assets/app'

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

  ul.favorites
    list-style: none
    margin-top: 10px
    padding: 0 .5rem
    li
      width: 100%
      margin-bottom: .5rem
      background: rgba(250, 250, 250, .1)
      border-bottom: 1px solid #444
      padding: .5rem
      padding-left: calc(64px + .5rem)
      position: relative
      border-radius: .3rem
      transition: .1s background
      &:hover
        background: rgba(250, 250, 250, .075)
        & .avatar
          // border-width: 0
      &.active
        opacity: .75
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
        .vs-chip
          padding: 0 5px
      .states
        position: absolute
        right: .5rem
        top: .5rem
        .material-icons
          opacity: .2
          font-size: 1rem
          margin-left: .1rem
          vertical-align: middle
          &.red
            color: red
            opacity: .7
          &.blue
            color: lightblue
            opacity: .7
      .text
        color: #eaeaea
        font-size: .8rem
        font-weight: 300
        margin: .3rem 0
      strong
        color: $tertiary
        margin-left: .2rem
        font-weight: 400
      button
        font-size: .75rem
        padding: 5px 10px
</style>
