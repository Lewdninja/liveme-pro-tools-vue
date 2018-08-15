const { remote } = require('electron')
const Liveme = remote.getGlobal('Liveme')
const DataManager = remote.getGlobal('DataManager')

const videoID = value => {
  return Liveme.getVideoInfo(value)
    .then(video => {
      if (!video.videosource.length) {
        return Promise.reject({
          msg: 'Video not found, either it never existed or it was deleted from the servers.'
        })
      }

      return userID(video.userid)
    })
}

const userID = value => {
  return Liveme.getUserInfo(value)
}

const shortID = value => {
  return Liveme.performSearch(value, 1, 1, 1)
    .then(res => {
      if (!res.length) {
        return Promise.reject({
          msg: 'User with that short id was not found.'
        })
      }

      return userID(res[0].user_id)
    })
}

const username = (value, page, count = 10) => {
  return new Promise((resolve, reject) => {
    Liveme.performSearch(value, page, count, 1)
      .then(results => {
        const data = []
        for (const result of results) {
          Liveme.getUserInfo(result.user_id)
            .then(user => {
              user.viewed = DataManager.wasProfileViewed(user.user_info.uid)
              user.viewedNow = false
              user.bookmarked = DataManager.isBookmarked(user.user_info)
              user.sex = Number(user.sex) < 0 ? '' : (Number(user.sex) === 0 ? 'female' : 'male')
              data.push(user)
            })
            .catch(err => console.log(err))
        }
        resolve(data)
      })
      .catch(err => reject(err))
  })
}

const hashtag = (value, page, count = 10) => {
  return new Promise((resolve, reject) => {
    Liveme.performSearch(value, page, count, 2)
      .then(results => {
        const data = []
        for (const result of results) {
          Liveme.getUserInfo(result.userid)
            .then(user => {
              user.viewed = DataManager.wasProfileViewed(user.user_info.uid)
              user.viewedNow = false
              user.bookmarked = DataManager.isBookmarked(user.user_info)
              user.sex = Number(user.sex) < 0 ? '' : (Number(user.sex) === 0 ? 'female' : 'male')
              data.push({
                ...user,
                result
              })
            })
            .catch(err => console.log(err))
        }
        resolve(data)
      })
      .catch(err => reject(err))
  })
}

export default {
  userID,
  shortID,
  videoID,
  username,
  hashtag
}
