# FLURER MIRROR SYNC REQUIRED — v0.12.11

**Date:** 2026-08-09
**Source repo:** `sahuishan01/flurer-plugin-git` (tag `v0.12.11`)
**Mirror:** `Flurer/plugins/git`

---

## Why

The plugin source lives in two places and must stay in sync:

1. **Plugin repo** (`flurer-plugin-git`) — independently releases on tag push (GitHub Actions builds the installable `.zip`).
2. **Flurer monorepo** (`Flurer/plugins/git`) — mirror kept for Flurer-side CI (`build.yml` / `release.yml`) and local dev cycles.

**Note:** No changes are required to Flurer's Rust backend or the app itself — plugins are loaded at runtime from `~/.config/flurer/plugins/<id>/` (`src-tauri/src/plugins/mod.rs`), so only the mirror source (and its built `dist/`) is affected.

---

## Files changed (v0.12.5 → v0.12.11)

| File | Change |
|------|--------|
| `src/components/GraphView.tsx` | Graph redesign: SVG lanes + HTML flex rows, responsive breakpoints (640/480/360px), branch ref pills, merge badges, lane legend. SVG alignment restored to v0.12.4 approach (`rowMaxLanes`, `refStart`, `textX`, `msgLeft`, foreignObject). Color changes kept (lighten, CSS vars, gradient merge badge). Bottom padding for dangling edges. |
| `src/components/shared/index.tsx` | `backdrop-filter: blur()` stripped from all text-containing elements (Card, inputs, buttons, tabBar, repoCard, context menus, dropdowns, modals). Only full-screen overlay backdrops retain blur. |
| `src/components/DiffView.tsx` | Button group `backdrop-filter` stripped. Inner elements retain `surfaceBg(0.08)` and `surfaceBg(0.05)` for section headers. |
| `src/styles.ts` | `backdrop-filter` removed from all text-containing styles (`S.card`, `S.btn`, `S.input`, `S.tabBar`, `S.toast`, etc.) |
| `src/context.tsx` | `openRepo` restores saved view; `switchView` saves view. `loadGraph` try/catch toast. |
| `src/utils.ts` | `surfaceBg()`, `isLightBg()`, `getSavedActiveView`/`saveActiveView`, `getSavedBranchSelection`/`saveBranchSelection`. |
| `src/index.tsx` | Single `surfaceBg(0.06)` tint div behind whole plugin (GitPanel root). Import added. |
| `package.json` | Version → `0.12.11` |
| `plugin.json` | Version → `0.12.11` |

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
grep -o 'version:"0\.12\.[0-9]*"' dist/index.js

# 4. Commit the mirror changes
cd ../..
git add plugins/git
git commit -m "plugins/git: sync flurer-plugin-git v0.12.11"
git push
```

---

## Verification checklist

- [ ] `bun run build` succeeds in `Flurer/plugins/git` (bundle ≈ 113 KB)
- [ ] `dist/index.js` version matches `package.json` (0.12.11)
- [ ] `diff` of `src/` between both repos is clean
- [ ] Runtime installed plugin at `~/.config/flurer/plugins/git/` updated with new `dist/index.js` + `plugin.json` (restart Flurer to load)
- [ ] Graph rows show `author · committer · time`
- [ ] Branch filter survives repo close/reopen and app restart
- [ ] Single tint visible behind whole plugin (subtle light/dark blend)
- [ ] No blurry text (no `backdrop-filter` on text elements)
