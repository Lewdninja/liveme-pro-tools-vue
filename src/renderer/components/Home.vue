<template>
  <div id="wrapper">
    <menu-bar></menu-bar>
    <div id="contents">
      <vs-row>
        <vs-col vs-type="flex" vs-align="top" vs-w="8">
          <div class="inner">
            <h1>New Replays</h1>
            <vs-alert vs-color="warning" vs-active="true" vs-icon="info" v-if="checkingBookmarks">
              Checking your bookmarks for new replays. This might take a while, please wait!
            </vs-alert>
            <div class="progress-bar" v-if="checkingBookmarks">
              <div class="line" :style="'width:' + bookmarkProgress + '%'"></div>
            </div>
            <ul class="bookmark-replays" v-if="newReplays.length">
              <li v-for="user in newReplays">
                <vs-avatar :vs-src="user.face" :vs-badge="user.newReplays" class="avatar"/>
                <router-link :to="'/profile/' + user.uid" class="title">{{ user.nickname }}</router-link>
                <div class="text">Latest replay ended {{ user.latestReplay }}.</div>
                <div class="buttons">
                  <vs-button vs-color="warning" vs-type="flat" vs-icon="play_arrow" @click="openWindow('player', { videoid: user.latestReplayVid })">Play Replay</vs-button>
                  <vs-button vs-color="warning" vs-type="flat" vs-icon="person" @click="showUser(user)">Profile</vs-button>
                </div>
              </li>
            </ul>
            <vs-alert vs-color="success" vs-active="true" vs-icon="check_circle" v-if="!newReplays.length && !checkingBookmarks">
              There's no new replays available. You're all caught up!
            </vs-alert>
          </div>
        </vs-col>
        <vs-col vs-type="flex" vs-align="top" vs-w="4">
          <div class="inner">
            <ul class="feed">
              <li v-for="post in feed">
                <div class="title">{{ post.title }}
                  <span class="date">{{ post.date }}</span>
                </div>
                <div class="body">{{ post.body }}</div>
              </li>
            </ul>
          </div>
        </vs-col>
      </vs-row>
    </div>
    <foot-bar></foot-bar>
  </div>
</template>

