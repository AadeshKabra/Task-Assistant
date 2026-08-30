# Task Assistant

A lightweight, local-only personal task manager for the desktop. Shows your tasks
with due dates so you can see what needs prioritizing at a glance — a private
to-do list, no accounts, no network.

Built with **Electron + React + TypeScript**, data in **SQLite** (better-sqlite3).

---

## Features

- **Prominent live date** in the header (e.g. *Saturday, 30 August 2026*) that
  rolls over automatically past midnight and on window focus.
- **Task model:** title, topic/subject, due date (+ optional time), priority
  (Low/Medium/High), notes, completed. Add / edit / delete / complete.
- **Prioritized default view:** incomplete tasks, soonest-due first, with
  **overdue tasks surfaced at the top and flagged**; due-today/this-week vs.
  later are colour-coded.
- **Filter by due date** — Overdue, Today, This week (Mon–Sun), Upcoming, No due
  date — multi-select, combined with **topic filters** derived from the topics
  you've actually entered. Date + topic filters combine.
- **Sort** by due date, priority, title, or created; ascending/descending.
  Optional **group-by-topic** view. Search box.
- **Manual reordering:** in the default due-date view (and grouped view), drag a
  task by its handle to reorder tasks **that share the same due date**. The order
  persists (a per-task `position` used as the same-date tiebreaker). Cross-date
  drags snap back — the date sort always wins. New tasks append to the end of
  their day.
- **Recurring tasks** (daily/weekly/monthly): completing one spawns the next
  occurrence automatically.
- **Notifications** for tasks due today or overdue (toggleable).
- **Tray icon:** show/hide, settings, quit. Closing the window hides to tray.
- **Settings:** keep-on-top (off by default), launch-on-login (off by default),
  notifications, show-completed (struck-through), theme (system/light/dark).
- **Remembers window size & position** across restarts.

## Data & persistence

Data lives in the OS per-user app-data directory (**not** next to the
executable), so it survives restarts and updates:

- Windows: `%APPDATA%\task-assistant\`
  - `tasks.db` — SQLite database of tasks
  - `settings.json` — settings + window bounds

**Why SQLite (better-sqlite3) over a JSON blob?** Filtering/sorting by due date,
topic, and priority is the core of this app. SQLite gives real indexed queries
and transactional integrity (used when a recurring task spawns its next
occurrence) without loading the whole dataset into memory, while staying a
single embedded file with zero server. It's the more robust base to grow on.

## Architecture

Clean separation of concerns:

```
src/
  main/        Main process — window lifecycle, tray, OS integration, persistence
    index.ts        window + app lifecycle, single-instance, login item
    db.ts           SQLite data layer (the ONLY module touching the DB)
    settings.ts     settings + window-bounds JSON store
    ipc.ts          typed IPC handlers
    tray.ts         tray icon + menu
    notifications.ts due-today/overdue native notifications
  preload/     Typed bridge — contextIsolation ON, nodeIntegration OFF
    index.ts        exposes a small window.api; no raw ipcRenderer leaks
  renderer/    React UI (no direct Node/DB access)
    src/
      App.tsx           orchestrator + state
      components/        Header, FilterBar, TaskList, TaskItem, TaskForm, SettingsPanel
      lib/dates.ts       date bucketing + formatting
      lib/filter.ts      pure filter/sort/group logic
      hooks/useToday.ts  midnight/focus date-rollover
  shared/
    types.ts     the Task model + API contract shared by all three layers
```

Security posture: `contextIsolation: true`, `nodeIntegration: false`, a strict
CSP in `index.html`, and a minimal typed preload surface.

## Idle footprint

It's an Electron app, so expect roughly **~90–130 MB RAM** resident (main +
renderer + GPU). CPU is effectively **0%** at idle: the only background work is a
notification check every 5 minutes and a lightweight day-rollover timer that only
re-renders when the calendar day actually changes. WAL journaling keeps SQLite
writes cheap. If you later want a much smaller resident footprint (~15–30 MB), a
Tauri port is the path — same UI, Rust backend.

---

## Prerequisites

- **Node.js 18+** and npm.
- `better-sqlite3` is a native module. It ships prebuilt binaries for common
  Electron versions, so most installs need no compiler. If a build *is* triggered
  on Windows, you'll need **Visual Studio Build Tools** (Desktop C++) and Python
  3 — `electron-builder install-app-deps` (run automatically on `postinstall`)
  handles the rebuild.

## Install

```bash
npm install
```

## Run in dev (hot reload)

```bash
npm run dev
```

## Build (compile main/preload/renderer)

```bash
npm run build
```

## Package a Windows installer

```bash
npm run package
```

Produces an NSIS installer in `release/`. For an unpacked test build (no
installer):

```bash
npm run package:dir
```

Produces `release/Task Assistant Setup <version>.exe` (~81 MB) plus a portable
`release/win-unpacked/Task Assistant.exe`.

To brand the installer, drop a 256×256 `build/icon.ico` and uncomment the `icon:`
line in `electron-builder.yml`.

### Troubleshooting: "Cannot create symbolic link ... winCodeSign"

On Windows, packaging downloads a code-signing toolkit whose archive contains
macOS symlinks; extracting them needs Administrator or Developer Mode, so the
build fails with `A required privilege is not held by the client`. Any one of
these fixes it (no admin needed for the first):

- **Pre-extract the toolkit without the macOS files** (what this repo used):
  ```bash
  cd "$LOCALAPPDATA/electron-builder/Cache/winCodeSign"
  # extract the downloaded <n>.7z, skipping the darwin/ folder, into the stable name:
  "<repo>/node_modules/7zip-bin/win/x64/7za.exe" x <n>.7z -owinCodeSign-2.6.0 -xr!darwin -snld -y
  ```
  then re-run `npm run package`.
- Or enable **Settings → System → For developers → Developer Mode**, then rebuild.
- Or run `npm run package` from an **Administrator** terminal once.

## Notes / trade-offs

- **Target OS:** configured for Windows (NSIS). Building for macOS/Linux is a
  matter of adding targets to `electron-builder.yml` and building on/for those
  platforms.
- **Always-on-top** uses native Electron `alwaysOnTop` only (no desktop-pinning).
- The window is **frameless** with a custom drag strip and window controls in the
  header; closing hides to the tray rather than quitting.
