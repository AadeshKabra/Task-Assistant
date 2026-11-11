// Data layer. Owns the SQLite database and is the ONLY module that talks to it.
// Everything is synchronous (better-sqlite3) but wrapped by async IPC handlers.

import { app } from 'electron'
import { join } from 'path'
import Database from 'better-sqlite3'
import type { Task, TaskInput, TaskPatch, Recurrence } from '../shared/types'

let db: Database.Database

// Row shape as stored in SQLite (integers for booleans, snake_case columns).
interface Row {
  id: number
  title: string
  topic: string
  due_date: string | null
  due_time: string | null
  priority: Task['priority']
  notes: string
  completed: number
  recurrence: Recurrence
  position: number
  created_at: string
  updated_at: string
  completed_at: string | null
}

function rowToTask(r: Row): Task {
  return {
    id: r.id,
    title: r.title,
    topic: r.topic,
    dueDate: r.due_date,
    dueTime: r.due_time,
    priority: r.priority,
    notes: r.notes,
    completed: r.completed === 1,
    recurrence: r.recurrence,
    position: r.position,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    completedAt: r.completed_at
  }
}

export function initDb(): void {
  // Stored in the OS per-user app-data dir (%APPDATA%/task-assistant on Windows),
  // NOT next to the executable — survives restarts and app updates.
  const file = join(app.getPath('userData'), 'tasks.db')
  db = new Database(file)
  db.pragma('journal_mode = WAL')
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      title        TEXT    NOT NULL,
      topic        TEXT    NOT NULL DEFAULT '',
      due_date     TEXT,
      due_time     TEXT,
      priority     TEXT    NOT NULL DEFAULT 'medium',
      notes        TEXT    NOT NULL DEFAULT '',
      completed    INTEGER NOT NULL DEFAULT 0,
      recurrence   TEXT    NOT NULL DEFAULT 'none',
      position     REAL    NOT NULL DEFAULT 0,
      created_at   TEXT    NOT NULL,
      updated_at   TEXT    NOT NULL,
      completed_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_tasks_due   ON tasks(due_date);
    CREATE INDEX IF NOT EXISTS idx_tasks_topic ON tasks(topic);

    -- User-chosen display order of topics (chips + grouped view). Topics with
    -- no row here sort after ordered ones, alphabetically.
    CREATE TABLE IF NOT EXISTS topic_order (
      topic    TEXT    PRIMARY KEY,
      position INTEGER NOT NULL
    );
  `)
  migrate()
}

/** Additive migrations for databases created by earlier versions. */
function migrate(): void {
  const cols = db.prepare(`PRAGMA table_info(tasks)`).all() as { name: string }[]
  if (!cols.some((c) => c.name === 'position')) {
    db.exec(`ALTER TABLE tasks ADD COLUMN position REAL NOT NULL DEFAULT 0`)
    // Seed a stable initial order (by id) so existing tasks keep a sane sequence.
    db.exec(`UPDATE tasks SET position = id`)
  }
}

function nowIso(): string {
  return new Date().toISOString()
}

export function listTasks(): Task[] {
  const rows = db.prepare('SELECT * FROM tasks ORDER BY id').all() as Row[]
  return rows.map(rowToTask)
}

export function getTask(id: number): Task | null {
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Row | undefined
  return row ? rowToTask(row) : null
}

export function createTask(input: TaskInput): Task {
  const ts = nowIso()
  // New tasks append to the end of the manual order (highest position). Within
  // their due-date cluster this places them last; the user can drag to reorder.
  const maxPos = (db.prepare(`SELECT COALESCE(MAX(position), 0) AS m FROM tasks`).get() as {
    m: number
  }).m
  const info = db
    .prepare(
      `INSERT INTO tasks
        (title, topic, due_date, due_time, priority, notes, recurrence, position, completed, created_at, updated_at)
       VALUES
        (@title, @topic, @dueDate, @dueTime, @priority, @notes, @recurrence, @position, 0, @ts, @ts)`
    )
    .run({
      title: input.title.trim(),
      topic: (input.topic ?? '').trim(),
      dueDate: input.dueDate ?? null,
      dueTime: input.dueTime ?? null,
      priority: input.priority ?? 'medium',
      notes: input.notes ?? '',
      recurrence: input.recurrence ?? 'none',
      position: maxPos + 1,
      ts
    })
  return getTask(Number(info.lastInsertRowid))!
}

/**
 * Persist a manual order for a set of task ids (a same-due-date cluster passed
 * in the desired top-to-bottom order). Assigns sequential positions. Because
 * `position` only breaks ties *within* a due date, renumbering one cluster never
 * disturbs the order of tasks on other dates.
 */
export function reorderTasks(orderedIds: number[]): void {
  const stmt = db.prepare(`UPDATE tasks SET position = @pos WHERE id = @id`)
  const tx = db.transaction((ids: number[]) => {
    ids.forEach((id, i) => stmt.run({ pos: i, id }))
  })
  tx(orderedIds)
}

export function updateTask(id: number, patch: TaskPatch): Task | null {
  const existing = getTask(id)
  if (!existing) return null

  const merged = {
    title: patch.title !== undefined ? patch.title.trim() : existing.title,
    topic: patch.topic !== undefined ? patch.topic.trim() : existing.topic,
    due_date: patch.dueDate !== undefined ? patch.dueDate : existing.dueDate,
    due_time: patch.dueTime !== undefined ? patch.dueTime : existing.dueTime,
    priority: patch.priority ?? existing.priority,
    notes: patch.notes !== undefined ? patch.notes : existing.notes,
    recurrence: patch.recurrence ?? existing.recurrence,
    completed: patch.completed !== undefined ? (patch.completed ? 1 : 0) : existing.completed ? 1 : 0
  }

  db.prepare(
    `UPDATE tasks SET
       title = @title, topic = @topic, due_date = @due_date, due_time = @due_time,
       priority = @priority, notes = @notes, recurrence = @recurrence,
       completed = @completed, updated_at = @updated_at
     WHERE id = @id`
  ).run({ ...merged, updated_at: nowIso(), id })

  return getTask(id)
}

export function deleteTask(id: number): boolean {
  return db.prepare('DELETE FROM tasks WHERE id = ?').run(id).changes > 0
}

/**
 * Toggle completion. When a *recurring* task is completed, we spawn the next
 * occurrence (same details, due date advanced by the recurrence interval) as a
 * fresh incomplete task, then mark the current one complete. Uncompleting never
 * spawns anything.
 */
export function setCompleted(id: number, completed: boolean): Task | null {
  const task = getTask(id)
  if (!task) return null

  const tx = db.transaction(() => {
    if (completed && task.recurrence !== 'none' && task.dueDate) {
      const nextDue = advanceDate(task.dueDate, task.recurrence)
      createTask({
        title: task.title,
        topic: task.topic,
        dueDate: nextDue,
        dueTime: task.dueTime,
        priority: task.priority,
        notes: task.notes,
        recurrence: task.recurrence
      })
    }
    db.prepare(
      `UPDATE tasks SET completed = @c, completed_at = @at, updated_at = @at WHERE id = @id`
    ).run({ c: completed ? 1 : 0, at: completed ? nowIso() : null, id })
  })
  tx()

  return getTask(id)
}

/**
 * Distinct non-empty topics across all tasks, in the user's chosen order.
 * Topics never explicitly ordered come last, alphabetical (case-insensitive).
 */
export function listTopics(): string[] {
  const rows = db
    .prepare(
      `SELECT t.topic, o.position AS pos
         FROM (SELECT DISTINCT topic FROM tasks WHERE topic <> '') t
         LEFT JOIN topic_order o ON o.topic = t.topic
        ORDER BY pos IS NULL, pos, t.topic COLLATE NOCASE`
    )
    .all() as { topic: string }[]
  return rows.map((r) => r.topic)
}

/** Replace the stored topic order with the given top-to-bottom list. */
export function reorderTopics(ordered: string[]): void {
  const insert = db.prepare(`INSERT INTO topic_order (topic, position) VALUES (?, ?)`)
  const tx = db.transaction((names: string[]) => {
    db.exec(`DELETE FROM topic_order`)
    names.forEach((name, i) => insert.run(name, i))
  })
  tx([...new Set(ordered)])
}

/** Advance an ISO date string by one recurrence step, returning ISO date. */
function advanceDate(iso: string, recurrence: Recurrence): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  switch (recurrence) {
    case 'daily':
      date.setDate(date.getDate() + 1)
      break
    case 'weekly':
      date.setDate(date.getDate() + 7)
      break
    case 'monthly': {
      // Advance one month, clamping to the last valid day (e.g. Jan 31 -> Feb 28).
      const targetMonth = date.getMonth() + 1
      const day = date.getDate()
      date.setDate(1)
      date.setMonth(targetMonth)
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
      date.setDate(Math.min(day, lastDay))
      break
    }
  }
  const yy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}
