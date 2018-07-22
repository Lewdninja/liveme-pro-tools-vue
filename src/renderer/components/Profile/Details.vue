<template>
  <transition name="fadeIn">
    <div id="profile-details" v-show="visible">
      <div class="close">
        <i class="material-icons" @click="closeDetails">close</i>
      </div>
      <div class="title">Details</div>
      <vs-input vs-label="ID" :value="replay.vid" disabled/>
      <vs-input vs-label="URL" :value="'https://www.liveme.com/live.html?videoid=' + replay.vid" disabled/>
      <vs-input vs-label="Source" :value="replay.hlsvideosource" disabled/>
      <div class="title">Thumbnails</div>
      <div class="progress-bar" v-if="!thumbnailsLoaded">
        <div class="line" :style="'width:' + thumbnailProgress + '%'"></div>
      </div>
      <transition name="fadeIn">
        <div class="thumbnails" v-show="thumbnailsLoaded">
          <img v-for="thumb in thumbs" :src="thumb.path" :alt="thumb.name" @click="openThumb(thumb)">
        </div>
      </transition>
    </div>
  </transition>
</template>

<script>
  const fs = require('fs')
  const path = require('path')
  const ffmpeg = require('fluent-ffmpeg')
  const async = require('async')

  export default {
    name: 'profile-details',
    data () {
      return {
        maxThumbnails: 10,
        thumbnails: [],
        thumbnailPath: false,
        thumbnailProgress: 0,
        thumbnailsLoaded: true
      }
    },
    computed: {
      thumbs: function () {
        if (!this.thumbnailPath || !this.thumbnailsLoaded) return []
        return this.thumbnails.sort((a, b) => a - b).map(num => {
          return {
            name: `${this.replay.vid}_${num}.jpg`,
            path: path.join(this.thumbnailPath, `${this.replay.vid}_${num}.jpg`)
          }
        })
      }
    },
    props: {
      visible: Boolean,
      replay: {
        type: Object,
        default: {}
      }
    },
    watch: {
      replay: function () {
        this.loadDetails()
      }
    },
    methods: {
      loadDetails: function () {
        this.thumbnails = []
        this.thumbnailProgress = 0
        this.thumbnailsLoaded = false
        if (!this.thumbnailPath) {
          this.thumbnailPath = path.join(
            this.$electron.remote.app.getPath('appData'),
            this.$electron.remote.app.getName(),
            'thumbnails'
          )
        }
        if (this.replay.hlsvideosource) {
          this.loadThumbnails()
        }
      },
      loadThumbnails: function () {
        if (!Object.keys(this.replay).length || !this.visible) {
          return setTimeout(() => this.loadThumbnails(), 1000)
        }
        // Check if thumbnail directory exists
        if (!fs.existsSync(this.thumbnailPath)) fs.mkdirSync(this.thumbnailPath)
        const seek = Math.floor(Number(this.replay.videolength) / this.maxThumbnails)
        async.timesLimit(this.maxThumbnails, 2, (index, next) => {
          this.thumbnailProgress = (this.thumbnails.length / this.maxThumbnails) * 100
          ffmpeg(this.replay.hlsvideosource)
            .seekInput(index * seek)
            .outputOptions('-vframes 1')
            .output(path.join(this.thumbnailPath, `${this.replay.vid}_${index}.jpg`))
            .on('end', () => {
              this.thumbnails.push(index)
              next()
            })
            .on('error', () => next())
            .run()
        }, () => setTimeout(() => { this.thumbnailsLoaded = true }, 1000))
      },
      openThumb: function (thumb) {
        this.$electron.remote.shell.openItem(thumb.path)
      },
      closeDetails: function () {
        this.$emit('closeDetails')
      }
    }
  }
</script>

<style lang="sass">
  @import 'static/app'

  #profile-details
    position: absolute
    left: 10%
    right: 10%
    bottom: 10%
    top: 10%
    padding: 1rem
    border: .5rem solid #444
    border-radius: .3rem
    box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)
    background: #1a1a1a
    overflow: auto
    z-index: 10
    & .title
      color: $tertiary
      font-size: 2rem
    & > .close
      top: 0
      right: 0
      padding: 1rem
      position: absolute
      color: $tertiary
      cursor: pointer
      &:hover
        color: white
      .material-icons
        font-size: 2rem
    .vs-input
      margin-bottom: .5rem
      width: 100%
    .vs-con-input-label
      .vs-input-label
        color: rgba(250, 250, 250, .7)
    .thumbnails
      width: 100%
      white-space: nowrap
      overflow: auto
      img
        margin-top: .5rem
        margin-right: .3rem
        width: auto
        height: 280px
        display: inline-block
        cursor: pointer
        transition: .1s opacity ease
        vertical-align: top
        &:hover
          opacity: .9
  .progress-bar
    width: 100%
    height: 6px
    border-radius: 18px
    background: rgba(0, 250, 0, .1)
    position: relative
    overflow: hidden
    margin-top: .5rem
    .line
      width: 0%
      height: 6px
      background: green
      border-radius: 18px
      transition: .5s all ease
</style>
