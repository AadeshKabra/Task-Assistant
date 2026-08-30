// Tray / menu-bar icon: show/hide the window, open settings, quit.

import { Tray, Menu, nativeImage, BrowserWindow, app } from 'electron'
import { TRAY_ICON_DATA_URI } from './tray-icon'

let tray: Tray | null = null

export function createTray(
  getWindow: () => BrowserWindow | null,
  showWindow: () => void,
  openSettings: () => void
): void {
  const image = nativeImage.createFromDataURL(TRAY_ICON_DATA_URI)
  tray = new Tray(image)
  tray.setToolTip('Task Assistant')

  const menu = Menu.buildFromTemplate([
    { label: 'Show / Hide', click: () => toggleWindow(getWindow, showWindow) },
    { label: 'Settings', click: () => openSettings() },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit()
      }
    }
  ])
  tray.setContextMenu(menu)

  // Left-click toggles visibility (Windows convention).
  tray.on('click', () => toggleWindow(getWindow, showWindow))
}

function toggleWindow(getWindow: () => BrowserWindow | null, showWindow: () => void): void {
  const win = getWindow()
  if (win && win.isVisible() && !win.isMinimized()) {
    win.hide()
  } else {
    showWindow()
  }
}

export function destroyTray(): void {
  tray?.destroy()
  tray = null
}
