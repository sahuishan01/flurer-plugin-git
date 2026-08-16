import { createSignal, createMemo, For, Show } from "solid-js";
import { useGit } from "../context";
import { Card, Button, EmptyState, ConfirmDialog } from "./shared";
import { S } from "../styles";

export function BranchesView() {
  const ctx = useGit();
  const [showCreate, setShowCreate] = createSignal(false);
  const [newBranchName, setNewBranchName] = createSignal("");
  const [deleteTarget, setDeleteTarget] = createSignal<string | null>(null);
  const [mergeTarget, setMergeTarget] = createSignal<string | null>(null);

  const currentBranch = createMemo(() => ctx.branches().find((b) => b.is_current));

  async function handleCreate() {
    const name = newBranchName().trim();
    if (!name) return;
    await ctx.createBranch(name);
    setNewBranchName("");
    setShowCreate(false);
  }

  async function handleDelete() {
    const name = deleteTarget();
    if (name) await ctx.deleteBranch(name);
    setDeleteTarget(null);
  }

  async function handleCheckout(name: string) {
    await ctx.checkout(name);
  }

  async function handleMerge() {
    const name = mergeTarget();
    if (name) await ctx.merge(name);
    setMergeTarget(null);
  }

  return (
    <div style={{ padding: "20px 24px", display: "flex", "flex-direction": "column", gap: "16px", "max-width": "900px", margin: "0 auto", width: "100%", "box-sizing": "border-box" }}>
      <Show when={currentBranch()}>
        <Card style={{ border: "1px solid rgba(56, 189, 248, 0.3)", background: "linear-gradient(180deg, rgba(15, 23, 42, 0.85), rgba(10, 14, 23, 0.9))" }}>
          <div style={S.cardHeader}>
            <span style={{ "font-size": "12px", "text-transform": "uppercase", "letter-spacing": "0.6px", color: "rgba(255, 255, 255, 0.5)", "font-family": "Space Mono, monospace" }}>Current Active Branch</span>
          </div>
          <div style={{ display: "flex", "align-items": "center", gap: "10px" }}>
            <div style={{ width: "10px", height: "10px", "border-radius": "50%", background: "#38bdf8", "box-shadow": "0 0 10px #38bdf8" }} />
            <div style={{ "font-size": "15px", "font-weight": 700, color: "#38bdf8", "font-family": "Space Mono, monospace" }}>
              {currentBranch()!.name}
            </div>
            <Show when={currentBranch()!.upstream}>
              <span style={{ "font-weight": 400, color: "rgba(255, 255, 255, 0.5)", "font-size": "12px", "font-family": "Space Mono, monospace" }}>
                → {currentBranch()!.upstream}
              </span>
            </Show>
          </div>
        </Card>
      </Show>

      <Card>
        <div style={S.cardHeader}>
          <div style={{ display: "flex", "align-items": "center", gap: "8px" }}>
            <span style={{ "font-weight": 700 }}>All Branches</span>
            <span style={{ ...S.badge, background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8" }}>{ctx.branches().length}</span>
          </div>
          <Button variant="primary" size="sm" onClick={() => setShowCreate(!showCreate())}>
            {showCreate() ? "Cancel" : "+ New Branch"}
          </Button>
        </div>

        <Show when={showCreate()}>
          <div style={{ display: "flex", gap: "8px", "margin-bottom": "14px", "padding-bottom": "14px", "border-bottom": "1px solid rgba(255, 255, 255, 0.08)" }}>
            <input
              type="text"
              placeholder="Branch name (e.g. feature/new-ui)"
              value={newBranchName()}
              onInput={(e) => setNewBranchName(e.currentTarget.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              style={{ ...S.input, flex: 1 }}
            />
            <Button variant="primary" onClick={handleCreate}>Create Branch</Button>
          </div>
        </Show>

        <Show when={ctx.branches().length === 0}>
          <EmptyState message="No branches found." />
        </Show>

        <div style={{ display: "flex", "flex-direction": "column", gap: "2px" }}>
          <For each={ctx.branches()}>
            {(branch) => (
              <div
                style={{
                  ...S.fileRow,
                  padding: "10px 12px",
                  background: branch.is_current ? "rgba(56, 189, 248, 0.08)" : "rgba(255, 255, 255, 0.02)",
                  border: branch.is_current ? "1px solid rgba(56, 189, 248, 0.25)" : "none",
                  "border-bottom": "1px solid rgba(255, 255, 255, 0.05)",
                  "border-radius": "8px",
                  margin: "2px 0",
                }}
              >
                <div style={{ flex: 1, overflow: "hidden", display: "flex", "align-items": "center", gap: "8px" }}>
                  <Show when={branch.is_current}>
                    <div style={{ width: "8px", height: "8px", "border-radius": "50%", background: "#38bdf8", "flex-shrink": 0 }} />
                  </Show>
                  <span style={{ "font-family": "Space Mono, monospace", "font-size": "13px", "font-weight": branch.is_current ? 700 : 500, color: branch.is_current ? "#38bdf8" : "var(--text-primary, #f8fafc)" }}>
                    {branch.name}
                  </span>
                  <Show when={branch.upstream}>
                    <span style={{ "font-size": "11px", color: "rgba(255, 255, 255, 0.45)", "font-family": "Space Mono, monospace" }}>
                      → {branch.upstream}
                    </span>
                  </Show>
                </div>
                <div style={{ display: "flex", gap: "6px", "flex-shrink": 0, "align-items": "center" }}>
                  <Show when={!branch.is_current}>
                    <Button size="sm" onClick={() => handleCheckout(branch.name)}>Checkout</Button>
                    <Button size="sm" onClick={() => setMergeTarget(branch.name)}>Merge</Button>
                    <Button variant="danger" size="sm" onClick={() => setDeleteTarget(branch.name)}>Delete</Button>
                  </Show>
                  <Show when={branch.is_current}>
                    <span style={{ "font-size": "10.5px", color: "#38bdf8", padding: "2px 8px", background: "rgba(56, 189, 248, 0.15)", "border-radius": "4px", "font-weight": 700, "font-family": "Space Mono, monospace" }}>ACTIVE HEAD</span>
                  </Show>
                </div>
              </div>
            )}
          </For>
        </div>
      </Card>

      <ConfirmDialog
        open={deleteTarget() !== null}
        message={`Delete branch "${deleteTarget()}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        danger
      />

      <ConfirmDialog
        open={mergeTarget() !== null}
        message={`Merge "${mergeTarget()}" into current branch?`}
        onConfirm={handleMerge}
        onCancel={() => setMergeTarget(null)}
      />
    </div>
  );
}
