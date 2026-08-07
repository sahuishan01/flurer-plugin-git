# FLURER MIRROR SYNC REQUIRED — v0.12.2 + unreleased graph/selection fixes

**Date:** 2026-08-07
**Source repo:** `sahuishan01/flurer-plugin-git` (tag `v0.12.2` + unreleased changes)
**Mirror:** `Flurer/plugins/git`

---

## Why

The plugin source lives in two places and must stay in sync:

1. **Plugin repo** (`flurer-plugin-git`) — independently releases on tag push (GitHub Actions builds the installable `.zip`).
2. **Flurer monorepo** (`Flurer/plugins/git`) — mirror kept for Flurer-side CI (`build.yml` / `release.yml`) and local dev cycles.

The diff-section bugfixes were implemented and released as **v0.12.2** in the plugin repo. Two additional fixes (graph committer label + per-repo branch selection persistence) were added **after** the v0.12.2 tag and are **not yet released** — include them when next syncing so both sides stay identical.

**Note:** No changes are required to Flurer's Rust backend or the app itself — plugins are loaded at runtime from `~/.config/flurer/plugins/<id>/` (`src-tauri/src/plugins/mod.rs`), so only the mirror source (and its built `dist/`) is affected.

---

## Files changed (released in v0.12.2)

| File | Change |
|------|--------|
| `src/git.ts` | `execGit` always passes `-c color.ui=never`; added `stripAnsi` in `parseDiff`; added `Binary files … differ` detection (`binary: true`); dropped phantom trailing empty line (`rawLine === ""` branch) and `\ No newline at end of file` marker from hunk lines; new `gitUntrackedFiles()` helper; `gitDiff()` merges untracked-file diffs (`--no-index /dev/null <file>`) into "all changes" |
| `src/components/ChangesView.tsx` | Untracked file rows are clickable → `loadDiff(path, "unstaged")` |
| `src/components/DiffView.tsx` | `hasContent` treats `binary` files as content; binary files render a "Binary file" notice instead of hunks |
| `src/context.tsx` | `diffReqId` guard in `loadDiff`, `loadDiffCompare`, `loadDiffWithCurrent`, `loadDiffWithWorkingTree` to discard stale diff responses |
| `src/types.ts` | `DiffFile` gains optional `binary?: boolean` |
| `package.json` | Version `0.12.1` → `0.12.2` |
| `plugin.json` | Version `0.12.1` → `0.12.2` |

## Files changed (POST-v0.12.2, unreleased)

| File | Change |
|------|--------|
| `src/git.ts` | `gitGraph` format now includes committer: `%H%x1f%P%x1f%s%x1f%an%x1f%cn%x1f%at%x1f%D`, parsed into `committer` on each entry |
| `src/types.ts` | `GitGraphEntry` gains optional `committer?: string` |
| `src/components/GraphView.tsx` | Major graph redesign — CSS-injected responsive rules (injected `<style id="flurer-git-graph-css">` with hover glow + `@media` breakpoints at 1100/780/620px to hide refs/meta/hash on narrow windows); SVG layer now only draws lanes/edges/dots; labels are HTML flex rows: roomy hash → pill branch refs (full names, `+N more`, gradient merge badge `← a ➔ b` highlighted with glow) → ellipsizing message → `author · committer · time`; rows are rounded (8px) with inset accent bar on selection and hover tint; load-more is a centered pill |
| `src/context.tsx` | `selectedBranches` persisted per repo — restored on `openRepo`, saved via `persistBranchSelection` on every change |
| `src/utils.ts` | New `getSavedBranchSelection(path)` / `saveBranchSelection(path, branches)` localStorage helpers (`flurer-git-branch-selection`) |

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
grep -o 'version:"0\.12\.[0-9]"' dist/index.js

# 4. Commit the mirror changes
cd ../..
git add plugins/git
git commit -m "plugins/git: sync flurer-plugin-git v0.12.2 + graph/selection fixes"
git push
```

---

## Verification checklist

- [ ] `bun run build` succeeds in `Flurer/plugins/git` (bundle ≈ 110 kB)
- [ ] `dist/index.js` version matches `package.json`
- [ ] `diff` of `src/` between both repos is clean
- [ ] Runtime installed plugin at `~/.config/flurer/plugins/git/` updated with new `dist/index.js` + `plugin.json` (restart Flurer to load)
- [ ] Graph rows show `author · committer · time`
- [ ] Branch filter survives repo close/reopen and app restart