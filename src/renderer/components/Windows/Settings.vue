<template>
  <transition name="fadeIn">
    <div id="settings" v-if="visible">
      <div class="close">
        <i class="material-icons" @click="hide">close</i>
      </div>
      <div class="title">Settings</div>
      <section>
        <div class="title">Authentication</div>
        <vs-alert :vs-active="loginAlert" :vs-color="loginAlertColor">
          {{ loginAlertMessage }}
        </vs-alert>
        <vs-input placeholder="Username" v-model="email"/>
        <vs-input type="password" placeholder="Password" v-model="password"/>
        <vs-row class="captcha" style="margin-top: .5rem">
          <vs-col vs-type="flex" vs-w="2">
            <vs-tooltip color="primary" text="Click to refresh captcha.">
              <img :src="captchaChallenge" alt="Captcha" v-if="captchaChallenge" @click="getCaptcha">
            </vs-tooltip>
          </vs-col>
          <vs-col vs-type="flex" vs-w="2">
            <vs-input placeholder="Captcha" class="captcha" v-model="captcha"/>
          </vs-col>
          <vs-col vs-type="flex" vs-w="8">
            <vs-button vs-color="primary" vs-type="filled" @click="authenticate">Login</vs-button>
          </vs-col>
        </vs-row>
      </section>
    </div>
  </transition>
</template>

<script>
  const appSettings = require('electron-settings')

  export default {
    name: 'settings',
    data () {
      return {
        email: '',
        password: '',
        captcha: '',
        captchaChallenge: false,

        loginAlert: false,
        loginAlertColor: 'danger',
        loginAlertMessage: '',
        loginAlertSuccessMessage: 'Received a succesful login response from Live.me'
      }
    },
    props: ['visible'],
    watch: {
      email: (value) => appSettings.set('auth.email', value),
      password: (value) => appSettings.set('auth.password', value),
      captcha: function (value) {
        const Liveme = this.$electron.remote.getGlobal('Liveme')
        Liveme.setCaptcha(value)
      }
    },
    methods: {
      authenticate: function () {
        this.captcha = ''
        this.loginAlert = false

        const Liveme = this.$electron.remote.getGlobal('Liveme')
        Liveme.setAuthDetails(this.email, this.password)
          .then(res => {
            this.getCaptcha()
            this.loginAlert = true
            this.loginAlertColor = 'success'
            this.loginAlertMessage = this.loginAlertSuccessMessage
          })
          .catch(err => {
            this.getCaptcha()
            this.loginAlert = true
            this.loginAlertColor = 'danger'
            this.loginAlertMessage = `Received an error message while trying to login. (${err.msg})` || 'Unknown login error.'
          })
      },
      getCaptcha: function () {
        const Liveme = this.$electron.remote.getGlobal('Liveme')
        Liveme.getCaptcha()
          .then(res => {
            this.captchaChallenge = res
          })
      },
      hide: function () {
        this.$emit('hide')
      }
    },
    created () {
      this.getCaptcha()
      this.email = appSettings.get('auth.email')
      this.password = appSettings.get('auth.password')
    }
  }
</script>

<style lang="sass">
  @import 'static/app'

  #settings
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
    section
      margin-top: 1rem
      padding: 1rem
      background: rgba(250, 250, 250, .05)
      border-radius: .3rem
      .title
        color: $secondary
        font-size: 1.2rem
        font-weight: 400
        margin-bottom: .5rem
      .vs-input
        margin-bottom: .3rem
      img
        border-radius: .3rem
      .captcha
        width: 150px
        input
          padding: .625rem
        .vs-col
          width: 157px!important

</style>