<script>
  import MenuBar from './Windows/MenuBar'
  import FootBar from './Windows/FootBar'
  
  const async = require('async')
  const prettyDate = require('pretty-date')
  
  export default {
    name: 'home-page',
    components: { MenuBar, FootBar },
    data () {
      return {
        newReplays: [],
        checkingBookmarks: false,
        bookmarkProgress: 0,
        feed: [
          {
            title: 'New Developer',
            date: '2018-04-23',
            body: 'TheCoder has stepped down from maintaining Liveme Tools. Lewdninja is the new maintainer. You can support him on https://patreon.com/lewdninja'
          },
          {
            title: 'Authentication Required',
            date: '2018-04-21',
            body: 'Live.me updated their API. To see replays you have to authenticate yourself by opening settings.'
          },
          {
            title: 'Missing Replays',
            date: '2018-02-10',
            body: 'Even though it may say there\'s replays available, sometimes they are marked hidden and therefore are not visible.'
          }
        ]
      }
    },
    methods: {
      checkBookmarks: function () {
        const Liveme = this.$electron.remote.getGlobal('Liveme')
        const DataManager = this.$electron.remote.getGlobal('DataManager')

        if (!Liveme.user) return setTimeout(() => this.checkBookmarks(), 5000)
        this.checkingBookmarks = true

        const bookmarks = DataManager.getAllBookmarks()
        let count = 0

        async.eachLimit(bookmarks, 5, (bookmark, next) => {
          Liveme.getUserInfo(bookmark.uid)
            .then(user => {
              if (user === undefined) return next()

              const db = DataManager.getSingleBookmark(user.user_info.uid)

              db.counts.replays = user.count_info.video_count
              db.counts.friends = user.count_info.friends_count
              db.counts.followers = user.count_info.follower_count
              db.counts.followings = user.count_info.following_count
              db.signature = user.user_info.usign
              db.sex = user.user_info.sex
              db.face = user.user_info.face
              db.nickname = user.user_info.uname
              db.shortid = user.user_info.short_id
              // Update saved bookmark data
              DataManager.updateBookmark(db)

              if (db.counts.replays > 0) {
                this.checkReplays(user, db, () => next())
              } else {
                next()
              }
              // Update progress bar
              count++
              this.bookmarkProgress = Number(Math.round((count / bookmarks.length) * 100))
            })
            .catch(err => {
              console.log('Error', new Date(), err)
            })
        }, () => {
          this.bookmarkProgress = 0
          this.checkingBookmarks = false
        })
      },
      checkReplays: function (user, bookmark, callback) {
        const Liveme = this.$electron.remote.getGlobal('Liveme')
        const DataManager = this.$electron.remote.getGlobal('DataManager')

        Liveme.getUserReplays(user.user_info.uid, 1)
          .then(replays => {
            if (replays === undefined || replays.length < 0) return callback()

            const data = {
              ...bookmark,
              newReplays: 0,
              latestReplay: null,
              latestReplayVid: null,
              lastViewed: null
            }

            for (const replay of replays) {
              if (replay.vtime - bookmark.newest_replay > 0) {
                data.newReplays++
              }
            }

            if (data.newReplays) {
              data.latestReplay = prettyDate.format(new Date(replays[0].vtime * 1000))
              data.latestReplayVid = replays[0].vid
              data.lastViewed = prettyDate.format(new Date(bookmark.last_viewed * 1000))

              bookmark.newest_replay = Math.floor(replays[0].vtime)
              DataManager.updateBookmark(bookmark)

              this.newReplays.push(data)
            }
            callback()
          })
          .catch(err => {
            console.log(err)
            callback()
          })
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
      this.checkBookmarks()
    }
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

  .inner
    padding: .5rem
    height: 100%
    width: 100%
    margin: 0 !important 
    overflow: auto
  
  .progress-bar
    width: 100%
    height: 6px
    border-radius: 18px
    background: rgba(0, 250, 0, .1)
    position: relative
    overflow: hidden
    .line
      width: 0%
      height: 6px
      background: green
      border-radius: 18px
      transition: .5s all ease

  ul.bookmark-replays
    list-style: none
    margin-top: 10px
    li
      width: 100%
      height: 64px
      margin-bottom: .5rem
      background: rgba(250, 250, 250, .1)
      border-bottom: 1px solid #444
      padding: .6rem .5rem
      padding-left: calc(64px + .5rem)
      position: relative
      border-radius: 1rem
      border-top-left-radius: 64px
      border-bottom-left-radius: 64px
      transition: .1s background
      &:hover
        background: rgba(250, 250, 250, .075)
      .avatar
        width: 64px
        height: 64px
        position: absolute
        left: 0
        top: 0
        margin: 0
        padding: 0
        border-radius: 80px
        border: .3rem solid #1a1a1a
        cursor: pointer
        img
          width: 100%
        &:hover + .title
          color: $tertiary
      .title
        color: $secondary
        font-weight: 400
        cursor: pointer
        display: inline
        &:hover
          color: $tertiary
      .text
        color: #eaeaea
        font-size: 1rem
        font-weight: 300
      .buttons
        top: .9rem
        right: 1rem
        position: absolute
      .con-vs-avatar .dot-count.badgeNumber
        font-size: .825rem
        

  ul.feed
    list-style: none
    li
      margin-bottom: .5rem
      background: rgba(250, 250, 250, .03)
      padding: .3rem .5rem
      border-radius: .3rem
      position: relative
      .title
        color: $primary
        font-weight: 700
        .date
          color: rgba(250, 250, 250, .25)
          font-weight: 300
          font-style: italic
          position: absolute
          right: .5rem
      .body
        font-size: .9rem
        font-weight: 300
</style>
