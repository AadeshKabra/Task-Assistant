import { useLayoutEffect, useRef, useState } from 'react'
import type { Task } from '@shared/types'
import { bucketOf, formatDueLabel } from '../lib/dates'

/**
 * Task notes clamped to two lines. A "Show more" toggle appears only when the
 * text actually overflows (re-measured on resize / note edits).
 */
function TaskNotes({ notes }: { notes: string }): JSX.Element {
  const ref = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [overflows, setOverflows] = useState(false)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = (): void => {
      // Only measurable while clamped; keep the last result while expanded.
      if (!el.classList.contains('task-notes-clamped')) return
      setOverflows(el.scrollHeight > el.clientHeight + 1)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [notes, expanded])

  return (
    <>
      <div ref={ref} className={`task-notes ${expanded ? '' : 'task-notes-clamped'}`}>
        {notes}
      </div>
      {(overflows || expanded) && (
        <button
          className="notes-toggle"
          onClick={() => setExpanded((x) => !x)}
          onDoubleClick={(e) => e.stopPropagation()}
          aria-expanded={expanded}
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </>
  )
}

interface Props {
  task: Task
  now: Date
  strikeCompleted: boolean
  onToggle: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (id: number) => void
  // Drag-and-drop reordering (enabled in due-date sort / grouped views).
  reorderable?: boolean
  isDragging?: boolean
  dropLine?: 'top' | 'bottom' | null
  onDragStart?: (task: Task) => void
  onDragOver?: (task: Task, e: React.DragEvent) => void
  onDrop?: (task: Task) => void
  onDragEnd?: () => void
}

const RECUR_LABEL: Record<Task['recurrence'], string> = {
  none: '',
  daily: '↻ daily',
  weekly: '↻ weekly',
  monthly: '↻ monthly'
}

export default function TaskItem({
  task,
  now,
  strikeCompleted,
  onToggle,
  onEdit,
  onDelete,
  reorderable = false,
  isDragging = false,
  dropLine = null,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd
}: Props): JSX.Element {
  const bucket = bucketOf(task, now)
  const classes = [
    'task',
    `prio-${task.priority}`,
    `bucket-${bucket}`,
    task.completed ? 'task-done' : '',
    task.completed && strikeCompleted ? 'task-strike' : '',
    reorderable ? 'reorderable' : '',
    isDragging ? 'dragging' : '',
    dropLine === 'top' ? 'drop-top' : '',
    dropLine === 'bottom' ? 'drop-bottom' : ''
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <li
      className={classes}
      draggable={reorderable}
      onDragStart={reorderable ? () => onDragStart?.(task) : undefined}
      onDragOver={reorderable ? (e) => onDragOver?.(task, e) : undefined}
      onDrop={reorderable ? () => onDrop?.(task) : undefined}
      onDragEnd={reorderable ? () => onDragEnd?.() : undefined}
    >
      {reorderable && (
        <span className="drag-handle" title="Drag to reorder within this due date">
          ⠿
        </span>
      )}
      <input
        type="checkbox"
        className="task-check"
        checked={task.completed}
        onChange={() => onToggle(task)}
        aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
      />

      <div className="task-body" onDoubleClick={() => onEdit(task)}>
        <div className="task-title-row">
          <span className="task-title">{task.title}</span>
          {task.topic && <span className="task-topic">{task.topic}</span>}
        </div>
        <div className="task-meta">
          <span className={`task-due due-${bucket}`}>{formatDueLabel(task, now)}</span>
          <span className={`task-prio-dot prio-dot-${task.priority}`} title={task.priority} />
          {task.recurrence !== 'none' && (
            <span className="task-recur">{RECUR_LABEL[task.recurrence]}</span>
          )}
          {bucket === 'overdue' && !task.completed && (
            <span className="task-flag">Overdue</span>
          )}
        </div>
        {task.notes && <TaskNotes notes={task.notes} />}
      </div>

      <div className="task-actions">
        <button className="icon-btn" onClick={() => onEdit(task)} title="Edit" aria-label="Edit">
          ✎
        </button>
        <button
          className="icon-btn danger"
          onClick={() => onDelete(task.id)}
          title="Delete"
          aria-label="Delete"
        >
          🗑
        </button>
      </div>
    </li>
  )
}
