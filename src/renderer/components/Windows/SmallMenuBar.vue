<template>
  <div id="menubar">
    <nav>
      {{ title }}
      <a href="#" class="right" @click="close">✕</a>
      <a href="#" class="right" @click="minimize">🗕</a>
    </nav>
  </div>
</template>

<script>
  const { remote } = require('electron')

  export default {
    name: 'menu-bar',
    data () {
      return {}
    },
    props: ['title'],
    methods: {
      minimize: () => {
        remote.BrowserWindow.getFocusedWindow().minimize()
      },
      close: () => {
        window.close()
      }
    }
  }
</script>

<style lang="sass">
  @import '~@/assets/app'

  #menubar 
    nav
      width: 100%
      height: 2rem
      line-height: 2rem
      padding: 0 .5rem
      background: $app
      -webkit-app-region: drag
      & *
        -webkit-app-region: no-drag
      .right
        color: $secondary
        font-size: 1rem
        height: 2.45rem
        line-height: 3rem
        margin-top: -.45rem
        padding: 0 .5rem
        float: right
        &:hover
          background: rgba(0, 0, 0, .2)
</style>
