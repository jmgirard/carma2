const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', {
  openVideo: () => ipcRenderer.invoke('dialog:openVideo'),
  saveRatings: (data) => ipcRenderer.invoke('saveRatings', data),
  sendEvent: () => ipcRenderer.send('ratingEvent'),
  onVideoLoaded: (cb) => ipcRenderer.on('video-loaded', (_, path) => cb(path)),
  onVideoUnload: (cb) => ipcRenderer.on('video-unload', cb),
  onLayoutChange: (cb) => ipcRenderer.on('set-layout', (_, layout) => cb(layout)),
  onSettingsOpen: (cb) => ipcRenderer.on('open-settings', cb),
  onSaveRequest: (cb) => ipcRenderer.on('menu-trigger-save', cb)
});