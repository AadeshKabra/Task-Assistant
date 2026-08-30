import type { Task } from '@shared/types'
import { bucketOf, formatDueLabel } from '../lib/dates'

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
        {task.notes && <div className="task-notes">{task.notes}</div>}
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
