// Date logic shared by the UI: today's ISO date, due-date bucketing for the
// filter presets, and human-friendly formatting. All local-timezone.

import type { Task, Priority } from '@shared/types'

export type DateBucket = 'overdue' | 'today' | 'week' | 'later' | 'none'

/** Local 'YYYY-MM-DD' for a given Date (defaults to now). */
export function isoDate(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`
}

/** ISO date of the Monday starting the current week (weeks run Monday–Sunday). */
export function startOfWeekIso(today: Date = new Date()): string {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const daysSinceMonday = (d.getDay() + 6) % 7 // Mon=0 … Sun=6
  d.setDate(d.getDate() - daysSinceMonday)
  return isoDate(d)
}

/** ISO date of the Sunday ending the current week (weeks run Monday–Sunday). */
export function endOfWeekIso(today: Date = new Date()): string {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const dow = d.getDay() // 0=Sun .. 6=Sat
  const daysUntilSunday = dow === 0 ? 0 : 7 - dow
  d.setDate(d.getDate() + daysUntilSunday)
  return isoDate(d)
}

/** Which filter bucket a task's due date falls into, relative to `now`. */
export function bucketOf(task: Task, now: Date = new Date()): DateBucket {
  if (!task.dueDate) return 'none'
  const today = isoDate(now)
  if (task.dueDate < today) return 'overdue'
  if (task.dueDate === today) return 'today'
  if (task.dueDate <= endOfWeekIso(now)) return 'week'
  return 'later'
}

const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 }
export function priorityRank(p: Priority): number {
  return PRIORITY_RANK[p]
}

/** e.g. "Saturday, 30 August 2026" — for the header. */
export function formatHeaderDate(d: Date = new Date()): string {
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

/** Compact due label for a task row, e.g. "Today · 14:30", "Fri 5 Sep". */
export function formatDueLabel(task: Task, now: Date = new Date()): string {
  if (!task.dueDate) return 'No due date'
  const [y, m, d] = task.dueDate.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const bucket = bucketOf(task, now)

  let day: string
  if (bucket === 'today') day = 'Today'
  else if (task.dueDate === isoDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)))
    day = 'Tomorrow'
  else
    day = date.toLocaleDateString(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })

  return task.dueTime ? `${day} · ${task.dueTime}` : day
}
