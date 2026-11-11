---
name: Task Assistant
description: A dense, local-first desktop task manager where color signals urgency, not decoration.
colors:
  signal-blue: "#3b82f6"
  canvas: "#f4f5f7"
  panel: "#ffffff"
  panel-dim: "#eef0f3"
  hairline: "#dcdfe4"
  ink: "#1e1f24"
  ink-dim: "#6b7280"
  alert-overdue: "#dc2626"
  amber-today: "#d97706"
  olive-soon: "#ca8a04"
  horizon-later: "#2563eb"
  done-gray: "#9ca3af"
  priority-high: "#ef4444"
  priority-medium: "#f59e0b"
  priority-low: "#10b981"
typography:
  title:
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0em"
  headline:
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0em"
  body:
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0em"
  label:
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0em"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  pill: "999px"
spacing:
  xs: "2px"
  sm: "4px"
  base: "6px"
  md: "8px"
  lg: "10px"
  xl: "12px"
  2xl: "14px"
  3xl: "16px"
components:
  button-primary:
    backgroundColor: "{colors.signal-blue}"
    textColor: "{colors.panel}"
    rounded: "{rounded.sm}"
    padding: "5px 12px"
  button-secondary:
    backgroundColor: "{colors.panel-dim}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "5px 12px"
  icon-button:
    backgroundColor: "transparent"
    textColor: "{colors.ink-dim}"
    rounded: "{rounded.sm}"
    height: "26px"
    width: "26px"
  chip:
    backgroundColor: "{colors.panel-dim}"
    textColor: "{colors.ink-dim}"
    rounded: "{rounded.pill}"
    padding: "3px 9px"
  chip-selected:
    backgroundColor: "{colors.signal-blue}"
    textColor: "{colors.panel}"
    rounded: "{rounded.pill}"
    padding: "3px 9px"
  task-card:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.md}"
    padding: "8px 10px"
  tab:
    backgroundColor: "transparent"
    textColor: "{colors.ink-dim}"
    typography: "{typography.label}"
    rounded: "8px 8px 0 0"
    padding: "6px 14px"
  modal:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.lg}"
    padding: "16px"
    width: "360px"
---

# Design System: Task Assistant

## Overview

**Creative North Star: "The Control Panel"**

Task Assistant reads like flight-deck instrumentation, not a consumer productivity app: every pixel is informative, color is a signal rather than a decoration, and the whole interface stays small enough to live permanently at the edge of a screen. It is a single-user, local-only tool opened and glanced at dozens of times a day, so the design optimizes aggressively for scan speed and repeat-use efficiency over first-impression polish — there is no one to onboard and no audience to persuade.

The system is deliberately dense: a 13px base font, a 2–16px spacing rhythm, and a frameless window with custom minimize/maximize/close controls built from plain Unicode glyphs rather than an icon library. Surfaces are flat at rest; the only visual "weight" in the system is semantic color — the due-date urgency scale (overdue/today/soon/later) and the priority scale (high/medium/low) do the work that shadows, size, or illustration would do in a more expressive product. This density is the intended standard for future screens, not a placeholder to be loosened.

The visual anti-reference is the mainstream SaaS to-do app: no onboarding carousel, no empty-state illustration, no card-heavy marketing-style spacing, no bespoke icon set, no celebratory animation. Nothing in the system exists to be admired; everything exists to be read in under a second.

**Key Characteristics:**
- Flat, dense, information-first — color carries meaning, not mood.
- One real accent (signal blue) reserved for interactive/selected state; a separate, deliberately distinct color family encodes due-date urgency and task priority.
- Plain Unicode glyphs stand in for icons — no icon font, no SVG set, no image assets.
- Flat by default; shadow appears only as a direct response to hover or an overlay (modal).
- Frameless window with its own minimal title-bar-equivalent, built from the same component vocabulary as the rest of the app.

## Colors

A small neutral scaffold carries the UI; almost all remaining color is semantic (urgency, priority, destructive) rather than brand decoration. Every token below has a light value (root default) and a dark override — the app ships `system`/`light`/`dark` theme settings and both must stay paired when a token is touched.

### Primary
- **Signal Blue** (`#3b82f6` light / `#4f8cf7` dark): the only true interactive accent — primary buttons, checkboxes, selected chips/tabs, the "today" marker in the week view, focus-adjacent states. Reserved for things the user can act on or has selected; never used for passive status.

