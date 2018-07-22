'use strict'

import { app, ipcMain } from 'electron'
import { DataManager } from './datamanager'

const { exec } = require('child_process')
const helpers = require('./helpers').default
const windows = require('./windows').default
const appSettings = require('electron-settings')

const LivemeAPI = require('liveme-api')
const Liveme = new LivemeAPI({})

let mainWindow = null
let playerWindow = null
let bookmarksWindow = null
// let chatWindow = null
// let wizardWindow = null
// let menu = null

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

  mainWindow = windows.main()
  mainWindow.loadURL(winURL)

  global.Liveme = Liveme
  if (appSettings.get('auth.email') && appSettings.get('auth.password')) {
    global.Liveme.setAuthDetails(appSettings.get('auth.email').trim(), appSettings.get('auth.password').trim())
      .catch(e => console.log('Authentication failed.', JSON.stringify(e.message)))
  }

  global.DataManager = new DataManager()
  global.DataManager.loadFromDisk()

  // Save data every 10 minutes, just in case app crashes and it doesn't emit close event.
  setInterval(() => global.DataManager.saveToDisk(), 10 * 60 * 1000)

  mainWindow.on('close', () => {
    global.DataManager.saveToDisk()

    appSettings.set('position.mainWindow', mainWindow.getPosition())
    appSettings.set('size.mainWindow', mainWindow.getSize())

    if (playerWindow !== null) {
      playerWindow.close()
    }
    if (bookmarksWindow !== null) {
      bookmarksWindow.close()
    }
    setTimeout(() => app.quit(), 1000)
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
  if (mainWindow === null) {
    createWindow()
  }
})

/**
 * IPC Events
 */
ipcMain.on('router.push', (event, arg) => {
  mainWindow.webContents.send('router.push', arg)
})

ipcMain.on('open-player', (event, arg) => {
  const internalPlayer = appSettings.get('general.playerpath')
  let playerPath = internalPlayer

  if (playerPath.length > 5) {
    Liveme.getVideoInfo(arg.videoid)
      .then(video => exec(playerPath.replace('%url%', video.hlsvideosource)))
      .catch(err => console.log(err))
  } else {
    const windowURL = process.env.NODE_ENV === 'development'
      ? `http://localhost:9080/#/player/${arg.videoid}`
      : `file://${__dirname}/index.html#player/${arg.videoid}`
    // Internal Player
    if (playerWindow === null) {
      playerWindow = windows.player()
      playerWindow.on('close', () => {
        appSettings.set('position.playerWindow', playerWindow.getPosition())
        appSettings.set('size.playerWindow', playerWindow.getSize())
        playerWindow = null
        playerWindow.webContents.session.clearCache()
      })
    }
    playerWindow.loadURL(windowURL)
  }
})

ipcMain.on('open-bookmarks', (event, arg) => {
  const bookmarkURL = process.env.NODE_ENV === 'development'
    ? `http://localhost:9080/#/bookmarks`
    : `file://${__dirname}/index.html#bookmarks`

  if (bookmarksWindow === null) {
    bookmarksWindow = windows.bookmarks()
  } else {
    bookmarksWindow.restore()
    bookmarksWindow.show()
  }

  bookmarksWindow.on('close', () => {
    appSettings.set('position.bookmarksWindow', bookmarksWindow.getPosition())
    appSettings.set('size.bookmarksWindow', bookmarksWindow.getSize())
    bookmarksWindow = null
    bookmarksWindow.webContents.session.clearCache()
  })
  bookmarksWindow.on('ready-to-show', () => {
    bookmarksWindow.show()
  }).loadURL(bookmarkURL)
})

ipcMain.on('open-followings', (event, arg) => {
  const windowURL = process.env.NODE_ENV === 'development'
    ? `http://localhost:9080/#/favorites/${arg.user.uid}?type=Following&name=${arg.user.nickname}`
    : `file://${__dirname}/index.html#favorites/${arg.user.uid}?type=Following&name=${arg.user.nickname}`

  let window = windows.favorites('followings')
  window.on('ready-to-show', () => {
    window.show()
  }).on('close', () => {
    appSettings.set('position.followingsWindow', window.getPosition())
    window = null
    window.webContents.session.clearCache()
  }).loadURL(windowURL)
})

ipcMain.on('open-followers', (event, arg) => {
  const windowURL = process.env.NODE_ENV === 'development'
    ? `http://localhost:9080/#/favorites/${arg.user.uid}?type=Fans&name=${arg.user.nickname}`
    : `file://${__dirname}/index.html#favorites/${arg.user.uid}?type=Fans&name=${arg.user.nickname}`

  let window = windows.favorites('fans')
  window.on('ready-to-show', () => {
    window.show()
  }).on('close', () => {
    appSettings.set('position.fansWindow', window.getPosition())
    window = null
    window.webContents.session.clearCache()
  }).loadURL(windowURL)
})

ipcMain.on('open-comments', (event, arg) => {
  const windowURL = process.env.NODE_ENV === 'development'
    ? `http://localhost:9080/#/comments?vtime=${arg.vtime}&msgfile=${arg.msgfile}`
    : `file://${__dirname}/index.html#comments?vtime=${arg.vtime}&msgfile=${arg.msgfile}`

  let window = windows.comments()
  window.on('ready-to-show', () => {
    window.show()
  }).on('close', () => {
    appSettings.set('position.followingsWindow', window.getPosition())
    window = null
    window.webContents.session.clearCache()
  }).loadURL(windowURL)
})
