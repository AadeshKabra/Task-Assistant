import type { Settings, ThemePref } from '@shared/types'
import { useModalA11y } from '../hooks/useModalA11y'

interface Props {
  settings: Settings
  onChange: (patch: Partial<Settings>) => void
  onClose: () => void
}

export default function SettingsPanel({ settings, onChange, onClose }: Props): JSX.Element {
  const dialogRef = useModalA11y<HTMLDivElement>(onClose)

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id="settings-title" className="modal-title">
          Settings
        </h2>

        <label className="setting-row">
          <span>
            Keep window on top
            <small>Native always-on-top. Off by default.</small>
          </span>
          <input
            type="checkbox"
            checked={settings.alwaysOnTop}
            onChange={(e) => onChange({ alwaysOnTop: e.target.checked })}
          />
        </label>

        <label className="setting-row">
          <span>
            Launch on login
            <small>Start Task Assistant when you sign in.</small>
          </span>
          <input
            type="checkbox"
            checked={settings.launchOnLogin}
            onChange={(e) => onChange({ launchOnLogin: e.target.checked })}
          />
        </label>

        <label className="setting-row">
          <span>
            Notifications
            <small>Alert for tasks due today or overdue.</small>
          </span>
          <input
            type="checkbox"
            checked={settings.notificationsEnabled}
            onChange={(e) => onChange({ notificationsEnabled: e.target.checked })}
          />
        </label>

        <label className="setting-row">
          <span>
            Show completed
            <small>Keep finished tasks visible, struck through.</small>
          </span>
          <input
            type="checkbox"
            checked={settings.showCompleted}
            onChange={(e) => onChange({ showCompleted: e.target.checked })}
          />
        </label>

        <label className="setting-row">
          <span>
            Theme
            <small>Follow the system or force light/dark.</small>
          </span>
          <select
            value={settings.theme}
            onChange={(e) => onChange({ theme: e.target.value as ThemePref })}
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
