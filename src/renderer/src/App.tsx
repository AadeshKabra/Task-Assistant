import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Settings, Task, TaskInput, TaskPatch } from '@shared/types'
import { useToday } from './hooks/useToday'
import { filterTasks, sortTasks, groupByTopic, type FilterState } from './lib/filter'
import Header from './components/Header'
import FilterBar from './components/FilterBar'
import TaskList from './components/TaskList'
import WeekView from './components/WeekView'
import TaskForm from './components/TaskForm'
import SettingsPanel from './components/SettingsPanel'

type View = 'list' | 'week'

const DEFAULT_FILTER: FilterState = {
  dateBuckets: new Set(),
  topics: new Set(),
  showCompleted: false,
  search: '',
  sortKey: 'dueDate',
  sortDir: 'asc'
}

function applyTheme(theme: Settings['theme']): void {
  const resolved =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme
  document.documentElement.dataset.theme = resolved
}

export default function App(): JSX.Element {
  const now = useToday()
  const [tasks, setTasks] = useState<Task[]>([])
  const [topics, setTopics] = useState<string[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER)
  const [groupBy, setGroupBy] = useState(false)
  const [view, setView] = useState<View>('list')

  const [editing, setEditing] = useState<Task | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Never throws — every mutation handler below calls this to resync after
  // its own IPC call, whether that call succeeded or failed, so this is the
  // one place that has to stay safe to await unconditionally.
  const reload = useCallback(async () => {
    try {
      const [t, tp] = await Promise.all([window.api.tasks.list(), window.api.tasks.topics()])
      setTasks(t)
      setTopics(tp)
    } catch {
      setError('Could not refresh your tasks. Try restarting the app.')
    }
  }, [])

  // Initial load + settings + main-process event subscriptions.
  useEffect(() => {
    void reload()
    void window.api.settings
      .get()
      .then((s) => {
        setSettings(s)
        setFilter((f) => ({ ...f, showCompleted: s.showCompleted }))
        applyTheme(s.theme)
      })
      .catch(() => setError('Could not load settings. Try restarting the app.'))

    const offSettings = window.api.onSettingsChanged((s) => {
      setSettings(s)
      applyTheme(s.theme)
    })
    const offOpen = window.api.onOpenSettings(() => setSettingsOpen(true))

    // React to OS theme changes while in "system" mode.
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onSystemTheme = (): void => {
      void window.api.settings.get().then((s) => s.theme === 'system' && applyTheme('system'))
    }
    mq.addEventListener('change', onSystemTheme)

    return () => {
      offSettings()
      offOpen()
      mq.removeEventListener('change', onSystemTheme)
    }
  }, [reload])

  // ---- task actions ----
  const handleCreate = useCallback(
    async (input: TaskInput) => {
      await window.api.tasks.create(input)
      await reload()
    },
    [reload]
  )
  const handleUpdate = useCallback(
    async (id: number, patch: TaskPatch) => {
      await window.api.tasks.update(id, patch)
      await reload()
    },
    [reload]
  )
  const handleDelete = useCallback(
    async (id: number) => {
      // Permanent hard-delete from the SQLite DB — confirm first (no undo).
      const task = tasks.find((t) => t.id === id)
      const label = task ? `"${task.title}"` : 'this task'
      const ok = window.confirm(`Delete ${label} permanently? This cannot be undone.`)
      if (!ok) return
      // Optimistic: drop the row immediately. reload() always follows — on
      // success it's just a resync, on failure it's what undoes this and
      // brings the row back, since the server is the source of truth.
      setTasks((ts) => ts.filter((t) => t.id !== id))
      try {
        await window.api.tasks.remove(id)
      } catch {
        setError(`Could not delete ${label}. Please try again.`)
      }
      await reload()
    },
    [tasks, reload]
  )
  const handleToggle = useCallback(
    async (task: Task) => {
      // Optimistic: flip the checkbox immediately — this is the single most
      // frequent action in the app, so the perceived response shouldn't
      // wait on the round trip. reload() always follows: on success it's
      // what picks up a recurring task's freshly-spawned next occurrence;
      // on failure it's what reverts this back to the real state.
      const next = !task.completed
      setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, completed: next } : t)))
      try {
        await window.api.tasks.setCompleted(task.id, next)
      } catch {
        setError(`Could not update "${task.title}". Please try again.`)
      }
      await reload()
    },
    [reload]
  )
  const handleReorder = useCallback(
    async (orderedIds: number[]) => {
      try {
        await window.api.tasks.reorder(orderedIds)
      } catch {
        setError('Could not save the new order. Please try again.')
      }
      await reload()
    },
    [reload]
  )

  /**
   * Move a topic one step up/down relative to its neighbour in `visibleOrder`
   * (the groups currently on screen), then persist the full topic list.
   */
  const handleMoveTopic = useCallback(
    async (topic: string, dir: -1 | 1, visibleOrder: string[]) => {
      const i = visibleOrder.indexOf(topic)
      const neighbour = visibleOrder[i + dir]
      if (i === -1 || neighbour === undefined) return
      const next = [...topics]
      const a = next.indexOf(topic)
      const b = next.indexOf(neighbour)
      if (a === -1 || b === -1) return
      ;[next[a], next[b]] = [next[b], next[a]]
      setTopics(next) // optimistic — keeps the UI snappy
      try {
        await window.api.tasks.reorderTopics(next)
      } catch {
        setError('Could not save the new topic order. Please try again.')
      }
      await reload()
    },
    [topics, reload]
  )

  const handleSettings = useCallback(async (patch: Partial<Settings>) => {
    try {
      const next = await window.api.settings.update(patch)
      setSettings(next)
      applyTheme(next.theme)
      if (patch.showCompleted !== undefined) {
        setFilter((f) => ({ ...f, showCompleted: next.showCompleted }))
      }
    } catch {
      setError('Could not save settings. Please try again.')
    }
  }, [])

  // ---- derived view ----
  const visible = useMemo(() => {
    const filtered = filterTasks(tasks, filter, now)
    return sortTasks(filtered, filter, now)
  }, [tasks, filter, now])

  const groups = useMemo(
    () => (groupBy ? groupByTopic(visible, topics) : null),
    [groupBy, visible, topics]
  )

  // Week view: same topic/search/showCompleted filtering, but date buckets and
  // sort don't apply — WeekView arranges tasks by weekday itself.
  const weekTasks = useMemo(
    () => filterTasks(tasks, { ...filter, dateBuckets: new Set() }, now),
    [tasks, filter, now]
  )

  const openAdd = (): void => {
    setEditing(null)
    setFormOpen(true)
  }
  const openEdit = (task: Task): void => {
    setEditing(task)
    setFormOpen(true)
  }

  return (
    <div className="app">
      <Header
        now={now}
        onAdd={openAdd}
        onOpenSettings={() => setSettingsOpen(true)}
        onHide={() => window.api.window.hide()}
        onMinimize={() => window.api.window.minimize()}
      />

      <nav className="tabbar no-drag">
        <button
          className={`tab ${view === 'list' ? 'tab-on' : ''}`}
          onClick={() => setView('list')}
        >
          All tasks
        </button>
        <button
          className={`tab ${view === 'week' ? 'tab-on' : ''}`}
          onClick={() => setView('week')}
        >
          This week
        </button>
      </nav>

      <FilterBar
        filter={filter}
        onChange={setFilter}
        topics={topics}
        groupBy={groupBy}
        onToggleGroupBy={() => setGroupBy((g) => !g)}
        showDateAndSort={view === 'list'}
      />

      {error && (
        <div className="error-banner" role="alert">
          <span>{error}</span>
          <button className="icon-btn" onClick={() => setError(null)} aria-label="Dismiss">
            ✕
          </button>
        </div>
      )}

      <main className="content">
        {view === 'list' ? (
          <TaskList
            tasks={visible}
            groups={groups}
            now={now}
            strikeCompleted={settings?.showCompleted ?? false}
            reorderable={filter.sortKey === 'dueDate' && filter.sortDir === 'asc'}
            onToggle={handleToggle}
            onEdit={openEdit}
            onDelete={handleDelete}
            onReorder={handleReorder}
            onMoveTopic={handleMoveTopic}
          />
        ) : (
          <WeekView
            tasks={weekTasks}
            now={now}
            strikeCompleted={settings?.showCompleted ?? false}
            onToggle={handleToggle}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        )}
      </main>

      {formOpen && (
        <TaskForm
          task={editing}
          existingTopics={topics}
          onCancel={() => setFormOpen(false)}
          onSubmit={async (input) => {
            try {
              if (editing) await handleUpdate(editing.id, input)
              else await handleCreate(input)
              setFormOpen(false)
            } catch {
              // Leave the modal open with the user's input intact so they
              // can retry; TaskForm resets its own submitting state on
              // this rejection.
              setError(
                editing
                  ? 'Could not save your changes. Please try again.'
                  : 'Could not add the task. Please try again.'
              )
              throw new Error('submit failed')
            }
          }}
        />
      )}

      {settingsOpen && settings && (
        <SettingsPanel
          settings={settings}
          onChange={handleSettings}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  )
}
