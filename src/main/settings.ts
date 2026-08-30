// Settings + window-bounds persistence. Small key/value state that doesn't
// belong in the task DB lives here as a single JSON file in the app-data dir.

import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync } from 'fs'
import type { Settings, WindowBounds } from '../shared/types'

interface PersistedState {
  settings: Settings
  bounds: WindowBounds
}

const DEFAULTS: PersistedState = {
  settings: {
    alwaysOnTop: false,
    launchOnLogin: false,
    theme: 'system',
    showCompleted: false,
    notificationsEnabled: true
  },
  bounds: { width: 420, height: 640 }
}

let state: PersistedState
let file: string

function filePath(): string {
  return join(app.getPath('userData'), 'settings.json')
}

export function initSettings(): void {
  file = filePath()
  try {
    const raw = JSON.parse(readFileSync(file, 'utf-8'))
    state = {
      settings: { ...DEFAULTS.settings, ...(raw.settings ?? {}) },
      bounds: { ...DEFAULTS.bounds, ...(raw.bounds ?? {}) }
    }
  } catch {
    state = structuredClone(DEFAULTS)
  }
}

function persist(): void {
  try {
    writeFileSync(file, JSON.stringify(state, null, 2), 'utf-8')
  } catch (err) {
    console.error('Failed to persist settings:', err)
  }
}

export function getSettings(): Settings {
  return { ...state.settings }
}

export function updateSettings(patch: Partial<Settings>): Settings {
  state.settings = { ...state.settings, ...patch }
  persist()
  return getSettings()
}

export function getBounds(): WindowBounds {
  return { ...state.bounds }
}

export function saveBounds(bounds: WindowBounds): void {
  state.bounds = bounds
  persist()
}
