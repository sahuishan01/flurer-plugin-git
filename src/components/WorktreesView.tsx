import { createSignal, For, Show, onMount } from "solid-js";
import { useGit } from "../context";
import { basename } from "../utils";
import { Card, Button, EmptyState, ConfirmDialog } from "./shared";
import { S } from "../styles";

export function WorktreesView() {
  const ctx = useGit();
  const [showAdd, setShowAdd] = createSignal(false);
  const [addPath, setAddPath] = createSignal("");
  const [addBranch, setAddBranch] = createSignal("");
  const [removeTarget, setRemoveTarget] = createSignal<string | null>(null);

  onMount(() => {
    ctx.loadWorktrees();
  });

  async function handleAdd() {
    const p = addPath().trim();
    if (!p) return;
    await ctx.addWorktree(p, addBranch().trim() || undefined);
    setAddPath("");
    setAddBranch("");
    setShowAdd(false);
  }

  async function handleRemove() {
    const p = removeTarget();
    if (p) await ctx.removeWorktree(p);
    setRemoveTarget(null);
  }

  return (
    <div style={{ padding: "20px 24px", display: "flex", "flex-direction": "column", gap: "16px", "max-width": "900px", margin: "0 auto", width: "100%", "box-sizing": "border-box" }}>
      <Card>
        <div style={S.cardHeader}>
          <div style={{ display: "flex", "align-items": "center", gap: "8px" }}>
            <span style={{ "font-weight": 700 }}>Active Worktrees</span>
            <span style={{ ...S.badge, background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8" }}>{ctx.worktrees().length}</span>
          </div>
          <Button variant="primary" size="sm" onClick={() => setShowAdd(!showAdd())}>
            {showAdd() ? "Cancel" : "+ Add Worktree"}
          </Button>
        </div>

        <Show when={showAdd()}>
          <div style={{ display: "flex", "flex-direction": "column", gap: "10px", "margin-bottom": "14px", "padding-bottom": "14px", "border-bottom": "1px solid rgba(255, 255, 255, 0.08)" }}>
            <input
              type="text"
              placeholder="Worktree directory path (e.g. ../my-feature-worktree)"
              value={addPath()}
              onInput={(e) => setAddPath(e.currentTarget.value)}
              style={S.input}
            />
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                placeholder="Branch name (optional, will create branch if needed)"
                value={addBranch()}
                onInput={(e) => setAddBranch(e.currentTarget.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                style={{ ...S.input, flex: 1 }}
              />
              <Button variant="primary" onClick={handleAdd}>Create Worktree</Button>
            </div>
          </div>
        </Show>

        <Show when={ctx.worktrees().length === 0}>
          <EmptyState message="No worktrees found." />
        </Show>

        <div style={{ display: "flex", "flex-direction": "column", gap: "6px" }}>
          <For each={ctx.worktrees()}>
            {(wt) => {
              const isMain = wt.path === ctx.repoPath();
              return (
                <div style={{ ...S.fileRow, padding: "12px", background: "rgba(255, 255, 255, 0.02)", "border-radius": "8px", "flex-direction": "column", "align-items": "stretch", gap: "6px" }}>
                  <div style={{ display: "flex", "align-items": "center", "justify-content": "space-between" }}>
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <div style={{ display: "flex", "align-items": "center", gap: "8px" }}>
                        <span style={{ "font-weight": 700, "font-size": "13.5px", color: "var(--text-primary, #f8fafc)" }}>{basename(wt.path)}</span>
                        <Show when={isMain}>
                          <span style={{ "font-size": "10.5px", padding: "1px 6px", "border-radius": "4px", background: "rgba(56, 189, 248, 0.2)", color: "#38bdf8", "font-weight": 700, "font-family": "Space Mono, monospace" }}>MAIN REPO</span>
                        </Show>
                        <Show when={wt.locked}>
                          <span style={{ "font-size": "10.5px", padding: "1px 6px", "border-radius": "4px", background: "rgba(239, 68, 68, 0.2)", color: "#f87171", "font-weight": 600 }}>LOCKED</span>
                        </Show>
                      </div>
                      <div style={{ "font-size": "11.5px", color: "rgba(255, 255, 255, 0.45)", "font-family": "Space Mono, monospace", overflow: "hidden", "text-overflow": "ellipsis", "white-space": "nowrap", "margin-top": "2px" }}>
                        {wt.path}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px", "flex-shrink": 0, "align-items": "center" }}>
                      <Show when={wt.branch}>
                        <span style={{ "font-size": "11.5px", color: "#38bdf8", background: "rgba(56, 189, 248, 0.12)", padding: "2px 8px", "border-radius": "4px", "font-family": "Space Mono, monospace", "font-weight": 600 }}>{wt.branch}</span>
                      </Show>
                      <Show when={!isMain}>
                        <Button variant="danger" size="sm" onClick={() => setRemoveTarget(wt.path)}>Remove</Button>
                      </Show>
                    </div>
                  </div>
                  <div style={{ "font-size": "11px", color: "rgba(255, 255, 255, 0.35)", "font-family": "Space Mono, monospace" }}>
                    HEAD: {wt.head?.slice(0, 7) ?? "N/A"}
                  </div>
                </div>
              );
            }}
          </For>
        </div>
      </Card>

      <ConfirmDialog
        open={removeTarget() !== null}
        message={`Remove worktree at "${removeTarget()}"? Uncommitted changes will be discarded.`}
        onConfirm={handleRemove}
        onCancel={() => setRemoveTarget(null)}
        danger
      />
    </div>
  );
}
