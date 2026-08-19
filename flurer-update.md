# Flurer & Plugin Translucency Update Specification

## 1. Executive Summary

This document specifies the architectural updates required for **Flurer Core** and **Flurer Plugins** (such as [flurer-plugin-git](file:///home/opc/projects/flurer-plugin-git)) to achieve seamless glassmorphism, wallpaper translucency, and independent plugin-level opacity controls that exceed the base Flurer shell opacity.

---

## 2. Core Problem Analysis

### 2.1 The DOM & WebView Blur Hierarchy
1. **Flurer Base Theme**: Flurer manages dynamic CSS custom properties on `document.documentElement` (`--panel-rgb`, `--surface-opacity`, `--surface-blur`, `--glass-bg`, etc.) and renders an absolute wallpaper background ([`.wallpaper-bg`](file:///home/opc/projects/Flurer/src/App.tsx#L921-L923)) behind the app shell.
2. **Plugin Container in Flurer**: In [`Flurer/src/App.tsx:L1015-L1018`](file:///home/opc/projects/Flurer/src/App.tsx#L1015-L1018), plugins are mounted inside `.view-pane`. In [`Flurer/src/App.css:L468-L474`](file:///home/opc/projects/Flurer/src/App.css#L468-L474), `.view-pane` is purely a flex layout box with `background: transparent` and no `backdrop-filter`.
3. **Plugin Software Blending Issue**: When transparency appeared inactive, plugins attempted software alpha blending ([`surfaceBg`](file:///home/opc/projects/flurer-plugin-git/src/utils.ts#L170-L184)) which outputs solid, 100% opaque `rgb(r,g,b)` strings. This solid background occludes the underlying wallpaper and destroys the DOM backdrop chain.
4. **WebView Limitation on `backgroundType: "none"`**: CSS `backdrop-filter: blur()` in Chromium/WebView2 can only sample and blur elements rendered inside the DOM paint tree. If the user selects `backgroundType: "none"` without native OS window vibrancy (Mica/Acrylic), pure transparency displays an unblurred cutout of desktop windows.

---

## 3. Recommended Flurer Core Updates

### 3.1 Provide Standard Plugin Container Styles & Scoped Opacity CSS Variables
Update [`.view-pane`](file:///home/opc/projects/Flurer/src/App.css#L468-L474) in [`Flurer/src/App.css`](file:///home/opc/projects/Flurer/src/App.css) to support an optional plugin glass surface while allowing plugins to override surface opacity:

```css
/* Flurer/src/App.css */
.view-pane {
    flex: 1;
    min-width: 0;
    min-height: 0;
    flex-direction: column;
    overflow: auto;
    /* Base surface fallback for plugins without custom container backgrounds */
    background-color: rgba(var(--panel-rgb), var(--plugin-surface-opacity, var(--surface-opacity)));
    backdrop-filter: blur(var(--surface-blur, 0));
    -webkit-backdrop-filter: blur(var(--surface-blur, 0));
}
```

### 3.2 Pass Dynamic Plugin Settings & Theme Tokens
Ensure [`Flurer/src/App.tsx`](file:///home/opc/projects/Flurer/src/App.tsx#L1020-L1037) passes the parent theme tokens and allows plugins to cleanly read and write their scoped opacity settings via `pluginSettings`:

```tsx
// Flurer/src/App.tsx
const props = {
  currentPath: currentPath(),
  navigateTo: navigateTo,
  searchQuery: searchQuery(),
  focusPath: graphFocusRequest(),
  active: mainView() === plugin.id,
  dataBgLightness: fileListLightness(),
  settingsLoaded: settingsLoaded(),
  baseSurfaceOpacity: settings.uiTintOpacity,
  baseSurfaceBlur: settings.uiBlurPx,
  pluginSettings: settings.pluginSettings?.[plugin.id] ?? {},
  onPluginSettingsChange: (patch: any) => updatePluginSettings(plugin.id, patch)
};
```

### 3.3 Add Native Window Vibrancy (Windows Mica / Acrylic) in Tauri Backend
In [`Flurer/src-tauri/src/lib.rs`](file:///home/opc/projects/Flurer/src-tauri/src/lib.rs), enable DWM / window vibrancy effects for Windows 11/10 when `backgroundType` is `"none"`:
* Utilize Tauri window effects (`window.set_effects(...)` or `window_vibrancy`) so that transparent areas blur the desktop wallpaper natively even when no in-app wallpaper image is rendered.

---

## 4. Recommended Plugin-Side Updates (e.g. `flurer-plugin-git`)

### 4.1 Independent, Higher Opacity Calculation
Plugins often contain dense tabular data, diff trees, and branch graphs requiring higher contrast and opacity (e.g., `0.70`–`0.85`) than Flurer's main shell (`0.35`).

Update [`src/utils.ts`](file:///home/opc/projects/flurer-plugin-git/src/utils.ts) to produce true `rgba()` values using Flurer's CSS variables:

```typescript
// flurer-plugin-git/src/utils.ts
export function getEffectiveSurfaceOpacity(): number {
  // Plugin opacity setting (default 0.75), guaranteed to maintain readability
  const pluginOpacity = getSurfaceOpacity(); // e.g. 0.75
  return Math.max(0.4, Math.min(1.0, pluginOpacity));
}

export function pluginGlassBg(customOpacity?: number): string {
  const opacity = customOpacity ?? getEffectiveSurfaceOpacity();
  return `rgba(var(--panel-rgb, 32, 32, 32), ${opacity})`;
}

export function pluginTintBg(customOpacity?: number): string {
  const opacity = customOpacity ?? (getEffectiveSurfaceOpacity() * 0.9);
  return `rgba(var(--panel-tint-rgb, 24, 24, 27), ${opacity})`;
}
```

### 4.2 Update Root Container in `GitPanel`
In [`src/index.tsx:L129`](file:///home/opc/projects/flurer-plugin-git/src/index.tsx#L129):

```tsx
// flurer-plugin-git/src/index.tsx
<div
  style={{
    height: "100%",
    width: "100%",
    display: "flex",
    "flex-direction": "column",
    overflow: "hidden",
    "box-sizing": "border-box",
    background: `rgba(var(--panel-rgb, 32, 32, 32), ${getEffectiveSurfaceOpacity()})`,
    "backdrop-filter": "blur(var(--surface-blur, 16px))",
    "-webkit-backdrop-filter": "blur(var(--surface-blur, 16px))",
  }}
>
  {/* Tab bar and sub-views */}
</div>
```

### 4.3 Refactor Child Style Tokens in `styles.ts`
Replace hardcoded dark navy colors (`rgba(15, 23, 42, ...)`, `rgba(10, 14, 23, ...)`) in [`src/styles.ts`](file:///home/opc/projects/flurer-plugin-git/src/styles.ts) with CSS variable-backed translucent layers:

* **Cards ([`S.card`](file:///home/opc/projects/flurer-plugin-git/src/styles.ts#L93-L102), [`S.repoCard`](file:///home/opc/projects/flurer-plugin-git/src/styles.ts#L259-L272))**:
  ```typescript
  card: {
    background: "rgba(var(--panel-tint-rgb, 15, 23, 42), calc(var(--surface-opacity, 0.5) * 0.75 + 0.25))",
    border: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
    "box-shadow": "var(--shadow-md, 0 4px 20px rgba(0, 0, 0, 0.25))",
    "backdrop-filter": "blur(var(--glass-blur, 12px))",
    "-webkit-backdrop-filter": "blur(var(--glass-blur, 12px))",
    "border-radius": "12px",
    padding: "16px",
    "margin-bottom": "12px",
  }
  ```
* **Inputs & Controls ([`S.input`](file:///home/opc/projects/flurer-plugin-git/src/styles.ts#L165-L176), [`S.commitInput`](file:///home/opc/projects/flurer-plugin-git/src/styles.ts#L115-L127))**:
  ```typescript
  input: {
    background: "var(--control-bg, rgba(255, 255, 255, 0.08))",
    border: "var(--control-border, 1px solid rgba(255, 255, 255, 0.12))",
    color: "var(--text-primary, var(--text-color, #f8fafc))",
  }
  ```
* **Tab Bars & Toolbars ([`S.tabBar`](file:///home/opc/projects/flurer-plugin-git/src/styles.ts#L155-L164), [`S.statusBar`](file:///home/opc/projects/flurer-plugin-git/src/styles.ts#L309-L325))**:
  ```typescript
  tabBar: {
    background: "rgba(var(--panel-tint-rgb, 10, 14, 23), calc(var(--surface-opacity, 0.5) * 0.85 + 0.15))",
    "backdrop-filter": "blur(var(--glass-blur, 12px))",
    "-webkit-backdrop-filter": "blur(var(--glass-blur, 12px))",
    "border-bottom": "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
  }
  ```

---

## 5. Summary Checklist

| Component | Target Location | Action |
| :--- | :--- | :--- |
| **Flurer Core** | [`Flurer/src/App.css`](file:///home/opc/projects/Flurer/src/App.css#L468-L474) | Add default glass background & backdrop-filter to `.view-pane` |
| **Flurer Core** | [`Flurer/src/App.tsx`](file:///home/opc/projects/Flurer/src/App.tsx#L1020-L1030) | Provide `baseSurfaceOpacity` and theme props to plugin mount |
| **Flurer Core** | [`Flurer/src-tauri/src/lib.rs`](file:///home/opc/projects/Flurer/src-tauri/src/lib.rs) | Add native window acrylic/mica vibrancy fallback for `backgroundType: "none"` |
| **Git Plugin** | [`flurer-plugin-git/src/utils.ts`](file:///home/opc/projects/flurer-plugin-git/src/utils.ts#L170-L184) | Replace solid `rgb()` `surfaceBg` with true `rgba(var(--panel-rgb), opacity)` |
| **Git Plugin** | [`flurer-plugin-git/src/index.tsx`](file:///home/opc/projects/flurer-plugin-git/src/index.tsx#L129) | Add `backdrop-filter: blur(var(--surface-blur))` to root container |
| **Git Plugin** | [`flurer-plugin-git/src/styles.ts`](file:///home/opc/projects/flurer-plugin-git/src/styles.ts) | Unify card, input, and toolbar styling with Flurer CSS variables |
