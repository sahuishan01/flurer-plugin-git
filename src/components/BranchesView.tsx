import { createSignal, createMemo, For, Show } from "solid-js";
import { useGit } from "../context";
import { formatTimestamp } from "../utils";
import { Card, Button, EmptyState, ConfirmDialog } from "./shared";
import { S } from "../styles";

export function BranchesView() {
  const ctx = useGit();
  const [showCreate, setShowCreate] = createSignal(false);
  const [newBranchName, setNewBranchName] = createSignal("");
  const [searchQuery, setSearchQuery] = createSignal("");
  const [deleteTarget, setDeleteTarget] = createSignal<string | null>(null);
  const [mergeTarget, setMergeTarget] = createSignal<string | null>(null);

  const currentBranch = createMemo(() => ctx.branches().find((b) => b.is_current));

  const filteredBranches = createMemo(() => {
    const q = searchQuery().toLowerCase().trim();
    if (!q) return ctx.branches();
    return ctx.branches().filter((b) => b.name.toLowerCase().includes(q) || (b.upstream && b.upstream.toLowerCase().includes(q)));
  });

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
      {/* Current Active Branch Highlight */}
      <Show when={currentBranch()}>
        <Card style={{ border: "1px solid rgba(56, 189, 248, 0.35)", background: "linear-gradient(180deg, rgba(15, 23, 42, 0.9), rgba(10, 14, 23, 0.95))" }}>
          <div style={S.cardHeader}>
            <span style={{ "font-size": "11px", "text-transform": "uppercase", "letter-spacing": "0.6px", color: "rgba(255, 255, 255, 0.5)", "font-family": "Space Mono, monospace", "font-weight": 700 }}>
              Current Active Branch
            </span>
          </div>
          <div style={{ display: "flex", "align-items": "center", "justify-content": "space-between", "flex-wrap": "wrap", gap: "12px" }}>
            <div style={{ display: "flex", "align-items": "center", gap: "10px" }}>
              <div style={{ width: "10px", height: "10px", "border-radius": "50%", background: "#38bdf8", "box-shadow": "0 0 12px #38bdf8" }} />
              <div style={{ "font-size": "16px", "font-weight": 700, color: "#38bdf8", "font-family": "Space Mono, monospace" }}>
                {currentBranch()!.name}
              </div>
              <Show when={currentBranch()!.upstream}>
                <span style={{ "font-weight": 500, color: "rgba(255, 255, 255, 0.5)", "font-size": "12px", "font-family": "Space Mono, monospace" }}>
                  → {currentBranch()!.upstream}
                </span>
              </Show>
              <Show when={typeof currentBranch()!.ahead === "number" && typeof currentBranch()!.behind === "number" && (currentBranch()!.ahead! > 0 || currentBranch()!.behind! > 0)}>
                <span style={{ "font-size": "11px", padding: "2px 7px", "border-radius": "4px", background: "rgba(0, 0, 0, 0.3)", color: "#4ade80", "font-family": "Space Mono, monospace" }}>
                  ↑{currentBranch()!.ahead} ↓{currentBranch()!.behind}
                </span>
              </Show>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <Button size="sm" onClick={ctx.pull} disabled={ctx.loading()}>Pull</Button>
              <Button variant="primary" size="sm" onClick={ctx.push} disabled={ctx.loading()}>Push</Button>
              <Button size="sm" onClick={ctx.fetchRemote} disabled={ctx.loading()}>Fetch</Button>
            </div>
          </div>

          <Show when={currentBranch()!.lastCommit}>
            <div style={{ "margin-top": "12px", "padding-top": "10px", "border-top": "1px solid rgba(255, 255, 255, 0.06)", display: "flex", "align-items": "center", gap: "10px", "font-size": "12px", color: "var(--text-secondary, #94a3b8)" }}>
              <code style={{ color: "var(--accent-default, #38bdf8)", "font-family": "Space Mono, monospace", "font-size": "11px" }}>
                {currentBranch()!.lastCommit!.hash}
              </code>
              <span style={{ flex: 1, overflow: "hidden", "text-overflow": "ellipsis", "white-space": "nowrap" }}>
                {currentBranch()!.lastCommit!.message}
              </span>
              <span style={{ "font-size": "11px", opacity: 0.6, "font-family": "Space Mono, monospace", "flex-shrink": 0 }}>
                {currentBranch()!.lastCommit!.author} • {formatTimestamp(currentBranch()!.lastCommit!.timestamp)}
              </span>
            </div>
          </Show>
        </Card>
      </Show>

      {/* All Branches Card */}
      <Card>
        <div style={S.cardHeader}>
          <div style={{ display: "flex", "align-items": "center", gap: "8px" }}>
            <span style={{ "font-weight": 700 }}>All Branches</span>
            <span style={{ ...S.badge, background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8" }}>{ctx.branches().length}</span>
          </div>
          <div style={{ display: "flex", "align-items": "center", gap: "8px" }}>
            <Button size="sm" onClick={() => ctx.openTagModal("HEAD")}>
              🏷️ Manage Tags
            </Button>
            <Button variant="primary" size="sm" onClick={() => setShowCreate(!showCreate())}>
              {showCreate() ? "Cancel" : "+ New Branch"}
            </Button>
          </div>
        </div>

        {/* Branch Search Input */}
        <div style={{ "margin-bottom": "12px" }}>
          <input
            type="text"
            placeholder="🔍 Search branches..."
            value={searchQuery()}
            onInput={(e) => setSearchQuery(e.currentTarget.value)}
            style={{
              width: "100%",
              padding: "6px 12px",
              "font-size": "12px",
              "border-radius": "6px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              background: "rgba(0, 0, 0, 0.25)",
              color: "#f8fafc",
              outline: "none",
              "box-sizing": "border-box",
            }}
          />
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

        <Show when={filteredBranches().length === 0}>
          <EmptyState message="No branches matching query." />
        </Show>

        <div style={{ display: "flex", "flex-direction": "column", gap: "4px" }}>
          <For each={filteredBranches()}>
            {(branch) => (
              <div
                style={{
                  ...S.fileRow,
                  padding: "10px 14px",
                  background: branch.is_current ? "rgba(56, 189, 248, 0.08)" : "rgba(255, 255, 255, 0.02)",
                  border: branch.is_current ? "1px solid rgba(56, 189, 248, 0.25)" : "1px solid rgba(255, 255, 255, 0.04)",
                  "border-radius": "8px",
                  margin: "2px 0",
                  transition: "all 0.15s ease",
                  display: "flex",
                  "flex-direction": "column",
                  gap: "6px",
                }}
              >
                <div style={{ display: "flex", "align-items": "center", "justify-content": "space-between", gap: "10px" }}>
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
                    <Show when={typeof branch.ahead === "number" && typeof branch.behind === "number" && (branch.ahead > 0 || branch.behind > 0)}>
                      <span style={{ "font-size": "10.5px", padding: "1px 6px", "border-radius": "4px", background: "rgba(0, 0, 0, 0.25)", color: "#4ade80", "font-family": "Space Mono, monospace" }}>
                        ↑{branch.ahead} ↓{branch.behind}
                      </span>
                    </Show>
                  </div>

                  <div style={{ display: "flex", gap: "6px", "flex-shrink": 0, "align-items": "center" }}>
                    <Show when={!branch.is_current}>
                      <Button size="sm" onClick={() => handleCheckout(branch.name)}>Checkout</Button>
                      <Button size="sm" onClick={() => setMergeTarget(branch.name)}>Merge</Button>
                      <Button variant="danger" size="sm" onClick={() => setDeleteTarget(branch.name)}>Delete</Button>
                    </Show>
                  </div>
                </div>

                <Show when={branch.lastCommit}>
                  <div style={{ display: "flex", "align-items": "center", gap: "8px", "font-size": "11.5px", color: "rgba(255, 255, 255, 0.5)" }}>
                    <code style={{ color: "#38bdf8", "font-family": "Space Mono, monospace", "font-size": "10.5px" }}>
                      {branch.lastCommit!.hash}
                    </code>
                    <span style={{ flex: 1, overflow: "hidden", "text-overflow": "ellipsis", "white-space": "nowrap" }}>
                      {branch.lastCommit!.message}
                    </span>
                    <span style={{ "font-size": "10.5px", opacity: 0.7, "font-family": "Space Mono, monospace", "flex-shrink": 0 }}>
                      {branch.lastCommit!.author} • {formatTimestamp(branch.lastCommit!.timestamp)}
                    </span>
                  </div>
                </Show>
              </div>
            )}
          </For>
        </div>
      </Card>

      <ConfirmDialog
        open={deleteTarget() !== null}
        title="Delete Branch"
        message={`Are you sure you want to delete branch "${deleteTarget()}"? This operation cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={mergeTarget() !== null}
        title="Merge Branch"
        message={`Merge branch "${mergeTarget()}" into current branch "${currentBranch()?.name}"?`}
        confirmLabel="Merge"
        variant="primary"
        onConfirm={handleMerge}
        onCancel={() => setMergeTarget(null)}
      />
    </div>
  );
}
