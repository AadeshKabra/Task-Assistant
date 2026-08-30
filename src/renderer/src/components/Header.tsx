import { formatHeaderDate } from '../lib/dates'

interface Props {
  now: Date
  onAdd: () => void
  onOpenSettings: () => void
  onHide: () => void
  onMinimize: () => void
}

export default function Header({
  now,
  onAdd,
  onOpenSettings,
  onHide,
  onMinimize
}: Props): JSX.Element {
  return (
    <header className="header">
      {/* This whole strip is the window drag region (frameless window). */}
      <div className="header-drag">
        <div className="header-date">
          <span className="header-date-main">{formatHeaderDate(now)}</span>
          <span className="header-subtitle">Task Assistant</span>
        </div>
      </div>

      {/* Buttons opt out of the drag region so they remain clickable. */}
      <div className="header-actions no-drag">
        <button className="btn btn-primary" onClick={onAdd} title="Add task (new)">
          + Add
        </button>
        <button className="icon-btn" onClick={onOpenSettings} title="Settings" aria-label="Settings">
          ⚙
        </button>
        <button className="icon-btn" onClick={onMinimize} title="Minimize" aria-label="Minimize">
          –
        </button>
        <button className="icon-btn" onClick={onHide} title="Hide to tray" aria-label="Hide">
          ✕
        </button>
      </div>
    </header>
  )
}
