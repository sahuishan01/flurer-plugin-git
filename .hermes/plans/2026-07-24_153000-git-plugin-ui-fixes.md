# Git Plugin UI Fixes Implementation Plan

> **For Hermes:** Use bite-sized tasks. This is the flurer-plugin-git repo at `/home/opc/projects/flurer-plugin-git`.

**Goal:** Fix three UI bugs in the Git plugin: tint slider not reactive, graph missing surface tint, graph rendering incomplete.

**Architecture:** SolidJS plugin loaded as IIFE into Flurer. Tint opacity needs to be a reactive signal so Solid components re-render when it changes. Graph SVG needs proper sizing and scroll behavior.

**Tech Stack:** SolidJS, TypeScript, SVG, Git CLI

---

### Task 1: Make tint opacity reactive with a Solid signal

**Objective:** Replace the plain module variable with a Solid `createSignal` so components re-render when the slider changes.

**Files:**
- Modify: `src/utils.ts:8-18`
- Modify: `src/components/SettingsPanel.tsx` (may need adjustment)

**Root cause:** `_surfaceOpacity` is a plain number. When `setSurfaceOpacity()` writes to it, SolidJS has no way to know that components using `surfaceBg()` need to re-render.

**Step 1: Replace `_surfaceOpacity` with a Solid signal**

In `src/utils.ts`, change:

```typescript
import { createSignal, createRoot } from "solid-js";
```

Replace the `_surfaceOpacity` variable and its getter/setter with a root-level signal:

```typescript
const [_surfaceOpacity, _setSurfaceOpacity] = createRoot(() =>
  createSignal(0.04)
);

export function setSurfaceOpacity(opacity: number) {
  _setSurfaceOpacity(Math.max(0, Math.min(1, opacity)));
}

export function getSurfaceOpacity(): number {
  return _surfaceOpacity();
}
```

`createRoot` initializes the signal outside any component (module-level). The getter is a Solid accessor — when called inside a tracked scope (e.g. during component render), Solid subscribes to it. When the slider calls `setSurfaceOpacity()`, all components that called `surfaceBg()` → `getSurfaceOpacity()` will re-render.

**Step 2: Build and verify**

Run: `bun run build`
Expected: 16 modules, builds without errors.

**Step 3: Commit**

```bash
git add src/utils.ts
git commit -m "fix: make tint opacity a reactive Solid signal"
```

---

### Task 2: Apply surface tint to graph section

**Objective:** Add `surfaceBg()` background to the GraphView container so it matches the rest of the UI.

**Files:**
- Modify: `src/components/GraphView.tsx:81`

**Step 1: Apply `surfaceBg()` to the graph outer container**

Add import for `surfaceBg`:

```typescript
import { formatTimestamp, surfaceBg } from "../utils";
```

Change the outer div (line 81) from:

```tsx
<div style={{ padding: "16px 24px" }}>
```

to:

```tsx
<div style={{ padding: "16px 24px", background: surfaceBg(0.04), height: "100%" }}>
```

Also add `background: surfaceBg(0.04)` to the scrollable inner container (line 87) to ensure the background extends behind the SVG:

```tsx
<div style={{ overflow: "auto", background: surfaceBg(0.04) }}>
```

**Step 2: Build and verify**

Run: `bun run build`
Expected: builds without errors.

**Step 3: Commit**

```bash
git add src/components/GraphView.tsx
git commit -m "fix: apply surface tint background to graph section"
```

---

### Task 3: Fix graph refs parsing and make SVG scrollable

**Objective:** Fix the ref (branch/tag) parsing from `%D` format so labels appear, and make the SVG wide enough for all columns with proper scroll behavior.

**Files:**
- Modify: `src/git.ts:286-292`
- Modify: `src/components/GraphView.tsx:87-92, 141-183`

**Step 1: Fix ref parsing in git.ts**

The current `%D` format returns something like `HEAD -> main, tag: v0.3.2`. The parsing `split(",").map(r => r.trim().split(" ").pop()!)` tries to get `main` from `HEAD -> main`, which should work but `.pop()!` will get `main` correctly. However, for `tag: v0.3.2`, it gets `v0.3.2)` which has a trailing paren? No, `%D` doesn't have parens. Let me check what `%D` actually returns.

`%D` returns ref names like: `HEAD -> main, origin/main, tag: v0.3.2`

The current parsing:
```typescript
const refs = refsStr ? refsStr.split(",").map((r) => r.trim().split(" ").pop()!).filter(Boolean) : [];
```

For `HEAD -> main`: `split(" ")` = `["HEAD", "->", "main"]`, `pop()` = `"main"` ✓
For `tag: v0.3.2`: `split(" ")` = `["tag:", "v0.3.2"]`, `pop()` = `"v0.3.2"` ✓

