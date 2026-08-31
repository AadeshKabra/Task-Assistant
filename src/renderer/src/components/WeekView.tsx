import type { Task } from '@shared/types'
import { isoDate, startOfWeekIso, endOfWeekIso } from '../lib/dates'
import TaskItem from './TaskItem'

interface Props {
  /** Tasks already filtered by topic/search/showCompleted. */
  tasks: Task[]
  now: Date
  strikeCompleted: boolean
  onToggle: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (id: number) => void
}

interface Day {
  iso: string
  date: Date
  isToday: boolean
  tasks: Task[]
}

function parseIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function fmtRange(startIso: string, endIso: string): string {
  const s = parseIso(startIso)
  const e = parseIso(endIso)
  const sameYear = s.getFullYear() === e.getFullYear()
  const sameMonth = sameYear && s.getMonth() === e.getMonth()
  const sOpts: Intl.DateTimeFormatOptions = sameMonth
    ? { day: 'numeric' }
    : { day: 'numeric', month: 'short' }
  const eOpts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }
  return `${s.toLocaleDateString(undefined, sOpts)} – ${e.toLocaleDateString(undefined, eOpts)}`
}

export default function WeekView({
  tasks,
  now,
  strikeCompleted,
  onToggle,
  onEdit,
  onDelete
}: Props): JSX.Element {
  const weekStart = startOfWeekIso(now)
  const weekEnd = endOfWeekIso(now)
  const todayIso = isoDate(now)

  // Incomplete tasks whose due date is before this week roll forward and show
  // up here until they're completed — so nothing from a past week gets lost.
  const carried = tasks
    .filter((t) => !t.completed && t.dueDate && t.dueDate < weekStart)
    .sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1))

  const start = parseIso(weekStart)
  const days: Day[] = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    const iso = isoDate(date)
    return {
      iso,
      date,
      isToday: iso === todayIso,
      tasks: tasks
        .filter((t) => t.dueDate === iso)
        .sort((a, b) => a.position - b.position)
    }
  })

  const renderTask = (t: Task): JSX.Element => (
    <TaskItem
      key={t.id}
      task={t}
      now={now}
      strikeCompleted={strikeCompleted}
      onToggle={onToggle}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  )

  return (
    <div className="weekview">
      <div className="week-range">
        <span className="week-range-label">Week of</span>
        <span className="week-range-dates">{fmtRange(weekStart, weekEnd)}</span>
      </div>

      {carried.length > 0 && (
        <section className="week-day week-carried">
          <div className="week-day-head">
            <span className="week-day-name">Carried over</span>
            <span className="week-day-count">{carried.length}</span>
          </div>
          <ul className="task-list">{carried.map(renderTask)}</ul>
        </section>
      )}

      {days.map((d) => (
        <section key={d.iso} className={`week-day ${d.isToday ? 'week-today' : ''}`}>
          <div className="week-day-head">
            <span className="week-day-name">
              {d.date.toLocaleDateString(undefined, { weekday: 'long' })}
              {d.isToday && <span className="week-today-badge">Today</span>}
            </span>
            <span className="week-day-date">
              {d.date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
            </span>
          </div>
          {d.tasks.length > 0 ? (
            <ul className="task-list">{d.tasks.map(renderTask)}</ul>
          ) : (
            <p className="week-day-empty">—</p>
          )}
        </section>
      ))}
    </div>
  )
}
