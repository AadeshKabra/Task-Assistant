// Preload bridge. Runs with contextIsolation ON / nodeIntegration OFF and is the
// ONLY surface the renderer can reach the main process through. Exposes a small,
// typed `window.api` — no raw ipcRenderer, no Node access leaks to the page.

import { contextBridge, ipcRenderer } from 'electron'
import type { Api, Settings, TaskInput, TaskPatch } from '../shared/types'

const api: Api = {
  tasks: {
    list: () => ipcRenderer.invoke('tasks:list'),
    create: (input: TaskInput) => ipcRenderer.invoke('tasks:create', input),
    update: (id: number, patch: TaskPatch) => ipcRenderer.invoke('tasks:update', id, patch),
    remove: (id: number) => ipcRenderer.invoke('tasks:remove', id),
    setCompleted: (id: number, completed: boolean) =>
      ipcRenderer.invoke('tasks:setCompleted', id, completed),
    topics: () => ipcRenderer.invoke('tasks:topics'),
    reorder: (orderedIds: number[]) => ipcRenderer.invoke('tasks:reorder', orderedIds)
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    update: (patch: Partial<Settings>) => ipcRenderer.invoke('settings:update', patch)
  },
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    hide: () => ipcRenderer.send('window:hide')
  },
  onSettingsChanged: (cb) => {
    const listener = (_e: unknown, settings: Settings): void => cb(settings)
    ipcRenderer.on('settings:changed', listener)
    return () => ipcRenderer.removeListener('settings:changed', listener)
  },
  onOpenSettings: (cb) => {
    const listener = (): void => cb()
    ipcRenderer.on('ui:open-settings', listener)
    return () => ipcRenderer.removeListener('ui:open-settings', listener)
  }
}

contextBridge.exposeInMainWorld('api', api)
