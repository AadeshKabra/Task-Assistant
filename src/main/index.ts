// Main process entry point. Owns the window lifecycle, OS integration (tray,
// login item, always-on-top), persistence bootstrap, and IPC registration.

import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'
import { initDb } from './db'
import { initSettings, getSettings, getBounds, saveBounds } from './settings'
import { registerIpc, broadcastSettings } from './ipc'
import { createTray, destroyTray } from './tray'
import { startNotifications, stopNotifications } from './notifications'

let mainWindow: BrowserWindow | null = null
let isQuitting = false

// Single-instance: focus the existing window instead of opening a second one.
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => showWindow())
}

function createWindow(): void {
  const bounds = getBounds()
  const settings = getSettings()

  // Window/taskbar icon in dev. In the packaged app the exe icon (set by
  // electron-builder) is used; guarded so a missing file is a harmless no-op.
  const iconPath = join(__dirname, '../../build/icon.ico')
  const icon = existsSync(iconPath) ? iconPath : undefined

  mainWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    minWidth: 340,
    minHeight: 420,
    show: false,
    frame: false, // frameless — custom minimal chrome drawn in the renderer
    backgroundColor: '#1e1f24',
    icon,
    alwaysOnTop: settings.alwaysOnTop,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false // required so the preload can `require` in this setup
    }
  })

  mainWindow.once('ready-to-show', () => showWindow())

  // Persist size/position (debounced) whenever the user moves or resizes.
  let saveTimer: NodeJS.Timeout | null = null
  // Maximized/minimized geometry is never saved, so the app always reopens as
  // the user's normal small window.
  const remember = (): void => {
    if (!mainWindow || mainWindow.isMinimized() || mainWindow.isMaximized()) return
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      if (!mainWindow || mainWindow.isMinimized() || mainWindow.isMaximized()) return
      const b = mainWindow.getBounds()
      saveBounds({ x: b.x, y: b.y, width: b.width, height: b.height })
    }, 400)
  }
  mainWindow.on('resize', remember)
  mainWindow.on('move', remember)

  // Keep the renderer's maximize/restore button icon in sync (also covers
  // Win+Up, Aero Snap and double-clicking the header drag region).
  const sendMaximized = (): void => {
    mainWindow?.webContents.send('window:maximized-changed', mainWindow.isMaximized())
  }
  mainWindow.on('maximize', sendMaximized)
  mainWindow.on('unmaximize', sendMaximized)

  // Closing the window hides it to the tray; the app keeps running. Real quit
  // goes through the tray "Quit" item (or app.quit), which sets isQuitting.
  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault()
      mainWindow?.hide()
    }
  })
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Open external links in the OS browser, never in-app.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function showWindow(): void {
  if (!mainWindow) {
    createWindow()
    return
  }
  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.show()
  mainWindow.focus()
}

function openSettings(): void {
  showWindow()
  mainWindow?.webContents.send('ui:open-settings')
}

app.whenReady().then(() => {
  initSettings()
  initDb()

  // Sync OS login-item state with the stored preference on every launch.
  app.setLoginItemSettings({ openAtLogin: getSettings().launchOnLogin })

  registerIpc(() => mainWindow)
  createWindow()
  createTray(() => mainWindow, showWindow, openSettings)
  startNotifications()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
    else showWindow()
  })
})

// Keep running when all windows are "closed" (hidden to tray) on all platforms.
app.on('window-all-closed', () => {
  // Intentionally do not quit — this is a resident tray app.
})

app.on('before-quit', () => {
  isQuitting = true
  stopNotifications()
  destroyTray()
})

// Re-broadcast settings after they change so any open window stays in sync.
export { broadcastSettings }
