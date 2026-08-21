import { createSignal, For, Show } from "solid-js";
import { getRecentRepos, removeRecentRepo, formatTimestamp, getMaxDiscoveredReposCap } from "../utils";
import { GitIcon, FolderIcon, TrashIcon, Button } from "./shared";
import { DirectoryPickerModal } from "./DirectoryPickerModal";
import { SearchableRepoDropdown } from "./SearchableRepoDropdown";
import { scanDirectoryForGitRepos } from "../git";
import type { DiscoveredRepo } from "../types";
import { S } from "../styles";

type DashboardViewProps = {
  onOpenRepo: (path: string) => void;
};

export function DashboardView(props: DashboardViewProps) {
  const [repos, setRepos] = createSignal(getRecentRepos());
  const [openPath, setOpenPath] = createSignal("");
  const [scanPath, setScanPath] = createSignal("");
  const [showInput, setShowInput] = createSignal(false);
  const [showScanSection, setShowScanSection] = createSignal(false);
  const [showPicker, setShowPicker] = createSignal(false);
  const [discoveredRepos, setDiscoveredRepos] = createSignal<DiscoveredRepo[]>([]);
  const [scanning, setScanning] = createSignal(false);

  function handleOpen(path: string) {
    props.onOpenRepo(path);
  }

  function handleRemove(path: string) {
    removeRecentRepo(path);
    setRepos(getRecentRepos());
  }

  function handleOpenPath() {
    const p = openPath().trim();
    if (!p) return;
    props.onOpenRepo(p);
    setOpenPath("");
    setShowInput(false);
  }

  async function handleScanDirectory() {
    const target = scanPath().trim();
    if (!target) return;
    setScanning(true);
    try {
      const found = await scanDirectoryForGitRepos(target, getMaxDiscoveredReposCap());
      setDiscoveredRepos(found);
    } catch {
      setDiscoveredRepos([]);
    } finally {
      setScanning(false);
    }
  }

  function handleBrowseFolder() {
    setShowPicker(true);
  }

  return (
    <div style={{ height: "100%", display: "flex", "flex-direction": "column", overflow: "hidden" }}>
      <div style={{ ...S.section, "border-bottom": "1px solid rgba(255, 255, 255, 0.08)", "flex-shrink": 0, background: "rgba(var(--panel-rgb, 10, 14, 23), 0.35)", "backdrop-filter": "blur(12px)" }}>
        <div style={S.toolbar}>
          <div style={{ display: "flex", "align-items": "center", gap: "10px" }}>
            <div style={{ width: "32px", height: "32px", "border-radius": "8px", background: "linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(14, 165, 233, 0.1))", border: "1px solid rgba(56, 189, 248, 0.3)", display: "flex", "align-items": "center", "justify-content": "center", color: "#38bdf8" }}>
              <GitIcon size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, "font-size": "16px", "font-weight": 700, "letter-spacing": "0.3px" }}>Git Dashboard</h2>
              <div style={{ "font-size": "11px", color: "rgba(255, 255, 255, 0.45)" }}>Manage repositories, branches, commits, and graph</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ ...S.section, flex: 1, overflow: "auto", "padding-top": "20px", "padding-bottom": "28px", "max-width": "900px", margin: "0 auto", width: "100%", "box-sizing": "border-box" }}>
        <div style={{ ...S.card, "margin-bottom": "20px", border: "1px solid rgba(56, 189, 248, 0.2)", background: "rgba(var(--panel-rgb, 15, 23, 42), 0.45)" }}>
          <div style={{ "font-size": "14px", "font-weight": 700, "margin-bottom": "12px", color: "var(--text-primary, #f8fafc)" }}>Open Repository</div>
          <div style={{ display: "flex", gap: "10px", "flex-wrap": "wrap" }}>
            <Button
              variant="primary"
              onClick={handleBrowseFolder}
              style={{ flex: 1, padding: "10px 16px", display: "flex", "align-items": "center", "justify-content": "center", gap: "8px", "font-size": "13px" }}
            >
              <FolderIcon size={16} />
              Browse Folder...
            </Button>
            <Show when={!showInput()}>
              <Button onClick={() => setShowInput(true)} style={{ padding: "10px 16px", "font-size": "13px" }}>
                Enter Path...
              </Button>
            </Show>
            <Show when={!showScanSection()}>
              <Button onClick={() => setShowScanSection(true)} style={{ padding: "10px 16px", "font-size": "13px" }}>
                🔍 Scan Submodules & Repos...
              </Button>
            </Show>
          </div>

          <Show when={showInput()}>
            <div style={{ "margin-top": "12px" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  placeholder="/path/to/git/repository"
                  value={openPath()}
                  onInput={(e) => setOpenPath(e.currentTarget.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleOpenPath()}
                  style={{ ...S.input, flex: 1 }}
                />
                <Button variant="primary" onClick={handleOpenPath}>Open</Button>
                <Button onClick={() => setShowInput(false)}>Cancel</Button>
              </div>
            </div>
          </Show>

          <Show when={showScanSection()}>
            <div style={{ "margin-top": "14px", "padding-top": "12px", "border-top": "1px solid rgba(255, 255, 255, 0.08)" }}>
              <div style={{ "font-size": "12px", "font-weight": 600, color: "#38bdf8", "margin-bottom": "8px" }}>
                Recursive Directory Scan for Submodules & Repositories
              </div>
              <div style={{ display: "flex", gap: "8px", "margin-bottom": "12px" }}>
                <input
                  type="text"
                  placeholder="/path/to/parent/workspace/folder"
                  value={scanPath()}
                  onInput={(e) => setScanPath(e.currentTarget.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleScanDirectory()}
                  style={{ ...S.input, flex: 1 }}
                />
                <Button variant="primary" onClick={handleScanDirectory} disabled={scanning() || !scanPath().trim()}>
                  {scanning() ? "Scanning..." : "Scan"}
                </Button>
                <Button onClick={() => setShowScanSection(false)}>Hide</Button>
              </div>

              <Show when={discoveredRepos().length > 0 || scanning()}>
                <SearchableRepoDropdown
                  repos={discoveredRepos()}
                  loading={scanning()}
                  maxCap={getMaxDiscoveredReposCap()}
                  onSelectRepo={(path) => props.onOpenRepo(path)}
                />
              </Show>
            </div>
          </Show>
        </div>

        <Show when={repos().length > 0}>
          <div style={{ "margin-bottom": "16px" }}>
            <h3 style={S.sectionTitle}>Recent Repositories</h3>
            <div style={{ display: "flex", "flex-direction": "column", gap: "8px" }}>
              <For each={repos()}>
                {(repo) => (
                  <div
                    style={{ ...S.repoCard, position: "relative" }}
                    onClick={() => handleOpen(repo.path)}
                  >
                    <div style={{ width: "36px", height: "36px", "border-radius": "8px", background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", "align-items": "center", "justify-content": "center", color: "#38bdf8", "flex-shrink": 0 }}>
                      <FolderIcon size={18} />
                    </div>
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <div style={{ "font-weight": 600, "font-size": "14px", "white-space": "nowrap", overflow: "hidden", "text-overflow": "ellipsis", color: "var(--text-primary, #f8fafc)" }}>{repo.name}</div>
                      <div style={{ "font-size": "11.5px", color: "rgba(255, 255, 255, 0.5)", "white-space": "nowrap", overflow: "hidden", "text-overflow": "ellipsis", display: "flex", "align-items": "center", gap: "8px", "margin-top": "2px" }}>
                        <span style={{ overflow: "hidden", "text-overflow": "ellipsis" }}>{repo.path}</span>
                        <Show when={repo.branch}>
                          <span style={{ color: "#38bdf8", background: "rgba(56, 189, 248, 0.12)", padding: "1px 6px", "border-radius": "4px", "font-family": "Space Mono, monospace", "font-size": "10.5px" }}>{repo.branch}</span>
                        </Show>
                      </div>
                    </div>
                    <div style={{ display: "flex", "align-items": "center", gap: "10px", "flex-shrink": 0 }}>
                      <span style={{ "font-size": "11px", color: "rgba(255, 255, 255, 0.4)", "font-family": "Space Mono, monospace" }}>{formatTimestamp(repo.lastOpened / 1000)}</span>
                      <button
                        type="button"
                        style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255, 255, 255, 0.4)", padding: "6px", "border-radius": "4px", display: "flex", "align-items": "center" }}
                        title="Remove from recent list"
                        onClick={(e) => { e.stopPropagation(); handleRemove(repo.path); }}
                      >
                        <TrashIcon size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>
        </Show>

        <Show when={repos().length === 0}>
          <div style={{ ...S.emptyState, "padding-top": "40px" }}>
            <GitIcon size={44} />
            <p style={{ "margin-top": "14px", "font-size": "15px", "font-weight": 600 }}>No Recent Repositories</p>
            <p style={{ "font-size": "12px", opacity: 0.6 }}>Open or browse for a git repository to get started</p>
          </div>
        </Show>
      </div>

      <DirectoryPickerModal
        open={showPicker()}
        onSelect={(path) => props.onOpenRepo(path)}
        onClose={() => setShowPicker(false)}
      />
    </div>
  );
}
