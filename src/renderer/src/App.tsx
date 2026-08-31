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

  const reload = useCallback(async () => {
    const [t, tp] = await Promise.all([window.api.tasks.list(), window.api.tasks.topics()])
    setTasks(t)
    setTopics(tp)
  }, [])

  // Initial load + settings + main-process event subscriptions.
  useEffect(() => {
    void reload()
    void window.api.settings.get().then((s) => {
      setSettings(s)
      setFilter((f) => ({ ...f, showCompleted: s.showCompleted }))
      applyTheme(s.theme)
    })

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
      await window.api.tasks.remove(id)
      await reload()
    },
    [tasks, reload]
  )
  const handleToggle = useCallback(
    async (task: Task) => {
      await window.api.tasks.setCompleted(task.id, !task.completed)
      await reload()
    },
    [reload]
  )
  const handleReorder = useCallback(
    async (orderedIds: number[]) => {
      await window.api.tasks.reorder(orderedIds)
      await reload()
    },
    [reload]
  )

  const handleSettings = useCallback(async (patch: Partial<Settings>) => {
    const next = await window.api.settings.update(patch)
    setSettings(next)
    applyTheme(next.theme)
    if (patch.showCompleted !== undefined) {
      setFilter((f) => ({ ...f, showCompleted: next.showCompleted }))
    }
  }, [])

  // ---- derived view ----
  const visible = useMemo(() => {
    const filtered = filterTasks(tasks, filter, now)
    return sortTasks(filtered, filter, now)
  }, [tasks, filter, now])

  const groups = useMemo(() => (groupBy ? groupByTopic(visible) : null), [groupBy, visible])

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
            if (editing) await handleUpdate(editing.id, input)
            else await handleCreate(input)
            setFormOpen(false)
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
