import type { SortKey } from '@shared/types'
import type { DateBucket } from '../lib/dates'
import type { FilterState } from '../lib/filter'

interface Props {
  filter: FilterState
  onChange: (f: FilterState) => void
  topics: string[]
  groupBy: boolean
  onToggleGroupBy: () => void
  /** Hide date presets + sort/group controls (used by the Week view). */
  showDateAndSort?: boolean
}

const DATE_PRESETS: { key: DateBucket; label: string }[] = [
  { key: 'overdue', label: 'Overdue' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This week' },
  { key: 'later', label: 'Upcoming' },
  { key: 'none', label: 'No due date' }
]

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'dueDate', label: 'Due date' },
  { key: 'priority', label: 'Priority' },
  { key: 'title', label: 'Title' },
  { key: 'createdAt', label: 'Created' }
]

export default function FilterBar({
  filter,
  onChange,
  topics,
  groupBy,
  onToggleGroupBy,
  showDateAndSort = true
}: Props): JSX.Element {
  const toggleBucket = (b: DateBucket): void => {
    const next = new Set(filter.dateBuckets)
    next.has(b) ? next.delete(b) : next.add(b)
    onChange({ ...filter, dateBuckets: next })
  }

  const toggleTopic = (t: string): void => {
    const next = new Set(filter.topics)
    next.has(t) ? next.delete(t) : next.add(t)
    onChange({ ...filter, topics: next })
  }

  return (
    <div className="filterbar no-drag">
      {/* Date presets (multi-select) — not shown in the Week view. */}
      {showDateAndSort && (
        <div className="chip-row">
          {DATE_PRESETS.map((p) => (
            <button
              key={p.key}
              className={`chip ${filter.dateBuckets.has(p.key) ? 'chip-on' : ''} chip-${p.key}`}
              onClick={() => toggleBucket(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Topic filter (multi-select). "All topics" clears the selection. */}
      {topics.length > 0 && (
        <div className="chip-row">
          <button
            className={`chip ${filter.topics.size === 0 ? 'chip-on' : ''}`}
            onClick={() => onChange({ ...filter, topics: new Set() })}
          >
            All topics
          </button>
          {topics.map((t) => (
            <button
              key={t}
              className={`chip ${filter.topics.has(t) ? 'chip-on' : ''}`}
              onClick={() => toggleTopic(t)}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Search + sort + view controls */}
      <div className="controls-row">
        <input
          className="search"
          type="search"
          placeholder="Search…"
          value={filter.search}
          onChange={(e) => onChange({ ...filter, search: e.target.value })}
        />

        {showDateAndSort && (
          <>
            <label className="control-label">
              Sort
              <select
                value={filter.sortKey}
                onChange={(e) => onChange({ ...filter, sortKey: e.target.value as SortKey })}
              >
                {SORTS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              className="icon-btn"
              title={filter.sortDir === 'asc' ? 'Ascending' : 'Descending'}
              onClick={() =>
                onChange({ ...filter, sortDir: filter.sortDir === 'asc' ? 'desc' : 'asc' })
              }
            >
              {filter.sortDir === 'asc' ? '↑' : '↓'}
            </button>

            <button
              className={`toggle-btn ${groupBy ? 'toggle-on' : ''}`}
              onClick={onToggleGroupBy}
              title="Group by topic"
            >
              Group
            </button>
          </>
        )}

        <button
          className={`toggle-btn ${filter.showCompleted ? 'toggle-on' : ''}`}
          onClick={() => onChange({ ...filter, showCompleted: !filter.showCompleted })}
          title="Show completed tasks"
        >
          Done
        </button>
      </div>
    </div>
  )
}
