import type { Task } from '@shared/types'
import type { TopicGroup } from '../lib/filter'
import TaskItem from './TaskItem'

interface Props {
  tasks: Task[]
  groups: TopicGroup[] | null
  now: Date
  strikeCompleted: boolean
  onToggle: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (id: number) => void
}

export default function TaskList({
  tasks,
  groups,
  now,
  strikeCompleted,
  onToggle,
  onEdit,
  onDelete
}: Props): JSX.Element {
  if (tasks.length === 0) {
    return (
      <div className="empty">
        <p>Nothing here.</p>
        <p className="empty-sub">No tasks match the current filters.</p>
      </div>
    )
  }

  const renderItem = (t: Task): JSX.Element => (
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

  if (groups) {
    return (
      <div className="grouped">
        {groups.map((g) => (
          <section key={g.topic || '__none__'} className="group">
            <h2 className="group-title">{g.topic || 'No topic'}</h2>
            <ul className="task-list">{g.tasks.map(renderItem)}</ul>
          </section>
        ))}
      </div>
    )
  }

  return <ul className="task-list">{tasks.map(renderItem)}</ul>
}
