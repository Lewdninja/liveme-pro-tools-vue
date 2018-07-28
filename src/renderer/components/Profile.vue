<template>
  <div id="wrapper">
    <menu-bar></menu-bar>
    <div id="contents" v-if="user.user_info">
      <header>
        <div class="backdrop" :style="'background-image:url(' + user.user_info.big_cover + ')'"></div>
        <vs-avatar :vs-src="user.user_info.face" class="avatar"/>
        <section class="meta">
          <div class="title">{{ user.user_info.nickname }}</div>
          <div class="actions">
            <vs-button vs-color="rgba(250, 250, 250, .1)" vs-type="filled" vs-icon="refresh" @click="getUserInfo">Refresh</vs-button>
            <vs-button vs-color="danger" vs-type="filled" :vs-icon="this.bookmark ? 'favorite' : 'favorite_border'" @click="toggleBookmark">
              <span v-if="this.bookmark">Remove from Bookmarks</span>
              <span v-else>Add to Bookmarks</span>
            </vs-button>
          </div>
          <div class="chips">
            <vs-chip vs-color="rgb(200, 200, 200)"><strong>Level:</strong> {{ user.user_info.level }}</vs-chip>
            <vs-chip vs-color="rgb(200, 200, 200)"><strong>Country:</strong> {{ user.user_info.countryCode }}</vs-chip>
            <vs-chip vs-color="rgb(200, 200, 200)"><strong>ID:</strong> {{ user.user_info.uid }}</vs-chip>
            <vs-chip vs-color="rgb(200, 200, 200)"><strong>Short ID:</strong> {{ user.user_info.short_id }}</vs-chip>
          </div>
          <div class="usign" v-html="user.user_info.usign.replace(/(?:\r\n|\r|\n)/g, '<br>')" v-if="user.user_info.usign"></div>
          <div class="favorites">
            <vs-button vs-color="dark" vs-type="filled" @click="openWindow('followers', { user: user.user_info })">{{ Number(user.count_info.follower_count).toLocaleString() }} fans</vs-button>
            <vs-button vs-color="dark" vs-type="filled" @click="openWindow('followings', { user: user.user_info })">Following {{ Number(user.count_info.following_count).toLocaleString() }}</vs-button>
          </div>
        </section>
      </header>
      <vue-good-table
        :columns="columns"
        :rows="rows"
        styleClass="vgt-table condensed striped" v-if="rows.length">
        <template slot="table-row" slot-scope="props">
          <span v-if="props.column.field === 'state'">
            <i class="material-icons" :class="props.row.watched ? 'green' : ''">remove_red_eye</i>
            <i class="material-icons" :class="props.row.downloaded ? 'blue' : ''">cloud_download</i>
          </span>
          <span v-else-if="props.column.field === 'title'">
            <a href="#" @click.prevent="openWindow('player', { videoid: props.row.vid }, props.index)" title="Watch replay">
              <i class="material-icons">play_circle_outline</i> {{ props.row.title }}
              <span v-if="props.row.live" class="live" title="Currently Live">
                <i class="material-icons" title="Live">live_tv</i> LIVE
              </span>
            </a>
          </span>
          <span v-else-if="props.column.field !== 'actions'">
            {{ props.formattedRow[props.column.field] }}
          </span>
          <span v-else>
            <a href="#" class="btn" title="View more options" @click="showReplayDetails(props.row)">
              <i class="material-icons">more_horiz</i>
            </a>
            <a href="#" class="btn" title="View replay comment feed" @click="openWindow('comments', { vtime: props.row.vtime, msgfile: props.row.msgfile })">
              <i class="material-icons">comment</i>
            </a>
            <a href="#" class="btn" title="Download replay" @click="addToQueue(props.row)">
              <i class="material-icons">cloud_download</i>
            </a>
          </span>
        </template>
      </vue-good-table>
      <div class="inner" v-else>
        <vs-alert vs-color="success" vs-active="true" vs-icon="error" v-if="!rows.length && !replaysLoaded && !notAuthenticated">
          Loading replays please wait.. If this is taking too long try again.
        </vs-alert>
        <vs-alert vs-color="danger" vs-active="true" vs-icon="error" v-if="!rows.length && replaysLoaded">
          There are no replays available.
        </vs-alert>
        <vs-alert vs-color="danger" vs-active="true" vs-icon="error" v-if="notAuthenticated">
          You are not logged in. Replays could not be loaded, please authenticate and try again.
        </vs-alert>
      </div>
    </div>
    <profile-details 
      :replay="replayDetails"
      :visible="replayDetailsVisible"
      @closeDetails="replayDetailsVisible = false"></profile-details>
    <foot-bar></foot-bar>
  </div>
