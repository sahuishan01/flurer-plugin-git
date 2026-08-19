import { createSignal, createMemo, For, Show } from "solid-js";
import { useGit } from "../context";
import { Card, EmptyState, Button } from "./shared";
import { S } from "../styles";
import type { DiffHunk, DiffLine } from "../types";

function formatHashLabel(str?: string | null): string {
  if (!str) return "";
  if (str.includes("~")) {
    const [h, rest] = str.split("~");
    return `${h.slice(0, 7)}~${rest}`;
  }
  if (str.length > 7 && !str.includes(" ")) {
    return str.slice(0, 7);
  }
  return str;
}

interface SplitRow {
  left: { lineNum: number | null; content: string; origin: string } | null;
  right: { lineNum: number | null; content: string; origin: string } | null;
}

function buildSplitRows(hunk: DiffHunk): SplitRow[] {
  let oldLine = hunk.old_start;
  let newLine = hunk.new_start;
  const rows: SplitRow[] = [];

  let i = 0;
  const lines = hunk.lines;

  while (i < lines.length) {
    const line = lines[i];

    if (line.origin === " ") {
      rows.push({
        left: { lineNum: oldLine++, content: line.content, origin: " " },
        right: { lineNum: newLine++, content: line.content, origin: " " },
      });
      i++;
    } else {
      // Gather consecutive '-' and consecutive '+'
      const removals: DiffLine[] = [];
      while (i < lines.length && lines[i].origin === "-") {
        removals.push(lines[i]);
        i++;
      }
      const additions: DiffLine[] = [];
      while (i < lines.length && lines[i].origin === "+") {
        additions.push(lines[i]);
        i++;
      }

      const maxLen = Math.max(removals.length, additions.length);
      for (let k = 0; k < maxLen; k++) {
        const rem = removals[k];
        const add = additions[k];
        rows.push({
          left: rem ? { lineNum: oldLine++, content: rem.content, origin: "-" } : null,
          right: add ? { lineNum: newLine++, content: add.content, origin: "+" } : null,
        });
      }
    }
  }

  return rows;
}

