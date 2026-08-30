// IPC handlers — the typed boundary between renderer requests and the main
// process. Channel names are mirrored by the preload bridge.

import { app, ipcMain, BrowserWindow } from 'electron'
import type { Settings, TaskInput, TaskPatch } from '../shared/types'
import {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  setCompleted,
  listTopics,
  reorderTasks
} from './db'
import { getSettings, updateSettings } from './settings'
import { resetNotified } from './notifications'

/** Apply OS-level side effects that must follow certain settings changes. */
function applySettingsSideEffects(patch: Partial<Settings>, win: BrowserWindow | null): void {
  if (patch.alwaysOnTop !== undefined && win) {
    win.setAlwaysOnTop(patch.alwaysOnTop)
  }
  if (patch.launchOnLogin !== undefined) {
    app.setLoginItemSettings({ openAtLogin: patch.launchOnLogin })
  }
}

/** Notify the renderer that settings changed (e.g. theme toggled from tray). */
export function broadcastSettings(): void {
  const settings = getSettings()
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send('settings:changed', settings)
  }
}

export function registerIpc(getWindow: () => BrowserWindow | null): void {
  ipcMain.handle('tasks:list', () => listTasks())
  ipcMain.handle('tasks:create', (_e, input: TaskInput) => {
    const t = createTask(input)
    resetNotified()
    return t
  })
  ipcMain.handle('tasks:update', (_e, id: number, patch: TaskPatch) => {
    const t = updateTask(id, patch)
    resetNotified()
    return t
  })
  ipcMain.handle('tasks:remove', (_e, id: number) => deleteTask(id))
  ipcMain.handle('tasks:setCompleted', (_e, id: number, completed: boolean) =>
    setCompleted(id, completed)
  )
  ipcMain.handle('tasks:topics', () => listTopics())
  ipcMain.handle('tasks:reorder', (_e, orderedIds: number[]) => reorderTasks(orderedIds))

  ipcMain.handle('settings:get', () => getSettings())
  ipcMain.handle('settings:update', (_e, patch: Partial<Settings>) => {
    const next = updateSettings(patch)
    applySettingsSideEffects(patch, getWindow())
    return next
  })

  ipcMain.on('window:minimize', () => getWindow()?.minimize())
  ipcMain.on('window:hide', () => getWindow()?.hide())
}
