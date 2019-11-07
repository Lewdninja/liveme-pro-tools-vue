<template>
  <div id="wrapper">
    <menu-bar :title="title"></menu-bar>
    <header>
      <div class="options hover-show">
        <vs-button vs-color="dark" vs-type="filled" vs-size="small" @click="setPlayerRotate()">
          Rotate
        </vs-button>
        <vs-button vs-color="dark" vs-type="filled" vs-size="small" @click="setPlayerRotate(true, 1.75)">
          Zoom
        </vs-button>
      </div>
      <div class="hot-spots hover-show">
        <div class="spot" v-for="spot in hotSpots" :key="spot" @click="setPlayerTime(spot)">{{ spot }}</div>
      </div>
    </header>
    <div id="contents">
      <video id="video" class="video-js"></video>
    </div>
  </div>
</template>

<script>
  import MenuBar from './Windows/SmallMenuBar'

  const appSettings = require('electron-settings')
  window.videojs = require('video.js')
  require('videojs-contrib-hls.js')
  require('videojs-rotatezoom')

  export default {
    name: 'player',
    components: { MenuBar },
    data () {
      return {
        player: false,
        video: {},
        comments: [],
        hotSpots: [],
        rotate: 0,
        zoom: 1
      }
    },
    computed: {
      title: function () {
        return `► ${this.video.uname} - ${this.video.vid}`
      }
    },
    methods: {
      playerInit: function () {
        this.player = window.videojs('video', {
          controls: true,
          autoplay: true,
          preload: 'auto'
        })
      },
      playerDispose: function () {
        this.player.dispose()
      },
      setPlayerEvents: function () {
        this.player.on('volumechange', () => {
          appSettings.set('player.volume', this.player.muted() ? false : this.player.volume())
        })
      },
      setPlayerVolume: function () {
        const volume = appSettings.get('player.volume')
        this.player.muted(!volume)
        this.player.volume(volume || 1)
      },
      setPlayerTime: function (time) {
        const times = time.split(':')
        let seconds = 0
        times.forEach((num, index) => {
          if (index === 0) seconds += Number(num) * 3600
          if (index === 1) seconds += Number(num) * 60
          if (index === 2) seconds += Number(num)
        })
        this.player.currentTime(seconds)
      },
      setPlayerRotate: function (degrees, zoom = 1) {
        if (this.zoom === zoom) {
          this.zoom = 1
          zoom = 1
        } else {
          this.zoom = zoom
        }
        if (degrees !== true) this.rotate += degrees || 90
        if (this.rotate >= 360) this.rotate = 0
        this.player.zoomrotate({ rotate: this.rotate, zoom: zoom })
      },
      loadStream: function () {
        const format = require('format-duration')
        const Liveme = this.$electron.remote.getGlobal('Liveme')
        const DataManager = this.$electron.remote.getGlobal('DataManager')

        DataManager.addWatched(this.$route.params.id)

        Liveme.getVideoInfo(this.$route.params.id)
          .then(video => {
            this.video = video
            this.player.src({ src: video.hlsvideosource })
            window.rotation = 0
            window.debugPlayer = this.player
            return video
          })
          .then(video => {
            Liveme.getChatHistoryForVideo(video.msgfile)
              .then(raw => {
                const hotStamps = {}
                const lines = raw.split('\n')
                for (const line of lines) {
                  try {
                    const json = JSON.parse(line)
                    const time = format(Number(json.timestamp) - (video.vtime * 1000))

                    if (json.objectName === 'RC:TxtMsg') {
                      this.comments.push({
                        userid: json.content.user.id,
                        user: json.content.user.name,
                        text: json.content.content,
                        time
                      })
                      // hotStamp algo
                      const ts = time.split(':')
                      let key = ts
                      if (ts.length === 3) {
                        key = `${ts[0]}:${ts[1]}:00`
                      } else {
                        key = `0:${ts[0]}:00`
                      }
                      if (!hotStamps[key]) { hotStamps[key] = 0 }
                      hotStamps[key] += 1
                    }
                  } catch (e) {
                    console.log(e)
                  }
                }
                // sort hotstamps
                const hotStampsSort = Object.keys(hotStamps).sort((a, b) => hotStamps[b] - hotStamps[a])
                this.hotSpots = hotStampsSort.splice(0, 10)
              })
              .catch(err => {
                console.log(err)
              })
          })
          .catch(err => console.log(err.response))
      }
    },
    watch: {
      '$route': 'loadStream'
    },
    mounted () {
      this.playerInit()
      this.setPlayerEvents()
      this.setPlayerVolume()
      this.loadStream()
    },
    beforeDestroy () {
      this.playerDispose()
    }
  }
</script>

<style lang="sass">
  @import '~@/assets/app'
  @import '~@/assets/player.css'

  #wrapper
    &:hover
      .hover-show
        display: block
    .hover-show
      display: none
    header
      top: 3rem
      left: 1rem
      right: 1rem
      position: absolute
      z-index: 999
      .hot-spots
        .spot
          font-size: .8rem
          padding: 0.2rem 0.3rem
          background: #333
          border-radius: 3px
          margin-right: 0.3rem
          display: inline-block
          &:hover
            cursor: pointer
            background: rgba(250, 0, 0, .75)

  #contents
    top: 2rem
    bottom: 0
    left: 0
    right: 0
    border: .3rem solid $app
    border-top-width: 0
    background: rgba(250, 250, 250, .1)
    position: absolute
    overflow: auto
</style>
