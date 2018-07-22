<template>
  <div id="footbar">
    <nav>
      <span style="opacity: .3">
        CPU: {{ this.CPU.toFixed(2) }}% - 
        MEM: {{ Math.floor(this.MEM.rss / 1000 / 1000) }}MB / 
        {{ Math.floor(this.MEM.heapTotal / 1000 / 1000) }}MB / 
        {{ Math.floor(this.MEM.heapUsed / 1000 / 1000) }}MB
      </span>
    </nav>
  </div>
</template>

<script>
  export default {
    name: 'foot-bar',
    data () {
      return {
        CPU: 0,
        MEM: {},
        interval: false
      }
    },
    methods: {
      getUsageStats: function () {
        this.CPU = process.getCPUUsage().percentCPUUsage
        this.MEM = process.memoryUsage()
      }
    },
    created () {
      this.getUsageStats()
      this.interval = setInterval(() => this.getUsageStats(), 2000)
    },
    beforeDestroy () {
      clearInterval(this.interval)
    }
  }
</script>

<style lang="sass">
  @import 'static/app'

  #footbar nav
    width: 100%
    height: 2rem
    line-height: 2rem
    background: $app
    position: absolute
    bottom: 0
    padding: 0 1rem
</style>
