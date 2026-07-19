# Flurer Backend Tasks for Git Plugin

## Overview

The `flurer-plugin-git` plugin (v0.2.0) now executes git commands directly via Tauri's shell plugin instead of custom Rust commands. To enable this, Flurer needs two minimal backend changes.

---

## Task 1: Initialize Shell Plugin

Add `tauri-plugin-shell` to the Flurer project and initialize it.

### Cargo.toml

```toml
[dependencies]
tauri-plugin-shell = "2"
```

### src-tauri/src/lib.rs

Add `.plugin(tauri_plugin_shell::init())` to the Tauri builder:

```rust
tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    // ... existing plugins ...
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
```

---

## Task 2: Add Shell Execute Capabilities

The shell plugin requires explicit permission to execute commands. Add a capability that allows running `sh -c "git ..."` commands.

### Create or update a capabilities file (e.g. `src-tauri/capabilities/git-plugin.json`):

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "git-plugin-shell",
  "description": "Allows the git plugin to execute git commands via shell",
  "windows": ["main"],
  "permissions": [
    {
      "identifier": "shell:allow-execute",
      "allow": [
        {
          "name": "exec-sh",
          "cmd": "sh",
          "args": [
            "-c",
            {
              "validator": "^git(\\s+.*)?$"
            }
          ],
          "sidecar": false
        }
      ]
    }
  ]
}
```

> **Security note**: The validator `^git(\\s+.*)?$` restricts execution to only `git` commands. Adjust if needed, but keep it as restrictive as possible.

---

## Task 3: Install npm Dependency (Plugin Side)

In the `flurer-plugin-git` project, the shell plugin is externalized in the Vite config and mapped to `window.TauriShell`. For this to work, Flurer's webview must expose the shell API at that global.

In Flurer's webview initialization code, ensure the Tauri shell plugin is available as `window.TauriShell`. This typically happens automatically when `withGlobalTauri: true` is set in `tauri.conf.json`, but verify the global name matches.

If Flurer uses `window.__TAURI__` as the global Tauri object, the plugin can also look there. The plugin already handles both:
- `window.TauriShell` (mapped via Vite externals)
- `window.__TAURI__.shell` (fallback detection)

---

## Verification

After implementing these changes:

1. Build Flurer: `cargo build`
2. Build the plugin: `cd flurer-plugin-git && npm run build`
3. Install the plugin in Flurer via ZIP
4. Open a git repository in Flurer
5. Click the Git icon in the ViewRail
6. Verify: dashboard shows, can open a repo, all tabs work (Changes, Graph, Branches, Diff, History, Stash, Worktrees)

---

## What This Replaces

Previously the plugin relied on 7+ custom Rust commands (`git_repo_status`, `git_log`, `git_stage`, etc.) compiled into Flurer. With the shell plugin, **no custom Rust git commands are needed** — the plugin executes `git` directly via `sh -c`.

If you prefer to keep the custom Rust commands for security (allowlisting specific git subcommands instead of arbitrary shell execution), the plugin also falls back to those commands automatically when the shell plugin is not available.