This parsing looks correct for standard git ref formats. The issue is likely that most commits DON'T have refs pointing at them — only the current branch HEAD, tags, and remote branches. So commits in the middle of the graph will have empty `refs[]`.

To show more useful info on each graph row, add the **commit hash** and **message** columns as fallback content when refs are empty.

**Step 2: Rewrite GraphView SVG layout for proper scroll + wrapping**

Replace the fixed-width SVG with a dynamic-width layout that supports horizontal scrolling and wraps long commit messages.

Replace lines 87-92 (the scroll container + SVG wrapper):

```tsx
<div style={{ overflow: "auto", background: surfaceBg(0.04) }}>
  <div style={{ "min-width": `${graphWidth() + 700}px` }}>
    <svg
      width={graphWidth() + 700}
      height={rows().length * ROW_HEIGHT + 20}
      style={{ "font-family": "Space Mono, monospace", "font-size": "12px", display: "block" }}
    >
```

The extra 700px accommodates commit hash + author + timestamp columns alongside the graph.

**Step 3: Replace static text positioning with dynamic column layout**

Replace the ref/hash/message/author text elements (lines 141-183) with properly positioned columns.

The key changes:
- `COL_HASH` = 80px after the graph
- `COL_MESSAGE` = 320px after hash  
- `COL_AUTHOR` = 200px after message
- Message column: use `<foreignObject>` with HTML `<div>` for text wrapping instead of `<text>`

Remove the old text elements (lines 140-183) and replace with:

```tsx
{/* Ref labels — rendered as badges */}
<Index each={row().refs}>
  {(ref) => (
    <g>
      <rect
        x={graphWidth() + 8}
        y={y - 8}
        width={ref().length * 7 + 12}
        height={16}
        rx={3}
        fill={laneColor(row().lane)}
        opacity="0.2"
      />
      <text
        x={graphWidth() + 14}
        y={y + 4}
        fill={laneColor(row().lane)}
        font-size="10"
        font-weight="600"
      >
        {ref().length > 15 ? ref().slice(0, 15) + "…" : ref()}
      </text>
    </g>
  )}
</Index>

{/* Commit hash */}
<text
  x={graphWidth() + 10 + (row().refs.length > 0 ? Math.max(...row().refs.map(r => r.length)) * 7 + 20 : 0)}
  y={y + 4}
  fill="var(--accent-color, #f59e0b)"
  font-size="11"
  font-family="Space Mono, monospace"
>
  {row().hash.slice(0, 7)}
</text>

{/* Commit message — use foreignObject for text wrapping */}
<foreignObject
  x={graphWidth() + 96}
  y={y - 10}
  width={320}
  height={ROW_HEIGHT - 4}
>
  <div
    xmlns="http://www.w3.org/1999/xhtml"
    style={{
      "font-size": "12px",
      color: "var(--text-color)",
      "line-height": `${ROW_HEIGHT - 4}px`,
      overflow: "hidden",
      "text-overflow": "ellipsis",
      "white-space": "nowrap",
    }}
    title={row().message}
  >
    {row().message}
  </div>
</foreignObject>

{/* Author + time */}
<text
  x={graphWidth() + 426}
  y={y + 4}
  fill="var(--text-muted, #888)"
  font-size="11"
>
  {row().author.length > 18 ? row().author.slice(0, 18) + "…" : row().author} · {formatTimestamp(row().timestamp)}
</text>
```

**Why `foreignObject` instead of `text`:** SVG `<text>` elements don't support text wrapping. Using a `<foreignObject>` with an HTML `<div>` gives us natural text overflow handling with `text-overflow: ellipsis` and a `title` attribute for the full message on hover. Horizontal scroll is handled by the wider container.

**Step 4: Build and verify**

Run: `bun run build`
Expected: 16 modules, builds without errors.

**Step 5: Commit**

```bash
git add src/components/GraphView.tsx src/git.ts
git commit -m "fix: graph scroll, ref labels, message wrapping"
```

---

### Verification

1. `bun run build` — 16 modules, no errors
2. Tint slider changes should immediately update card/panel/button backgrounds
3. Graph section should have the same surface tint as other panels
4. Graph should show ref labels (branches/tags) on applicable commits
5. Graph container should scroll horizontally when content overflows
6. Long commit messages show ellipsis with full text on hover tooltip

---

### Risks & Open Questions

- `foreignObject` support: all modern browsers support it, but not in all SVG viewers. Tauri uses a modern Chromium webview, so it's safe.
- Ref parsing: `%D` format includes `tag: ` prefix on tags and `HEAD -> ` prefix on current branch. The current parsing handles these correctly, but `refsStr` could be empty for commits without any refs.
- Layout on narrow screens: the fixed 700px + graph width may still overflow on very narrow panels. The container already has `overflow: auto` so scrollbars will appear as needed.
