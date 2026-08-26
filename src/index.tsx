import { Show, For, createSignal, createMemo, createEffect, createRoot } from "solid-js";
import { GitProvider } from "./context";
import {
  getRecentRepos, basename, setSurfaceOpacity, setSurfaceBlur, setButtonTintOpacity,
  setGraphPanSpeed, setGraphZoomSpeed, setGraphRotateSpeed,
  setGraphFocusZoomStep, setGraphFocusTransitionTime,
  getSavedOpenTabs, saveOpenTabs, getSavedActiveTab, saveActiveTab,
} from "./utils";
import { GitIcon, CloseIcon, PlusIcon, Toast } from "./components/shared";
import { DashboardView } from "./components/DashboardView";
import { RepoView } from "./components/RepoView";
import { SettingsPanel } from "./components/SettingsPanel";

interface OpenTab {
  id: string;
  path: string;
  name: string;
}

let tabCounter = 0;

function initRestoredTabs(): { tabs: OpenTab[]; activeId: string | null } {
  const savedPaths = getSavedOpenTabs();
  const savedActivePath = getSavedActiveTab();
  if (savedPaths.length > 0) {
    const restored: OpenTab[] = savedPaths.map((p) => ({
      id: `tab-${++tabCounter}`,
      path: p,
      name: basename(p),
    }));
    const activeMatch = restored.find((t) => t.path === savedActivePath);
    return {
      tabs: restored,
      activeId: activeMatch ? activeMatch.id : restored[0].id,
    };
  }
  return { tabs: [], activeId: null };
}

const initialTabState = initRestoredTabs();

// Persistent module-level reactive state that survives unmount/remount (e.g. switching to Settings & back)
const [globalTabs, setGlobalTabs] = createRoot(() => createSignal<OpenTab[]>(initialTabState.tabs));
const [globalActiveTabId, setGlobalActiveTabId] = createRoot(() => createSignal<string | null>(initialTabState.activeId));
const [globalShowDashManual, setGlobalShowDashManual] = createRoot(() => createSignal(false));
const [switchedFromExplorer, setSwitchedFromExplorer] = createRoot(() => createSignal(false));

function wasExplorerActive(): boolean {
  try {
    const activeRail = document.querySelector(".view-rail-item.active");
    if (activeRail) {
      const title = activeRail.getAttribute("title") || activeRail.getAttribute("aria-label");
      if (title === "Explorer") return true;
      if (title && title !== "Explorer") return false;
    }
    const explorerPane = document.querySelector(".explorer-view");
    if (explorerPane && window.getComputedStyle(explorerPane).display !== "none") {
      return true;
    }
  } catch {}
  return false;
}

import { currentTheme, getThemeStyles } from "./theme";

