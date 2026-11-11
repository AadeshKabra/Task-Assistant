// Pure filtering + sorting over the task list. Kept separate from components so
// the prioritization rules are easy to read and test in isolation.

import type { Task, SortKey, SortDir } from '@shared/types'
import { bucketOf, priorityRank, type DateBucket } from './dates'

export interface FilterState {
  /** Selected due-date buckets. Empty set = no date filter (show all). */
  dateBuckets: Set<DateBucket>
  /** Selected topics. Empty = all topics. */
  topics: Set<string>
  showCompleted: boolean
  search: string
  sortKey: SortKey
  sortDir: SortDir
}

export function filterTasks(tasks: Task[], f: FilterState, now: Date = new Date()): Task[] {
  const q = f.search.trim().toLowerCase()
  return tasks.filter((t) => {
    if (!f.showCompleted && t.completed) return false
    if (f.dateBuckets.size > 0 && !f.dateBuckets.has(bucketOf(t, now))) return false
    if (f.topics.size > 0 && !f.topics.has(t.topic)) return false
    if (q) {
      const hay = `${t.title} ${t.topic} ${t.notes}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
}

/**
 * Sort by the chosen key, but ALWAYS surface overdue incomplete tasks first and
 * push completed tasks to the bottom — the default prioritized view.
 */
export function sortTasks(tasks: Task[], f: FilterState, now: Date = new Date()): Task[] {
  const dir = f.sortDir === 'asc' ? 1 : -1
  return [...tasks].sort((a, b) => {
    // Completed always sinks below incomplete.
    if (a.completed !== b.completed) return a.completed ? 1 : -1

    // Overdue incomplete tasks bubble to the very top regardless of sort key.
    if (!a.completed && !b.completed) {
      const ao = bucketOf(a, now) === 'overdue'
      const bo = bucketOf(b, now) === 'overdue'
      if (ao !== bo) return ao ? -1 : 1
    }

    return compareBy(a, b, f.sortKey) * dir
  })
}

function compareBy(a: Task, b: Task, key: SortKey): number {
  switch (key) {
    case 'dueDate': {
      // Nulls (no due date) sort last in ascending order.
      const av = a.dueDate ?? '9999-99-99'
      const bv = b.dueDate ?? '9999-99-99'
      if (av !== bv) return av < bv ? -1 : 1
      // Same date: honor the user's manual order (drag-and-drop), then time,
      // then priority as final tiebreakers.
      if (a.position !== b.position) return a.position - b.position
      const at = a.dueTime ?? '99:99'
      const bt = b.dueTime ?? '99:99'
      if (at !== bt) return at < bt ? -1 : 1
      return priorityRank(a.priority) - priorityRank(b.priority)
    }
    case 'priority': {
      const pr = priorityRank(a.priority) - priorityRank(b.priority)
      if (pr !== 0) return pr
      return (a.dueDate ?? '9999-99-99') < (b.dueDate ?? '9999-99-99') ? -1 : 1
    }
    case 'title':
      return a.title.localeCompare(b.title)
    case 'createdAt':
      return a.createdAt < b.createdAt ? -1 : 1
  }
}

export interface TopicGroup {
  topic: string
  tasks: Task[]
}

/**
 * Group an already-sorted list by topic, preserving task order within each
 * group. Groups follow `topicOrder` (the user's chosen order); topics missing
 * from it fall back to alphabetical after the ordered ones; untopiced last.
 */
export function groupByTopic(tasks: Task[], topicOrder: string[] = []): TopicGroup[] {
  const rank = new Map(topicOrder.map((t, i) => [t, i]))
  const map = new Map<string, Task[]>()
  for (const t of tasks) {
    const key = t.topic || ''
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(t)
  }
  const groups = [...map.entries()].map(([topic, ts]) => ({ topic, tasks: ts }))
  groups.sort((a, b) => {
    if (a.topic === '') return 1
    if (b.topic === '') return -1
    const ar = rank.get(a.topic) ?? Infinity
    const br = rank.get(b.topic) ?? Infinity
    if (ar !== br) return ar - br
    return a.topic.localeCompare(b.topic)
  })
  return groups
}
