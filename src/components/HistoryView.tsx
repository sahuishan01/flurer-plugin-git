import { createSignal, createMemo, For, Show, onMount } from "solid-js";
import { useGit } from "../context";
import { formatTimestamp } from "../utils";
import { Card, EmptyState, Button, CommitContextMenu } from "./shared";
import { S } from "../styles";

export function HistoryView() {
  const ctx = useGit();
  const [search, setSearch] = createSignal("");
  const [loadingMore, setLoadingMore] = createSignal(false);
  const [menuPos, setMenuPos] = createSignal<{ x: number; y: number; hash: string } | null>(null);

  onMount(() => {
    if (ctx.commits().length === 0) {
      ctx.loadHistory(100);
    }
  });

  const filteredCommits = createMemo(() => {
    const q = search().trim().toLowerCase();
    const c = ctx.commits();
    if (!q) return c;
    return c.filter((cm) =>
      cm.message.toLowerCase().includes(q) ||
      cm.author.toLowerCase().includes(q) ||
      cm.hash.toLowerCase().includes(q)
    );
  });

  async function handleLoadMore() {
    if (loadingMore() || !ctx.historyHasMore()) return;
    setLoadingMore(true);
    await ctx.loadMoreHistory();
    setLoadingMore(false);
  }

  function handleScroll(e: Event) {
    const el = e.currentTarget as HTMLDivElement;
    if (!el || loadingMore() || !ctx.historyHasMore()) return;
    if (el.scrollTop > 50 && el.scrollHeight - el.scrollTop - el.clientHeight < 200) {
      handleLoadMore();
    }
  }

  function handleContextMenu(e: MouseEvent, hash: string) {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY, hash });
  }

  return (
    <div
      onScroll={handleScroll}
      style={{
        padding: "16px 20px",
        height: "100%",
        width: "100%",
        "box-sizing": "border-box",
        "overflow-y": "auto",
        display: "flex",
        "flex-direction": "column",
      }}
    >
      <div style={{ "margin-bottom": "12px", width: "100%", "box-sizing": "border-box" }}>
        <input
          type="text"
          placeholder="Search commits..."
          value={search()}
          onInput={(e) => setSearch(e.currentTarget.value)}
          style={{ ...S.input, width: "100%", "box-sizing": "border-box" }}
        />
      </div>

      <Show when={filteredCommits().length === 0}>
        <EmptyState message="No commits found." />
      </Show>

      <Show when={filteredCommits().length > 0}>
        <Card style={{ padding: 0, width: "100%", "box-sizing": "border-box", overflow: "hidden" }}>
          <For each={filteredCommits()}>
            {(c) => (
              <div
                style={{
                  ...S.fileRow,
                  padding: "10px 14px",
                  cursor: "pointer",
                  display: "flex",
                  "align-items": "center",
                  "justify-content": "space-between",
                  gap: "12px",
                  width: "100%",
                  "box-sizing": "border-box",
                }}
                onClick={() => ctx.showCommitDetail(c.hash)}
                onContextMenu={(e) => handleContextMenu(e, c.hash)}
              >
                <div style={{ display: "flex", "align-items": "center", gap: "10px", flex: 1, "min-width": 0 }}>
                  <code style={{ color: "var(--accent-color, #f59e0b)", "font-family": "Space Mono, monospace", "font-size": "12px", "flex-shrink": 0 }}>
                    {c.hash.slice(0, 7)}
                  </code>
                  <span style={{ "font-size": "13px", color: "var(--text-color)", overflow: "hidden", "text-overflow": "ellipsis", "white-space": "nowrap", flex: 1 }}>
                    {c.message}
                  </span>
                </div>
                <div style={{ "font-size": "11px", color: "var(--text-muted, #888)", "flex-shrink": 0, "text-align": "right", "white-space": "nowrap" }}>
                  {c.author} · {formatTimestamp(c.timestamp)}
                </div>
              </div>
            )}
          </For>
        </Card>

        <Show when={ctx.historyHasMore()}>
          <div style={{ "text-align": "center", "margin-top": "12px", "padding-bottom": "16px", width: "100%" }}>
            <Button onClick={handleLoadMore} disabled={loadingMore()}>
              {loadingMore() ? "Loading..." : "Load More"}
            </Button>
          </div>
        </Show>
      </Show>

      <Show when={ctx.commitDetail()}>
        <div style={{ "margin-top": "16px", width: "100%", "box-sizing": "border-box" }}>
          <Card style={{ width: "100%", "box-sizing": "border-box" }}>
            <div style={S.cardHeader}>
              <span>Commit Detail</span>
              <Button size="sm" onClick={() => {
                const d = ctx.commitDetail();
                if (d) {
                  ctx.loadDiff(".", "commit", d.hash);
                }
              }}>View Diff</Button>
            </div>
            <div style={{ "font-size": "13px", "line-height": "1.5" }}>
              <div style={{ "margin-bottom": "4px" }}>
                <code style={{ color: "var(--accent-color, #f59e0b)", "font-family": "Space Mono, monospace" }}>{ctx.commitDetail()!.hash}</code>
              </div>
              <div style={{ "font-weight": 600, "margin-bottom": "8px", "white-space": "pre-wrap", "word-break": "break-word" }}>{ctx.commitDetail()!.message}</div>
              <div style={{ color: "var(--text-muted, #888)", "font-size": "11px" }}>
                {ctx.commitDetail()!.author} &lt;{ctx.commitDetail()!.email}&gt;
              </div>
              <div style={{ color: "var(--text-muted, #888)", "font-size": "11px" }}>
                {formatTimestamp(ctx.commitDetail()!.timestamp)}
              </div>
            </div>
          </Card>
        </div>
      </Show>

      {/* Right-click Context Menu */}
      <Show when={menuPos()}>
        <CommitContextMenu
          x={menuPos()!.x}
          y={menuPos()!.y}
          hash={menuPos()!.hash}
          onClose={() => setMenuPos(null)}
        />
      </Show>
    </div>
  );
}
