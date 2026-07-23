---
version: alpha
name: Flurer Git Plugin
description: Dark-theme Git operations panel with tinted surface hierarchy for Flurer, a Tauri v2 + SolidJS Windows file manager.
colors:
  primary: "#e4e4e7"
  surface-raised: "rgba(255,255,255,0.04)"
  surface-hover: "rgba(255,255,255,0.06)"
  accent: "#f59e0b"
  accent-on: "#000000"
  success: "#4ade80"
  success-bg: "rgba(34,197,94,0.15)"
  info: "#60a5fa"
  info-bg: "rgba(59,130,246,0.15)"
  danger: "#f87171"
  danger-bg: "rgba(239,68,68,0.15)"
  text-muted: "#888888"
  border-strong: "rgba(255,255,255,0.08)"
  border-subtle: "rgba(255,255,255,0.04)"
typography:
  body-md:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: 13px
    fontWeight: 400
  label-mono:
    fontFamily: "Space Mono, monospace"
    fontSize: 12px
    fontWeight: 400
  label-badge:
    fontFamily: "Space Mono, monospace"
    fontSize: 11px
    fontWeight: 600
  label-caps:
    fontFamily: "Space Mono, monospace"
    fontSize: 10px
    fontWeight: 600
    letterSpacing: "0.04em"
rounded:
  sm: 4px
  md: 8px
  lg: 16px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
components:
  card:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: 16px
  card-hover:
    backgroundColor: "{colors.surface-hover}"
  card-header:
    textColor: "{colors.primary}"
  file-row:
    textColor: "{colors.primary}"
  file-row-hover:
    backgroundColor: "{colors.surface-hover}"
  branch-badge:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-on}"
    rounded: "{rounded.full}"
    padding: 5px 12px
  staged-badge:
    backgroundColor: "{colors.success-bg}"
    textColor: "{colors.success}"
    rounded: "{rounded.sm}"
  unstaged-badge:
    backgroundColor: "{colors.info-bg}"
    textColor: "{colors.info}"
    rounded: "{rounded.sm}"
  untracked-badge:
    backgroundColor: "{colors.danger-bg}"
    textColor: "{colors.danger}"
    rounded: "{rounded.sm}"
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-on}"
    rounded: "{rounded.sm}"
    padding: 6px 14px
  button-secondary:
    backgroundColor: "{colors.surface-hover}"
    textColor: "{colors.primary}"
    rounded: "{rounded.sm}"
    padding: 6px 14px
  button-danger:
    backgroundColor: "{colors.danger-bg}"
    textColor: "{colors.danger}"
    rounded: "{rounded.sm}"
    padding: 6px 14px
  diff-added:
    backgroundColor: "rgba(34,197,94,0.06)"
    textColor: "{colors.success}"
  diff-removed:
    backgroundColor: "rgba(239,68,68,0.06)"
    textColor: "{colors.danger}"
  diff-context:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
  diff-hunk-header:
    backgroundColor: "{colors.surface-hover}"
    textColor: "{colors.text-muted}"
  toast-success:
    backgroundColor: "rgba(34,197,94,0.9)"
    textColor: "#000000"
  toast-error:
    backgroundColor: "rgba(239,68,68,0.9)"
    textColor: "#ffffff"
  confirm-dialog-overlay:
    backgroundColor: "rgba(0,0,0,0.5)"
  confirm-dialog-surface:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
  tab:
    textColor: "{colors.text-muted}"
  tab-active:
    textColor: "{colors.primary}"
  repo-card:
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    backgroundColor: "{colors.surface-raised}"
  repo-card-hover:
    backgroundColor: "{colors.surface-hover}"
---

## Overview

A dark-theme Git operations panel that lives inside Flurer's plugin system.
The plugin inherits Flurer's CSS custom properties (`--panel-bg`, `--text-color`,
`--accent-color`, etc.) and applies a **subtle surface-tint hierarchy** on top
to create visual depth without introducing harsh borders or shadows.

