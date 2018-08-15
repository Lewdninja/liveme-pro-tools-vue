import Vue from 'vue'
import axios from 'axios'

import Vuesax from 'vuesax'
import VueTable from 'vue-good-table'
import VueScroll from 'vue-infinite-scroll'

import 'vuesax/dist/vuesax.css'
import 'vue-good-table/dist/vue-good-table.css'
import 'material-icons/iconfont/material-icons.css'

import App from './App'
import router from './router'
import store from './store'

Vue.use(Vuesax)
Vue.use(VueTable)
Vue.use(VueScroll)

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  store,
  template: '<App/>'
}).$mount('#app')
