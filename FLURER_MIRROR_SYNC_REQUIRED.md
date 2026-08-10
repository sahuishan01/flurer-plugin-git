# FLURER MIRROR SYNC REQUIRED — v0.12.13

**Date:** 2026-08-09
**Source repo:** `sahuishan01/flurer-plugin-git` (tag `v0.12.13`)
**Mirror:** `Flurer/plugins/git`

---

## Why

The plugin source lives in two places and must stay in sync:

1. **Plugin repo** (`flurer-plugin-git`) — independently releases on tag push (GitHub Actions builds the installable `.zip`).
2. **Flurer monorepo** (`Flurer/plugins/git`) — mirror kept for Flurer-side CI (`build.yml` / `release.yml`) and local dev cycles.

**Note:** No changes are required to Flurer's Rust backend or the app itself — plugins are loaded at runtime from `~/.config/flurer/plugins/<id>/` (`src-tauri/src/plugins/mod.rs`), so only the mirror source (and its built `dist/`) is affected.

---

## Files changed (v0.12.11 → v0.12.13)

| File | Change |
|------|--------|
| `src/utils.ts` | Added `buttonBg(accentColor, opacity?)` — blends accent toward bg. Added `_buttonTintOpacity` signal + `getButtonTintOpacity()` / `setButtonTintOpacity()`. Added `parseColor()` helper. |
| `src/styles.ts` | Removed `text-shadow` from `S.btnPrimary` and `S.btnSecondary`. |
| `src/components/shared/index.tsx` | `Button` component now applies `buttonBg()` tinting to primary/danger variants. Removed `text-shadow` from `menuBtnStyle` and `BranchMultiSelect` trigger. |
| `src/components/SettingsPanel.tsx` | New "Button tint opacity" slider (0–50%, default 12%). Persists both settings together. |
| `src/index.tsx` | Applies `buttonTintOpacity` from plugin settings on startup. |
| `package.json` | Version → `0.12.13` |
| `plugin.json` | Version → `0.12.13` |

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
git commit -m "plugins/git: sync flurer-plugin-git v0.12.13"
git push
```

---

## Verification checklist

- [ ] `bun run build` succeeds in `Flurer/plugins/git` (bundle ≈ 115 KB)
- [ ] `dist/index.js` version matches `package.json` (0.12.13)
- [ ] `diff` of `src/` between both repos is clean
- [ ] Runtime installed plugin at `~/.config/flurer/plugins/git/` updated with new `dist/index.js` + `plugin.json` (restart Flurer to load)
- [ ] Buttons have no text-shadow
- [ ] Button backgrounds are tinted (not solid), adjustable in Settings
- [ ] Single tint visible behind whole plugin (subtle light/dark blend)
