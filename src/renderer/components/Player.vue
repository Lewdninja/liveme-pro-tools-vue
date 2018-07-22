<template>
  <div id="wrapper">
    <menu-bar :title="title"></menu-bar>
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
        video: {}
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
      loadStream: function () {
        const Liveme = this.$electron.remote.getGlobal('Liveme')
        const DataManager = this.$electron.remote.getGlobal('DataManager')

        DataManager.addWatched(this.$route.params.id)

        Liveme.getVideoInfo(this.$route.params.id)
          .then(video => {
            this.video = video
            this.player.src({ src: video.hlsvideosource })
            window.rotation = 0
            window.debugPlayer = this.player
          })
          .catch(err => console.log(err))
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
  @import 'static/app'
  @import '/static/player.css'

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
