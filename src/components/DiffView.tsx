import { createMemo, For, Show } from "solid-js";
import { useGit } from "../context";
import { surfaceBg } from "../utils";
import { Card, EmptyState, Button } from "./shared";
import { S } from "../styles";

export function DiffView() {
  const ctx = useGit();

  const diff = createMemo(() => ctx.diffResult());
  const commitHash = createMemo(() => ctx.diffCommitHash());
  const compareTo = createMemo(() => ctx.diffCompareCommits()?.to);

  return (
    <div style={{ padding: "16px 24px" }}>
      <div style={{ "margin-bottom": "14px", display: "flex", "align-items": "center", "justify-content": "space-between", "flex-wrap": "wrap", gap: "10px" }}>
        <div style={{ display: "flex", "align-items": "center", gap: "8px", "flex-wrap": "wrap" }}>
          <Show when={ctx.selectedDiffFile()}>
            <Button size="sm" onClick={() => ctx.selectDiffFile(null)}>Back to file list</Button>
          </Show>
          <span style={{ "font-size": "13px", "font-family": "Space Mono, monospace", color: "var(--text-primary, var(--text-color))", "text-shadow": "var(--text-shadow)" }}>
            {ctx.selectedDiffFile() ?? (commitHash() ? `Commit: ${commitHash()?.slice(0, 7)}` : "All Changes")}
          </span>
          <span style={{ "font-size": "11px", padding: "2px 8px", "border-radius": "4px", background: ctx.diffMode() === "staged" ? "rgba(34,197,94,0.2)" : ctx.diffMode() === "unstaged" ? "rgba(59,130,246,0.2)" : "rgba(168,85,247,0.2)", color: ctx.diffMode() === "staged" ? "#4ade80" : ctx.diffMode() === "unstaged" ? "#60a5fa" : "#c084fc", "font-weight": 600 }}>
            {ctx.diffMode() === "commit" ? "vs Previous Commit" : ctx.diffMode()} {compareTo() ? `(${ctx.diffCompareCommits()?.from.slice(0, 7)} ↔ ${compareTo()})` : ""}
          </span>
        </div>

        {/* Quick Target Switcher Toolbar for Commit Diffs */}
        <Show when={commitHash()}>
          <div style={{ display: "inline-flex", background: "var(--control-bg, rgba(255, 255, 255, 0.08))", border: "var(--control-border, 1px solid rgba(255, 255, 255, 0.12))", "border-radius": "8px", padding: "2px", gap: "2px", "backdrop-filter": "blur(8px)" }}>
            <button
              type="button"
              style={{
                padding: "4px 10px",
                "font-size": "11px",
                "font-weight": 600,
                border: "none",
                "border-radius": "6px",
                cursor: "pointer",
                background: ctx.diffMode() === "commit" ? "var(--accent-default, #f59e0b)" : "transparent",
                color: ctx.diffMode() === "commit" ? "#000" : "var(--text-primary, var(--text-color))",
                transition: "all 0.15s ease",
              }}
              onClick={() => ctx.loadDiff(".", "commit", commitHash()!)}
              title="Compare with previous commit (~1)"
            >
              ⏮️ Previous
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
                background: compareTo() === "HEAD" ? "var(--accent-default, #f59e0b)" : "transparent",
                color: compareTo() === "HEAD" ? "#000" : "var(--text-primary, var(--text-color))",
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
                background: compareTo() === "Working Tree" ? "var(--accent-default, #f59e0b)" : "transparent",
                color: compareTo() === "Working Tree" ? "#000" : "var(--text-primary, var(--text-color))",
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

      {/* File Selection List for Multi-file Diffs */}
      <Show when={!ctx.selectedDiffFile() && diff()?.files && diff()!.files!.length > 0}>
        <Card style={{ "margin-bottom": "16px" }}>
          <div style={S.cardHeader}>
            <span>Changed Files ({diff()!.files!.length})</span>
          </div>
          <For each={diff()!.files!}>
            {(f) => (
              <div
                style={{ ...S.fileRow, cursor: "pointer", padding: "8px 12px" }}
                onClick={() => ctx.selectDiffFile(f.newPath || f.oldPath)}
              >
                <span style={{ flex: 1, overflow: "hidden", "text-overflow": "ellipsis", "white-space": "nowrap" }}>
                  <span style={{ color: "var(--accent-color, #f59e0b)", "font-family": "Space Mono, monospace", "margin-right": "8px", "font-size": "12px" }}>
                    {f.hunks.length} {f.hunks.length === 1 ? "hunk" : "hunks"}
                  </span>
                  {f.newPath || f.oldPath}
                </span>
                <Button size="sm">Inspect Diff</Button>
              </div>
            )}
          </For>
        </Card>
      </Show>

      {/* Render Diff Hunks */}
      <Show when={diff()}>
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <For each={diff()!.files && ctx.selectedDiffFile() ? diff()!.files!.filter(f => (f.newPath || f.oldPath) === ctx.selectedDiffFile()) : (diff()!.files ?? [{ newPath: "", oldPath: "", hunks: diff()!.hunks }])}>
            {(fileItem) => {
              let oldLine = 0;
              let newLine = 0;
              return (
                <div>
                  <Show when={fileItem.newPath || fileItem.oldPath}>
                    <div style={{ padding: "8px 12px", background: surfaceBg(0.08), "font-weight": 600, "font-size": "13px", "font-family": "Space Mono, monospace", "border-bottom": "1px solid var(--border-strong)" }}>
                      📄 {fileItem.newPath || fileItem.oldPath}
                    </div>
                  </Show>
                  <For each={fileItem.hunks}>
                    {(hunk) => {
                      oldLine = hunk.old_start;
                      newLine = hunk.new_start;
                      return (
                        <div>
                          <div style={{ ...S.diffHunkHeader, background: surfaceBg(0.05) }}>
                            @@ -{hunk.old_start},{hunk.old_lines} +{hunk.new_start},{hunk.new_lines} @@
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
                </div>
              );
            }}
          </For>
          <Show when={diff()!.hunks.length === 0 && (!diff()!.files || diff()!.files!.length === 0)}>
            <div style={{ padding: "28px 20px", "text-align": "center" }}>
              <div style={{ "font-size": "14px", "font-weight": 600, color: "var(--text-primary, var(--text-color))", "margin-bottom": "6px", "text-shadow": "var(--text-shadow)" }}>
                No differences found
              </div>
              <div style={{ "font-size": "12px", color: "var(--text-muted, #888)", "margin-bottom": "16px" }}>
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
            </div>
          </Show>
        </Card>
      </Show>

      <Show when={!diff()}>
        <EmptyState message="Loading diff..." />
      </Show>
    </div>
  );
}
