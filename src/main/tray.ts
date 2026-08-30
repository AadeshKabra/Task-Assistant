// Tray / menu-bar icon: show/hide the window, open settings, quit.

import { Tray, Menu, nativeImage, BrowserWindow, app } from 'electron'

let tray: Tray | null = null

// A tiny checklist glyph drawn as an inline data URI so we don't ship a binary
// asset. 16x16 is fine for the Windows tray.
const ICON_DATA_URI =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAd0lEQVR42u3TMQ6AIAxA0Z7/0nVwcHFwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwvgFVAwFBxwT6BAAAAABJRU5ErkJggg=='

export function createTray(
  getWindow: () => BrowserWindow | null,
  showWindow: () => void,
  openSettings: () => void
): void {
  const image = nativeImage.createFromDataURL(ICON_DATA_URI)
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
