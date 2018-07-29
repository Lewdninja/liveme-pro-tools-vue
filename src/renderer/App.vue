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
  @import './static/fonts/fonts.css'

  $app: #303030
  $primary: #9356f3
  $secondary: #C1A0F5
  $tertiary: #F5B96F

  .nodrag
      -webkit-app-region: no-drag!important
      &.all *
          -webkit-app-region: no-drag!important

  h1
      color: $primary
      padding-left: 1rem
      font-weight: 700
      text-shadow: 1px 1px 1px #000

  .vs-con-input-label
      width: 100%

  .vs-inputx
      color: $primary!important
      background: rgba(0, 0, 0, .5)
      border-color: transparent!important
  .input-span-placeholder
      color: $primary!important
      opacity: 1

  .con-select
      .material-icons
          color: $primary
      .input-select
          color: $primary
          background: rgba(0, 0, 0, .5)
          border-color: transparent!important
          width: 100%
  .vs-select-options
      background: #111
      ul
          li
              display: block
              margin-bottom: .3rem
              &:last-child
                  margin: 0
              .vs-select-item-btn
                  border: 0!important
                  background: $app
                  &:hover
                      background: rgba(250, 250, 250, .2)
                  &.activex
                      background: rgba(250, 250, 250, .2)!important
                      span
                          color: $tertiary
                  span
                      color: $secondary
      
  .fadeIn-enter-active, .fadeIn-leave-active
      transition: opacity .1s linear
  .fadeIn-enter, .fadeIn-leave-to
      opacity: 0

  *
    -webkit-box-sizing: border-box
    box-sizing: border-box
    font-family: 'source-sans-pro', Arial, Helvetica, sans-serif

  #app
    color: #eaeaea
    font-size: 18px
    font-weight: 300
</style>
