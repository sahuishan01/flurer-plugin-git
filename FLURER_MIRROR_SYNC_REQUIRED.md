# FLURER MIRROR SYNC REQUIRED — v0.12.2

**Date:** 2026-08-07
**Source repo:** `sahuishan01/flurer-plugin-git` (tag `v0.12.2`)
**Mirror:** `Flurer/plugins/git`

---

## Why

The plugin source lives in two places and must stay in sync:

1. **Plugin repo** (`flurer-plugin-git`) — independently releases on tag push (GitHub Actions builds the installable `.zip`).
2. **Flurer monorepo** (`Flurer/plugins/git`) — mirror kept for Flurer-side CI (`build.yml` / `release.yml`) and local dev cycles.

The diff-section bugfixes were implemented and released as **v0.12.2** in the plugin repo. The Flurer mirror needs the same changes applied so both sides stay identical.

**Note:** No changes are required to Flurer's Rust backend or the app itself — plugins are loaded at runtime from `~/.config/flurer/plugins/<id>/` (`src-tauri/src/plugins/mod.rs`), so only the mirror source (and its built `dist/`) is affected.

---

## Files changed in the plugin repo (v0.12.2)

| File | Change |
|------|--------|
| `src/git.ts` | `execGit` now always passes `-c color.ui=never`; added `stripAnsi` and applied it in `parseDiff`; added `Binary files … differ` detection (`binary: true`); dropped phantom trailing empty line (`rawLine === ""` branch) and `\ No newline at end of file` marker from hunk lines; new `gitUntrackedFiles()` helper; `gitDiff()` now merges untracked-file diffs (`--no-index /dev/null <file>`) into the "all changes" result |
| `src/components/ChangesView.tsx` | Untracked file rows are now clickable → `loadDiff(path, "unstaged")` |
| `src/components/DiffView.tsx` | `hasContent` treats `binary` files as content; binary files render a "Binary file" notice instead of hunks |
| `src/context.tsx` | Added `diffReqId` guard in `loadDiff`, `loadDiffCompare`, `loadDiffWithCurrent`, `loadDiffWithWorkingTree` to discard stale (out-of-order) diff responses |
| `src/types.ts` | `DiffFile` gains optional `binary?: boolean` |
| `package.json` | Version `0.12.1` → `0.12.2` |
| `plugin.json` | Version `0.12.1` → `0.12.2` |
| `dist/index.js` | Rebuilt (IIFE bundle, contains `version:"0.12.2"`) |

---

## Required steps in the Flurer repo

```bash
cd /home/opc/projects/Flurer

# 1. Copy the synced plugin source over the mirror
cp -r /home/opc/projects/flurer-plugin-git/src/* plugins/git/src/
cp /home/opc/projects/flurer-plugin-git/package.json plugins/git/package.json
cp /home/opc/projects/flurer-plugin-git/plugin.json plugins/git/plugin.json

# 2. Rebuild the mirror bundle
cd plugins/git
bun install   # if needed
bun run build

# 3. Verify the version inside the bundle
grep -o 'version:"0\.12\.[0-9]"' dist/index.js   # expect version:"0.12.2"

# 4. Commit the mirror changes
cd ../..
git add plugins/git
git commit -m "plugins/git: sync flurer-plugin-git v0.12.2 diff fixes"
git push
```

---

## Verification checklist

- [ ] `bun run build` succeeds in `Flurer/plugins/git` (bundle ≈ 110 kB)
- [ ] `dist/index.js` contains `version:"0.12.2"`
- [ ] `diff` of `src/` between both repos is clean
- [ ] Runtime installed plugin at `~/.config/flurer/plugins/git/` updated with new `dist/index.js` + `plugin.json` (restart Flurer to load)