### Neutral
- **Canvas** (`#f4f5f7` light / `#1a1b1f` dark): the app's outer background and the resting color behind the active tab.
- **Panel** (`#ffffff` light / `#24262b` dark): header, tab bar, filter bar, task cards, modals — anything that reads as a raised/contained surface.
- **Panel Dim** (`#eef0f3` light / `#2c2f36` dark): recessed surfaces — secondary buttons, chips, inputs, icon-button hover fill.
- **Hairline** (`#dcdfe4` light / `#383b42` dark): all borders and dividers; also the scrollbar thumb.
- **Ink** (`#1e1f24` light / `#e7e9ee` dark): primary text.
- **Ink Dim** (`#6b7280` light / `#9aa0ab` dark): secondary/meta text — labels, timestamps, placeholder-weight copy.

### Status & Priority Colors
The due-date urgency scale and the task-priority scale are two independent systems that happen to share a red/amber/green vocabulary — they are never meant to be read as the same scale.

- **Alert / Overdue** (`#dc2626` light / `#f87171` dark): overdue due-date label, the "Overdue" flag badge, and destructive actions (delete) — doubles as the danger color by design, since "overdue" and "destructive" are both this app's highest-alarm state.
- **Amber Today** (`#d97706` light / `#fbbf24` dark): due-today label and chip.
- **Olive Soon** (`#ca8a04` light / `#facc15` dark): due-this-week label and the "soon" task-card left border — intentionally darker/olive rather than a clean yellow, so it doesn't compete with Amber Today at a glance.
- **Horizon Later** (`#2563eb` light / `#60a5fa` dark): due-later task-card left border. Deliberately its own blue, distinct from Signal Blue, so "due later" is never mistaken for "selected."
- **Done Gray** (`#9ca3af` light / `#6b7280` dark): completed-task de-emphasis (opacity pairing, not a fill).
- **Priority High** (`#ef4444` light / `#f87171` dark), **Priority Medium** (`#f59e0b` light / `#fbbf24` dark), **Priority Low** (`#10b981` light / `#34d399` dark): the small priority dot only. A lighter red than Alert/Overdue on purpose — priority is informational, due-date urgency is the thing that should alarm.

### Named Rules
**The One Signal Rule.** Signal Blue means "interactive or selected," full stop. It never appears as a passive status color, and no other color is used for a clickable/selected state.

## Typography

**Body Font:** `'Segoe UI', system-ui, -apple-system, sans-serif` — the only family in the system; there is no separate display or mono face.

**Character:** A plain, native-feeling Windows UI face used at small, utility sizes throughout. Personality comes from weight and case (bold, uppercase, letter-spaced labels) rather than from typeface choice.

### Hierarchy
- **Title** (700, 15px, 1.3 line-height): modal headers ("New task", "Settings") and topic group headers.
- **Headline** (600–700, 14px, 1.2 line-height): the header's live date, the week-range dates.
- **Body** (400–600, 13px, 1.4 line-height): task titles (600), default body copy and field inputs (400).
- **Label** (400–600, 11–12px): tabs, chips, search, toggles, control labels, field captions.
- **Eyebrow / Micro-label** (700, 9–11px, uppercase, 0.03–0.05em letter-spacing): the "TASK ASSISTANT" header subtitle, topic pills, the "Overdue" flag, the recurrence marker, the today badge, group titles, the week-range label. This is the system's only decorative typographic move — everywhere else type is purely functional.

### Named Rules
**The Weight-Not-Size Rule.** The type scale barely moves (11px–15px); hierarchy is built with weight (400/500/600/700), case, and letter-spacing rather than dramatic size jumps. This keeps the dense layout from feeling chaotic.

## Layout

A fixed-chrome, single-window desktop layout: a frameless top strip (double-click-to-maximize drag region) containing the live date and window controls, a tab bar (All tasks / This week), a filter bar, then a single scrolling content region that fills the remainder of the window. Nothing above the content region scrolls.

Spacing runs on a tight rhythm from 2px up to 16px (`xs` 2px, `sm` 4px, `base` 6px, `md` 8px, `lg` 10px, `xl` 12px, `2xl` 14px, `3xl` 16px) — there is no larger "section" gap; density is deliberate and this scale is the standard for any new screen, not a placeholder to be loosened later.

No responsive breakpoints exist or are needed: this is a desktop window with a practical minimum size, not a page that reflows across device classes.

## Elevation & Depth

**The Flat-By-Default Rule.** Every surface is flat at rest — no ambient shadows, no resting elevation. Shadow exists only as a direct response to an interaction state: a task card gains a soft shadow on hover, and a modal gains a stronger shadow because it's genuinely floating above a dimmed backdrop. If a future component is tempted to add a resting shadow "for polish," that's a sign it's the wrong component for this system.

