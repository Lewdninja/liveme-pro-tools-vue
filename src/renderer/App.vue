<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
  export default {
    name: 'liveme-tools',
    created () {
      this.$electron.ipcRenderer.on('router.push', (event, arg) => {
        this.$router.push(arg)
      })
    }
  }
</script>

<style lang="sass">
  @import '~@/assets/fonts/fonts.css'
  @import '~@/assets/app'

  *
    -webkit-box-sizing: border-box
    box-sizing: border-box
    font-family: 'source-sans-pro', Arial, Helvetica, sans-serif

  body
    overflow: hidden

  #app
    color: #eaeaea
    font-size: 18px
    font-weight: 300
</style>
