<template>
  <div id="wrapper">
    <menu-bar title="Comments"></menu-bar>
    <div id="contents">
      <ul class="comments">
				<li v-for="comment in comments">
          <div class="title">{{ comment.user }}
            <span>{{ comment.time }}</span>
          </div>
          <div class="text">{{ comment.text }}</div>
        </li>
			</ul>
    </div>
  </div>
</template>

<script>
  import MenuBar from './Windows/SmallMenuBar'

  export default {
    name: 'comments',
    components: { MenuBar },
    data () {
      return {
        comments: []
      }
    },
    methods: {
      loadComments: function () {
        const format = require('format-duration')
        const Liveme = this.$electron.remote.getGlobal('Liveme')
        const msgFile = this.$route.query.msgfile
        const start = this.$route.query.vtime * 1000

        if (!msgFile) return

        this.$vs.loading({
          background: 'rgba(0, 0, 0, .5)'
        })

        Liveme.getChatHistoryForVideo(msgFile)
          .then(raw => {
            const lines = raw.split('\n')
            for (const line of lines) {
              try {
                const json = JSON.parse(line)
                const time = format(Number(json.timestamp) - start)

                if (json.objectName === 'RC:TxtMsg') {
                  this.comments.push({
                    userid: json.content.user.id,
                    user: json.content.user.name,
                    text: json.content.content,
                    time
                  })
                }
              } catch (e) {
                console.log(e)
              }
            }
            this.$vs.loading.close()
          })
          .catch(err => {
            this.$vs.loading.close()
            console.log(err)
          })
      }
    },
    created () {
      this.loadComments()
    }
  }
</script>

<style lang="sass">
  @import '~@/assets/app'

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
  .toolbar
    width: 100%
    background: $app
    padding: .5rem
    button
      margin-right: .3rem
      &:last-child
        margin-right: 1rem

  ul.comments
    list-style: none
    margin-top: 10px
    padding: 0 .5rem
    overflow: hidden
    li
      width: 100%
      margin-bottom: .5rem
      background: rgba(250, 250, 250, .1)
      border-bottom: 1px solid #444
      padding: .5rem .5rem
      border-radius: .3rem
      transition: .1s background
      &:hover
        background: rgba(250, 250, 250, .075)
      .title
        color: $secondary
        font-weight: 400
        cursor: pointer
        display: inline
        &:hover
          color: $tertiary
        span
          color: #999
          float: right
          cursor: default
      .text
        color: #eaeaea
        font-size: .9rem
        font-weight: 300
</style>
