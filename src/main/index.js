'use strict'

import { app, ipcMain } from 'electron'
import { DataManager } from './datamanager'

const { exec } = require('child_process')
const helpers = require('./helpers').default
const windows = require('./windows').default
const appSettings = require('electron-settings')

let auth = {}
if (appSettings.get('auth.email') && appSettings.get('auth.password')) {
  auth.email = appSettings.get('auth.email')
  auth.password = appSettings.get('auth.password')
}

const LivemeAPI = require('liveme-api')
const Liveme = new LivemeAPI(auth)

const appWindows = {
  main: null,
  player: null,
  bookmarks: null
}

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

function createWindow () {
  helpers.checkFreshInstallAndSettings()

  appWindows.main = windows.main()
  appWindows.main.loadURL(winURL)
  appWindows.main.once('ready-to-show', () => appWindows.main.show())

  global.Liveme = Liveme
  // Load data to app
  global.DataManager = new DataManager()
  global.DataManager.loadFromDisk()
  // Save data every 10 minutes, just in case app crashes and it doesn't emit close event.
  setInterval(() => global.DataManager.saveToDisk(), 10 * 60 * 1000)
  // Before we close the app
  appWindows.main.on('close', () => {
    // Save app data to disk
    global.DataManager.saveToDisk()
    // Save main window size and position to config
    appSettings.set('position.mainWindow', appWindows.main.getPosition())
    appSettings.set('size.mainWindow', appWindows.main.getSize())
    // Destroy all windows
    Object.entries(appWindows).forEach(([index, window]) => {
      appSettings.set(`position.${index}Window`, appWindows[index].getPosition())
      appSettings.set(`size.${index}Window`, appWindows[index].getSize())
      if (window !== null) window.destroy()
    })
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  global.DataManager.saveToDisk()
  if (process.platform !== 'darwin') {
    setTimeout(() => app.quit(), 1000)
  }
})

app.on('activate', () => {
  if (appWindows.main === null) createWindow()
})

/**
 * IPC Events
 */
ipcMain.on('router.push', (event, arg) => {
  appWindows.main.webContents.send('router.push', arg)
})

ipcMain.on('open-player', (event, arg) => {
  const internalPlayer = appSettings.get('general.playerpath')
  let playerPath = internalPlayer

  if (playerPath && playerPath.length > 5) {
    Liveme.getVideoInfo(arg.videoid)
      .then(video => exec(playerPath.replace('%url%', video.hlsvideosource)))
      .catch(err => console.log(err))
  } else {
    const windowURL = process.env.NODE_ENV === 'development'
      ? `http://localhost:9080/#/player/${arg.videoid}`
      : `file://${__dirname}/index.html#player/${arg.videoid}`
    // Internal Player
    if (appWindows.player === null) {
      appWindows.player = windows.player()
      appWindows.player.on('close', () => {
        appSettings.set('position.playerWindow', appWindows.player.getPosition())
        appSettings.set('size.playerWindow', appWindows.player.getSize())
        appWindows.player = null
        appWindows.player.webContents.session.clearCache()
      })
    }
    appWindows.player.loadURL(windowURL)
    appWindows.player.once('ready-to-show', () => appWindows.player.show())
  }
})

ipcMain.on('open-bookmarks', (event, arg) => {
  const bookmarkURL = process.env.NODE_ENV === 'development'
    ? `http://localhost:9080/#/bookmarks`
    : `file://${__dirname}/index.html#bookmarks`

  if (appWindows.bookmarks === null) {
    appWindows.bookmarks = windows.bookmarks()
  } else {
    appWindows.bookmarks.restore()
    appWindows.bookmarks.show()
  }

  appWindows.bookmarks.on('close', () => {
    appSettings.set('position.bookmarksWindow', appWindows.bookmarks.getPosition())
    appSettings.set('size.bookmarksWindow', appWindows.bookmarks.getSize())
    appWindows.bookmarks = null
    appWindows.bookmarks.webContents.session.clearCache()
  })
  appWindows.bookmarks.loadURL(bookmarkURL)
  appWindows.bookmarks.on('ready-to-show', () => appWindows.bookmarks.show())
})

ipcMain.on('open-followings', (event, arg) => {
  const windowURL = process.env.NODE_ENV === 'development'
    ? `http://localhost:9080/#/favorites/${arg.user.uid}?type=Following&name=${arg.user.nickname}`
    : `file://${__dirname}/index.html#favorites/${arg.user.uid}?type=Following&name=${arg.user.nickname}`

  let window = appWindows[`followings_${arg.user.id}`] = windows.favorites('followings')
  window.on('ready-to-show', () => {
    window.show()
  }).on('close', () => {
    appSettings.set('position.followingsWindow', window.getPosition())
    window.webContents.session.clearCache()
    window = null
  }).loadURL(windowURL)
})

ipcMain.on('open-followers', (event, arg) => {
  const windowURL = process.env.NODE_ENV === 'development'
    ? `http://localhost:9080/#/favorites/${arg.user.uid}?type=Fans&name=${arg.user.nickname}`
    : `file://${__dirname}/index.html#favorites/${arg.user.uid}?type=Fans&name=${arg.user.nickname}`

  let window = appWindows[`followers_${arg.user.id}`] = windows.favorites('fans')
  window.on('ready-to-show', () => {
    window.show()
  }).on('close', () => {
    appSettings.set('position.fansWindow', window.getPosition())
    window.webContents.session.clearCache()
    window = null
  }).loadURL(windowURL)
})

ipcMain.on('open-comments', (event, arg) => {
  const windowURL = process.env.NODE_ENV === 'development'
    ? `http://localhost:9080/#/comments?vtime=${arg.vtime}&msgfile=${arg.msgfile}`
    : `file://${__dirname}/index.html#comments?vtime=${arg.vtime}&msgfile=${arg.msgfile}`

  let window = appWindows[`comments_${arg.msgfile}`] = windows.comments()
  window.on('ready-to-show', () => {
    window.show()
  }).on('close', () => {
    appSettings.set('position.followingsWindow', window.getPosition())
    window.webContents.session.clearCache()
    window = null
  }).loadURL(windowURL)
})
