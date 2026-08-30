import { useState } from 'react'
import type { Task } from '@shared/types'
import type { TopicGroup } from '../lib/filter'
import TaskItem from './TaskItem'

interface Props {
  tasks: Task[]
  groups: TopicGroup[] | null
  now: Date
  strikeCompleted: boolean
  /** Whether drag-to-reorder is active (due-date sort). */
  reorderable: boolean
  onToggle: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (id: number) => void
  onReorder: (orderedIds: number[]) => void
}

const sameDate = (a: Task, b: Task): boolean => (a.dueDate ?? null) === (b.dueDate ?? null)

export default function TaskList({
  tasks,
  groups,
  now,
  strikeCompleted,
  reorderable,
  onToggle,
  onEdit,
  onDelete,
  onReorder
}: Props): JSX.Element {
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const [dropTargetId, setDropTargetId] = useState<number | null>(null)
  const [dropAfter, setDropAfter] = useState(false)

  const byId = (id: number): Task | undefined => tasks.find((t) => t.id === id)

  const clearDrag = (): void => {
    setDraggingId(null)
    setDropTargetId(null)
    setDropAfter(false)
  }

  const handleDragOver = (scope: Task[]) => (target: Task, e: React.DragEvent): void => {
    if (draggingId == null) return
    const dragged = byId(draggingId)
    // Only allow reordering among tasks sharing the same due date.
    if (!dragged || !sameDate(dragged, target) || target.id === draggingId) {
      setDropTargetId(null)
      return
    }
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    setDropAfter(e.clientY > rect.top + rect.height / 2)
    setDropTargetId(target.id)
    void scope
  }

  const handleDrop = (scope: Task[]) => (target: Task): void => {
    if (draggingId == null) {
      clearDrag()
      return
    }
    const dragged = byId(draggingId)
    if (dragged && sameDate(dragged, target) && dragged.id !== target.id) {
      const cluster = scope.filter((t) => sameDate(t, dragged))
      const ids = cluster.map((t) => t.id).filter((id) => id !== draggingId)
      let idx = ids.indexOf(target.id)
      if (idx !== -1) {
        if (dropAfter) idx += 1
        ids.splice(idx, 0, draggingId)
        onReorder(ids)
      }
    }
    clearDrag()
  }

  const dropLineFor = (task: Task): 'top' | 'bottom' | null =>
    task.id === dropTargetId ? (dropAfter ? 'bottom' : 'top') : null

  const renderItem = (t: Task, scope: Task[]): JSX.Element => (
    <TaskItem
      key={t.id}
      task={t}
      now={now}
      strikeCompleted={strikeCompleted}
      onToggle={onToggle}
      onEdit={onEdit}
      onDelete={onDelete}
      reorderable={reorderable}
      isDragging={t.id === draggingId}
      dropLine={dropLineFor(t)}
      onDragStart={(task) => setDraggingId(task.id)}
      onDragOver={handleDragOver(scope)}
      onDrop={handleDrop(scope)}
      onDragEnd={clearDrag}
    />
  )

  if (tasks.length === 0) {
    return (
      <div className="empty">
        <p>Nothing here.</p>
        <p className="empty-sub">No tasks match the current filters.</p>
      </div>
    )
  }

  if (groups) {
    return (
      <div className="grouped">
        {groups.map((g) => (
          <section key={g.topic || '__none__'} className="group">
            <h2 className="group-title">{g.topic || 'No topic'}</h2>
            <ul className="task-list">{g.tasks.map((t) => renderItem(t, g.tasks))}</ul>
          </section>
        ))}
      </div>
    )
  }

  return <ul className="task-list">{tasks.map((t) => renderItem(t, tasks))}</ul>
}
