import { createSignal, createMemo, For, Show, onMount } from "solid-js";
import { useGit } from "../context";
import { formatTimestamp } from "../utils";
import { Card, Button, EmptyState, ConfirmDialog } from "./shared";
import { S } from "../styles";

export function StashView() {
  const ctx = useGit();
  const [showCreate, setShowCreate] = createSignal(false);
  const [stashMsg, setStashMsg] = createSignal("");
  const [dropTarget, setDropTarget] = createSignal<number | null>(null);

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
    if (idx !== null) await ctx.stashDrop(idx);
    setDropTarget(null);
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

        <div style={{ display: "flex", "flex-direction": "column", gap: "6px" }}>
          <For each={ctx.stashes()}>
            {(stash) => (
              <div style={{ ...S.fileRow, padding: "12px", background: "rgba(255, 255, 255, 0.02)", "border-radius": "8px", "flex-direction": "column", "align-items": "stretch", gap: "8px" }}>
                <div style={{ display: "flex", "align-items": "center", "justify-content": "space-between" }}>
                  <div style={{ display: "flex", "align-items": "center", gap: "8px" }}>
                    <code style={{ color: "#38bdf8", "font-family": "Space Mono, monospace", "font-size": "12px", "font-weight": 600, background: "rgba(56, 189, 248, 0.1)", padding: "2px 6px", "border-radius": "4px" }}>stash@{"{"}{stash.index}{"}"}</code>
                    <span style={{ "font-size": "11.5px", color: "rgba(255, 255, 255, 0.45)", "font-family": "Space Mono, monospace" }}>{formatTimestamp(stash.timestamp)}</span>
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <Button variant="primary" size="sm" onClick={() => ctx.stashPop(stash.index)}>Pop</Button>
                    <Button variant="danger" size="sm" onClick={() => setDropTarget(stash.index)}>Drop</Button>
                  </div>
                </div>
                <Show when={stash.message}>
                  <div style={{ "font-size": "13px", color: "var(--text-primary, #f8fafc)", "font-weight": 500 }}>{stash.message}</div>
                </Show>
              </div>
            )}
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
