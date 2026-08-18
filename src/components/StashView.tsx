import { createSignal, createMemo, For, Show, onMount } from "solid-js";
import { useGit } from "../context";
import { formatTimestamp } from "../utils";
import { Card, Button, EmptyState, ConfirmDialog } from "./shared";
import { S } from "../styles";
import type { GitDiff } from "../types";

export function StashView() {
  const ctx = useGit();
  const [showCreate, setShowCreate] = createSignal(false);
  const [stashMsg, setStashMsg] = createSignal("");
  const [dropTarget, setDropTarget] = createSignal<number | null>(null);
  const [expandedStash, setExpandedStash] = createSignal<number | null>(null);
  const [stashDiffData, setStashDiffData] = createSignal<GitDiff | null>(null);
  const [loadingDiff, setLoadingDiff] = createSignal(false);

  onMount(() => {
    ctx.loadStashes();
  });

  async function handleCreate() {
    await ctx.stash(stashMsg().trim() || undefined);
    setStashMsg("");
    setShowCreate(false);
  }

  async function handleDrop() {
    const idx = dropTarget();
    if (idx !== null) {
      await ctx.stashDrop(idx);
      if (expandedStash() === idx) {
        setExpandedStash(null);
        setStashDiffData(null);
      }
    }
    setDropTarget(null);
  }

  async function toggleInspect(index: number) {
    if (expandedStash() === index) {
      setExpandedStash(null);
      setStashDiffData(null);
      return;
    }
    setExpandedStash(index);
    setLoadingDiff(true);
    const d = await ctx.loadStashDiff(index);
    setStashDiffData(d);
    setLoadingDiff(false);
  }

  return (
    <div style={{ padding: "20px 24px", display: "flex", "flex-direction": "column", gap: "16px", "max-width": "900px", margin: "0 auto", width: "100%", "box-sizing": "border-box" }}>
      <Card>
        <div style={S.cardHeader}>
          <div style={{ display: "flex", "align-items": "center", gap: "8px" }}>
            <span style={{ "font-weight": 700 }}>Saved Stashes</span>
            <span style={{ ...S.badge, background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8" }}>{ctx.stashes().length}</span>
          </div>
          <Button variant="primary" size="sm" onClick={() => setShowCreate(!showCreate())}>
            {showCreate() ? "Cancel" : "+ New Stash"}
          </Button>
        </div>

        <Show when={showCreate()}>
          <div style={{ display: "flex", gap: "8px", "margin-bottom": "14px", "padding-bottom": "14px", "border-bottom": "1px solid rgba(255, 255, 255, 0.08)" }}>
            <input
              type="text"
              placeholder="Stash message (optional)"
              value={stashMsg()}
              onInput={(e) => setStashMsg(e.currentTarget.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              style={{ ...S.input, flex: 1 }}
            />
            <Button variant="primary" onClick={handleCreate}>Save Stash</Button>
          </div>
        </Show>

        <Show when={ctx.stashes().length === 0}>
          <EmptyState message="No stashes found." />
        </Show>

        <div style={{ display: "flex", "flex-direction": "column", gap: "8px" }}>
          <For each={ctx.stashes()}>
            {(stash) => {
              const isExp = () => expandedStash() === stash.index;

              return (
                <div
                  style={{
                    ...S.fileRow,
                    padding: "12px 14px",
                    background: isExp() ? "rgba(56, 189, 248, 0.08)" : "rgba(255, 255, 255, 0.02)",
                    border: isExp() ? "1px solid rgba(56, 189, 248, 0.3)" : "1px solid rgba(255, 255, 255, 0.04)",
                    "border-radius": "8px",
                    "flex-direction": "column",
                    "align-items": "stretch",
                    gap: "8px",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", "align-items": "center", "justify-content": "space-between", "flex-wrap": "wrap", gap: "10px" }}>
                    <div
                      style={{ display: "flex", "align-items": "center", gap: "10px", cursor: "pointer", flex: 1 }}
                      onClick={() => toggleInspect(stash.index)}
                    >
                      <code style={{ color: "#38bdf8", "font-family": "Space Mono, monospace", "font-size": "12px", "font-weight": 700, background: "rgba(56, 189, 248, 0.1)", padding: "3px 8px", "border-radius": "4px" }}>
                        stash@{"{"}{stash.index}{"}"}
                      </code>
                      <span style={{ "font-size": "11.5px", color: "rgba(255, 255, 255, 0.45)", "font-family": "Space Mono, monospace" }}>
                        {formatTimestamp(stash.timestamp)}
                      </span>
                      <span style={{ "font-size": "11px", color: "#38bdf8", opacity: 0.8 }}>
                        {isExp() ? "▼ Hide diff" : "▶ Preview diff"}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "6px" }}>
                      <Button variant="primary" size="sm" onClick={() => ctx.stashPop(stash.index)}>Pop</Button>
                      <Button variant="danger" size="sm" onClick={() => setDropTarget(stash.index)}>Drop</Button>
                    </div>
                  </div>

                  <Show when={stash.message}>
                    <div style={{ "font-size": "13px", color: "var(--text-primary, #f8fafc)", "font-weight": 500 }}>
                      {stash.message}
                    </div>
                  </Show>

                  {/* Expanded Stash Preview */}
                  <Show when={isExp()}>
                    <div style={{ "margin-top": "8px", "padding-top": "8px", "border-top": "1px solid rgba(255, 255, 255, 0.08)" }}>
                      <Show when={loadingDiff()}>
                        <div style={{ padding: "12px", "font-size": "12px", color: "rgba(255, 255, 255, 0.5)", "text-align": "center" }}>
                          Loading stash diff...
                        </div>
                      </Show>
                      <Show when={!loadingDiff() && stashDiffData()}>
                        <div style={{ display: "flex", "flex-direction": "column", gap: "8px", "max-height": "320px", overflow: "auto" }}>
                          <For each={stashDiffData()?.files || (stashDiffData()?.hunks ? [{ hunks: stashDiffData()!.hunks }] : [])}>
                            {(file: any) => (
                              <div style={{ border: "1px solid rgba(255, 255, 255, 0.08)", "border-radius": "6px", overflow: "hidden", background: "rgba(10, 14, 23, 0.6)" }}>
                                <Show when={file.newPath || file.oldPath}>
                                  <div style={{ padding: "6px 10px", background: "rgba(15, 23, 42, 0.8)", "font-size": "11.5px", "font-family": "Space Mono, monospace", color: "#38bdf8", "font-weight": 600 }}>
                                    📄 {file.newPath || file.oldPath}
                                  </div>
                                </Show>
                                <For each={file.hunks}>
                                  {(hunk: any) => (
                                    <div>
                                      <div style={{ ...S.diffHunkHeader, "font-size": "10.5px", padding: "3px 8px" }}>
                                        @@ -{hunk.old_start},{hunk.old_lines} +{hunk.new_start},{hunk.new_lines} @@
                                      </div>
                                      <For each={hunk.lines}>
                                        {(line: any) => {
                                          const style = line.origin === "+" ? S.diffAdded : line.origin === "-" ? S.diffRemoved : S.diffContext;
                                          return (
                                            <div style={{ ...S.diffLine, ...style, "font-size": "11px", "line-height": "18px" }}>
                                              <span style={{ flex: 1, "white-space": "pre-wrap", "word-break": "break-all" }}>
                                                {line.origin} {line.content}
                                              </span>
                                            </div>
                                          );
                                        }}
                                      </For>
                                    </div>
                                  )}
                                </For>
                              </div>
                            )}
                          </For>
                        </div>
                      </Show>
                    </div>
                  </Show>
                </div>
              );
            }}
          </For>
        </div>
      </Card>

      <ConfirmDialog
        open={dropTarget() !== null}
        message={`Drop stash@{"{"}${dropTarget()}{"}"}? This cannot be undone.`}
        onConfirm={handleDrop}
        onCancel={() => setDropTarget(null)}
        danger
      />
    </div>
  );
}
