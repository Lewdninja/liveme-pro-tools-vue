import { BrowserWindow } from 'electron'

const path = require('path')
const appSettings = require('electron-settings')

const icon = path.join(__dirname, '../renderer/assets/appicon.ico')

const main = () => {
  const winPosition = appSettings.get('position.mainWindow')
  const winSize = appSettings.get('size.mainWindow')

  return new BrowserWindow({
    icon,
    x: winPosition[0] > -1 ? winPosition[0] : null,
    y: winPosition[1] > -1 ? winPosition[1] : null,
    width: winSize[0],
    height: winSize[1],
    minWidth: 1024,
    maxWidth: 1600,
    minHeight: 480,
    maxHeight: 1200,
    autoHideMenuBar: true,
    disableAutoHideCursor: true,
    maximizable: false,
    frame: false,
    backgroundColor: '#000',
    useContentSize: true,
    show: false,
    webPreferences: {
      webSecurity: false,
      textAreasAreResizable: false,
      plugins: true
    }
  })
}

const bookmarks = () => {
  const winPosition = appSettings.get('position.bookmarksWindow')
  const winSize = appSettings.get('size.bookmarksWindow')

  return new BrowserWindow({
    icon,
    x: winPosition[0] > -1 ? winPosition[0] : null,
    y: winPosition[1] > -1 ? winPosition[1] : null,
    width: 420,
    height: winSize[1],
    minWidth: 420,
    maxWidth: 420,
    minHeight: 480,
    maxHeight: 1200,
    darkTheme: true,
    autoHideMenuBar: false,
    disableAutoHideCursor: true,
    titleBarStyle: 'default',
    fullscreen: false,
    maximizable: false,
    frame: false,
    show: false,
    backgroundColor: '#000000'
  })
}

const comments = () => {
  return new BrowserWindow({
    icon,
    width: 400,
    height: 660,
    resizable: false,
    darkTheme: false,
    autoHideMenuBar: true,
    skipTaskbar: false,
    backgroundColor: '#000000',
    disableAutoHideCursor: true,
    titleBarStyle: 'default',
    fullscreen: false,
    maximizable: false,
    closable: true,
    frame: false,
    show: false
  })
}

const favorites = (type) => {
  if (['fans', 'followings'].indexOf(type) === -1) {
    return false // Invalid type
  }
  const winPosition = appSettings.get(`position.${type}Window`) ? appSettings.get(`position.${type}Window`) : [-1, -1]

  return new BrowserWindow({
    icon,
    x: winPosition[0] !== -1 ? winPosition[0] : null,
    y: winPosition[1] !== -1 ? winPosition[1] : null,
    width: 420,
    height: 720,
    resizable: false,
    darkTheme: false,
    autoHideMenuBar: true,
    skipTaskbar: false,
    backgroundColor: '#000000',
    disableAutoHideCursor: true,
    titleBarStyle: 'default',
    fullscreen: false,
    maximizable: false,
    closable: true,
    frame: false,
    show: false
  })
}

const player = () => {
  const winPosition = appSettings.get('position.playerWindow')
  const winSize = appSettings.get('size.playerWindow')

  return new BrowserWindow({
    icon: path.join(__dirname, 'appicon.ico'),
    width: winSize[0],
    height: winSize[1],
    x: winPosition[0] !== -1 ? winPosition[0] : null,
    y: winPosition[1] !== -1 ? winPosition[1] : null,
    minWidth: 380,
    minHeight: 708,
    darkTheme: true,
    autoHideMenuBar: false,
    disableAutoHideCursor: true,
    titleBarStyle: 'default',
    fullscreen: false,
    maximizable: false,
    frame: false,
    show: false,
    backgroundColor: '#000000',
    webPreferences: {
      webSecurity: false,
      textAreasAreResizable: false,
      plugins: true
    }
  })
}

export default {
  main,
  bookmarks,
  comments,
  favorites,
  player
}
