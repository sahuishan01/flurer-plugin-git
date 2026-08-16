import { createSignal, createMemo, For, Show, onMount, onCleanup } from "solid-js";
import { useGit } from "../context";
import { formatTimestamp } from "../utils";
import { Card, EmptyState, Button, CommitContextMenu, BranchMultiSelect } from "./shared";
import { S } from "../styles";

export function HistoryView() {
  const ctx = useGit();
  const [search, setSearch] = createSignal("");
  const [loadingMore, setLoadingMore] = createSignal(false);
  const [menuPos, setMenuPos] = createSignal<{ x: number; y: number; hash: string } | null>(null);
  let containerRef: HTMLDivElement | undefined;

  onMount(() => {
    if (ctx.commits().length === 0) {
      ctx.loadHistory(100);
    }
    const el = containerRef?.parentElement ?? containerRef;
    if (!el) return;
    const handler = () => {
      if (loadingMore() || !ctx.historyHasMore()) return;
      if (el.scrollTop > 50 && el.scrollHeight - el.scrollTop - el.clientHeight < 300) {
        handleLoadMore();
      }
    };
    el.addEventListener("scroll", handler, { passive: true });
    onCleanup(() => el.removeEventListener("scroll", handler));
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

  function handleContextMenu(e: MouseEvent, hash: string) {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY, hash });
  }

  return (
    <div
      ref={containerRef}
      style={{
        padding: "16px 20px",
        width: "100%",
        "max-width": "100%",
        "box-sizing": "border-box",
        display: "flex",
        "flex-direction": "column",
        "align-items": "stretch",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", gap: "10px", "align-items": "center", "margin-bottom": "12px", width: "100%", "box-sizing": "border-box" }}>
        <input
          type="text"
          placeholder="Search commits..."
          value={search()}
          onInput={(e) => setSearch(e.currentTarget.value)}
          style={{ ...S.input, flex: 1, "box-sizing": "border-box" }}
        />
        <BranchMultiSelect />
      </div>

      <Show when={filteredCommits().length === 0}>
        <EmptyState message="No commits found." />
      </Show>

      <Show when={filteredCommits().length > 0}>
        <Card style={{ padding: 0, width: "100%", "max-width": "100%", "box-sizing": "border-box", overflow: "hidden" }}>
          <For each={filteredCommits()}>
            {(c) => {
              const initials = c.author ? c.author.slice(0, 2).toUpperCase() : "??";
              return (
                <div
                  style={{
                    ...S.fileRow,
                    padding: "10px 16px",
                    cursor: "pointer",
                    display: "flex",
                    "align-items": "center",
                    gap: "12px",
                    width: "100%",
                    "max-width": "100%",
                    "box-sizing": "border-box",
                    "min-width": 0,
                    overflow: "hidden",
                    border: "none",
                    "border-bottom": "1px solid rgba(255, 255, 255, 0.05)",
                  }}
                  onClick={() => ctx.showCommitDetail(c.hash)}
                  onContextMenu={(e) => handleContextMenu(e, c.hash)}
                >
                  <div
                    style={{
                      width: "26px",
                      height: "26px",
                      "border-radius": "50%",
                      background: "linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(129, 140, 248, 0.25))",
                      border: "1px solid rgba(56, 189, 248, 0.35)",
                      color: "#38bdf8",
                      display: "flex",
                      "align-items": "center",
                      "justify-content": "center",
                      "font-size": "10px",
                      "font-weight": 700,
                      "font-family": "Space Mono, monospace",
                      "flex-shrink": 0,
                    }}
                    title={c.author}
                  >
                    {initials}
                  </div>
                  <code style={{ color: "var(--accent-default, #38bdf8)", "font-family": "Space Mono, monospace", "font-size": "11.5px", "font-weight": 600, "flex-shrink": 0, padding: "2px 6px", background: "rgba(56, 189, 248, 0.1)", "border-radius": "4px" }}>
                    {c.hash.slice(0, 7)}
                  </code>
                  <span style={{ "font-size": "13px", "font-weight": 500, color: "var(--text-primary, #f8fafc)", overflow: "hidden", "text-overflow": "ellipsis", "white-space": "nowrap", flex: 1, "min-width": 0 }}>
                    {c.message}
                  </span>
                  <span style={{ "font-size": "11px", color: "rgba(255, 255, 255, 0.45)", "font-family": "Space Mono, monospace", "flex-shrink": 0, "text-align": "right" }}>
                    {formatTimestamp(c.timestamp)}
                  </span>
                </div>
              );
            }}
          </For>
        </Card>

        <Show when={ctx.historyHasMore()}>
          <div style={{ "text-align": "center", "margin-top": "14px", "padding-bottom": "16px", width: "100%" }}>
            <Button onClick={handleLoadMore} disabled={loadingMore()}>
              {loadingMore() ? "Loading..." : "Load More Commits"}
            </Button>
          </div>
        </Show>
      </Show>

      <Show when={ctx.commitDetail()}>
        <div style={{ "margin-top": "16px", width: "100%", "max-width": "100%", "box-sizing": "border-box", overflow: "hidden" }}>
          <Card style={{ width: "100%", "max-width": "100%", "box-sizing": "border-box", overflow: "hidden", border: "1px solid rgba(56, 189, 248, 0.3)" }}>
            <div style={S.cardHeader}>
              <div style={{ display: "flex", "align-items": "center", gap: "8px" }}>
                <span style={{ "font-weight": 700 }}>Commit Details</span>
                <code style={{ color: "var(--accent-default, #38bdf8)", "font-family": "Space Mono, monospace", "font-size": "11.5px", padding: "2px 6px", background: "rgba(56, 189, 248, 0.12)", "border-radius": "4px" }}>{ctx.commitDetail()!.hash.slice(0, 8)}</code>
              </div>
              <Button size="sm" variant="primary" onClick={() => {
                const d = ctx.commitDetail();
                if (d) {
                  ctx.openDiffPrompt(d.hash);
                }
              }}>View Diff</Button>
            </div>
            <div style={{ "font-size": "13px", "line-height": "1.6", "word-break": "break-word", overflow: "hidden" }}>
              <div style={{ "font-weight": 600, "font-size": "14px", "margin-bottom": "10px", "white-space": "pre-wrap", "word-break": "break-word", color: "var(--text-primary, #f8fafc)" }}>{ctx.commitDetail()!.message}</div>
              <div style={{ display: "flex", "flex-wrap": "wrap", gap: "12px", "font-size": "11.5px", color: "rgba(255, 255, 255, 0.6)", "font-family": "Space Mono, monospace" }}>
                <div>Author: <span style={{ color: "var(--text-primary, #f8fafc)" }}>{ctx.commitDetail()!.author}</span> &lt;{ctx.commitDetail()!.email}&gt;</div>
                <div>Date: <span style={{ color: "var(--text-primary, #f8fafc)" }}>{formatTimestamp(ctx.commitDetail()!.timestamp)}</span></div>
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
