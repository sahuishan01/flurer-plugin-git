import type { RecentRepo } from "./types";
import { createSignal, createRoot } from "solid-js";

const RECENT_REPOS_KEY = "flurer-git-recent-repos";
const MAX_RECENT_REPOS = 20;

const SETTINGS_KEY = "flurer-git-plugin-settings";

export function loadPluginSettings(): Record<string, any> {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function savePluginSettings(settings: Record<string, any>): void {
  try {
    const current = loadPluginSettings();
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, ...settings }));
  } catch {}
}

const _initialSettings = loadPluginSettings();

let _isLight: boolean | null = null;
let _bgColor: string | null = null;
const [_surfaceOpacity, _setSurfaceOpacity] = createRoot(() =>
  createSignal(typeof _initialSettings.surfaceOpacity === "number" ? _initialSettings.surfaceOpacity : 0.45)
);
const [_surfaceBlur, _setSurfaceBlur] = createRoot(() =>
  createSignal(typeof _initialSettings.surfaceBlur === "number" ? _initialSettings.surfaceBlur : 16)
);
const [_buttonTintOpacity, _setButtonTintOpacity] = createRoot(() =>
  createSignal(typeof _initialSettings.buttonTintOpacity === "number" ? _initialSettings.buttonTintOpacity : 0.12)
);
const [_graphPanSpeed, _setGraphPanSpeed] = createRoot(() =>
  createSignal(typeof _initialSettings.graphPanSpeed === "number" ? _initialSettings.graphPanSpeed : 1.0)
);
const [_graphZoomSpeed, _setGraphZoomSpeed] = createRoot(() =>
  createSignal(typeof _initialSettings.graphZoomSpeed === "number" ? _initialSettings.graphZoomSpeed : 1.0)
);
const [_graphRotateSpeed, _setGraphRotateSpeed] = createRoot(() =>
  createSignal(typeof _initialSettings.graphRotateSpeed === "number" ? _initialSettings.graphRotateSpeed : 1.0)
);
const [_graphFocusZoomStep, _setGraphFocusZoomStep] = createRoot(() =>
  createSignal(typeof _initialSettings.graphFocusZoomStep === "number" ? _initialSettings.graphFocusZoomStep : 0.20)
);
const [_graphFocusTransitionTime, _setGraphFocusTransitionTime] = createRoot(() =>
  createSignal(typeof _initialSettings.graphFocusTransitionTime === "number" ? _initialSettings.graphFocusTransitionTime : 650)
);
const [_maxDiscoveredReposCap, _setMaxDiscoveredReposCap] = createRoot(() =>
  createSignal(typeof _initialSettings.maxDiscoveredReposCap === "number" ? _initialSettings.maxDiscoveredReposCap : 50)
);

/** Override max discovered repos scan cap (5–500). Passed via plugin settings. */
export function setMaxDiscoveredReposCap(cap: number) {
  _setMaxDiscoveredReposCap(Math.max(5, Math.min(500, cap)));
  savePluginSettings({ maxDiscoveredReposCap: cap });
}

/** Get current max discovered repos scan cap. */
export function getMaxDiscoveredReposCap(): number {
  return _maxDiscoveredReposCap();
}

/** Override the surface tint opacity (0–1). Passed via plugin settings. */
export function setSurfaceOpacity(opacity: number) {
  _setSurfaceOpacity(Math.max(0, Math.min(1, opacity)));
  savePluginSettings({ surfaceOpacity: opacity });
}

/** Get current surface tint opacity. */
export function getSurfaceOpacity(): number {
  return _surfaceOpacity();
}

/** Override the surface blur in px (0–64). Passed via plugin settings. */
export function setSurfaceBlur(blur: number) {
  _setSurfaceBlur(Math.max(0, Math.min(64, blur)));
  savePluginSettings({ surfaceBlur: blur });
}

