import { createSignal, For, Show } from "solid-js";
import type { DiscoveredRepo } from "../types";
import { FolderIcon, GitIcon, Button } from "./shared";

export interface SearchableRepoDropdownProps {
  repos: DiscoveredRepo[];
  loading?: boolean;
  maxCap?: number;
  onSelectRepo: (path: string) => void;
  placeholder?: string;
  title?: string;
}

export function SearchableRepoDropdown(props: SearchableRepoDropdownProps) {
  const [query, setQuery] = createSignal("");

  const filteredRepos = () => {
    const q = query().trim().toLowerCase();
    if (!q) return props.repos;
    return props.repos.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.relPath && r.relPath.toLowerCase().includes(q)) ||
        r.path.toLowerCase().includes(q)
    );
  };

  return (
    <div
      style={{
        display: "flex",
        "flex-direction": "column",
        gap: "8px",
        background: "rgba(15, 23, 42, 0.55)",
        border: "1px solid rgba(56, 189, 248, 0.25)",
        "border-radius": "8px",
        padding: "12px",
        "margin-bottom": "14px",
      }}
    >
      <div style={{ display: "flex", "align-items": "center", "justify-content": "space-between", gap: "8px" }}>
        <div style={{ display: "flex", "align-items": "center", gap: "6px" }}>
          <GitIcon size={16} />
          <span style={{ "font-size": "13px", "font-weight": 700, color: "var(--text-primary, #f8fafc)" }}>
            {props.title || "Discovered Submodules & Repositories"}
          </span>
          <span
            style={{
              "font-size": "11px",
              background: "rgba(56, 189, 248, 0.15)",
              color: "#38bdf8",
              padding: "2px 8px",
              "border-radius": "10px",
              "font-family": "Space Mono, monospace",
              "font-weight": 600,
            }}
          >
            {props.repos.length} {props.maxCap ? `/ ${props.maxCap} max` : "found"}
          </span>
        </div>
        <Show when={props.loading}>
          <span style={{ "font-size": "11px", color: "rgba(255,255,255,0.5)", "font-family": "Space Mono, monospace" }}>
            Scanning...
          </span>
        </Show>
      </div>

      {/* Search Input Filter */}
      <div style={{ position: "relative", display: "flex", "align-items": "center" }}>
        <input
          type="text"
          placeholder={props.placeholder || "Search discovered repos by name or path..."}
          value={query()}
          onInput={(e) => setQuery(e.currentTarget.value)}
          style={{
            width: "100%",
            padding: "7px 10px",
            "padding-right": query() ? "28px" : "10px",
            "font-size": "12px",
            "font-family": "Space Mono, monospace",
            background: "rgba(0, 0, 0, 0.35)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            "border-radius": "6px",
            color: "var(--text-primary, #fff)",
            outline: "none",
          }}
        />
        <Show when={query()}>
          <button
            type="button"
            onClick={() => setQuery("")}
            style={{
              position: "absolute",
              right: "6px",
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.5)",
              cursor: "pointer",
              padding: "4px",
              "font-size": "12px",
            }}
          >
            ✕
          </button>
        </Show>
      </div>

      {/* Dropdown Items List */}
      <div
        style={{
          "max-height": "180px",
          "overflow-y": "auto",
          display: "flex",
          "flex-direction": "column",
          gap: "4px",
          "margin-top": "4px",
          padding: "2px",
        }}
      >
        <Show when={!props.loading && filteredRepos().length === 0}>
          <div style={{ padding: "12px", "text-align": "center", "font-size": "12px", color: "rgba(255, 255, 255, 0.45)" }}>
            {query() ? "No matching repositories found for search." : "No submodules or sub-repositories found."}
          </div>
        </Show>

        <For each={filteredRepos()}>
          {(repo) => (
            <div
              style={{
                display: "flex",
                "align-items": "center",
                "justify-content": "space-between",
                gap: "10px",
                padding: "7px 10px",
                "border-radius": "6px",
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                cursor: "pointer",
                transition: "background 0.15s, border-color 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(56, 189, 248, 0.12)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(56, 189, 248, 0.3)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255, 255, 255, 0.03)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255, 255, 255, 0.06)";
              }}
              onClick={() => props.onSelectRepo(repo.path)}
            >
              <div style={{ display: "flex", "align-items": "center", gap: "8px", overflow: "hidden", flex: 1 }}>
                <FolderIcon size={15} />
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div style={{ display: "flex", "align-items": "center", gap: "6px" }}>
                    <span style={{ "font-size": "12.5px", "font-weight": 600, color: "var(--text-primary, #f8fafc)" }}>
                      {repo.name}
                    </span>
                    <Show when={repo.isSubmodule}>
                      <span
                        style={{
                          "font-size": "9.5px",
                          background: "rgba(56, 189, 248, 0.2)",
                          color: "#38bdf8",
                          padding: "1px 5px",
                          "border-radius": "3px",
                          "font-family": "Space Mono, monospace",
                        }}
                      >
                        Submodule
                      </span>
                    </Show>
                    <Show when={!repo.isSubmodule}>
                      <span
                        style={{
                          "font-size": "9.5px",
                          background: "rgba(16, 185, 129, 0.2)",
                          color: "#10b981",
                          padding: "1px 5px",
                          "border-radius": "3px",
                          "font-family": "Space Mono, monospace",
                        }}
                      >
                        Git Repo
                      </span>
                    </Show>
                  </div>
                  <div
                    style={{
                      "font-size": "10.5px",
                      color: "rgba(255, 255, 255, 0.45)",
                      "font-family": "Space Mono, monospace",
                      overflow: "hidden",
                      "text-overflow": "ellipsis",
                      "white-space": "nowrap",
                    }}
                  >
                    {repo.relPath || repo.path}
                  </div>
                </div>
              </div>

              <Button size="sm" variant="primary" onClick={(e) => { e.stopPropagation(); props.onSelectRepo(repo.path); }}>
                Open
              </Button>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
