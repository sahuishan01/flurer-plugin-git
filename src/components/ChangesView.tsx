import { createSignal, createMemo, For, Show } from "solid-js";
import { useGit } from "../context";
import { statusColor } from "../utils";
import { Badge, Button, Card, EmptyState } from "./shared";
import { S } from "../styles";

export function ChangesView() {
  const ctx = useGit();
  const [commitMsg, setCommitMsg] = createSignal("");

  const stagedFiles = createMemo(() => ctx.status()?.changes.filter((c) => c.staged) ?? []);
  const unstagedFiles = createMemo(() => ctx.status()?.changes.filter((c) => !c.staged && c.status !== "??") ?? []);
  const untrackedFiles = createMemo(() => ctx.status()?.changes.filter((c) => c.status === "??") ?? []);

  async function handleCommit() {
    const msg = commitMsg().trim();
    if (!msg) return;
    await ctx.commit(msg);
    setCommitMsg("");
  }

  function handleFileClick(path: string, staged: boolean) {
    ctx.loadDiff(path, staged ? "staged" : "unstaged");
  }

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
    <div style={{ padding: "20px 24px", display: "flex", "flex-direction": "column", gap: "16px", "max-width": "1000px", margin: "0 auto", width: "100%", "box-sizing": "border-box" }}>
      <Show when={ctx.loading() && !ctx.status()}>
        <EmptyState message="Loading repository status..." />
      </Show>

      <Show when={ctx.status()}>
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
                      "border-radius": "8px",
                      padding: "8px 12px",
                      margin: "2px 0",
                    }}
                  >
                    <span
                      style={{ cursor: "pointer", flex: 1, overflow: "hidden", "text-overflow": "ellipsis", "white-space": "nowrap", display: "flex", "align-items": "center" }}
                      onClick={() => handleFileClick(f.path, true)}
                      title="Click to view diff"
                    >
                      {renderStatusBadge(f.status)}
                      <span style={{ "font-size": "13px", "font-weight": 500 }}>{f.path}</span>
                    </span>
                    <Button size="sm" onClick={() => ctx.unstage(f.path)}>Unstage</Button>
                  </div>
                )}
              </For>
            </div>
          </Card>
        </Show>

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
                      "border-radius": "8px",
                      padding: "8px 12px",
                      margin: "2px 0",
                    }}
                  >
                    <span
                      style={{ cursor: "pointer", flex: 1, overflow: "hidden", "text-overflow": "ellipsis", "white-space": "nowrap", display: "flex", "align-items": "center" }}
                      onClick={() => handleFileClick(f.path, false)}
                      title="Click to view diff"
                    >
                      {renderStatusBadge(f.status)}
                      <span style={{ "font-size": "13px", "font-weight": 500 }}>{f.path}</span>
                    </span>
                    <Button variant="primary" size="sm" onClick={() => ctx.stage(f.path)}>Stage</Button>
                  </div>
                )}
              </For>
            </div>
          </Card>
        </Show>

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
                      "border-radius": "8px",
                      padding: "8px 12px",
                      margin: "2px 0",
                    }}
                  >
                    <span
                      style={{ cursor: "pointer", flex: 1, overflow: "hidden", "text-overflow": "ellipsis", "white-space": "nowrap", display: "flex", "align-items": "center" }}
                      onClick={() => handleFileClick(f.path, false)}
                      title="Click to view diff"
                    >
                      {renderStatusBadge("?")}
                      <span style={{ "font-size": "13px", "font-weight": 500 }}>{f.path}</span>
                    </span>
                    <Button variant="primary" size="sm" onClick={() => ctx.stage(f.path)}>Stage</Button>
                  </div>
                )}
              </For>
            </div>
          </Card>
        </Show>

        <Show when={stagedFiles().length === 0 && unstagedFiles().length === 0 && untrackedFiles().length === 0}>
          <EmptyState message="Working tree is clean. No local changes detected." />
        </Show>

        <Show when={stagedFiles().length > 0}>
          <Card style={{ "margin-top": "8px", border: "1px solid rgba(56, 189, 248, 0.25)", background: "linear-gradient(180deg, rgba(15, 23, 42, 0.85), rgba(10, 14, 23, 0.9))" }}>
            <div style={S.cardHeader}>
              <span style={{ "font-weight": 700 }}>Commit Staged Changes</span>
              <span style={{ "font-size": "11px", color: "rgba(255, 255, 255, 0.45)", "font-family": "Space Mono, monospace" }}>Ctrl + Enter to commit</span>
            </div>
            <div style={{ display: "flex", gap: "10px", "align-items": "center" }}>
              <input
                type="text"
                placeholder="Write a clear commit message..."
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
                Commit
              </Button>
            </div>
          </Card>
        </Show>
      </Show>
    </div>
  );
}
