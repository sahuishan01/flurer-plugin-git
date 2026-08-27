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
import { checkGitAvailable, isGitRepo } from "./git";

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

  const [gitStatus, setGitStatus] = createSignal<{ checking: boolean; installed: boolean; version: string }>({
    checking: true,
    installed: true,
    version: "",
  });
  const [copiedCommand, setCopiedCommand] = createSignal(false);

  async function verifyGitInstallation() {
    setGitStatus({ checking: true, installed: true, version: "" });
    const res = await checkGitAvailable();
    setGitStatus({ checking: false, installed: res.installed, version: res.version });
  }

  createEffect(() => {
    if (props.active) {
      verifyGitInstallation();
    }
  });

  // Persist open tabs and active tab whenever they change
  createEffect(() => {
    const currentTabs = tabs();
    saveOpenTabs(currentTabs.map((t) => t.path));
    const active = currentTabs.find((t) => t.id === activeTabId());
    saveActiveTab(active ? active.path : null);
  });

  // Automatically open directly if no repo is open, else ask using a popup modal (ONLY when switching from Explorer view AND if the folder is a git repo)
  const [pendingExplorerPath, setPendingExplorerPath] = createSignal<string | null>(null);
  let lastHandledPath: string | null = null;
  createEffect(() => {
    const p = props.currentPath;
    const isActive = props.active;
    if (!isActive || !p) return;

    const fromExplorer = switchedFromExplorer();
    if (!fromExplorer) {
      // Must ONLY process props.currentPath if the user explicitly switched from Explorer view
      return;
    }

    setSwitchedFromExplorer(false);

    if (p === lastHandledPath) return;
    lastHandledPath = p;

    const activeTab = tabs().find((t) => t.id === activeTabId());
    if (activeTab && activeTab.path === p) return;

    // Only process the folder if it is a valid Git repository
    isGitRepo(p).then((isGit) => {
      if (!isGit) return;

      if (tabs().length === 0) {
        // No repo is currently opened -> open folder directly
        openRepo(p);
      } else {
        // Repos are already opened -> ask using a popup modal
        setPendingExplorerPath(p);
      }
    });
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
    const currentTabs = tabs();
    const idx = currentTabs.findIndex((t) => t.id === id);
    if (idx === -1) return;

    const remaining = currentTabs.filter((t) => t.id !== id);
    setGlobalTabs(remaining);

    if (remaining.length === 0) {
      setGlobalActiveTabId(null);
      saveActiveTab(null);
      setGlobalShowDashManual(true);
    } else if (activeTabId() === id) {
      const nextIdx = Math.min(idx, remaining.length - 1);
      const nextTab = remaining[nextIdx];
      if (nextTab) {
        setGlobalActiveTabId(nextTab.id);
        saveActiveTab(nextTab.path);
      } else {
        setGlobalActiveTabId(null);
        saveActiveTab(null);
      }
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
      {/* Git Missing / Download Required Modal */}
      <Show when={!gitStatus().checking && !gitStatus().installed}>
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.8)",
            "backdrop-filter": "blur(16px)",
            "-webkit-backdrop-filter": "blur(16px)",
            display: "flex",
            "align-items": "center",
            "justify-content": "center",
            "z-index": 100099,
            padding: "20px",
          }}
        >
          <div
            style={{
              ...getThemeStyles(currentTheme()),
              background: "var(--panel-bg, #0f172a)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              "border-radius": "16px",
              "max-width": "520px",
              width: "100%",
              padding: "28px 32px",
              "box-shadow": "0 25px 60px rgba(0, 0, 0, 0.85)",
              color: "var(--text-primary, #f8fafc)",
              display: "flex",
              "flex-direction": "column",
              gap: "18px",
            }}
          >
            <div style={{ display: "flex", "align-items": "center", gap: "14px" }}>
              <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", padding: "12px", "border-radius": "12px", display: "flex" }}>
                <GitIcon size={32} style={{ color: "#ef4444" }} />
              </div>
              <div>
                <div style={{ "font-size": "19px", "font-weight": 700, color: "#f8fafc" }}>
                  Git CLI Required
                </div>
                <div style={{ "font-size": "13px", color: "var(--text-secondary, #94a3b8)", "margin-top": "2px" }}>
                  Git Operations requires Git installed on your system to work.
                </div>
              </div>
            </div>

            <div style={{ background: "rgba(0, 0, 0, 0.35)", padding: "14px 16px", "border-radius": "10px", border: "1px solid rgba(255, 255, 255, 0.08)", "font-size": "13px", "line-height": "1.6", color: "var(--text-secondary, #cbd5e1)" }}>
              We could not find <code style={{ color: "#38bdf8", background: "rgba(56, 189, 248, 0.12)", padding: "2px 6px", "border-radius": "4px", "font-family": "Space Mono, monospace" }}>git</code> in your system PATH. Please install Git using one of the options below and click <strong>Re-check Git</strong>.
            </div>

            <div style={{ display: "flex", "flex-direction": "column", gap: "8px" }}>
              <div style={{ "font-size": "12px", "font-weight": 600, color: "var(--text-secondary, #94a3b8)" }}>
                Quick Terminal Install:
              </div>
              <div style={{ background: "#090d16", padding: "10px 14px", "border-radius": "8px", border: "1px solid rgba(255,255,255,0.12)", "font-family": "Space Mono, monospace", "font-size": "12px", color: "#38bdf8", display: "flex", "justify-content": "space-between", "align-items": "center", gap: "10px" }}>
                <span style={{ "word-break": "break-all" }}>
                  {typeof navigator !== "undefined" && navigator.userAgent.includes("Windows")
                    ? "winget install --id Git.Git -e --source winget"
                    : typeof navigator !== "undefined" && navigator.userAgent.includes("Macintosh")
                    ? "brew install git"
                    : "sudo apt install git"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const isWin = typeof navigator !== "undefined" && navigator.userAgent.includes("Windows");
                    const isMac = typeof navigator !== "undefined" && navigator.userAgent.includes("Macintosh");
                    const cmd = isWin ? "winget install --id Git.Git -e --source winget" : isMac ? "brew install git" : "sudo apt install git";
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(cmd);
                    }
                    setCopiedCommand(true);
                    setTimeout(() => setCopiedCommand(false), 2000);
                  }}
                  style={{
                    background: copiedCommand() ? "rgba(52, 211, 153, 0.2)" : "rgba(255,255,255,0.1)",
                    border: copiedCommand() ? "1px solid rgba(52, 211, 153, 0.4)" : "1px solid rgba(255,255,255,0.15)",
                    color: copiedCommand() ? "#34d399" : "#fff",
                    padding: "4px 10px",
                    "border-radius": "6px",
                    cursor: "pointer",
                    "font-size": "11px",
                    "font-weight": 600,
                    "white-space": "nowrap",
                  }}
                >
                  {copiedCommand() ? "✓ Copied!" : "📋 Copy"}
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", "margin-top": "6px", "justify-content": "flex-end", "flex-wrap": "wrap" }}>
              <button
                type="button"
                onClick={() => {
                  const win = window as any;
                  const dlUrl = typeof navigator !== "undefined" && navigator.userAgent.includes("Windows")
                    ? "https://git-scm.com/download/win"
                    : typeof navigator !== "undefined" && navigator.userAgent.includes("Macintosh")
                    ? "https://git-scm.com/download/mac"
                    : "https://git-scm.com/downloads";
                  if (win.TauriShell?.open) {
                    win.TauriShell.open(dlUrl);
                  } else {
                    window.open(dlUrl, "_blank");
                  }
                }}
                style={{
                  padding: "8px 18px",
                  "font-size": "13px",
                  "font-weight": 600,
                  "border-radius": "8px",
                  background: "#1e293b",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#f8fafc",
                  cursor: "pointer",
                  display: "inline-flex",
                  "align-items": "center",
                  gap: "6px",
                }}
              >
                🌐 Open Git Download Page
              </button>
              <button
                type="button"
                onClick={() => verifyGitInstallation()}
                style={{
                  padding: "8px 18px",
                  "font-size": "13px",
                  "font-weight": 600,
                  "border-radius": "8px",
                  background: "var(--accent-default, #38bdf8)",
                  border: "none",
                  color: "#0f172a",
                  cursor: "pointer",
                  display: "inline-flex",
                  "align-items": "center",
                  gap: "6px",
                }}
              >
                🔄 Re-check Git
              </button>
            </div>
          </div>
        </div>
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