</template>

<script>
  import MenuBar from './Windows/MenuBar'
  import FootBar from './Windows/FootBar'
  import ProfileDetails from './Profile/Details'

  const format = require('format-duration')

  export default {
    name: 'profile-page',
    components: { MenuBar, FootBar, ProfileDetails },
    data () {
      return {
        user: false,
        bookmark: false,
        notAuthenticated: false,
        replaysLoaded: false,
        currentReplayPage: 1,
        maxReplaysPerPage: 10,
        columns: [
          {
            field: 'state',
            html: true,
            sortable: false
          },
          {
            label: 'Title',
            field: 'title'
          },
          {
            label: 'Date',
            field: 'vtime',
            type: 'number',
            formatFn: this.date
          },
          {
            label: 'Length',
            field: 'videolength',
            type: 'number',
            formatFn: this.duration
          },
          {
            label: 'Views',
            field: 'playnumber',
            type: 'number',
            formatFn: this.number
          },
          {
            label: 'Likes',
            field: 'likenum',
            type: 'number',
            formatFn: this.number
          },
          {
            label: 'Shares',
            field: 'sharenum',
            type: 'number',
            formatFn: this.number
          },
          {
            field: 'actions',
            type: 'number',
            html: true,
            sortable: false
          }
        ],
        rows: [],
        replayDetails: {},
        replayDetailsVisible: false
      }
    },
    methods: {
      number: (value) => {
        return Number(value).toLocaleString()
      },
      date: (value) => {
        const date = new Date(Number(value) * 1000)
        // I would love to use `toLocaleString` or any other formatting
        // but apparently that makes the UI stutter. This has better performance.
        return date.toUTCString().split(', ')[1].replace(' GMT', '')
      },
      duration: (value) => {
        return format(Number(value) * 1000)
      },
      toggleBookmark: function () {
        const DataManager = this.$electron.remote.getGlobal('DataManager')
        if (DataManager.isBookmarked(this.user.user_info)) {
          this.bookmark = false
          DataManager.removeBookmark(this.user.user_info)
        } else {
          DataManager.addBookmark(this.user)
          this.bookmark = DataManager.getSingleBookmark(this.user.user_info.uid)
        }
      },
      getUserInfo: function () {
        const Liveme = this.$electron.remote.getGlobal('Liveme')
        const DataManager = this.$electron.remote.getGlobal('DataManager')
        // TODO: If ID is missing or request fails display an error
        this.$vs.loading({
          background: 'rgba(0, 0, 0, .5)'
        })
        this.clearReplays()
        Liveme.getUserInfo(this.$route.params.id)
          .then(user => {
            this.bookmark = DataManager.getSingleBookmark(user.user_info.uid)
            if (this.bookmark) {
              this.bookmark.last_viewed = Math.floor(new Date().getTime() / 1000)
              DataManager.updateBookmark(this.bookmark)
            }
            DataManager.addViewed(user.user_info.uid)

            this.user = user
            this.$vs.loading.close()

            this.clearReplays()
            this.getUserReplays()
          })
          .catch(err => {
            console.log(JSON.stringify(err))
            this.$vs.loading.close()
          })
      },
      getUserReplays: function (retries) {
        const Liveme = this.$electron.remote.getGlobal('Liveme')
        const DataManager = this.$electron.remote.getGlobal('DataManager')

        if (retries === undefined) retries = 10

        this.notAuthenticated = false
        if (!Liveme.user) {
          this.notAuthenticated = true
          return setTimeout(() => this.getUsersReplays(), 5000)
        }

        Liveme.getUserReplays(this.user.user_info.uid, this.currentReplayPage, this.maxReplaysPerPage)
          .then(replays => {
            if (replays && replays.length && replays[0].userid === this.user.user_info.uid) {
              for (const replay of replays) {
                this.rows.push({
                  expire_time: replay.expire_time,
                  hlsvideosource: replay.hlsvideosource,
                  msgfile: replay.msgfile,
                  playnumber: replay.playnumber,
                  sharenum: replay.sharenum,
                  title: replay.title,
                  vid: replay.vid,
                  videolength: replay.videolength,
                  videosource: replay.videosource,
                  watchnumber: replay.watchnumber,
                  likenum: replay.likenum,
                  vtime: replay.vtime,
                  downloaded: DataManager.wasDownloaded(replay.vid),
                  watched: DataManager.wasWatched(replay.vid),
                  live: (replay.hlsvideosource.endsWith('flv') || replay.hlsvideosource.indexOf('liveplay') > 0)
                })
              }
            }
            // Update if bookmarked
            if (this.currentReplayPage === 1 && this.bookmark && this.rows.length) {
              this.bookmark.newest_replay = Number(this.rows[0].vtime)
              DataManager.updateBookmark(this.bookmark)
            }
            // Check if more replays to load
            if (replays.length === this.maxReplaysPerPage) {
              this.currentReplayPage += 1
              this.getUserReplays()
            } else {
              this.replaysLoaded = true
              if (this.bookmark) {
                this.bookmark.counts.replays = this.rows.length
                DataManager.updateBookmark(this.bookmark)
              }
            }
          })
          .catch(err => {
            if (typeof err.response.body === 'string') {
              const json = JSON.parse(err.response.body)
              console.log(json)
            }
            if (retries) {
              return setTimeout(() => this.getUserReplays(retries - 1), 100)
            }
            this.replaysLoaded = true
          })
      },
      clearReplays: function () {
        this.replaysLoaded = false
        this.rows = []
        this.currentReplayPage = 1
        this.replayDetails = {}
        this.replayDetailsVisible = false
      },
      showReplayDetails: function (replay) {
        this.replayDetails = replay
        this.replayDetailsVisible = true
      },
      addToQueue: function (video) {
        video.downloaded = true
        this.$store.commit('addDownload', {
          ...video,
          uname: this.user.user_info.nickname
        })
        // Notify the user that it's been added to the queue
        this.$vs.notify({
          title: this.user.user_info.nickname,
          text: `${video.vid} has been added to the download queue.`,
          color: 'success'
        })
      },
      openWindow: function (page, data = undefined, item) {
        // If watching a replay
        if (page === 'player') {
          this.rows[item].watched = true
        }
        this.$electron.ipcRenderer.send(`open-${page}`, data)
      }
    },
    watch: {
      '$route': 'getUserInfo'
    },
    created () {
      this.getUserInfo()
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
    width: 100%
    height: auto
    margin-top: -1rem
    overflow: auto
  
  header
    width: calc(100% - 1rem)
    margin: .5rem
    padding: .6rem .5rem
    border-radius: .3rem
    border-bottom: 1px solid #444
    background: $app
    position: relative
    .backdrop
      width: 100%
      height: 100%
      left: 0
      top: 0
      position: absolute
      background-position: center
      background-repeat: no-repeat
      background-size: 100%
      border-radius: .3rem
      opacity: .2
      &:before
        content: ''
        position: absolute
        width: 100%
        height: 100%
        background-image: linear-gradient(to top , rgba(0, 0, 0, .5), transparent)
    .meta
      display: inline-block
      width: calc(100% - 140px)
      min-height: 8rem
      margin-left: .5rem
      position: relative
      z-index: 1
      vertical-align: top
      .actions
        position: absolute
        top: 0
        right: 0
        button
          margin-left: .5rem
    .avatar
      width: 128px
      height: 128px
      margin: 0
      cursor: default
      border: .3rem solid $app
      display: inline-block
      vertical-align: top
      img
        width: 100%
    .title
      color: $secondary
      font-size: 2rem
      font-weight: 400
      margin-right: .5rem
    .chips
      margin-bottom: .5rem
    .usign
      display: inline-block
      max-width: 75%
      font-size: .8rem
      padding: 5px 10px
      background: #1a1a1a
      border-radius: .3rem
    strong
      font-weight: 700
    .favorites
      position: absolute
      bottom: 0
      right: 0

  .vgt-wrap
    // padding: 0 .5rem
    .vgt-inner-wrap
      // border-radius: .3rem
      overflow: hidden
      .vgt-table 
        border: 0
        background: rgba(250, 250, 250, .05)
        &.striped
          tr:nth-of-type(odd)
            background: rgba(0, 0, 0, .2)
        td
          color: #eaeaea
          border-bottom-color: rgba(0, 0, 0, .2)
          &:first-child
            .material-icons
              opacity: .2
              &:last-child
                margin-right: -1rem
          .material-icons
            font-size: 1rem
            margin-right: .1rem
            vertical-align: middle
            opacity: .5
            &.green
              color: lightgreen
              opacity: .7
            &.blue
              color: lightblue
              opacity: .7
          .live
            color: red
            font-weight: 700
            .material-icons
              margin: 0
              margin-left: .3rem
              vertical-align: top
          a
            color: #fff
            &:hover
              color: $tertiary
            &.btn
              padding: 1px 3px
              background: rgba(250, 250, 250, .1)
              border-radius: .3rem
              margin-left: .1rem
              &:first-child
                margin: 0
              &:hover
                background: rgba(250, 250, 250, .15)
        thead th
          color: $tertiary
          background: $app
          border: 0
          &.sorting:after
            border-bottom-color: $tertiary
          &.sorting-desc:after
            border-top-color: $tertiary
</style>