export function DiffView() {
  const ctx = useGit();
  const [diffViewType, setDiffViewType] = createSignal<"split" | "unified">("unified");
  const [fileSearch, setFileSearch] = createSignal("");
  const [sidebarCollapsed, setSidebarCollapsed] = createSignal(false);

  const diff = createMemo(() => ctx.diffResult());
  const commitHash = createMemo(() => ctx.diffCommitHash());
  const compareFrom = createMemo(() => formatHashLabel(ctx.diffCompareCommits()?.from));
  const compareTo = createMemo(() => formatHashLabel(ctx.diffCompareCommits()?.to));

  // Normalize selected file path
  const normSelectedFile = createMemo(() => {
    const f = ctx.selectedDiffFile();
    if (!f) return null;
    return f.replace(/^\.\//, "");
  });

  const allFiles = createMemo(() => {
    const d = diff();
    if (!d) return [];
    if (d.files && d.files.length > 0) return d.files;
    if (d.hunks && d.hunks.length > 0) {
      return [{ newPath: normSelectedFile() || "Diff Output", oldPath: "", hunks: d.hunks }];
    }
    return [];
  });

  const filteredSidebarFiles = createMemo(() => {
    const q = fileSearch().toLowerCase().trim();
    if (!q) return allFiles();
    return allFiles().filter((f) => {
      const p = (f.newPath || f.oldPath || "").toLowerCase();
      return p.includes(q);
    });
  });

  const filesToDisplay = createMemo(() => {
    const files = allFiles();
    const sel = normSelectedFile();
    if (sel && files.length > 1) {
      const match = files.find((f) => {
        const np = (f.newPath || "").replace(/^\.\//, "");
        const op = (f.oldPath || "").replace(/^\.\//, "");
        return np === sel || op === sel || np.endsWith("/" + sel) || op.endsWith("/" + sel);
      });
      if (match) return [match];
    }
    return files;
  });

  const hasContent = createMemo(() => {
    const fList = filesToDisplay();
    return fList.some((f) => f.binary || (f.hunks && f.hunks.length > 0));
  });

  function getFileStats(fileItem: any) {
    let added = 0;
    let removed = 0;
    if (fileItem.hunks) {
      for (const h of fileItem.hunks) {
        for (const l of h.lines) {
          if (l.origin === "+") added++;
          else if (l.origin === "-") removed++;
        }
      }
    }
    return { added, removed };
  }

  return (
    <div style={{ display: "flex", height: "100%", width: "100%", overflow: "hidden", "box-sizing": "border-box" }}>
      {/* Collapsible Left-Hand File Tree Navigator */}
      <Show when={allFiles().length > 1}>
        <div
          style={{
            width: sidebarCollapsed() ? "44px" : "280px",
            "min-width": sidebarCollapsed() ? "44px" : "240px",
            "max-width": "340px",
            background: "rgba(10, 14, 23, 0.75)",
            "backdrop-filter": "blur(14px)",
            "-webkit-backdrop-filter": "blur(14px)",
            "border-right": "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            "flex-direction": "column",
            transition: "width 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
            overflow: "hidden",
            "flex-shrink": 0,
          }}
        >
          {/* Sidebar Header */}
          <div style={{ padding: "10px 12px", display: "flex", "align-items": "center", "justify-content": "space-between", "border-bottom": "1px solid rgba(255, 255, 255, 0.06)", "flex-shrink": 0 }}>
            <Show when={!sidebarCollapsed()}>
              <div style={{ display: "flex", "align-items": "center", gap: "6px" }}>
                <span style={{ "font-size": "11px", "font-weight": 700, "font-family": "Space Mono, monospace", color: "var(--text-secondary, #94a3b8)", "text-transform": "uppercase", "letter-spacing": "0.5px" }}>
                  Files ({allFiles().length})
                </span>
              </div>
            </Show>
            <button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed())}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-secondary, #94a3b8)",
                cursor: "pointer",
                padding: "3px 6px",
                "border-radius": "4px",
                "font-size": "11px",
              }}
              title={sidebarCollapsed() ? "Expand files sidebar" : "Collapse files sidebar"}
            >
              {sidebarCollapsed() ? "▶" : "◀"}
            </button>
          </div>

          <Show when={!sidebarCollapsed()}>
            {/* File Search Input */}
            <div style={{ padding: "8px 10px", "border-bottom": "1px solid rgba(255, 255, 255, 0.05)", "flex-shrink": 0 }}>
              <input
                type="text"
                placeholder="Filter files..."
                value={fileSearch()}
                onInput={(e) => setFileSearch(e.currentTarget.value)}
                style={{
                  width: "100%",
                  padding: "5px 8px",
                  "font-size": "11.5px",
                  "border-radius": "6px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  background: "rgba(0, 0, 0, 0.3)",
                  color: "#f8fafc",
                  outline: "none",
                  "box-sizing": "border-box",
                }}
              />
            </div>

            {/* "Show All Files" item */}
            <div
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                display: "flex",
                "align-items": "center",
                "justify-content": "space-between",
                "font-size": "11.5px",
                "font-weight": 600,
                color: !normSelectedFile() ? "#38bdf8" : "var(--text-secondary, #94a3b8)",
                background: !normSelectedFile() ? "rgba(56, 189, 248, 0.12)" : "transparent",
                border: "none",
                "border-bottom": "1px solid rgba(255, 255, 255, 0.04)",
                transition: "all 0.15s ease",
              }}
              onClick={() => ctx.selectDiffFile(null)}
            >
              <span>📄 All Changed Files</span>
              <span style={{ "font-size": "10.5px", opacity: 0.6, "font-family": "Space Mono, monospace" }}>
                {allFiles().length}
              </span>
            </div>

            {/* File List */}
            <div style={{ flex: 1, overflow: "auto", padding: "4px 0" }}>
              <For each={filteredSidebarFiles()}>
                {(file) => {
                  const stats = getFileStats(file);
                  const path = file.newPath || file.oldPath;
                  const isSel = () => normSelectedFile() === path.replace(/^\.\//, "");
                  const fileName = path.split("/").pop() || path;
                  const dirPath = path.includes("/") ? path.substring(0, path.lastIndexOf("/")) : "";

                  return (
                    <div
                      style={{
                        padding: "6px 12px",
                        cursor: "pointer",
                        display: "flex",
                        "align-items": "center",
                        "justify-content": "space-between",
                        gap: "8px",
                        background: isSel() ? "rgba(56, 189, 248, 0.16)" : "transparent",
                        "border-left": isSel() ? "3px solid #38bdf8" : "3px solid transparent",
                        transition: "all 0.15s ease",
                      }}
                      onClick={() => ctx.selectDiffFile(path)}
                      title={path}
                    >
                      <div style={{ flex: 1, overflow: "hidden", "min-width": 0 }}>
                        <div style={{ "font-size": "12px", "font-weight": isSel() ? 700 : 500, color: isSel() ? "#38bdf8" : "var(--text-primary, #f8fafc)", "white-space": "nowrap", overflow: "hidden", "text-overflow": "ellipsis" }}>
                          {fileName}
                        </div>
                        <Show when={dirPath}>
                          <div style={{ "font-size": "10px", color: "rgba(255, 255, 255, 0.4)", "white-space": "nowrap", overflow: "hidden", "text-overflow": "ellipsis" }}>
                            {dirPath}
                          </div>
                        </Show>
                      </div>

                      <div style={{ display: "flex", "align-items": "center", gap: "4px", "font-size": "10.5px", "font-family": "Space Mono, monospace", "flex-shrink": 0 }}>
                        <Show when={stats.added > 0}>
                          <span style={{ color: "#4ade80" }}>+{stats.added}</span>
                        </Show>
                        <Show when={stats.removed > 0}>
                          <span style={{ color: "#f87171" }}>-{stats.removed}</span>
                        </Show>
                      </div>
                    </div>
                  );
                }}
              </For>
            </div>
          </Show>
        </div>
      </Show>

      {/* Main Diff Content Container */}
      <div style={{ flex: 1, overflow: "auto", padding: "16px 20px", "box-sizing": "border-box" }}>
        {/* Top Diff Header & Controls */}
        <div style={{ "margin-bottom": "14px", display: "flex", "align-items": "center", "justify-content": "space-between", "flex-wrap": "wrap", gap: "12px" }}>
          <div style={{ display: "flex", "align-items": "center", gap: "10px", "flex-wrap": "wrap" }}>
            <Show when={ctx.selectedDiffFile()}>
              <Button size="sm" onClick={() => ctx.selectDiffFile(null)}>← All Files</Button>
            </Show>
            <span style={{ "font-size": "13px", "font-family": "Space Mono, monospace", "font-weight": 700, color: "var(--text-primary, #f8fafc)" }}>
              {ctx.selectedDiffFile() ?? (commitHash() ? `Commit: ${commitHash()?.slice(0, 7)}` : "All Changes")}
            </span>
            <span style={{ "font-size": "11px", padding: "2px 9px", "border-radius": "6px", background: ctx.diffMode() === "staged" ? "rgba(52, 211, 153, 0.18)" : ctx.diffMode() === "unstaged" ? "rgba(96, 165, 250, 0.18)" : "rgba(168, 85, 247, 0.18)", color: ctx.diffMode() === "staged" ? "#34d399" : ctx.diffMode() === "unstaged" ? "#60a5fa" : "#c084fc", border: "1px solid rgba(255,255,255,0.08)", "font-weight": 600, "font-family": "Space Mono, monospace" }}>
              {ctx.diffMode() === "commit" ? "vs Previous Commit" : ctx.diffMode()} {compareTo() ? `(${compareFrom()} ↔ ${compareTo()})` : ""}
            </span>
          </div>

          <div style={{ display: "flex", "align-items": "center", gap: "10px", "flex-wrap": "wrap" }}>
            {/* Split vs Unified Diff Toggle */}
            <div style={{ display: "inline-flex", background: "rgba(10, 14, 23, 0.6)", border: "1px solid rgba(255, 255, 255, 0.12)", "border-radius": "8px", padding: "2px", gap: "2px" }}>
              <button
                type="button"
                style={{
                  padding: "4px 10px",
                  "font-size": "11px",
                  "font-weight": 600,
                  border: "none",
                  "border-radius": "6px",
                  cursor: "pointer",
                  background: diffViewType() === "unified" ? "var(--accent-default, #38bdf8)" : "transparent",
                  color: diffViewType() === "unified" ? "#000" : "var(--text-primary, #f8fafc)",
                  transition: "all 0.15s ease",
                }}
                onClick={() => setDiffViewType("unified")}
                title="Unified 1-column diff"
              >
                📄 Unified
              </button>
              <button
                type="button"
                style={{
                  padding: "4px 10px",
                  "font-size": "11px",
                  "font-weight": 600,
                  border: "none",
                  "border-radius": "6px",
                  cursor: "pointer",
                  background: diffViewType() === "split" ? "var(--accent-default, #38bdf8)" : "transparent",
                  color: diffViewType() === "split" ? "#000" : "var(--text-primary, #f8fafc)",
                  transition: "all 0.15s ease",
                }}
                onClick={() => setDiffViewType("split")}
                title="Side-by-side 2-column diff"
              >
                🔀 Side-by-Side
              </button>
            </div>

            {/* Target Switcher for Commit Diffs */}
            <Show when={commitHash()}>
              <div style={{ display: "inline-flex", background: "rgba(10, 14, 23, 0.6)", border: "1px solid rgba(255, 255, 255, 0.12)", "border-radius": "8px", padding: "2px", gap: "2px" }}>
                <button
                  type="button"
                  style={{
                    padding: "4px 10px",
                    "font-size": "11px",
                    "font-weight": 600,
                    border: "none",
                    "border-radius": "6px",
                    cursor: "pointer",
                    background: ctx.diffMode() === "commit" ? "var(--accent-default, #38bdf8)" : "transparent",
                    color: ctx.diffMode() === "commit" ? "#000" : "var(--text-primary, #f8fafc)",
                    transition: "all 0.15s ease",
                  }}
                  onClick={() => ctx.loadDiff(".", "commit", commitHash()!)}
                  title="Compare with previous commit (~1)"
                >
                  ⏮️ Prev
                </button>
                <button
                  type="button"
                  style={{
                    padding: "4px 10px",
                    "font-size": "11px",
                    "font-weight": 600,
                    border: "none",
                    "border-radius": "6px",
                    cursor: "pointer",
                    background: compareTo() === "HEAD" ? "var(--accent-default, #38bdf8)" : "transparent",
                    color: compareTo() === "HEAD" ? "#000" : "var(--text-primary, #f8fafc)",
                    transition: "all 0.15s ease",
                  }}
                  onClick={() => ctx.loadDiffWithCurrent(commitHash()!)}
                  title="Compare with HEAD commit"
                >
                  📍 HEAD
                </button>
                <button
                  type="button"
                  style={{
                    padding: "4px 10px",
                    "font-size": "11px",
                    "font-weight": 600,
                    border: "none",
                    "border-radius": "6px",
                    cursor: "pointer",
                    background: compareTo() === "Working Tree" ? "var(--accent-default, #38bdf8)" : "transparent",
                    color: compareTo() === "Working Tree" ? "#000" : "var(--text-primary, #f8fafc)",
                    transition: "all 0.15s ease",
                  }}
                  onClick={() => ctx.loadDiffWithWorkingTree(commitHash()!)}
                  title="Compare with uncommitted working tree"
                >
                  📝 Working Tree
                </button>
              </div>
            </Show>
          </div>
        </div>

        {/* Render Diff Hunks */}
        <Show when={diff()}>
          <Show when={hasContent()} fallback={
            <Card style={{ padding: "36px 20px", "text-align": "center" }}>
              <div style={{ "font-size": "15px", "font-weight": 600, color: "var(--text-primary, #f8fafc)", "margin-bottom": "8px" }}>
                No differences found
              </div>
              <div style={{ "font-size": "12.5px", color: "rgba(255, 255, 255, 0.5)", "margin-bottom": "18px" }}>
                {commitHash()
                  ? `There are no code changes between commit ${commitHash()?.slice(0, 7)} and ${compareTo() || "target"}.`
                  : "No diff changes found for this selection."}
              </div>
              <Show when={commitHash()}>
                <div style={{ display: "flex", gap: "8px", "justify-content": "center", "flex-wrap": "wrap" }}>
                  <Button size="sm" onClick={() => ctx.loadDiff(".", "commit", commitHash()!)}>⏮️ Compare vs Previous Commit</Button>
                  <Button size="sm" onClick={() => ctx.loadDiffWithCurrent(commitHash()!)}>📍 Compare vs HEAD</Button>
                  <Button size="sm" onClick={() => ctx.loadDiffWithWorkingTree(commitHash()!)}>📝 Compare vs Working Tree</Button>
                </div>
              </Show>
            </Card>
          }>
            <For each={filesToDisplay()}>
              {(fileItem) => {
                const stats = getFileStats(fileItem);

                return (
                  <Card style={{ padding: 0, overflow: "hidden", "margin-bottom": "16px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                    <Show when={fileItem.newPath || fileItem.oldPath}>
                      <div style={{ padding: "10px 14px", background: "rgba(var(--panel-rgb, 10, 14, 23), 0.45)", "font-weight": 600, "font-size": "12.5px", "font-family": "Space Mono, monospace", "border-bottom": "1px solid rgba(255, 255, 255, 0.08)", display: "flex", "align-items": "center", "justify-content": "space-between" }}>
                        <div style={{ display: "flex", "align-items": "center", gap: "8px" }}>
                          <span style={{ color: "#38bdf8" }}>📄 {fileItem.newPath || fileItem.oldPath}</span>
                        </div>
                        <div style={{ display: "flex", "align-items": "center", gap: "10px" }}>
                          <Show when={stats.added > 0}>
                            <span style={{ color: "#4ade80", "font-size": "11px" }}>+{stats.added}</span>
                          </Show>
                          <Show when={stats.removed > 0}>
                            <span style={{ color: "#f87171", "font-size": "11px" }}>-{stats.removed}</span>
                          </Show>
                          <span style={{ "font-size": "11px", color: "rgba(255, 255, 255, 0.45)", "font-weight": 400 }}>
                            {fileItem.binary ? "binary" : `${fileItem.hunks.length} hunks`}
                          </span>
                        </div>
                      </div>
                    </Show>

                    <Show when={fileItem.binary}>
                      <div style={{ padding: "24px 16px", "font-size": "12.5px", color: "rgba(255, 255, 255, 0.5)", "text-align": "center", "font-family": "Space Mono, monospace" }}>
                        Binary file — content cannot be previewed.
                      </div>
                    </Show>

                    <Show when={!fileItem.binary}>
                      {/* Unified Mode View */}
                      <Show when={diffViewType() === "unified"}>
                        <For each={fileItem.hunks}>
                          {(hunk) => {
                            let oldLine = hunk.old_start;
                            let newLine = hunk.new_start;
                            const filePath = fileItem.newPath || fileItem.oldPath;
                            return (
                              <div style={{ padding: "0 0 4px" }}>
                                <div style={{ ...S.diffHunkHeader, display: "flex", "align-items": "center", "justify-content": "space-between", "flex-wrap": "wrap", gap: "6px" }}>
                                  <span>@@ -{hunk.old_start},{hunk.old_lines} +{hunk.new_start},{hunk.new_lines} @@</span>
                                  <div style={{ display: "flex", "align-items": "center", gap: "6px" }}>
                                    <Show when={ctx.diffMode() === "unstaged"}>
                                      <button
                                        type="button"
                                        onClick={() => ctx.stageHunk(filePath, hunk)}
                                        style={{ padding: "2px 8px", "font-size": "10.5px", "border-radius": "4px", background: "rgba(52, 211, 153, 0.2)", border: "1px solid rgba(52, 211, 153, 0.4)", color: "#34d399", cursor: "pointer", "font-weight": 600, "font-family": "Space Mono, monospace" }}
                                        title="Stage this specific hunk"
                                      >
                                        + Stage Hunk
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => ctx.discardHunk(filePath, hunk)}
                                        style={{ padding: "2px 8px", "font-size": "10.5px", "border-radius": "4px", background: "rgba(239, 68, 68, 0.2)", border: "1px solid rgba(239, 68, 68, 0.4)", color: "#f87171", cursor: "pointer", "font-weight": 600, "font-family": "Space Mono, monospace" }}
                                        title="Discard changes in this hunk"
                                      >
                                        🗑️ Discard Hunk
                                      </button>
                                    </Show>
                                    <Show when={ctx.diffMode() === "staged"}>
                                      <button
                                        type="button"
                                        onClick={() => ctx.unstageHunk(filePath, hunk)}
                                        style={{ padding: "2px 8px", "font-size": "10.5px", "border-radius": "4px", background: "rgba(245, 158, 11, 0.2)", border: "1px solid rgba(245, 158, 11, 0.4)", color: "#fbbf24", cursor: "pointer", "font-weight": 600, "font-family": "Space Mono, monospace" }}
                                        title="Unstage this specific hunk"
                                      >
                                        - Unstage Hunk
                                      </button>
                                    </Show>
                                  </div>
                                </div>
                                <For each={hunk.lines}>
                                  {(line) => {
                                    const old = line.origin !== "+" ? oldLine++ : null;
                                    const newL = line.origin !== "-" ? newLine++ : null;
                                    const style = line.origin === "+" ? S.diffAdded : line.origin === "-" ? S.diffRemoved : S.diffContext;
                                    return (
                                      <div style={{ ...S.diffLine, ...style }}>
                                        <span style={S.diffGutter}>{old ?? ""}</span>
                                        <span style={S.diffGutter}>{newL ?? ""}</span>
                                        <span style={{ flex: 1, "white-space": "pre-wrap", "word-break": "break-all" }}>{line.content}</span>
                                      </div>
                                    );
                                  }}
                                </For>
                              </div>
                            );
                          }}
                        </For>
                      </Show>

                      {/* Side-by-Side (Split) Mode View */}
                      <Show when={diffViewType() === "split"}>
                        <For each={fileItem.hunks}>
                          {(hunk) => {
                            const splitRows = buildSplitRows(hunk);
                            const filePath = fileItem.newPath || fileItem.oldPath;
                            return (
                              <div style={{ padding: "0 0 4px", overflow: "auto" }}>
                                <div style={{ ...S.diffHunkHeader, display: "flex", "align-items": "center", "justify-content": "space-between", "flex-wrap": "wrap", gap: "6px" }}>
                                  <span>@@ -{hunk.old_start},{hunk.old_lines} +{hunk.new_start},{hunk.new_lines} @@</span>
                                  <div style={{ display: "flex", "align-items": "center", gap: "6px" }}>
                                    <Show when={ctx.diffMode() === "unstaged"}>
                                      <button
                                        type="button"
                                        onClick={() => ctx.stageHunk(filePath, hunk)}
                                        style={{ padding: "2px 8px", "font-size": "10.5px", "border-radius": "4px", background: "rgba(52, 211, 153, 0.2)", border: "1px solid rgba(52, 211, 153, 0.4)", color: "#34d399", cursor: "pointer", "font-weight": 600, "font-family": "Space Mono, monospace" }}
                                        title="Stage this specific hunk"
                                      >
                                        + Stage Hunk
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => ctx.discardHunk(filePath, hunk)}
                                        style={{ padding: "2px 8px", "font-size": "10.5px", "border-radius": "4px", background: "rgba(239, 68, 68, 0.2)", border: "1px solid rgba(239, 68, 68, 0.4)", color: "#f87171", cursor: "pointer", "font-weight": 600, "font-family": "Space Mono, monospace" }}
                                        title="Discard changes in this hunk"
                                      >
                                        🗑️ Discard Hunk
                                      </button>
                                    </Show>
                                    <Show when={ctx.diffMode() === "staged"}>
                                      <button
                                        type="button"
                                        onClick={() => ctx.unstageHunk(filePath, hunk)}
                                        style={{ padding: "2px 8px", "font-size": "10.5px", "border-radius": "4px", background: "rgba(245, 158, 11, 0.2)", border: "1px solid rgba(245, 158, 11, 0.4)", color: "#fbbf24", cursor: "pointer", "font-weight": 600, "font-family": "Space Mono, monospace" }}
                                        title="Unstage this specific hunk"
                                      >
                                        - Unstage Hunk
                                      </button>
                                    </Show>
                                  </div>
                                </div>
                                <div style={{ display: "flex", "flex-direction": "column", width: "100%" }}>
                                  <For each={splitRows}>
                                    {(row) => (
                                      <div style={{ display: "grid", "grid-template-columns": "1fr 1fr", "border-bottom": "1px solid rgba(255,255,255,0.03)", "font-family": "Space Mono, monospace", "font-size": "11.5px", "line-height": "20px" }}>
                                        {/* Left Column (Old) */}
                                        <div
                                          style={{
                                            display: "flex",
                                            padding: "0 8px",
                                            background: row.left?.origin === "-" ? "rgba(239, 68, 68, 0.16)" : "transparent",
                                            color: row.left?.origin === "-" ? "#fca5a5" : "inherit",
                                            "border-right": "1px solid rgba(255, 255, 255, 0.08)",
                                            overflow: "hidden",
                                          }}
                                        >
                                          <span style={{ ...S.diffGutter, width: "36px", "padding-right": "6px", "margin-right": "6px" }}>
                                            {row.left?.lineNum ?? ""}
                                          </span>
                                          <span style={{ flex: 1, "white-space": "pre-wrap", "word-break": "break-all", opacity: row.left ? 1 : 0.2 }}>
                                            {row.left?.content ?? ""}
                                          </span>
                                        </div>

                                        {/* Right Column (New) */}
                                        <div
                                          style={{
                                            display: "flex",
                                            padding: "0 8px",
                                            background: row.right?.origin === "+" ? "rgba(34, 197, 94, 0.16)" : "transparent",
                                            color: row.right?.origin === "+" ? "#86efac" : "inherit",
                                            overflow: "hidden",
                                          }}
                                        >
                                          <span style={{ ...S.diffGutter, width: "36px", "padding-right": "6px", "margin-right": "6px" }}>
                                            {row.right?.lineNum ?? ""}
                                          </span>
                                          <span style={{ flex: 1, "white-space": "pre-wrap", "word-break": "break-all", opacity: row.right ? 1 : 0.2 }}>
                                            {row.right?.content ?? ""}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </For>
                                </div>
                              </div>
                            );
                          }}
                        </For>
                      </Show>
                    </Show>
                  </Card>
                );
              }}
            </For>
          </Show>
        </Show>

        <Show when={!diff()}>
          <EmptyState message="Loading diff..." />
        </Show>
      </div>
    </div>
  );
}
