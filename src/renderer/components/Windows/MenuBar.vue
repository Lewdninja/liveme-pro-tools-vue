<template>
  <div id="menubar">
    <vs-sidebar :vs-active.sync="active" vs-parent="#app" id="sidepanel">
      <!--
      <vs-sidebar-item @click="active=false" vs-icon="settings_backup_restore">
        Backup & Restore
      </vs-sidebar-item>
      -->
      <vs-sidebar-item @click="openWindow('bookmarks')" vs-icon="bookmark">
        Open Bookmarks
      </vs-sidebar-item>
      <!--
      <vs-sidebar-item @click="goToPage('help')" vs-icon="help">
        Help
      </vs-sidebar-item>
      -->
      <vs-sidebar-item @click="togglePanel('Settings')" vs-icon="settings">
        Settings
      </vs-sidebar-item>
      <vs-sidebar-item @click="close" vs-icon="power_settings_new">
        Quit
      </vs-sidebar-item>
    </vs-sidebar>
    <nav>
      <vs-button @click="active=!active" vs-color="dark" vs-type="flat" vs-icon="menu" class="menu-icon"></vs-button>
      <div class="history">
        <a href="#" @click="goToPage(-1)" title="Go back">
          <i class="material-icons">keyboard_arrow_left</i>
        </a>
        <a href="#" @click="goToPage(1)" title="Go forward">
          <i class="material-icons">keyboard_arrow_right</i>
        </a>
      </div>
      <div class="tabs">
        <vs-button vs-color="dark" vs-size="small" vs-type="filled" vs-icon="home" @click="goToPage('/')">Home</vs-button>
        <vs-button vs-color="dark" vs-size="small" vs-type="filled" vs-icon="search" @click="goToPage('/search')">Search</vs-button>
        <vs-button vs-color="dark" vs-size="small" vs-type="filled" vs-icon="bookmark" @click="openWindow('bookmarks')">Bookmarks</vs-button>
        <vs-button vs-color="dark" vs-size="small" vs-type="filled" vs-icon="cloud_download" @click="togglePanel('Downloads')">Downloads</vs-button>
      </div>
      <a href="#" class="right" style="line-height: 3.9rem" @click="close">✕</a>
      <a href="#" class="right" @click="minimize">🗕</a>
    </nav>
    <downloads
      :visible="showDownloads"
      @hide="showDownloads = false"></downloads>
    <settings
      :visible="showSettings"
      @hide="showSettings = false"></settings>
  </div>
</template>

<script>
  import Downloads from './Downloads'
  import Settings from './Settings'

  const { remote } = require('electron')

  export default {
    name: 'menu-bar',
    components: { Downloads, Settings },
    data () {
      return {
        active: false,
        showDownloads: false,
        showSettings: false
      }
    },
    computed: {
      queue () {
        return this.$store.state.Downloads.queue
      }
    },
    methods: {
      goToPage: function (page) {
        if (Number.isInteger(page)) {
          this.$router.go(page)
          return
        }
        this.active = false
        this.$router.push(page)
      },
      openWindow: function (page, data = undefined) {
        this.active = false
        this.$electron.ipcRenderer.send(`open-${page}`, data)
      },
      togglePanel: function (name) {
        this.active = false
        this[`show${name}`] = !this[`show${name}`]
      },
      minimize: () => {
        remote.BrowserWindow.getFocusedWindow().minimize()
      },
      close: () => {
        window.close()
      }
    },
    created () {
      const DataManager = this.$electron.remote.getGlobal('DataManager')
      console.log(DataManager.getQueued())
    }
  }
</script>

<style lang="sass">
  @import '~@/assets/app'

  #menubar 
    nav
      width: 100%
      height: 2.75rem
      line-height: 2.75rem
      padding: 0 .3rem
      background: $app
      -webkit-app-region: drag
      & *
        -webkit-app-region: no-drag
      .tabs
        display: inline-block
        padding-top: 0.45rem
        margin-left: 1rem
        vertical-align: top
        button
          margin-right: .5rem
      .history
        display: inline-block
        padding-top: 0.47rem
        margin-left: .5rem
        vertical-align: top
        a
          display: inline-block
          color: rgba(250, 250, 250, .5)
          padding: 0 .2rem
          height: 1.9rem
          &:hover
            color: rgba(250, 250, 250, .75)
      .menu-icon i
        color: $secondary
        font-size: 1.7rem
      .right
        color: $secondary
        font-size: 2rem
        height: 3.2rem
        line-height: 3.2rem
        margin-top: -.45rem
        padding: 0 .5rem
        float: right
        &:hover
          background: rgba(0, 0, 0, .2)
  #sidepanel
    top: 2.75rem
    height: calc(100% - 2.75rem)
    .vs-sidebar
      background: $app
      .con-text-span
        color: #eaeaea
      .active-item
        background: rgba(0, 0, 0, .25)
      .vs-sidebar-item:not(.active-item).vs-sidebar-item a:hover
        background: rgba(0, 0, 0, .1)
      .vs-sidebar-item:after
        background: $primary
  
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
