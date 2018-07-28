const events = require('events')
const path = require('path')
const fs = require('fs')
const { app } = require('electron')

let bookmarks = []
let profiles = []
let downloaded = []
let watched = []
let errored = []
let queued = []
let isBusy = false
let canWrite = true

export class DataManager {
  constructor () {
    this.events = new (events.EventEmitter)()
  }

  disableWrites () {
    canWrite = false
  }

  enableWrites () {
    canWrite = true
  }

  filePath (file) {
    return path.join(app.getPath('appData'), app.getName(), `${file}.json`)
  }

  loadFileData (file) {
    if (!fs.existsSync(this.filePath(file))) { return [] }
    const data = fs.readFileSync(this.filePath(file), 'utf8')
    if (!data) { return [] }
    try { return JSON.parse(data) } catch (e) { return [] }
  }

  saveFileData (file, data) {
    try {
      if (typeof data !== 'string') data = JSON.stringify(data, null, 2)
      if (data && data.length) {
        console.log(file, data)
        fs.writeFile(this.filePath(file), data, () => {})
      }
    } catch (e) {
      fs.writeFileSync('saveFileDataError.json', e)
    }
  }

  wipeAllData () {
    bookmarks = []
    profiles = []
    downloaded = []
    watched = []
    errored = []
    queued = []

    this.saveFileData(this.filePath('bookmarks'), [])
    this.saveFileData(this.filePath('profiles'), [])
    this.saveFileData(this.filePath('downloaded'), [])
    this.saveFileData(this.filePath('watched'), [])
    this.saveFileData(this.filePath('errored.v1'), [])
    this.saveFileData(this.filePath('queued.v1'), [])
  }

  getStats () {
    return {
      bookmarks: bookmarks.length,
      profiles: profiles.length,
      downloaded: downloaded.length,
      watched: watched.length
    }
  }

  loadFromDisk () {
    bookmarks = this.loadFileData('bookmarks')
    profiles = this.loadFileData('profiles')
    downloaded = this.loadFileData('downloaded')
    watched = this.loadFileData('watched')
    errored = this.loadFileData('errored.v1')
    queued = this.loadFileData('queued.v1')
  }

  saveToDisk () {
    if (isBusy === true || canWrite === false) return setTimeout(() => this.saveToDisk(), 1000)

    this.saveFileData('bookmarks', bookmarks)
    this.saveFileData('profiles', profiles)
    this.saveFileData('downloaded', downloaded)
    this.saveFileData('watched', watched)
    this.saveFileData('errored.v1', errored)
    this.saveFileData('queued.v1', queued)
  }

  /**
   * Track Downloaded Replays
   */
  addDownloaded (vidid) {
    isBusy = true
    let add = true
    let dt = new Date()
    for (var i = 0; i < downloaded.length; i++) {
      if (downloaded[i].videoid === vidid) {
        downloaded[i].dt = Math.floor(dt.getTime() / 1000)
        add = false
      }
    }
    if (add) {
      downloaded.push({
        dt: Math.floor(dt.getTime() / 1000),
        videoid: vidid
      })
    }
    isBusy = false
  }
  wasDownloaded (vidid) {
    var ret = false
    for (var i = 0; i < downloaded.length; i++) {
      if (downloaded[i].videoid === vidid) ret = new Date(downloaded[i].dt * 1000)
    }
    return ret
  }

  /**
   * Track Watched Replays
   */
  addWatched (vidid) {
    isBusy = true
    let add = true
    let dt = new Date()
    for (var i = 0; i < watched.length; i++) {
      if (watched[i].videoid === vidid) {
        watched[i].dt = Math.floor(dt.getTime() / 1000)
        add = false
      }
    }
    if (add) {
      watched.push({
        dt: Math.floor(dt.getTime() / 1000),
        videoid: vidid
      })
    }
    isBusy = false
  }

  wasWatched (vidid) {
    var ret = false
    for (var i = 0; i < watched.length; i++) {
      if (watched[i].videoid === vidid) ret = new Date(watched[i].dt * 1000)
    }
    return ret
  }

