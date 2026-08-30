// Native notifications for tasks that are due today or overdue. Runs a low-cost
// timer in the main process. Notified task ids are remembered for the session so
// the user isn't pinged repeatedly for the same task.

import { Notification } from 'electron'
import { listTasks } from './db'
import { getSettings } from './settings'

const CHECK_INTERVAL_MS = 5 * 60 * 1000 // every 5 minutes — negligible CPU
const notified = new Set<number>()
let timer: NodeJS.Timeout | null = null

/** Local 'YYYY-MM-DD' for today. */
function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function check(): void {
  if (!getSettings().notificationsEnabled) return
  if (!Notification.isSupported()) return

  const today = todayIso()
  for (const task of listTasks()) {
    if (task.completed || !task.dueDate) continue
    if (notified.has(task.id)) continue

    const overdue = task.dueDate < today
    const dueToday = task.dueDate === today
    if (!overdue && !dueToday) continue

    const when = task.dueTime ? ` at ${task.dueTime}` : ''
    new Notification({
      title: overdue ? 'Task overdue' : 'Task due today',
      body: `${task.title}${when}`,
      silent: false
    }).show()
    notified.add(task.id)
  }
}

export function startNotifications(): void {
  // Small delay so the first check doesn't compete with app startup.
  setTimeout(check, 10_000)
  timer = setInterval(check, CHECK_INTERVAL_MS)
}

export function stopNotifications(): void {
  if (timer) clearInterval(timer)
  timer = null
}

/** Clear the "already notified" memory (e.g. after edits) so a re-check can fire. */
export function resetNotified(): void {
  notified.clear()
}