The core principle: **cards and interactive rows get a very faint white overlay**
(`rgba(255,255,255,0.04)`) that lifts them above the main panel background.
This tiny shift is enough to separate surfaces while keeping the dark,
minimalist feel. Hover states use a slightly stronger tint (`0.06`).

## Colors

The plugin does **not** define a static palette — it inherits Flurer's dark
theme variables. It only adds **tint values** (semi-transparent white overlays)
for surface elevation:

- **Surface-raised** (`rgba(255,255,255,0.04)`): Cards, repo cards — the
  primary elevation layer. Just 4% white over `var(--panel-bg)` creates
  clear separation.
- **Surface-hover** (`rgba(255,255,255,0.06)`): Hover states on file rows,
  secondary buttons. Subtle enough to not flash.
- **Accent** (`#f59e0b`): The sole interaction driver. Used for primary
  buttons, branch badges, active tab indicators, and commit hashes.
- **Status colors**: Green (`#4ade80`) for staged/success, blue (`#60a5fa`)
  for unstaged, red (`#f87171`) for untracked/danger/removed.

Each status color has a matching `*-bg` variant at 15% opacity for badge
backgrounds — the badge text (full-opacity) against the parent card's
surface-raised background provides sufficient readability. The badge's own
tinted background is deliberately low-contrast (a subtle color wash, not a
readable surface); the text reads against the card beneath.

## Typography

- **Body** (13px): Default for file names, descriptions, commit messages.
- **Mono label** (12px): File status indicators, git hashes, diff content.
- **Badge** (11px, bold): Count badges, status badges.
- **Caps** (10px, tracked): Future use for section headers.

## Layout

4px baseline. `lg` (24px) for section padding inside views, `md` (16px) for
card interiors, `sm` (8px) for intra-toolbar gaps. Toolbar height is governed
by its contents.

## Shapes

- `sm` (4px): Buttons, badges, small indicators.
- `md` (8px): Cards, dialogs, repo cards.
- `full` (9999px): Branch badge (pill shape).

## Components

- **Card**: The foundational surface. Uses `surface-raised` to lift content
  off the flat panel background. No shadow — tint alone creates depth.
- **File row**: Bottom border at `border-subtle` opacity. Hover elevates to
  `surface-hover`.
- **Branch badge**: Accent fill + black text for max contrast. Pill shape.
- **Status badges**: Color text on matching 15%-opacity background. The
  badge's tinted background is a color wash — readability comes from text
  against the card's surface-raised layer beneath.
- **Buttons**: Primary uses accent fill + black text. Secondary uses hover
  tint. Danger uses red text on red-tinted background.
- **Toast**: Higher-opacity backgrounds (90%) for legibility over content.
  Success toast uses black text on green; error uses white on red.
- **Diff**: Added lines get a barely-there green tint (`0.06`) with a solid
  green left border. Removed lines get red similarly. Hunk headers use hover
  tint. The color wash is a visual cue — readability comes from the solid
  left-border and the text color against the panel background.
- **Confirm dialog**: Semi-transparent black overlay + centered surface card.
- **Tab bar**: Muted text on inactive tabs, primary text + amber underline on
  active. Count badges use subtle background.

## Do's and Don'ts

- **Do** use `var(--panel-bg)` for the outermost container and
  `surface-raised` (`rgba(255,255,255,0.04)`) for cards and elevated surfaces.
- **Do** use tokenized status colors with their matching `*-bg` backgrounds
  for badges — never raw hex on transparent.
- **Don't** hardcode dark/light assumptions. The tint model works on any
  background because it's a relative overlay, not an absolute color.
- **Don't** use box-shadows for elevation — the tint overlay is the only
  depth cue.
- **Don't** exceed two surface levels (panel → card → dialog overlay).
  More levels break the minimalist contract.
