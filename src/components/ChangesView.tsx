import { createSignal, createMemo, For, Show } from "solid-js";
import { useGit } from "../context";
import { statusColor } from "../utils";
import { Badge, Button, Card, EmptyState } from "./shared";
import { S } from "../styles";
import type { GitChange, DiffHunk } from "../types";

const CONVENTIONAL_TYPES = [
  { prefix: "feat:", label: "feat", color: "#38bdf8" },
  { prefix: "fix:", label: "fix", color: "#f87171" },
  { prefix: "refactor:", label: "refactor", color: "#c084fc" },
  { prefix: "docs:", label: "docs", color: "#fbbf24" },
  { prefix: "chore:", label: "chore", color: "#94a3b8" },
  { prefix: "perf:", label: "perf", color: "#4ade80" },
  { prefix: "test:", label: "test", color: "#f472b6" },
];

export function ChangesView() {
  const ctx = useGit();
  const [commitMsg, setCommitMsg] = createSignal("");
  const [searchQuery, setSearchQuery] = createSignal("");
  const [inspectingFile, setInspectingFile] = createSignal<{ path: string; staged: boolean } | null>(null);
  const [discardTarget, setDiscardTarget] = createSignal<{ path: string; isUntracked: boolean } | null>(null);

  const allChanges = createMemo(() => ctx.status()?.changes ?? []);

  const filteredChanges = createMemo(() => {
    const q = searchQuery().toLowerCase().trim();
    if (!q) return allChanges();
    return allChanges().filter((c) => c.path.toLowerCase().includes(q));
  });

  const stagedFiles = createMemo(() => filteredChanges().filter((c) => c.staged));
  const unstagedFiles = createMemo(() => filteredChanges().filter((c) => !c.staged && c.status !== "??"));
  const untrackedFiles = createMemo(() => filteredChanges().filter((c) => c.status === "??"));

  async function handleCommit() {
    const msg = commitMsg().trim();
    if (!msg) return;
    if (ctx.isAmend()) {
      await ctx.commitAmend(msg);
    } else {
      await ctx.commit(msg);
    }
    setCommitMsg("");
    setInspectingFile(null);
  }

  function handleFileSelect(path: string, staged: boolean) {
    if (inspectingFile()?.path === path && inspectingFile()?.staged === staged) {
      setInspectingFile(null);
    } else {
      setInspectingFile({ path, staged });
      ctx.loadDiff(path, staged ? "staged" : "unstaged");
    }
  }

  function handleApplyPrefix(prefix: string) {
    let cur = commitMsg().trimStart();
    for (const t of CONVENTIONAL_TYPES) {
      if (cur.startsWith(t.prefix)) {
        cur = cur.slice(t.prefix.length).trimStart();
        break;
      }
    }
    setCommitMsg(`${prefix} ${cur}`.trim());
  }

  const msgLength = () => commitMsg().length;
  const msgLengthColor = () => {
    const len = msgLength();
    if (len === 0) return "#94a3b8";
    if (len <= 50) return "#4ade80";
    if (len <= 72) return "#f59e0b";
    return "#f87171";
  };

  function renderStatusBadge(status: string) {
    const color = statusColor(status);
    return (
      <span
        style={{
          display: "inline-flex",
          "align-items": "center",
          "justify-content": "center",
          width: "20px",
          height: "20px",
          "border-radius": "4px",
          background: `${color}22`,
          color: color,
          border: `1px solid ${color}44`,
          "font-family": "Space Mono, monospace",
          "font-size": "11px",
          "font-weight": 700,
          "margin-right": "10px",
          "flex-shrink": 0,
        }}
      >
        {status}
      </span>
    );
  }

  return (
    <div style={{ display: "flex", height: "100%", width: "100%", overflow: "hidden", "box-sizing": "border-box" }}>
      {/* Left List of Changes */}
      <div
        style={{
          flex: inspectingFile() ? "1" : "1",
          "max-width": inspectingFile() ? "480px" : "1000px",
          margin: inspectingFile() ? "0" : "0 auto",
          width: "100%",
          padding: "16px 20px",
          overflow: "auto",
          display: "flex",
          "flex-direction": "column",
          gap: "14px",
          "box-sizing": "border-box",
          "border-right": inspectingFile() ? "1px solid rgba(255, 255, 255, 0.08)" : "none",
        }}
      >
        {/* Search & Filter Bar */}
        <div style={{ display: "flex", "align-items": "center", gap: "10px", "justify-content": "space-between" }}>
          <input
            type="text"
            placeholder="🔍 Filter uncommitted changes..."
            value={searchQuery()}
            onInput={(e) => setSearchQuery(e.currentTarget.value)}
            style={{
              flex: 1,
              padding: "6px 12px",
              "font-size": "12px",
              "border-radius": "6px",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              background: "rgba(0, 0, 0, 0.3)",
              color: "#f8fafc",
              outline: "none",
            }}
          />
          <Show when={allChanges().length > 0}>
            <span style={{ "font-size": "11px", "font-family": "Space Mono, monospace", color: "var(--text-secondary, #94a3b8)" }}>
              {allChanges().length} total
            </span>
          </Show>
        </div>

        <Show when={ctx.loading() && !ctx.status()}>
          <EmptyState message="Loading repository status..." />
        </Show>

        <Show when={ctx.status()}>
          {/* Staged Changes Card */}
          <Show when={stagedFiles().length > 0}>
            <Card>
              <div style={S.cardHeader}>
                <div style={{ display: "flex", "align-items": "center", gap: "8px" }}>
                  <span style={{ "font-weight": 700, "letter-spacing": "0.3px" }}>Staged Changes</span>
                  <Badge variant="staged" count={stagedFiles().length} />
                </div>
                <Button size="sm" onClick={ctx.unstageAll}>Unstage All</Button>
              </div>
              <div style={{ display: "flex", "flex-direction": "column", gap: "2px" }}>
                <For each={stagedFiles()}>
                  {(f) => {
                    const isInspecting = () => inspectingFile()?.path === f.path && inspectingFile()?.staged === true;
                    return (
                      <div
                        style={{
                          ...S.fileRow,
                          background: isInspecting() ? "rgba(56, 189, 248, 0.14)" : "rgba(255, 255, 255, 0.02)",
                          border: isInspecting() ? "1px solid rgba(56, 189, 248, 0.4)" : "1px solid transparent",
                          "border-radius": "8px",
                          padding: "6px 10px",
                          margin: "2px 0",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <span
                          style={{ cursor: "pointer", flex: 1, overflow: "hidden", "text-overflow": "ellipsis", "white-space": "nowrap", display: "flex", "align-items": "center" }}
                          onClick={() => handleFileSelect(f.path, true)}
                          title="Click to preview diff"
                        >
                          {renderStatusBadge(f.status)}
                          <span style={{ "font-size": "12.5px", "font-weight": isInspecting() ? 700 : 500 }}>{f.path}</span>
                        </span>
                        <div style={{ display: "flex", "align-items": "center", gap: "6px" }}>
                          <Button size="sm" onClick={() => ctx.unstage(f.path)}>Unstage</Button>
                        </div>
                      </div>
                    );
                  }}
                </For>
              </div>
            </Card>
          </Show>

          {/* Modified Changes Card */}
          <Show when={unstagedFiles().length > 0}>
            <Card>
              <div style={S.cardHeader}>
                <div style={{ display: "flex", "align-items": "center", gap: "8px" }}>
                  <span style={{ "font-weight": 700, "letter-spacing": "0.3px" }}>Modified Changes</span>
                  <Badge variant="unstaged" count={unstagedFiles().length} />
                </div>
                <Button size="sm" onClick={ctx.stageAll}>Stage All</Button>
              </div>
              <div style={{ display: "flex", "flex-direction": "column", gap: "2px" }}>
                <For each={unstagedFiles()}>
                  {(f) => {
                    const isInspecting = () => inspectingFile()?.path === f.path && inspectingFile()?.staged === false;
                    return (
                      <div
                        style={{
                          ...S.fileRow,
                          background: isInspecting() ? "rgba(56, 189, 248, 0.14)" : "rgba(255, 255, 255, 0.02)",
                          border: isInspecting() ? "1px solid rgba(56, 189, 248, 0.4)" : "1px solid transparent",
                          "border-radius": "8px",
                          padding: "6px 10px",
                          margin: "2px 0",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <span
                          style={{ cursor: "pointer", flex: 1, overflow: "hidden", "text-overflow": "ellipsis", "white-space": "nowrap", display: "flex", "align-items": "center" }}
                          onClick={() => handleFileSelect(f.path, false)}
                          title="Click to preview diff"
                        >
                          {renderStatusBadge(f.status)}
                          <span style={{ "font-size": "12.5px", "font-weight": isInspecting() ? 700 : 500 }}>{f.path}</span>
                        </span>
                        <div style={{ display: "flex", "align-items": "center", gap: "6px" }}>
                          <Button variant="primary" size="sm" onClick={() => ctx.stage(f.path)}>Stage</Button>
                          <button
                            type="button"
                            onClick={() => setDiscardTarget({ path: f.path, isUntracked: false })}
                            style={{ background: "transparent", border: "none", color: "var(--text-secondary, #94a3b8)", cursor: "pointer", padding: "4px 6px", "font-size": "12px", "border-radius": "4px" }}
                            title="Discard file changes"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  }}
                </For>
              </div>
            </Card>
          </Show>

          {/* Untracked Files Card */}
          <Show when={untrackedFiles().length > 0}>
            <Card>
              <div style={S.cardHeader}>
                <div style={{ display: "flex", "align-items": "center", gap: "8px" }}>
                  <span style={{ "font-weight": 700, "letter-spacing": "0.3px" }}>Untracked Files</span>
                  <Badge variant="untracked" count={untrackedFiles().length} />
                </div>
              </div>
              <div style={{ display: "flex", "flex-direction": "column", gap: "2px" }}>
                <For each={untrackedFiles()}>
                  {(f) => {
                    const isInspecting = () => inspectingFile()?.path === f.path;
                    return (
                      <div
                        style={{
                          ...S.fileRow,
                          background: isInspecting() ? "rgba(56, 189, 248, 0.14)" : "rgba(255, 255, 255, 0.02)",
                          border: isInspecting() ? "1px solid rgba(56, 189, 248, 0.4)" : "1px solid transparent",
                          "border-radius": "8px",
                          padding: "6px 10px",
                          margin: "2px 0",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <span
                          style={{ cursor: "pointer", flex: 1, overflow: "hidden", "text-overflow": "ellipsis", "white-space": "nowrap", display: "flex", "align-items": "center" }}
                          onClick={() => handleFileSelect(f.path, false)}
                          title="Click to preview diff"
                        >
                          {renderStatusBadge("?")}
                          <span style={{ "font-size": "12.5px", "font-weight": isInspecting() ? 700 : 500 }}>{f.path}</span>
                        </span>
                        <div style={{ display: "flex", "align-items": "center", gap: "6px" }}>
                          <Button variant="primary" size="sm" onClick={() => ctx.stage(f.path)}>Stage</Button>
                          <button
                            type="button"
                            onClick={() => setDiscardTarget({ path: f.path, isUntracked: true })}
                            style={{ background: "transparent", border: "none", color: "var(--text-secondary, #94a3b8)", cursor: "pointer", padding: "4px 6px", "font-size": "12px", "border-radius": "4px" }}
                            title="Delete untracked file"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  }}
                </For>
              </div>
            </Card>
          </Show>

          {/* Clean State */}
          <Show when={allChanges().length === 0}>
            <EmptyState message="Working tree is clean. No local changes detected." />
          </Show>

          {/* Commit Staged Box */}
          <Show when={stagedFiles().length > 0 || ctx.isAmend()}>
            <Card style={{ "margin-top": "8px", border: "1px solid rgba(56, 189, 248, 0.25)", background: "linear-gradient(180deg, rgba(15, 23, 42, 0.85), rgba(10, 14, 23, 0.9))" }}>
              <div style={S.cardHeader}>
                <span style={{ "font-weight": 700 }}>{ctx.isAmend() ? "Amend Previous Commit" : "Commit Staged Changes"}</span>
                <span style={{ "font-size": "11px", "font-family": "Space Mono, monospace", color: msgLengthColor() }}>
                  {msgLength()} / 50 chars
                </span>
              </div>

              {/* Amend Checkbox */}
              <div style={{ display: "flex", "align-items": "center", gap: "6px", "margin-bottom": "8px" }}>
                <label style={{ display: "inline-flex", "align-items": "center", gap: "6px", "font-size": "12px", color: "var(--text-secondary, #94a3b8)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={ctx.isAmend()}
                    onChange={(e) => {
                      const checked = e.currentTarget.checked;
                      ctx.setIsAmend(checked);
                      if (checked) {
                        const headCommit = ctx.commits()[0];
                        if (headCommit && !commitMsg()) {
                          setCommitMsg(headCommit.message);
                        }
                      }
                    }}
                    style={{ cursor: "pointer", "accent-color": "var(--accent-default, #38bdf8)" }}
                  />
                  <span style={{ "font-weight": 600, color: ctx.isAmend() ? "var(--accent-default, #38bdf8)" : "inherit" }}>
                    Amend Previous Commit (--amend)
                  </span>
                </label>
              </div>

              {/* Conventional Commit Type Chips */}
              <div style={{ display: "flex", "align-items": "center", gap: "6px", "flex-wrap": "wrap", "margin-bottom": "10px" }}>
                <For each={CONVENTIONAL_TYPES}>
                  {(t) => (
                    <span
                      style={{
                        ...S.conventionalChip,
                        color: commitMsg().startsWith(t.prefix) ? "#000" : t.color,
                        background: commitMsg().startsWith(t.prefix) ? t.color : "rgba(255, 255, 255, 0.05)",
                        "border-color": commitMsg().startsWith(t.prefix) ? t.color : "rgba(255, 255, 255, 0.1)",
                      }}
                      onClick={() => handleApplyPrefix(t.prefix)}
                    >
                      {t.prefix}
                    </span>
                  )}
                </For>
              </div>

              <div style={{ display: "flex", gap: "10px", "align-items": "center" }}>
                <input
                  type="text"
                  placeholder={ctx.isAmend() ? "Amend commit message..." : "feat: concise commit summary..."}
                  value={commitMsg()}
                  onInput={(e) => setCommitMsg(e.currentTarget.value)}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                      handleCommit();
                    } else if (e.key === "Enter") {
                      handleCommit();
                    }
                  }}
                  style={{ ...S.commitInput, flex: 1 }}
                />
                <Button variant="primary" onClick={handleCommit} disabled={!commitMsg().trim()} style={{ padding: "10px 18px" }}>
                  {ctx.isAmend() ? "Amend" : "Commit"}
                </Button>
              </div>
            </Card>
          </Show>
        </Show>
      </div>

      {/* Right Side Instant Split Diff Preview */}
      <Show when={inspectingFile()}>
        <div
          style={{
            flex: 1,
            display: "flex",
            "flex-direction": "column",
            background: "rgba(10, 14, 23, 0.6)",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div style={{ padding: "12px 16px", background: "rgba(15, 23, 42, 0.85)", "border-bottom": "1px solid rgba(255, 255, 255, 0.08)", display: "flex", "align-items": "center", "justify-content": "space-between" }}>
            <div style={{ display: "flex", "align-items": "center", gap: "8px", overflow: "hidden" }}>
              <span style={{ "font-size": "13px", "font-weight": 700, color: "#38bdf8", "font-family": "Space Mono, monospace", "white-space": "nowrap", overflow: "hidden", "text-overflow": "ellipsis" }}>
                📄 {inspectingFile()!.path}
              </span>
              <span style={{ "font-size": "10.5px", padding: "2px 6px", "border-radius": "4px", background: inspectingFile()!.staged ? "rgba(52, 211, 153, 0.2)" : "rgba(96, 165, 250, 0.2)", color: inspectingFile()!.staged ? "#34d399" : "#60a5fa", "font-weight": 700, "font-family": "Space Mono, monospace" }}>
                {inspectingFile()!.staged ? "STAGED" : "UNSTAGED"}
              </span>
            </div>

            <div style={{ display: "flex", "align-items": "center", gap: "8px" }}>
              <Button size="sm" onClick={() => ctx.switchView("diff")}>
                Full Diff View ↗
              </Button>
              <button
                type="button"
                onClick={() => setInspectingFile(null)}
                style={{ background: "transparent", border: "none", color: "var(--text-secondary, #94a3b8)", cursor: "pointer", "font-size": "14px", padding: "4px" }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Diff Content Preview */}
          <div style={{ flex: 1, overflow: "auto", padding: "12px 16px" }}>
            <Show when={ctx.diffResult()} fallback={<div style={{ padding: "24px", color: "rgba(255,255,255,0.4)" }}>Loading preview...</div>}>
              <For each={ctx.diffResult()?.files || (ctx.diffResult()?.hunks ? [{ hunks: ctx.diffResult()!.hunks }] : [])}>
                {(file) => (
                  <div>
                    <For each={file.hunks}>
                      {(hunk) => {
                        let oldLine = hunk.old_start;
                        let newLine = hunk.new_start;
                        const currentFile = inspectingFile();
                        return (
                          <div style={{ "margin-bottom": "12px", border: "1px solid rgba(255, 255, 255, 0.08)", "border-radius": "6px", overflow: "hidden" }}>
                            <div style={{ ...S.diffHunkHeader, display: "flex", "align-items": "center", "justify-content": "space-between", "flex-wrap": "wrap", gap: "6px" }}>
                              <span>@@ -{hunk.old_start},{hunk.old_lines} +{hunk.new_start},{hunk.new_lines} @@</span>
                              <div style={{ display: "flex", "align-items": "center", gap: "6px" }}>
                                <Show when={currentFile && !currentFile.staged}>
                                  <button
                                    type="button"
                                    onClick={() => ctx.stageHunk(currentFile!.path, hunk)}
                                    style={{ padding: "2px 8px", "font-size": "10.5px", "border-radius": "4px", background: "rgba(52, 211, 153, 0.2)", border: "1px solid rgba(52, 211, 153, 0.4)", color: "#34d399", cursor: "pointer", "font-weight": 600, "font-family": "Space Mono, monospace" }}
                                    title="Stage this specific hunk"
                                  >
                                    + Stage Hunk
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => ctx.discardHunk(currentFile!.path, hunk)}
                                    style={{ padding: "2px 8px", "font-size": "10.5px", "border-radius": "4px", background: "rgba(239, 68, 68, 0.2)", border: "1px solid rgba(239, 68, 68, 0.4)", color: "#f87171", cursor: "pointer", "font-weight": 600, "font-family": "Space Mono, monospace" }}
                                    title="Discard this hunk"
                                  >
                                    🗑️ Discard Hunk
                                  </button>
                                </Show>
                                <Show when={currentFile && currentFile.staged}>
                                  <button
                                    type="button"
                                    onClick={() => ctx.unstageHunk(currentFile!.path, hunk)}
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
                                  <div style={{ ...S.diffLine, ...style, "font-size": "11.5px", "line-height": "19px" }}>
                                    <span style={{ ...S.diffGutter, width: "32px" }}>{old ?? ""}</span>
                                    <span style={{ ...S.diffGutter, width: "32px" }}>{newL ?? ""}</span>
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
                )}
              </For>
            </Show>
          </div>
        </div>
      </Show>

      {/* Discard Confirmation Modal */}
      <Show when={discardTarget()}>
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10, 14, 23, 0.75)",
            "backdrop-filter": "blur(12px)",
            display: "flex",
            "align-items": "center",
            "justify-content": "center",
            "z-index": 100050,
          }}
          onClick={() => setDiscardTarget(null)}
        >
          <div
            style={{
              background: "rgba(15, 23, 42, 0.96)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              "border-radius": "12px",
              padding: "20px 24px",
              "max-width": "420px",
              width: "90%",
              "box-shadow": "0 20px 40px rgba(0,0,0,0.6)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ "font-weight": 700, "font-size": "15px", color: "#f87171", "margin-bottom": "8px", display: "flex", "align-items": "center", gap: "6px" }}>
              <span>⚠️</span> Discard Changes?
            </div>
            <div style={{ "font-size": "12.5px", color: "#f8fafc", "line-height": "1.5", "margin-bottom": "16px" }}>
              Are you sure you want to discard all changes in <code style={{ "font-family": "Space Mono, monospace", color: "#38bdf8" }}>{discardTarget()!.path}</code>?
              <br />
              <span style={{ color: "rgba(255, 255, 255, 0.5)", "font-size": "11.5px" }}>This action cannot be undone.</span>
            </div>
            <div style={{ display: "flex", "justify-content": "flex-end", gap: "10px" }}>
              <Button size="sm" onClick={() => setDiscardTarget(null)}>Cancel</Button>
              <Button
                variant="danger"
                size="sm"
                onClick={async () => {
                  const target = discardTarget()!;
                  setDiscardTarget(null);
                  if (inspectingFile()?.path === target.path) setInspectingFile(null);
                  await ctx.discardFile(target.path, target.isUntracked);
                }}
              >
                Discard Changes
              </Button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}
