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
      <section>
        <div class="title">Bookmark & Favorite lists</div>
        <ul>
          <li>
            <vs-checkbox v-model="bm_hideZeroReplays">Hide bookmarks with zero replays</vs-checkbox>
          </li>
          <li>
            <vs-checkbox v-model="fav_hideZeroReplays">Hide followings with zero replays</vs-checkbox>
          </li>
          <li>
            <vs-checkbox v-model="fav_hideBookmarked">Hide followings that are already bookmarked</vs-checkbox>
          </li>
        </ul>
      </section>
      <section>
        <div class="title">Video Player</div>
        <p class="info">Internal player is used by default unless specified otherwise in the field below.</p>
        <p class="info">Available parameters: %url%</p>
        <vs-input placeholder="Full path to player" v-model="general_playerPath"/>
      </section>
      <section>
        <div class="title" style="margin: 0">Downloads</div>
        <vs-input vs-label="Download location" v-model="downloads_path"/>
        <vs-input vs-label="Filename template" v-model="downloads_template"/>
        <vs-input vs-label="Full path to FFMPEG executable" v-model="downloads_ffmpeg"/>
        <p class="info">You can customize how downloaded replays are named using the variables below in the text box above.</p>
        <vs-row class="info">
          <vs-col vs-type="flex" vs-w="6">%%broadcaster%%</vs-col>
          <vs-col vs-type="flex" vs-w="6">Broadcaster's Nickname</vs-col>
          <vs-col vs-type="flex" vs-w="6">%%longid%%</vs-col>
          <vs-col vs-type="flex" vs-w="6">Broadcaster's Long ID Number</vs-col>
          <vs-col vs-type="flex" vs-w="6">%%replayid%%</vs-col>
          <vs-col vs-type="flex" vs-w="6">ID Number of the Replay</vs-col>
          <vs-col vs-type="flex" vs-w="6">%%replayviews%%</vs-col>
          <vs-col vs-type="flex" vs-w="6">Number of Views</vs-col>
          <vs-col vs-type="flex" vs-w="6">%%replaylikes%%</vs-col>
          <vs-col vs-type="flex" vs-w="6">Number of Likes</vs-col>
          <vs-col vs-type="flex" vs-w="6">%%replayshares%%</vs-col>
          <vs-col vs-type="flex" vs-w="6">Number of Shares</vs-col>
          <vs-col vs-type="flex" vs-w="6">%%replaytitle%%</vs-col>
          <vs-col vs-type="flex" vs-w="6">Title of the Replay</vs-col>
          <vs-col vs-type="flex" vs-w="6">%%replayduration%%</vs-col>
          <vs-col vs-type="flex" vs-w="6">Duration of the Replay</vs-col>
          <vs-col vs-type="flex" vs-w="6">%%replaydatepacked%%</vs-col>
          <vs-col vs-type="flex" vs-w="6">Date the replay was originally recorded in YYYYMMDD</vs-col>
          <vs-col vs-type="flex" vs-w="6">%%replaydateus%%</vs-col>
          <vs-col vs-type="flex" vs-w="6">Date the replay was originally recorded in MM-DD-YYYY</vs-col>
          <vs-col vs-type="flex" vs-w="6">%%replaydateeu%%</vs-col>
          <vs-col vs-type="flex" vs-w="6">Date the replay was originally recorded in DD-MM-YYYY</vs-col>
        </vs-row>
        <div class="title">Download Method</div>
        <ul>
          <li>
            <vs-radio v-model="downloads_method" vs-value="ffmpeg">FFMPEG Stream Download (Slow and more stable)</vs-radio>
          </li>
          <li>
            <vs-radio v-model="downloads_method" vs-value="chunk">Chunk Download and Concat (Fast and possibly unstable)</vs-radio>
          </li>
          <li>
            <vs-checkbox v-model="downloads_teltmp">Delete temporary files left over by chunk download method</vs-checkbox>
          </li>
        </ul>
        <div class="title">Parallel Downloading</div>
        <vs-slider v-model="downloads_parallel"/>
      </section>
      <section>
        <div class="title">Viewed Profiles Auto Clearing</div>
        <p class="info">Clear viewed profiles that were last seen how many days ago?</p>
      </section>
      <section>
        <div class="title">Clear Data</div>
        <p class="info">By clicking the button below you will wipe out all Bookmarks, Downloads, Visited and Watched entries and reset all settings to their default values.</p>
        <p class="info">There's no confirmation once you click the button below, use it wisely!</p>
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
        loginAlertSuccessMessage: 'Received a succesful login response from Live.me',

        bm_hideZeroReplays: false,
        fav_hideZeroReplays: false,
        fav_hideBookmarked: false,

        general_playerPath: '',
        downloads_path: '',
        downloads_template: '',
        downloads_ffmpeg: '',
        downloads_method: 'ffmpeg',
        downloads_parallel: 3,
        downloads_teltmp: true
      }
    },
    props: ['visible'],
    watch: {
      email: (value) => appSettings.set('auth.email', value),
      password: (value) => appSettings.set('auth.password', value),
      captcha: function (value) {
        const Liveme = this.$electron.remote.getGlobal('Liveme')
        Liveme.setCaptcha(value)
      },
      // Multiple watchers
      ...[
        'bm_hideZeroReplays',
        'fav_hideZeroReplays',
        'fav_hideBookmarked',
        'general_playerPath',
        'downloads_path',
        'downloads_template',
        'downloads_ffmpeg',
        'downloads_method',
        'downloads_parallel',
        'downloads_deltmp'
      ].reduce((watchers, key) => ({
        ...watchers,
        [key] (value) {
          const name = key.replace('_', '.')
          appSettings.set(name, value)
        }
      }), {})
    },
    methods: {
      authenticate: function () {
        console.log('auth')
        this.captcha = ''
        this.loginAlert = false

        const Liveme = this.$electron.remote.getGlobal('Liveme')
        Liveme.setAuthDetails(this.email, this.password)
          .then(res => {
            console.log(res)
            this.getCaptcha()
            this.loginAlert = true
            this.loginAlertColor = 'success'
            this.loginAlertMessage = this.loginAlertSuccessMessage
          })
          .catch(err => {
            console.log(err)
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

      this.bm_hideZeroReplays = appSettings.get('bm.hideZeroReplays') || false
      this.fav_hideZeroReplays = appSettings.get('fav.hideZeroReplays') || false
      this.fav_hideBookmarked = appSettings.get('fav.hideBookmarked') || false
      this.general_playerPath = appSettings.get('general.playerPath') || ''
      this.downloads_path = appSettings.get('downloads.path')
      this.downloads_template = appSettings.get('downloads.template')
      this.downloads_ffmpeg = appSettings.get('downloads.ffmepg')
      this.downloads_method = appSettings.get('downloads.method') || 'ffmpeg'
      this.downloads_parallel = appSettings.get('downloads.parallel') || 3
      this.downloads_teltmp = appSettings.get('downloads.deltmp') || true
    }
  }
</script>

<style lang="sass">
  @import '~@/assets/app'

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
      .info
        font-size: 1rem
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
      ul
        list-style: none
        li
          margin-bottom: .5rem
          .con-vs-checkbox, .con-vs-radio
            justify-content: left
          .con-vs-radio
            margin-left: .375rem

</style>