function GitPanel(props: any) {
  const tabs = globalTabs;
  const activeTabId = globalActiveTabId;
  const showDashManual = globalShowDashManual;

  // Persist open tabs and active tab whenever they change
  createEffect(() => {
    const currentTabs = tabs();
    saveOpenTabs(currentTabs.map((t) => t.path));
    const active = currentTabs.find((t) => t.id === activeTabId());
    saveActiveTab(active ? active.path : null);
  });

  // Automatically open directly if no repo is open, else ask using a popup modal (ONLY when switching from Explorer view)
  const [pendingExplorerPath, setPendingExplorerPath] = createSignal<string | null>(null);
  let lastHandledPath: string | null = null;
  createEffect(() => {
    const p = props.currentPath;
    const isActive = props.active;
    if (!isActive || !p) return;

    const fromExplorer = switchedFromExplorer();
    if (!fromExplorer && tabs().length > 0) {
      // Coming from another plugin or settings with open tabs -> preserve current tabs as-is!
      return;
    }

    if (fromExplorer) setSwitchedFromExplorer(false);

    if (p === lastHandledPath) return;
    lastHandledPath = p;

    const activeTab = tabs().find((t) => t.id === activeTabId());
    if (activeTab && activeTab.path === p) return;

    if (tabs().length === 0) {
      // No repo is currently opened -> open folder directly
      openRepo(p);
    } else {
      // Repos are already opened -> ask using a popup modal
      setPendingExplorerPath(p);
    }
  });

  // Apply saved plugin settings
  createEffect(() => {
    const ps = props.pluginSettings;
    if (ps) {
      if (typeof ps.surfaceOpacity === "number") setSurfaceOpacity(ps.surfaceOpacity);
      if (typeof ps.surfaceBlur === "number") setSurfaceBlur(ps.surfaceBlur);
      if (typeof ps.buttonTintOpacity === "number") setButtonTintOpacity(ps.buttonTintOpacity);
      if (typeof ps.graphPanSpeed === "number") setGraphPanSpeed(ps.graphPanSpeed);
      if (typeof ps.graphZoomSpeed === "number") setGraphZoomSpeed(ps.graphZoomSpeed);
      if (typeof ps.graphRotateSpeed === "number") setGraphRotateSpeed(ps.graphRotateSpeed);
      if (typeof ps.graphFocusZoomStep === "number") setGraphFocusZoomStep(ps.graphFocusZoomStep);
      if (typeof ps.graphFocusTransitionTime === "number") setGraphFocusTransitionTime(ps.graphFocusTransitionTime);
    }
  });

  const showDashboard = () => tabs().length === 0 || showDashManual();

  function openRepo(path: string) {
    setGlobalShowDashManual(false);
    const existing = tabs().find((t) => t.path === path);
    if (existing) {
      setGlobalActiveTabId(existing.id);
      saveActiveTab(path);
      return;
    }
    const id = `tab-${++tabCounter}`;
    const name = basename(path);
    setGlobalTabs((prev) => [...prev, { id, path, name }]);
    setGlobalActiveTabId(id);
    saveActiveTab(path);
  }

  function closeTab(id: string, e: MouseEvent) {
    e.stopPropagation();
    const tab = tabs().find((t) => t.id === id);
    if (!tab) return;
    const remaining = tabs().filter((t) => t.id !== id);
    setGlobalTabs(remaining);
    if (remaining.length === 0) {
      setGlobalActiveTabId(null);
      saveActiveTab(null);
    } else if (activeTabId() === id) {
      const idx = tabs().findIndex((t) => t.id === id);
      const nextIdx = Math.min(idx, remaining.length - 1);
      const nextTab = remaining[nextIdx];
      setGlobalActiveTabId(nextTab.id);
      saveActiveTab(nextTab.path);
    }
  }

  function switchTab(id: string) {
    setGlobalActiveTabId(id);
    const target = tabs().find((t) => t.id === id);
    if (target) saveActiveTab(target.path);
  }

  return (
    <div
      class="flurer-plugin-git-root"
      style={{
        ...getThemeStyles(currentTheme()),
        height: "100%",
        width: "100%",
        display: "flex",
        "flex-direction": "column",
        overflow: "hidden",
        "box-sizing": "border-box",
        background: "var(--bg-primary, #0b0f19)",
        color: "var(--text-primary, #f8fafc)",
      }}
    >
      {/* Tab bar — always visible when there are open repos */}
      <Show when={tabs().length > 0}>
        <div style={{ display: "flex", gap: 0, "border-bottom": "1px solid var(--border-strong, rgba(255, 255, 255, 0.08))", "flex-shrink": 0, "align-items": "stretch", overflow: "auto", background: "rgba(var(--panel-rgb, 10, 14, 23), 0.35)", "backdrop-filter": "blur(12px)" }}>
          <For each={tabs()}>
            {(tab) => (
              <div
                style={{
                  display: "flex",
                  "align-items": "center",
                  gap: "6px",
                  padding: "0 12px",
                  height: "36px",
                  cursor: "pointer",
                  "flex-shrink": 0,
                  "font-size": "12px",
                  "font-weight": activeTabId() === tab.id ? 600 : 400,
                  color: activeTabId() === tab.id ? "var(--text-color)" : "var(--text-muted, #888)",
                  "border-bottom": activeTabId() === tab.id ? "2px solid var(--accent, var(--accent-color, #f59e0b))" : "2px solid transparent",
                  transition: "color 0.15s, border-color 0.15s",
                  "user-select": "none",
                }}
                onClick={() => switchTab(tab.id)}
              >
                <GitIcon size={14} />
                <span style={{ overflow: "hidden", "text-overflow": "ellipsis", "max-width": "140px", "white-space": "nowrap" }}>
                  {tab.name}
                </span>
                <button
                  type="button"
                  style={{
                    display: "inline-flex",
                    "align-items": "center",
                    "justify-content": "center",
                    width: "18px",
                    height: "18px",
                    padding: 0,
                    border: "none",
                    background: "transparent",
                    color: "var(--text-muted, #888)",
                    cursor: "pointer",
                    "border-radius": "3px",
                    opacity: 0.5,
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.5"; }}
                  onClick={(e) => closeTab(tab.id, e)}
                  title="Close tab"
                >
                  <CloseIcon size={12} />
                </button>
              </div>
            )}
          </For>
          <div style={{ display: "flex", "align-items": "center", padding: "0 8px" }}>
            <button
              type="button"
              style={{
                display: "inline-flex",
                "align-items": "center",
                "justify-content": "center",
                width: "24px",
                height: "24px",
                padding: 0,
                border: "none",
                background: "transparent",
                color: "var(--text-muted, #888)",
                cursor: "pointer",
                "border-radius": "4px",
              }}
              onClick={() => setGlobalShowDashManual(true)}
              title="Open Repository"
            >
              <PlusIcon size={16} />
            </button>
          </div>
        </div>
      </Show>

      {/* Dashboard — shown when no tabs are open, or when all tabs are closed */}
      <Show when={showDashboard()}>
        <DashboardView onOpenRepo={openRepo} />
      </Show>

      {/* Active repo tab — each tab gets its own GitProvider */}
      <For each={tabs()}>
        {(tab) => (
          <Show when={!showDashboard() && activeTabId() === tab.id}>
            <GitProvider initialPath={tab.path} onOpenRepoInNewTab={(p) => openRepo(p)}>
              <RepoView onClose={() => closeTab(tab.id, new MouseEvent("click"))} />
              <Toast />
            </GitProvider>
          </Show>
        )}
      </For>
      {/* Explorer Prompt Modal — shown when repos are already open and user browsed a new folder in Explorer */}
      <Show when={pendingExplorerPath()}>
        {(path) => {
          const isAlreadyTab = () => tabs().some((t) => t.path === path());
          return (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.65)",
                "backdrop-filter": "blur(12px)",
                "-webkit-backdrop-filter": "blur(12px)",
                display: "flex",
                "align-items": "center",
                "justify-content": "center",
                "z-index": 100000,
              }}
              onClick={() => setPendingExplorerPath(null)}
            >
              <div
                style={{
                  ...getThemeStyles(currentTheme()),
                  background: "var(--panel-bg, #0f172a)",
                  border: "1px solid var(--border-color, rgba(255, 255, 255, 0.15))",
                  "border-radius": "12px",
                  "max-width": "420px",
                  width: "90%",
                  padding: "20px 24px",
                  "box-shadow": "0 20px 50px rgba(0,0,0,0.75)",
                  color: "var(--text-primary, #f8fafc)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ display: "flex", "align-items": "center", gap: "8px", "margin-bottom": "8px" }}>
                  <div style={{ "font-size": "15px", "font-weight": 700 }}>
                    📁 Open Folder in Git Operations?
                  </div>
                </div>
                <div style={{ "font-size": "13px", color: "var(--text-secondary, #94a3b8)", "line-height": "1.5", "margin-bottom": "12px" }}>
                  Flurer Explorer is currently viewing:
                </div>
                <div style={{ background: "rgba(0,0,0,0.35)", padding: "8px 12px", "border-radius": "6px", border: "1px solid rgba(255,255,255,0.08)", "margin-bottom": "20px", "word-break": "break-all", "font-family": "Space Mono, monospace", "font-size": "12px", color: "var(--accent-default, #38bdf8)" }}>
                  {path()}
                </div>
                <div style={{ display: "flex", gap: "10px", "justify-content": "flex-end", "flex-wrap": "wrap" }}>
                  <button
                    type="button"
                    style={{
                      padding: "6px 14px",
                      "font-size": "12px",
                      "font-weight": 600,
                      "border-radius": "8px",
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.05)",
                      color: "var(--text-secondary, #cbd5e1)",
                      cursor: "pointer",
                    }}
                    onClick={() => setPendingExplorerPath(null)}
                  >
                    ✕ Dismiss
                  </button>
                  <button
                    type="button"
                    style={{
                      padding: "6px 14px",
                      "font-size": "12px",
                      "font-weight": 600,
                      "border-radius": "8px",
                      border: "1px solid rgba(255,255,255,0.18)",
                      background: "var(--btn-primary-bg, #1e293b)",
                      color: "var(--btn-primary-text, #f8fafc)",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      openRepo(path());
                      setPendingExplorerPath(null);
                    }}
                  >
                    {isAlreadyTab() ? "🔀 Switch to Tab" : "➕ Open in New Tab"}
                  </button>
                </div>
              </div>
            </div>
          );
        }}
      </Show>
    </div>
  );
}

declare const __VERSION__: string;

window.registerPlugin({
  id: "git",
  name: "Git Operations",
  description: "Full-featured git panel with graph, branches, diff, stash, worktrees, and more.",
  version: __VERSION__,
  author: "Algosculptor",
  hasCustomAppearanceSettings: true,
  viewRailButton: (props: any) => (
    <button
      type="button"
      class="view-rail-item"
      classList={{ active: props.active }}
      title="Git operations"
      aria-label="Git operations"
      onClick={() => {
        if (wasExplorerActive()) {
          setSwitchedFromExplorer(true);
        } else {
          setSwitchedFromExplorer(false);
        }
        props.onClick();
      }}
    >
      <GitIcon size={19} />
    </button>
  ),
  fullPanel: (props: any) => <GitPanel {...props} />,
  settingsPanel: (props: any) => <SettingsPanel {...props} />,
});