/** Get current surface blur in px. */
export function getSurfaceBlur(): number {
  return _surfaceBlur();
}

/** Override the button tint opacity (0–1). Passed via plugin settings. */
export function setButtonTintOpacity(opacity: number) {
  _setButtonTintOpacity(Math.max(0, Math.min(1, opacity)));
  savePluginSettings({ buttonTintOpacity: opacity });
}

/** Get current button tint opacity. */
export function getButtonTintOpacity(): number {
  return _buttonTintOpacity();
}

/** Override graph pan sensitivity (0.1–3.0x multiplier). */
export function setGraphPanSpeed(speed: number) {
  _setGraphPanSpeed(Math.max(0.1, Math.min(3.0, speed)));
  savePluginSettings({ graphPanSpeed: speed });
}

/** Get current graph pan sensitivity multiplier. */
export function getGraphPanSpeed(): number {
  return _graphPanSpeed();
}

/** Override graph zoom sensitivity (0.1–3.0x multiplier). */
export function setGraphZoomSpeed(speed: number) {
  _setGraphZoomSpeed(Math.max(0.1, Math.min(3.0, speed)));
  savePluginSettings({ graphZoomSpeed: speed });
}

/** Get current graph zoom sensitivity multiplier. */
export function getGraphZoomSpeed(): number {
  return _graphZoomSpeed();
}

/** Override graph 3D rotation sensitivity (0.1–3.0x multiplier). */
export function setGraphRotateSpeed(speed: number) {
  _setGraphRotateSpeed(Math.max(0.1, Math.min(3.0, speed)));
  savePluginSettings({ graphRotateSpeed: speed });
}

/** Get current graph 3D rotation sensitivity multiplier. */
export function getGraphRotateSpeed(): number {
  return _graphRotateSpeed();
}

/** Override graph focus zoom step ratio (0.05–0.60, default 0.20 for 20% zoom-in). */
export function setGraphFocusZoomStep(step: number) {
  _setGraphFocusZoomStep(Math.max(0.05, Math.min(0.60, step)));
  savePluginSettings({ graphFocusZoomStep: step });
}

/** Get current graph focus zoom step ratio. */
export function getGraphFocusZoomStep(): number {
  return _graphFocusZoomStep();
}

/** Override graph focus transition time in milliseconds (200–2000ms, default 650ms). */
export function setGraphFocusTransitionTime(ms: number) {
  _setGraphFocusTransitionTime(Math.max(200, Math.min(2000, ms)));
  savePluginSettings({ graphFocusTransitionTime: ms });
}

/** Get current graph focus transition time in milliseconds. */
export function getGraphFocusTransitionTime(): number {
  return _graphFocusTransitionTime();
}

