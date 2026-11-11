# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

A single primary user: the developer themselves. Task Assistant is a solo personal tool, not built for other accounts, households, or distribution — no onboarding, multi-user, or "explain it to someone else" concerns apply. The job: see what needs prioritizing today, at a glance, without ceremony.

## Product Purpose

A local-only personal to-do list for the desktop that makes due-date urgency impossible to miss. Success is a quick glance at the window telling the user exactly what's overdue, due today, or coming up this week, with minimal friction to add, edit, complete, or reschedule a task.

## Positioning

What a mainstream to-do app (Todoist, Microsoft To Do, Things) could not truthfully copy without becoming a different product:

- **Fully local & private** — no accounts, no cloud sync, no telemetry. Data never leaves the machine (SQLite in the OS per-user app-data directory).
- **Due-date-first prioritization** — overdue tasks are surfaced and flagged at the top by default, rather than buried in a generic list.
- **Lightweight & fast** — a small, free, zero-subscription desktop tool (~90-130MB idle, ~0% idle CPU), not a bloated SaaS client.
- **Built exactly to the user's own workflow** — the weekly planner (Mon–Sun), carry-forward of incomplete tasks, topic grouping, and recurrence rules are shaped around how this specific person actually plans, not a generic feature checklist.

## Operating Context

- Runs as a native Windows desktop app (Electron), typically kept open/minimized to tray rather than launched per-session.
- Primary glance-and-act usage: checking what's due, adding a quick task, checking something off, occasionally reordering or re-planning the week.
- Secondary workflow: weekly planning via the "This week" tab (Mon–Sun), with carried-over tasks from prior weeks surfaced separately.
- Notifications (due-today/overdue) and tray presence mean the app is often ambient/background rather than always in focus.

## Capabilities and Constraints

- Task model: title, topic (free-text), due date + optional time, priority (Low/Medium/High), notes, completed, recurrence (none/daily/weekly/monthly), manual position (same-due-date tiebreaker).
- Recurring tasks spawn their next occurrence automatically on completion.
- Manual drag-to-reorder within same-due-date clusters and for topic display order; cross-date drags snap back since due-date sort always wins.
- Filter by due-date bucket (Overdue/Today/This week/Upcoming/No due date, multi-select) combined with topic filters; sort by due date/priority/title/created; optional group-by-topic; search.
- Settings: always-on-top (default off), launch-on-login (default off), notifications toggle, show-completed, theme (system/light/dark).
- Target OS: Windows only (NSIS installer via electron-builder). macOS/Linux not currently built or targeted.
- No accounts, no network calls, no cloud sync — by design, not a current limitation to fix.
- Architecture enforces contextIsolation + no nodeIntegration + strict CSP; renderer has no direct DB/Node access (see src/shared/types.ts for the full typed API contract).

## Evidence on Hand

None — no testimonials, case studies, or external proof needed; this is a personal tool with one user and no audience to persuade.

## Product Principles

1. **Urgency is visual, not something you have to look for.** Overdue and due-soon tasks must be unmissable at a glance, not just filterable.
2. **Local-first, always.** No feature should require an account, network call, or cloud dependency — privacy and offline reliability are non-negotiable.
3. **Stay light.** Favor a small, fast, low-resource tool over feature creep that mimics mainstream SaaS to-do apps.
4. **Fit the user's actual planning habits**, not a generic task-app template — weekly carry-forward, topic grouping, and recurrence exist because this specific workflow needs them.
5. **Friction-free daily interaction.** Adding, completing, and rescheduling a task should take as few steps as possible since this is used many times a day.

## Accessibility & Inclusion

No specific personal accessibility requirement identified. Maintain standard good-practice contrast and keyboard operability as a baseline.
