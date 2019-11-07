/* eslint-disable */
const { remote, ipcRenderer } = require('electron')
const emit = (event, data) => ipcRenderer.emit(event, data)
const appSettings = require('electron-settings')

const fs = require('fs')
const async = require('async')
const request = require('request')
const ffmpeg = require('fluent-ffmpeg')

const DataManager = remote.getGlobal('DataManager')
const Liveme = remote.getGlobal('Liveme')

export default async.queue((task, done) => {  
  // Set custom FFMPEG path if defined
  if (appSettings.get('downloads.ffmepg')) ffmpeg.setFfmpegPath(appSettings.get('downloads.ffmepg'))
  // Get video info
  Liveme.getVideoInfo(task).then(video => {
    const path = appSettings.get('downloads.path')
    const dt = new Date(video.vtime * 1000)
    const mm = dt.getMonth() + 1
    const dd = dt.getDate()

    let filename = appSettings.get('downloads.template')
      .replace(/%%broadcaster%%/g, video.uname)
      .replace(/%%longid%%/g, video.userid)
      .replace(/%%replayid%%/g, video.vid)
      .replace(/%%replayviews%%/g, video.playnumber)
      .replace(/%%replaylikes%%/g, video.likenum)
      .replace(/%%replayshares%%/g, video.sharenum)
      .replace(/%%replaytitle%%/g, video.title ? video.title : 'untitled')
      .replace(/%%replayduration%%/g, video.videolength)
      .replace(/%%replaydatepacked%%/g, (dt.getFullYear() + (mm < 10 ? '0' : '') + mm + (dd < 10 ? '0' : '') + dd))
      .replace(/%%replaydateus%%/g, ((mm < 10 ? '0' : '') + mm + '-' + (dd < 10 ? '0' : '') + dd + '-' + dt.getFullYear()))
      .replace(/%%replaydateeu%%/g, ((dd < 10 ? '0' : '') + dd + '-' + (mm < 10 ? '0' : '') + mm + '-' + dt.getFullYear()))

    filename = filename.replace(/[/\\?%*:|"<>]/g, '-')
    filename = filename.replace(/([^a-z0-9\s]+)/gi, '-')
    filename = filename.replace(/[\u{0080}-\u{FFFF}]/gu, '')
    filename += '.mp4'
    video._filename = filename

    DataManager.addDownloaded(video.vid)

    switch (appSettings.get('downloads.method')) {
      case 'chunk':
        request(video.hlsvideosource, (err, res, body) => {
          if (err || !body) {
            fs.writeFileSync(`${path}/${filename}-error.log`, JSON.stringify(err, null, 2))
            return done({ vid: task, error: err || 'Failed to fetch m3u8 file.' })
          }
          // Separate ts names from m3u8
          let concatList = ''
          const tsList = []
          body.split('\n').forEach(line => {
            if (line.indexOf('.ts') !== -1) {
              const tsName = line.split('?')[0]
              const tsPath = `${path}/lpt_temp/${video.vid}_${tsName}`
              // Check if TS has already been added to array
              if (concatList.indexOf(tsPath) === -1) {
                // We'll use this later to merge downloaded chunks
                concatList += `${tsPath}|`
                // Push data to list
                tsList.push({ name: tsName, path: tsPath })
              }
            }
          })
          // remove last |
          concatList = concatList.slice(0, -1)
          // Check if tmp dir exists
          if (!fs.existsSync(`${path}/lpt_temp`)) {
            // create temporary dir for ts files
            fs.mkdirSync(`${path}/lpt_temp`)
          }
          // Download chunks
          let downloadedChunks = 0
          async.eachLimit(tsList, 10, (file, next) => {
            const stream = request(`${video.hlsvideosource.split('/').slice(0, -1).join('/')}/${file.name}`)
              .on('error', err => {
                fs.writeFileSync(`${path}/${filename}-error.log`, JSON.stringify(err, null, 2))
                return done({ vid: task, error: err })
              })
              .pipe(
                fs.createWriteStream(file.path)
              )
            // Events
            stream.on('finish', () => {
              downloadedChunks += 1
              emit('updateDownload', {
                vid: task,
                status: `Downloading chunks - ${downloadedChunks} of ${tsList.length}`,
                progress: Math.round((downloadedChunks / tsList.length) * 100)
              })
              next()
            })
          }, () => {
            // Chunks downloaded
            ffmpeg()
              .on('start', c => {
                console.log('started', c)
                emit('updateDownload', {
                  vid: task,
                  status: `Converting stream to MP4.`,
                  progress: 100
                })
              })
              .on('end', (stdout, stderr) => {
                if (appSettings.get('downloads.deltmp')) {
                  tsList.forEach(file => fs.unlinkSync(file.path))
                }
                return done()
              })
              .on('error', (err, stdout, stderr) => {
                fs.writeFileSync(`${path}/${filename}-error.log`, JSON.stringify([err, stdout, stderr], null, 2))
                if (appSettings.get('downloads.deltmp')) {
                  tsList.forEach(file => fs.unlinkSync(file.path))
                }
                return done({ vid: task, error: err })
              })
              .input(`concat:${concatList}`)
              .output(`${path}/${filename}`)
              // .outputOption('-strict -2')
              .outputOptions([
                '-c:v libx264',
                '-q:v 0',
                '-c:a copy',
                '-bsf:a aac_adtstoasc',
                '-vsync 2',
                '-preset superfast'
              ])
              .run()
          })
        })
        break
      default:
        ffmpeg(video.hlsvideosource)
          .outputOptions([
            '-c copy',
            '-bsf:a aac_adtstoasc',
            '-vsync 2',
            '-movflags faststart'
          ])
          .output(path + '/' + filename)
          .on('end', function (stdout, stderr) {
            return done()
          })
          .on('progress', function (progress) {
            // FFMPEG doesn't always have this >.<
            if (!progress.percent) {
              progress.percent = ((progress.targetSize * 1000) / Number(video.videosize)) * 100
            }
            emit('updateDownload', {
              vid: task,
              status: `Downloading stream - ${Math.round(progress.percent)}%`,
              progress: progress.percent
            })
          })
          .on('start', function (c) {
            emit('updateDownload', {
              vid: task,
              status: `Starting..`,
              progress: 0
            })
          })
          .on('error', function (err, stdout, stderr) {
            fs.writeFileSync(`${path}/${filename}-error.log`, JSON.stringify([err, stdout, stderr], null, 2))
            return done({ vid: task, error: err })
          })
          .run()
        break
    }
  })
}, Number(appSettings.get('downloads.parallel')) || 300)