/** Detect whether Flurer's background is light or dark, and cache its hex. */
export function isLightBg(): boolean {
  if (_isLight !== null) return _isLight;
  try {
    const root = document.documentElement;
    const cs = getComputedStyle(root);
    // Try --bg-color first (hex)
    const bg = cs.getPropertyValue("--bg-color").trim();
    if (bg && bg !== "transparent") {
      const match = bg.match(/^#([0-9a-f]{6})$/i);
      if (match) {
        _bgColor = bg;
        const r = parseInt(match[1].slice(0, 2), 16);
        const g = parseInt(match[1].slice(2, 4), 16);
        const b = parseInt(match[1].slice(4, 6), 16);
        _isLight = 0.299 * r + 0.587 * g + 0.114 * b > 128;
        return _isLight;
      }
    }
    // Fallback: read --glass-tint-rgb or --panel-rgb (e.g. "32, 32, 32")
    const tintRgb = cs.getPropertyValue("--glass-tint-rgb").trim()
      || cs.getPropertyValue("--panel-rgb").trim();
    if (tintRgb) {
      const parts = tintRgb.split(",").map((s) => parseInt(s.trim(), 10));
      if (parts.length === 3 && parts.every((n) => !isNaN(n))) {
        _bgColor = `#${parts.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
        _isLight = 0.299 * parts[0] + 0.587 * parts[1] + 0.114 * parts[2] > 128;
        return _isLight;
      }
    }
  } catch {}
  // Fallback: assume dark (Flurer default)
  _isLight = false;
  return false;
}

function blendChannel(base: number, tint: number, opacity: number): number {
  return Math.round(base + (tint - base) * opacity);
}

/** Get a translucent surface background utilizing Flurer panel tokens. */
export function surfaceBg(opacity?: number): string {
  const o = opacity ?? _surfaceOpacity();
  return `rgba(var(--panel-rgb, 15, 23, 42), ${o})`;
}

/** Parse a CSS color string (#hex or rgb()) into [r, g, b]. */
function parseColor(color: string): [number, number, number] | null {
  const hexMatch = color.match(/^#([0-9a-f]{6})$/i);
  if (hexMatch) {
    const h = hexMatch[1];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  const rgbMatch = color.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);
  if (rgbMatch) {
    return [parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3])];
  }
  return null;
}

/** Blend a color toward the background at the given opacity, creating a tinted button surface. */
export function buttonBg(accentColor: string, opacity?: number): string {
  const o = opacity ?? _buttonTintOpacity();
  isLightBg();
  const bgHex = _bgColor || (isLightBg() ? "#f5f5f5" : "#1a1a2e");
  const bg = parseColor(bgHex) || (isLightBg() ? [245, 245, 245] : [26, 26, 46]);
  const fg = parseColor(accentColor) || [0, 120, 212];
  return `rgb(${blendChannel(bg[0], fg[0], o)},${blendChannel(bg[1], fg[1], o)},${blendChannel(bg[2], fg[2], o)})`;
}

export function getRecentRepos(): RecentRepo[] {
  try {
    const raw = localStorage.getItem(RECENT_REPOS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveRecentRepo(path: string, branch?: string): void {
  const repos = getRecentRepos().filter((r) => r.path !== path);
  const name = basename(path);
  repos.unshift({ path, name, lastOpened: Date.now(), branch });
  if (repos.length > MAX_RECENT_REPOS) repos.length = MAX_RECENT_REPOS;
  localStorage.setItem(RECENT_REPOS_KEY, JSON.stringify(repos));
}

export function removeRecentRepo(path: string): void {
  const repos = getRecentRepos().filter((r) => r.path !== path);
  localStorage.setItem(RECENT_REPOS_KEY, JSON.stringify(repos));
}

const OPEN_TABS_KEY = "flurer-git-open-tabs";
const ACTIVE_TAB_KEY = "flurer-git-active-tab";

export function getSavedOpenTabs(): string[] {
  try {
    const raw = localStorage.getItem(OPEN_TABS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveOpenTabs(paths: string[]): void {
  try {
    localStorage.setItem(OPEN_TABS_KEY, JSON.stringify(paths));
  } catch {}
}

export function getSavedActiveTab(): string | null {
  try {
    return localStorage.getItem(ACTIVE_TAB_KEY);
  } catch {
    return null;
  }
}

export function saveActiveTab(path: string | null): void {
  try {
    if (path) {
      localStorage.setItem(ACTIVE_TAB_KEY, path);
    } else {
      localStorage.removeItem(ACTIVE_TAB_KEY);
    }
  } catch {}
}

const BRANCH_SELECT_KEY = "flurer-git-branch-selection";
const ACTIVE_VIEW_KEY = "flurer-git-active-view";

/** Load the saved active view for a given repo path. */
export function getSavedActiveView(path: string): string | null {
  try {
    const raw = localStorage.getItem(ACTIVE_VIEW_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw);
    return map?.[path] ?? null;
  } catch {
    return null;
  }
}

/** Persist the active view for a given repo path. */
export function saveActiveView(path: string, view: string): void {
  try {
    const raw = localStorage.getItem(ACTIVE_VIEW_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[path] = view;
    localStorage.setItem(ACTIVE_VIEW_KEY, JSON.stringify(map));
  } catch {}
}

/** Load the saved branch filter selection for a given repo path. */
export function getSavedBranchSelection(path: string): string[] | null {
  try {
    const raw = localStorage.getItem(BRANCH_SELECT_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw);
    const sel = map?.[path];
    if (Array.isArray(sel)) return sel;
    return null;
  } catch {
    return null;
  }
}

/** Persist the branch filter selection for a given repo path. */
export function saveBranchSelection(path: string, branches: string[]): void {
  try {
    const raw = localStorage.getItem(BRANCH_SELECT_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[path] = branches;
    localStorage.setItem(BRANCH_SELECT_KEY, JSON.stringify(map));
  } catch {}
}

const GRAPH_DISPLAY_MODE_KEY = "flurer-git-graph-display-mode";
const DAG_LAYOUT_KEY = "flurer-git-dag-layout";

export function getSavedGraphDisplayMode(): "3d" | "2d" | "tree" {
  try {
    const val = localStorage.getItem(GRAPH_DISPLAY_MODE_KEY);
    if (val === "3d" || val === "2d" || val === "tree") return val;
    return "3d";
  } catch {
    return "3d";
  }
}

export function saveGraphDisplayMode(mode: "3d" | "2d" | "tree"): void {
  try {
    localStorage.setItem(GRAPH_DISPLAY_MODE_KEY, mode);
  } catch {}
}

export function getSavedDagLayout(): "td" | "lr" | "radial" | "none" {
  try {
    const val = localStorage.getItem(DAG_LAYOUT_KEY);
    if (val === "td" || val === "lr" || val === "radial" || val === "none") return val;
    return "td";
  } catch {
    return "td";
  }
}

export function saveDagLayout(layout: "td" | "lr" | "radial" | "none"): void {
  try {
    localStorage.setItem(DAG_LAYOUT_KEY, layout);
  } catch {}
}

export function basename(path: string): string {
  const parts = path.replace(/\\/g, "/").split("/");
  return parts[parts.length - 1] || path;
}

export function formatTimestamp(ts: number): string {
  const now = Date.now();
  const diff = now - ts * 1000;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(ts * 1000).toLocaleDateString();
}

export const formatRelativeDate = formatTimestamp;

export function statusToLabel(status: string): string {
  switch (status) {
    case "M": return "Modified";
    case "A": return "Added";
    case "D": return "Deleted";
    case "R": return "Renamed";
    case "C": return "Copied";
    case "??": return "Untracked";
    case "!": return "Ignored";
    default: return status;
  }
}

export function statusColor(status: string): string {
  switch (status) {
    case "M": return "#f59e0b";
    case "A": return "#4ade80";
    case "D": return "#f87171";
    case "R": return "#c084fc";
    case "C": return "#60a5fa";
    case "??": return "#f87171";
    default: return "var(--text-muted, #888)";
  }
}

export interface ParsedRef {
  raw: string;
  label: string;
  isTag: boolean;
  isHead: boolean;
  isRemote: boolean;
}

export function parseRef(ref: string): ParsedRef {
  const clean = ref.trim();
  if (clean.startsWith("tag: ")) {
    return { raw: clean, label: clean.substring(5).trim(), isTag: true, isHead: false, isRemote: false };
  }
  if (clean.startsWith("HEAD -> ")) {
    return { raw: clean, label: `${clean.substring(8).trim()} (HEAD)`, isTag: false, isHead: true, isRemote: false };
  }
  if (clean === "HEAD") {
    return { raw: clean, label: "HEAD", isTag: false, isHead: true, isRemote: false };
  }
  const isRemote = clean.startsWith("origin/") || clean.startsWith("upstream/");
  return { raw: clean, label: clean, isTag: false, isHead: false, isRemote };
}
