# flurer-plugin-git v0.1.0 — Handoff

## Overview

A **Git Operations** plugin for Flurer, the Tauri + SolidJS Windows file manager. It exposes a `fullPanel` view in the Flurer plugin system that shows the git status of the current repository, lets users stage/unstage files, write commit messages, and push/pull.

**Requires Flurer v0.4.21+** — the Rust git backend commands are compiled into the Flurer binary in `src-tauri/src/plugins/git.rs`. The plugin's IIFE bundle calls those commands via `window.TauriCore.invoke`.

---

## How It Works

The plugin registers via `window.registerPlugin(...)`:

- **viewRailButton** — A git-branch SVG icon on the left ViewRail
- **fullPanel** — The GitView component takes over the full main area (sidebar + content)

When the user navigates into a git repository and opens the Git plugin:
1. The plugin calls `git_repo_status(currentPath)` to get branch, ahead/behind, and file changes
2. It also calls `git_log(currentPath, 10)` for recent commits
3. All git operations use the system `git` CLI via `std::process::Command`

### Commands

| Plugin Action | Rust Command | Git CLI |
|---|---|---|
| Load status | `git_repo_status` | `git -C <path> status --porcelain` |
| Stage file | `git_stage` | `git -C <path> add <file>` |
| Unstage file | `git_unstage` | `git -C <path> restore --staged <file>` |
| Commit | `git_commit` | `git -C <path> commit -m <msg>` |
| Push | `git_push` | `git -C <path> push` |
| Pull | `git_pull` | `git -C <path> pull` |
| List branches | `git_branches` | `git -C <path> branch` |
| Checkout branch | `git_checkout` | `git -C <path> checkout <branch>` |
| Recent commits | `git_log` | `git -C <path> log --max-count=N --format=...` |

---

## Build

```bash
npm install
npm run build
# Output: dist/index.js (IIFE bundle, 13 kB)
```

## Installation

### Via Plugin Marketplace (Flurer v0.4.21+)
1. Open Settings → Plugins
2. Under "Install from GitHub", enter `sahuishan01/flurer-plugin-git`
3. Click Install

### Via ZIP
1. Download the `.zip` from the latest release
2. Open Settings → Plugins → "Install from ZIP"
3. Pick the ZIP file

---

## UI Structure

The entire plugin is a single file: `src/index.tsx`. It contains:

- **GitIcon** — Inline SVG for the ViewRail button
- **GitView** — The main fullPanel component with:
  - Toolbar: branch badge (with ahead/behind), Pull/Push buttons, refresh button
  - Status message banner (success/error)
  - Recent commits section
  - Staged/unstaged/untracked file sections with Stage/Unstage buttons
  - Commit input + button (only shown when there are staged changes)

Styling uses inline style objects matching Flurer's CSS variable names.

---

## Key Design Decisions

- **System git CLI** — Using `std::process::Command("git", ...)` instead of `git2` crate avoids native libgit2 linking issues and uses the user's existing git config.
- **No separate settings panel** — The plugin has no `settingsPanel`. It works out of the box.
- **`fullPanel` not `mainPanel`** — Takes the full view area including the sidebar, similar to Settings.
- **Uses `currentPath`** — The plugin inspects whatever repo the user has open in the Explorer.
