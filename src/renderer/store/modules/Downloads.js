const state = {
  queue: []
}

const exists = x => {
  for (const file of state.queue) {
    if (file.vid === x.vid) return true
  }
  return false
}

const mutations = {
  addDownload (state, data) {
    if (!exists(data)) {
      state.queue.push({
        ...data,
        status: 'Queued for download',
        progress: 0
      })
    }
  },
  removeDownload (state, data) {
    if (exists(data)) {
      for (const index in state.queue) {
        if (state.queue[index].vid === data.vid) {
          state.queue.splice(index, 1)
          break
        }
      }
    }
  },
  updateDownload (state, data) {
    for (const i in state.queue) {
      if (state.queue[i].vid === data.vid) {
        Object.assign(state.queue[i], data)
        break
      }
    }
  }
}

const actions = {}

export default {
  state,
  mutations,
  actions
}
