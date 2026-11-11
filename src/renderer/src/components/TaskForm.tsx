import { useEffect, useRef, useState } from 'react'
import type { Priority, Recurrence, Task, TaskInput } from '@shared/types'

interface Props {
  task: Task | null // null = create mode
  existingTopics: string[]
  onSubmit: (input: TaskInput) => void
  onCancel: () => void
}

export default function TaskForm({
  task,
  existingTopics,
  onSubmit,
  onCancel
}: Props): JSX.Element {
  const [title, setTitle] = useState(task?.title ?? '')
  const [topic, setTopic] = useState(task?.topic ?? '')
  const [dueDate, setDueDate] = useState(task?.dueDate ?? '')
  const [dueTime, setDueTime] = useState(task?.dueTime ?? '')
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'medium')
  const [recurrence, setRecurrence] = useState<Recurrence>(task?.recurrence ?? 'none')
  const [notes, setNotes] = useState(task?.notes ?? '')
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  // Esc closes the dialog.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const submit = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!title.trim()) return
    onSubmit({
      title: title.trim(),
      topic: topic.trim(),
      dueDate: dueDate || null,
      dueTime: dueDate && dueTime ? dueTime : null, // time only meaningful with a date
      priority,
      recurrence: dueDate ? recurrence : 'none', // recurrence needs a due date
      notes: notes.trim()
    })
  }

  return (
    <div className="modal-backdrop" onMouseDown={onCancel}>
      <form className="modal" onMouseDown={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2 className="modal-title">{task ? 'Edit task' : 'New task'}</h2>

        <label className="field">
          <span>Title *</span>
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs doing?"
            required
          />
        </label>

        <label className="field">
          <span>Topic</span>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Coursework"
            list="topic-suggestions"
          />
          <datalist id="topic-suggestions">
            {existingTopics.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </label>

        <div className="field-row">
          <label className="field">
            <span>Due date</span>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </label>
          <label className="field">
            <span>Time</span>
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              disabled={!dueDate}
            />
          </label>
        </div>

        <div className="field-row">
          <label className="field">
            <span>Priority</span>
            <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <label className="field">
            <span>Repeat</span>
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as Recurrence)}
              disabled={!dueDate}
              title={dueDate ? '' : 'Set a due date to enable repeating'}
            >
              <option value="none">Never</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>
        </div>

        <label className="field">
          <span>Notes</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={6}
            placeholder="Optional details…"
          />
        </label>

        <div className="modal-actions">
          <button type="button" className="btn" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={!title.trim()}>
            {task ? 'Save' : 'Add task'}
          </button>
        </div>
      </form>
    </div>
  )
}