### Shadow Vocabulary
- **Hover Lift** (`box-shadow: 0 1px 6px var(--shadow)`, shadow = `rgba(0,0,0,0.12)` light / `rgba(0,0,0,0.4)` dark): task-card hover only.
- **Overlay Lift** (`box-shadow: 0 8px 30px var(--shadow)`): modal, paired with a `rgba(0,0,0,0.45)` backdrop scrim behind it.

## Shapes

A small, consistent radius scale: `sm` 6px (buttons, icon buttons, inputs, selects, the scrollbar thumb), `md` 8px (task cards, and the top-only corners of the active tab bar), `lg` 12px (modals), and `pill` 999px (chips, the topic tag, status badges).

The signature form is the **task card's colored left border** (3px) — it recolors per due-date bucket (overdue/today/soon/later) and is the single most important visual element in the app, since it's what makes urgency scannable without reading any text.

## Components

### Buttons
- **Shape:** 6px radius, all variants.
- **Primary:** Signal Blue fill, white text, 5px 12px padding; hover brightens via `filter: brightness(1.08)` rather than swapping to a second color token.
- **Secondary ("Panel Dim" ghost):** Panel Dim fill, Ink text, Hairline border; hover darkens to the Hairline color.
- **Icon-only:** 26×26px square, transparent at rest, Panel Dim fill on hover; a `.danger` modifier shifts icon color to Alert/Overdue on hover (used for delete).

### Chips
- **Style:** Panel Dim fill, Ink Dim text, Hairline border, pill radius, 12px label type.
- **Selected state:** fills with Signal Blue + white text — except the Overdue and Today filter chips, which fill with their own semantic color (Alert/Overdue, Amber Today) instead of Signal Blue when selected, so the filter itself stays legible as "which urgency am I looking at."

### Task Card (signature component)
- **Corner style:** 8px radius; 3px colored left border signaling due-date bucket (Alert/Overdue, Amber Today, Olive Soon, Horizon Later, or neutral Hairline for no date).
- **Background:** Panel; Hairline 1px border.
- **Shadow:** none at rest; Hover Lift on hover.
- **Internal layout:** optional drag handle (⠿, 40% opacity, brightens on card hover) → checkbox → title + topic pill → meta row (due label, priority dot, recurrence glyph, overdue flag) → optional clamped notes with a "Show more" toggle.
- **States:** completed tasks drop to 60% opacity and, when "strike completed" is on, get a line-through title. Row actions (edit ✎ / delete 🗑) are hidden until hover, except on completed tasks where they stay visible.

### Tabs
- **Style:** top-only 8px radius; inactive tabs are transparent with Ink Dim text; the active tab fills with Canvas (matching the content area below it, so it visually "merges" into the page) and gains a Hairline border on three sides.

### Inputs / Fields
- **Style:** Panel Dim fill, Hairline border, 6px radius, 13px body type, label caption above in Label/11px Ink Dim.
- **Layout:** fields can sit in a `field-row` (e.g. date + time) sharing equal width.

### Modal
- **Style:** Panel background, Hairline border, 12px radius, 360px max width, floating via Overlay Lift over a `rgba(0,0,0,0.45)` backdrop scrim.
- **Header:** Title-weight (700/15px) heading, no close icon in the header — dismissal is via an explicit Cancel action in the footer.

### Settings Rows
- **Style:** label + description on the left (description in Label/10px Ink Dim), control on the right, Hairline divider between rows, no divider after the last row.

### Icons
No icon library of any kind — every icon (⚙ settings, − minimize, □ / ❐ maximize/restore, ✕ close/hide, ✎ edit, 🗑 delete, ⠿ drag handle, ↻ recurrence) is a plain Unicode character rendered as text. This keeps the bundle dependency-free and is a deliberate extension of the local-first, no-bloat positioning — not a placeholder for a future icon set.

## Do's and Don'ts

### Do:
- **Do** keep Signal Blue exclusively for interactive/selected state — never repurpose it as a passive status color.
- **Do** keep the due-date urgency scale (overdue/today/soon/later) and the priority scale (high/medium/low) visually distinct, even though both borrow from a red/amber/green vocabulary.
- **Do** keep new surfaces flat at rest; add shadow only as a direct response to hover or an overlay.
- **Do** build hierarchy with weight, case, and letter-spacing before reaching for a larger font size.
- **Do** use plain Unicode glyphs for any new icon need rather than introducing an icon library or SVG set.

### Don't:
- **Don't** add a resting/ambient shadow to any surface — it breaks the Flat-By-Default Rule.
- **Don't** loosen the spacing scale (2–16px) for a new screen "for breathing room" — density is the standard, not a gap to fill.
- **Don't** introduce a second brand accent color; there is exactly one (Signal Blue), by design.
- **Don't** add onboarding flows, empty-state illustration, or celebratory motion — this is a single-user tool with no audience to delight on first use.