  dropWatched (oldestDate, dryRun) {
    if (dryRun == null) dryRun = false

    let ret = 0
    let temp = []

    for (var i = 0; i < watched.length; i++) {
      if (watched[i].dt > oldestDate) {
        temp.push(watched[i])
        ret++
      }
    }
    if (!dryRun) {
      watched = temp
      this.saveFileData('watched', watched)
    }
    return ret
  }

  /**
   * Track Viewed Profiles
   */
  addViewed (userid) {
    isBusy = true
    let add = true
    let dt = new Date()
    for (var i = 0; i < profiles.length; i++) {
      if (profiles[i].userid === userid) {
        profiles[i].dt = Math.floor(dt.getTime() / 1000)
        add = false
      }
    }
    if (add) {
      profiles.push({
        dt: Math.floor(dt.getTime() / 1000),
        userid: userid
      })
    }
    isBusy = false
  }

  wasProfileViewed (userid) {
    let ret = false
    for (var i = 0; i < profiles.length; i++) {
      if (profiles[i].userid === userid) ret = new Date(profiles[i].dt * 1000)
    }
    return ret
  }

  unviewProfiles (oldestDate, dryRun) {
    if (dryRun == null) dryRun = false

    console.log('Old Viewed Profiles Count: ' + profiles.length)

    let ret = 0
    let temp = []
    for (let i = 0; i < profiles.length; i++) {
      if (profiles[i].dt > oldestDate) {
        temp.push(profiles[i])
        ret++
      }
    }
    if (!dryRun) {
      profiles = temp
      this.saveFileData('profiles', profiles)
    }
    console.log('New Viewed Profiles Count: ' + temp.length)
    return ret
  }

  /**
   * Account Bookmarks
   */
  addBookmark (user) {
    isBusy = true
    if (!this.isBookmarked(user.user_info)) {
      bookmarks.push({
        uid: user.user_info.uid,
        shortid: user.user_info.shortid,
        signature: user.user_info.usign,
        sex: (user.user_info.sex === '0' || user.user_info.sex === 'female') ? 'female' : 'male',
        face: user.user_info.face,
        nickname: user.user_info.nickname,
        counts: {
          replays: user.count_info.replay_count,
          friends: user.count_info.friends_count,
          followers: user.count_info.follower_count,
          followings: user.count_info.following_count
        },
        last_viewed: Math.floor((new Date()).getTime() / 1000),
        newest_replay: 0
      })
    }
    isBusy = false
  }

  removeBookmark (user) {
    isBusy = true
    for (const i in bookmarks) {
      if (bookmarks[i].uid === user.uid) {
        bookmarks.splice(i, 1)
        break
      }
    }
    isBusy = false
  }

  updateBookmark (user) {
    isBusy = true
    for (const i in bookmarks) {
      const bookmark = bookmarks[i]
      if (bookmark.uid === user.uid) {
        bookmarks[i] = {...bookmark, ...user}
      }
    }
    isBusy = false
  }

  getAllBookmarks () {
    return bookmarks
  }

  getSingleBookmark (userid) {
    for (const bookmark of bookmarks) {
      if (bookmark.uid === userid) return bookmark
    }
    return false
  }

  isBookmarked (user) {
    return !!this.getSingleBookmark(user.uid)
  }

  /**
   * Queued
   */
  getQueued () {
    return queued
  }

  addToQueueList (video) {
    isBusy = true
    if (!this.isQueued(video)) {
      queued.push(video)
    }
    this.saveFileData('queued.v1', queued)
    isBusy = false
  }

  removeFromQueueList (video) {
    isBusy = true
    for (const i in queued) {
      if (queued[i].vid === video.vid) {
        queued.splice(i, 1)
        break
      }
    }
    this.saveFileData('queued.v1', queued)
    isBusy = false
  }

  isQueued (video) {
    for (const file of queued) {
      if (file.vid === video.vid) return true
    }
    return false
  }

  /**
   * Queued
   */
  addToErroredList (videoID) {
    isBusy = true
    for (const file of errored) {
      if (file === videoID) return
    }
    errored.push(videoID)
    this.saveFileData('errored.v1', errored)
    isBusy = false
  }
}
