const { app, BrowserWindow, dialog, ipcMain, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let win;
let menuItems = {};
let unsavedRatings = false;

function createWindow() {
  win = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile('index.html');
  win.maximize();

  // Your existing menu setup remains unchanged
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{ label: app.name, submenu: [{ role: 'about' }, { type: 'separator' }, { role: 'quit' }] }] : []),
    {
      label: 'File',
      submenu: [
        { id: 'openVideo', label: 'Open Video...', accelerator: 'CmdOrCtrl+O', click: openVideo },
        { id: 'unloadVideo', label: 'Unload Video', enabled: false, click: async () => {
            if (unsavedRatings) {
              const { response } = await dialog.showMessageBox(win, {
                type: 'warning', buttons: ['Cancel','Unload'], defaultId: 1, cancelId: 0,
                title: 'Confirm Unload', message: 'Any unsaved ratings will be lost. Unload video?'
              });
              if (response !== 1) return;
            }
            win.webContents.send('video-unload');
            unsavedRatings = false;
            updateMenu(false);
          } },
        { id: 'saveRatings', label: 'Save Ratings...', accelerator: 'CmdOrCtrl+S', enabled: false, click: () => {
            win.webContents.send('menu-trigger-save');
          } },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { id: 'layoutBelow', label: 'Slider Below', type: 'radio', checked: true, click: () => win.webContents.send('set-layout', 'below') },
        { id: 'layoutRight', label: 'Slider Right', type: 'radio', click: () => win.webContents.send('set-layout', 'right') }
      ]
    },
    {
      label: 'Settings',
      submenu: [
        { id: 'sliderSettings', label: 'Slider Options...', click: () => win.webContents.send('open-settings') }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  menuItems = {
    openVideo: menu.getMenuItemById('openVideo'),
    unloadVideo: menu.getMenuItemById('unloadVideo'),
    saveRatings: menu.getMenuItemById('saveRatings'),
    layoutBelow: menu.getMenuItemById('layoutBelow'),
    layoutRight: menu.getMenuItemById('layoutRight'),
    sliderSettings: menu.getMenuItemById('sliderSettings')
  };
  updateMenu(false);
}

async function openVideo() {
  const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ['openFile'], filters: [{ name: 'Video Files', extensions: ['mp4','mov','avi','mkv'] }] });
  if (!canceled && filePaths.length) {
    win.webContents.send('video-loaded', filePaths[0]);
    unsavedRatings = false;
    updateMenu(true);
  }
}

ipcMain.handle('saveRatings', async (e, bins) => {
  const { filePath, canceled } = await dialog.showSaveDialog({ defaultPath: 'ratings.csv', filters: [{ name: 'CSV', extensions: ['csv'] }] });
  if (canceled || !filePath) return null;
  const data = 'time,rating\n' + bins.map(b => `${b.time},${b.value}`).join('\n');
  fs.writeFileSync(filePath, data);
  unsavedRatings = false;
  menuItems.saveRatings.enabled = false;
  return filePath;
});

ipcMain.on('ratingEvent', () => {
  unsavedRatings = true;
  menuItems.saveRatings.enabled = true;
});

function updateMenu(loaded) {
  menuItems.openVideo.enabled = !loaded;
  menuItems.unloadVideo.enabled = loaded;
  menuItems.saveRatings.enabled = loaded;
  menuItems.layoutBelow.enabled = !loaded;
  menuItems.layoutRight.enabled = !loaded;
  menuItems.sliderSettings.enabled = !loaded;
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
