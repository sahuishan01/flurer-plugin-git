import { createSignal, createMemo, For, Show } from "solid-js";
import { useGit } from "../context";
import { statusColor } from "../utils";
import { Badge, Button, Card, EmptyState } from "./shared";
import { S } from "../styles";

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
  const [discardTarget, setDiscardTarget] = createSignal<{ path: string; isUntracked: boolean } | null>(null);

  const allChanges = createMemo(() => ctx.status()?.changes ?? []);

  const filteredChanges = createMemo(() => {
    const q = searchQuery().toLowerCase().trim();
    if (!q) return allChanges();
    return allChanges().filter((c) => c.path.toLowerCase().includes(q));
  });

  const conflictedFiles = createMemo(() =>
    filteredChanges().filter((c) => ["UU", "AA", "DD", "AU", "UA", "DU", "UD"].includes(c.status))
  );
  const stagedFiles = createMemo(() => filteredChanges().filter((c) => c.staged));
  const unstagedFiles = createMemo(() =>
    filteredChanges().filter(
      (c) => !c.staged && c.status !== "??" && !["UU", "AA", "DD", "AU", "UA", "DU", "UD"].includes(c.status)
    )
  );
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
  }

  function handleFileSelect(path: string, staged: boolean) {
    ctx.loadDiff(path, staged ? "staged" : "unstaged");
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
      {/* Main List of Changes Workspace */}
      <div
        style={{
          flex: 1,
          "max-width": "1000px",
          margin: "0 auto",
          width: "100%",
          padding: "16px 20px",
          overflow: "auto",
          display: "flex",
          "flex-direction": "column",
          gap: "14px",
          "box-sizing": "border-box",
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
          {/* Merge Conflicts Card */}
          <Show when={conflictedFiles().length > 0}>
            <Card style={{ border: "1px solid rgba(239, 68, 68, 0.4)", background: "linear-gradient(180deg, rgba(30, 10, 15, 0.85), rgba(15, 23, 42, 0.9))" }}>
              <div style={S.cardHeader}>
                <div style={{ display: "flex", "align-items": "center", gap: "8px" }}>
                  <span style={{ "font-weight": 700, color: "#f87171", "letter-spacing": "0.3px" }}>⚠️ Merge Conflicts</span>
                  <span style={{ ...S.badge, background: "rgba(239, 68, 68, 0.2)", color: "#f87171" }}>{conflictedFiles().length}</span>
                </div>
              </div>
              <div style={{ display: "flex", "flex-direction": "column", gap: "6px" }}>
                <For each={conflictedFiles()}>
                  {(f) => (
                    <div style={{ ...S.fileRow, background: "rgba(255, 255, 255, 0.02)", border: "1px solid transparent", "border-radius": "8px", padding: "8px 12px" }}>
                      <span
                        style={{ cursor: "pointer", flex: 1, overflow: "hidden", "text-overflow": "ellipsis", "white-space": "nowrap", display: "flex", "align-items": "center" }}
                        onClick={() => handleFileSelect(f.path, false)}
                        title="Click to view diff in Diff tab"
                      >
                        <span style={{ "font-size": "10px", "font-weight": 700, padding: "2px 6px", "border-radius": "4px", background: "rgba(239, 68, 68, 0.25)", color: "#fca5a5", "font-family": "Space Mono, monospace", "margin-right": "8px" }}>
                          CONFLICT
                        </span>
                        <span style={{ "font-size": "12.5px", "font-weight": 700, color: "#fca5a5" }}>{f.path}</span>
                      </span>
                      <div style={{ display: "flex", "align-items": "center", gap: "6px" }}>
                        <button
                          type="button"
                          onClick={() => ctx.resolveConflict(f.path, "ours")}
                          style={{ padding: "4px 8px", "font-size": "11px", "border-radius": "4px", background: "rgba(56, 189, 248, 0.15)", border: "1px solid rgba(56, 189, 248, 0.3)", color: "#38bdf8", cursor: "pointer", "font-weight": 600 }}
                          title="Keep Current (Ours / HEAD)"
                        >
                          Accept Ours
                        </button>
                        <button
                          type="button"
                          onClick={() => ctx.resolveConflict(f.path, "theirs")}
                          style={{ padding: "4px 8px", "font-size": "11px", "border-radius": "4px", background: "rgba(192, 132, 252, 0.15)", border: "1px solid rgba(192, 132, 252, 0.3)", color: "#c084fc", cursor: "pointer", "font-weight": 600 }}
                          title="Keep Incoming (Theirs / Remote)"
                        >
                          Accept Theirs
                        </button>
                        <Button size="sm" onClick={() => ctx.resolveConflict(f.path, "mark")}>
                          ✓ Resolved
                        </Button>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </Card>
          </Show>

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
                  {(f) => (
                    <div
                      style={{
                        ...S.fileRow,
                        background: "rgba(255, 255, 255, 0.02)",
                        border: "1px solid transparent",
                        "border-radius": "8px",
                        padding: "6px 10px",
                        margin: "2px 0",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <span
                        style={{ cursor: "pointer", flex: 1, overflow: "hidden", "text-overflow": "ellipsis", "white-space": "nowrap", display: "flex", "align-items": "center" }}
                        onClick={() => handleFileSelect(f.path, true)}
                        title="Click to view diff in Diff tab"
                      >
                        {renderStatusBadge(f.status)}
                        <span style={{ "font-size": "12.5px", "font-weight": 500 }}>{f.path}</span>
                      </span>
                      <div style={{ display: "flex", "align-items": "center", gap: "4px" }}>
                        <button
                          type="button"
                          onClick={() => ctx.openFileLog(f.path)}
                          style={{ background: "transparent", border: "none", color: "var(--text-secondary, #94a3b8)", cursor: "pointer", padding: "4px 6px", "font-size": "12px", "border-radius": "4px" }}
                          title="View File History"
                        >
                          📜
                        </button>
                        <button
                          type="button"
                          onClick={() => ctx.openBlame(f.path)}
                          style={{ background: "transparent", border: "none", color: "var(--text-secondary, #94a3b8)", cursor: "pointer", padding: "4px 6px", "font-size": "12px", "border-radius": "4px" }}
                          title="View Git Blame"
                        >
                          🔍
                        </button>
                        <Button size="sm" onClick={() => ctx.unstage(f.path)}>Unstage</Button>
                      </div>
                    </div>
                  )}
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
                  {(f) => (
                    <div
                      style={{
                        ...S.fileRow,
                        background: "rgba(255, 255, 255, 0.02)",
                        border: "1px solid transparent",
                        "border-radius": "8px",
                        padding: "6px 10px",
                        margin: "2px 0",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <span
                        style={{ cursor: "pointer", flex: 1, overflow: "hidden", "text-overflow": "ellipsis", "white-space": "nowrap", display: "flex", "align-items": "center" }}
                        onClick={() => handleFileSelect(f.path, false)}
                        title="Click to view diff in Diff tab"
                      >
                        {renderStatusBadge(f.status)}
                        <span style={{ "font-size": "12.5px", "font-weight": 500 }}>{f.path}</span>
                      </span>
                      <div style={{ display: "flex", "align-items": "center", gap: "4px" }}>
                        <button
                          type="button"
                          onClick={() => ctx.openFileLog(f.path)}
                          style={{ background: "transparent", border: "none", color: "var(--text-secondary, #94a3b8)", cursor: "pointer", padding: "4px 6px", "font-size": "12px", "border-radius": "4px" }}
                          title="View File History"
                        >
                          📜
                        </button>
                        <button
                          type="button"
                          onClick={() => ctx.openBlame(f.path)}
                          style={{ background: "transparent", border: "none", color: "var(--text-secondary, #94a3b8)", cursor: "pointer", padding: "4px 6px", "font-size": "12px", "border-radius": "4px" }}
                          title="View Git Blame"
                        >
                          🔍
                        </button>
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
                  )}
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
                  {(f) => (
                    <div
                      style={{
                        ...S.fileRow,
                        background: "rgba(255, 255, 255, 0.02)",
                        border: "1px solid transparent",
                        "border-radius": "8px",
                        padding: "6px 10px",
                        margin: "2px 0",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <span
                        style={{ cursor: "pointer", flex: 1, overflow: "hidden", "text-overflow": "ellipsis", "white-space": "nowrap", display: "flex", "align-items": "center" }}
                        onClick={() => handleFileSelect(f.path, false)}
                        title="Click to view diff in Diff tab"
                      >
                        {renderStatusBadge("?")}
                        <span style={{ "font-size": "12.5px", "font-weight": 500 }}>{f.path}</span>
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
                  )}
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
