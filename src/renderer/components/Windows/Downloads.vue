<template>
  <transition name="fadeIn">
    <div id="downloads" v-if="visible">
      <div class="close">
        <i class="material-icons" @click="hide">close</i>
      </div>
      <div class="title">Downloads</div>
      <ul class="list">
        <li v-for="file in queue">
          <div class="title" :title="file.title"><strong>{{ file.uname }}</strong> - {{ file.vid }}
            <span class="status">{{ file.status }}</span>
          </div>
          <div class="progress-bar">
            <div class="line" :style="'width:' + file.progress + '%'"></div>
          </div>
        </li>
      </ul>
    </div>
  </transition>
</template>

<script>
  const asyncQueue = require('../../../main/downloads').default

  export default {
    name: 'downloads',
    data () {
      return {}
    },
    props: ['visible'],
    computed: {
      queue () {
        return this.$store.state.Downloads.queue
      }
    },
    watch: {
      queue (data) {
        console.log('queue upd')
        const newVideo = data[data.length - 1]
        asyncQueue.push(newVideo.vid, () => {
          this.$store.commit('removeDownload', newVideo)
          // Notify user that the video's been downloaded
          this.$vs.notify({
            title: newVideo.uname,
            text: `${newVideo.vid} finished downloading.`,
            color: 'dark'
          })
        })
      }
    },
    methods: {
      hide: function () {
        this.$emit('hide')
      }
    },
    created () {
      this.$electron.ipcRenderer.on('updateDownload', data => {
        this.$store.commit('updateDownload', data)
      })
    }
  }
</script>

<style lang="sass">
  @import '~@/assets/app'

  #downloads
    position: absolute
    left: .2rem
    right: .2rem
    bottom: .2rem
    top: .2rem
    padding: 1rem
    background: #1a1a1a
    overflow: auto
    z-index: 999
    & > .title
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
    .list
      margin-top: 1rem
      list-style: none
      border-radius: .3rem
      overflow: hidden
      li
        padding: .6rem .5rem
        background: rgba(250, 250, 250, .025)
        border-top: 1px solid #1a1a1a
        &:nth-child(odd)
          background: rgba(250, 250, 250, .05)
          border-bottom: 1px solid $app
      .title
        font-weight: 400
        margin-bottom: .3rem
        .status
          color: $tertiary
          float: right
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
</style>
