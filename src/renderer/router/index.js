import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'home',
      component: require('@/components/Home').default
    },
    {
      path: '/search',
      name: 'search',
      component: require('@/components/Search').default
    },
    {
      path: '/profile/:id',
      name: 'profile',
      component: require('@/components/Profile').default
    },
    {
      path: '/bookmarks',
      name: 'bookmarks',
      component: require('@/components/Bookmarks').default
    },
    {
      path: '/favorites/:id',
      name: 'favorites',
      component: require('@/components/Favorites').default
    },
    {
      path: '/comments',
      name: 'comments',
      component: require('@/components/Comments').default
    },
    {
      path: '/player/:id',
      name: 'player',
      component: require('@/components/Player').default
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
