// Shared type contract between the main process (data layer / OS integration)
// and the renderer (UI). Imported by both sides plus the preload bridge.

export type Priority = 'low' | 'medium' | 'high'

export type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly'

export interface Task {
  id: number
  title: string
  /** Free-text topic/subject used for filtering. Empty string = no topic. */
  topic: string
  /** ISO calendar date 'YYYY-MM-DD', or null for "no due date". Local time. */
  dueDate: string | null
  /** 'HH:MM' 24h local time, or null. Only meaningful when dueDate is set. */
  dueTime: string | null
  priority: Priority
  notes: string
  completed: boolean
  recurrence: Recurrence
  /** Manual sort order; used as the tiebreaker among tasks with the same due date. */
  position: number
  createdAt: string
  updatedAt: string
  completedAt: string | null
}

/** Fields a caller supplies when creating a task. */
export interface TaskInput {
  title: string
  topic?: string
  dueDate?: string | null
  dueTime?: string | null
  priority?: Priority
  notes?: string
  recurrence?: Recurrence
}

/** Partial patch for editing an existing task. */
export type TaskPatch = Partial<TaskInput> & { completed?: boolean }

export type SortKey = 'dueDate' | 'priority' | 'title' | 'createdAt'
export type SortDir = 'asc' | 'desc'

export type ThemePref = 'system' | 'light' | 'dark'

export interface Settings {
  alwaysOnTop: boolean
  launchOnLogin: boolean
  theme: ThemePref
  showCompleted: boolean
  notificationsEnabled: boolean
}

export interface WindowBounds {
  x?: number
  y?: number
  width: number
  height: number
}

/** The typed API exposed on window.api by the preload bridge. */
export interface Api {
  tasks: {
    list(): Promise<Task[]>
    create(input: TaskInput): Promise<Task>
    update(id: number, patch: TaskPatch): Promise<Task | null>
    remove(id: number): Promise<boolean>
    setCompleted(id: number, completed: boolean): Promise<Task | null>
    /** Distinct topics in the user's chosen display order. */
    topics(): Promise<string[]>
    /** Persist a manual order for a set of tasks (a same-due-date cluster). */
    reorder(orderedIds: number[]): Promise<void>
    /** Persist the display order of topics (full list, top to bottom). */
    reorderTopics(ordered: string[]): Promise<void>
  }
  settings: {
    get(): Promise<Settings>
    update(patch: Partial<Settings>): Promise<Settings>
  }
  window: {
    minimize(): void
    hide(): void
    /** Maximize the window, or restore it to its normal size if maximized. */
    toggleMaximize(): void
    isMaximized(): Promise<boolean>
  }
  /** Fired when the window is maximized or restored (by any means). */
  onMaximizedChanged(cb: (maximized: boolean) => void): () => void
  /** Fired by the main process when settings change elsewhere (e.g. via tray). */
  onSettingsChanged(cb: (settings: Settings) => void): () => void
  /** Fired when the user picks "Settings" from the tray menu. */
  onOpenSettings(cb: () => void): () => void
}
