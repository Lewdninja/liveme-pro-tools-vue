'use strict'

import { app } from 'electron'

const path = require('path')
const appSettings = require('electron-settings')

const checkFreshInstallAndSettings = () => {
  const isFreshInstall = appSettings.get('general.fresh_install') == null

  if (isFreshInstall === true) {
    appSettings.set('general', {
      fresh_install: true,
      playerpath: '',
      hide_zeroreplay_fans: false,
      hide_zeroreplay_followings: true
    })
    appSettings.set('position', {
      mainWindow: [-1, -1],
      playerWindow: [-1, -1],
      bookmarksWindow: [-1, -1],
      fansWindow: [-1, -1],
      followingsWindow: [-1, -1]
    })
    appSettings.set('size', {
      mainWindow: [1024, 600],
      playerWindow: [370, 680],
      bookmarksWindow: [400, 720]
    })
    appSettings.set('downloads', {
      path: path.join(app.getPath('home'), 'Downloads'),
      template: '%%replayid%%'
    })
    appSettings.set('lamd', {
      enabled: false,
      url: 'http://localhost:8280',
      handle_downloads: false
    })
  }

  if (['ffmpeg', 'chunk'].indexOf(appSettings.get('downloads.method')) === -1) {
    appSettings.set('downloads.method', 'ffmpeg')
  }

  if (!appSettings.get('downloads.deltmp')) {
    appSettings.set('downloads.deltmp', true)
  }

  if (!appSettings.get('downloads.path')) {
    appSettings.set('downloads', {
      path: path.join(app.getPath('home'), 'Downloads'),
      template: '%%replayid%%'
    })
  }

  if (!appSettings.get('downloads.chunks')) {
    appSettings.set('downloads.chunks', 1)
  }

  if (!appSettings.get('lamd.enabled')) {
    appSettings.set('lamd', {
      enabled: false,
      url: 'http://localhost:8280',
      handle_downloads: false
    })
  }

  if (!appSettings.get('history.viewed_maxage')) {
    appSettings.set('history', {
      viewed_maxage: 1
    })
  }

  const test = appSettings.get('position')
  if (test.mainWindow[1] === undefined) {
    appSettings.set('position', {
      mainWindow: [-1, -1],
      playerWindow: [-1, -1],
      bookmarksWindow: [-1, -1]
    })
  }
}

export default {
  checkFreshInstallAndSettings
}
