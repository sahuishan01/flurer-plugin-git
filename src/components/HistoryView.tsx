import { createSignal, createMemo, For, Show, onMount, onCleanup } from "solid-js";
import { useGit } from "../context";
import { formatTimestamp, parseRef } from "../utils";
import { Card, EmptyState, Button, CommitContextMenu, BranchMultiSelect } from "./shared";
import { S } from "../styles";

export function HistoryView() {
  const ctx = useGit();
  const [search, setSearch] = createSignal("");
  const [density, setDensity] = createSignal<"detailed" | "compact">("detailed");
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
        overflow: "hidden",
      }}
    >
      {/* Toolbar */}
      <div style={{ display: "flex", gap: "10px", "margin-bottom": "14px", "align-items": "center", "flex-wrap": "wrap" }}>
        <input
          type="text"
          placeholder="🔍 Search commits by message, author, or hash..."
          value={search()}
          onInput={(e) => setSearch(e.currentTarget.value)}
          style={{ ...S.input, flex: 1, "min-width": "200px" }}
        />

        {/* Density Toggle */}
        <div style={{ display: "inline-flex", background: "rgba(10, 14, 23, 0.6)", border: "1px solid rgba(255, 255, 255, 0.12)", "border-radius": "8px", padding: "2px", gap: "2px" }}>
          <button
            type="button"
            style={{
              padding: "4px 10px",
              "font-size": "11px",
              "font-weight": 600,
              border: "none",
              "border-radius": "6px",
              cursor: "pointer",
              background: density() === "detailed" ? "var(--accent-default, #38bdf8)" : "transparent",
              color: density() === "detailed" ? "#000" : "var(--text-primary, #f8fafc)",
              transition: "all 0.15s ease",
            }}
            onClick={() => setDensity("detailed")}
            title="Detailed commit rows"
          >
            📋 Detailed
          </button>
          <button
            type="button"
            style={{
              padding: "4px 10px",
              "font-size": "11px",
              "font-weight": 600,
              border: "none",
              "border-radius": "6px",
              cursor: "pointer",
              background: density() === "compact" ? "var(--accent-default, #38bdf8)" : "transparent",
              color: density() === "compact" ? "#000" : "var(--text-primary, #f8fafc)",
              transition: "all 0.15s ease",
            }}
            onClick={() => setDensity("compact")}
            title="Compact 1-line rows"
          >
            ⚡ Compact
          </button>
        </div>

        <BranchMultiSelect />
      </div>

      <Show when={filteredCommits().length === 0 && !ctx.loading()}>
        <EmptyState message={search() ? "No matching commits" : "No commits found"} />
      </Show>

      <Show when={filteredCommits().length > 0}>
        <Card style={{ width: "100%", "max-width": "100%", "box-sizing": "border-box", overflow: "hidden", padding: "4px" }}>
          <For each={filteredCommits()}>
            {(c) => {
              const initials = c.author
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

              const cRefs = createMemo(() => {
                const graphMatch = ctx.graph().find((g) => g.hash === c.hash);
                return (graphMatch?.refs || []).map(parseRef);
              });

              return (
                <div
                  style={{
                    display: "flex",
                    "align-items": "center",
                    gap: "10px",
                    padding: density() === "compact" ? "5px 10px" : "8px 12px",
                    cursor: "pointer",
                    "border-radius": "6px",
                    transition: "background 0.15s ease",
                    width: "100%",
                    "max-width": "100%",
                    "box-sizing": "border-box",
                    overflow: "hidden",
                    border: "none",
                    "border-bottom": "1px solid rgba(255, 255, 255, 0.05)",
                  }}
                  onClick={() => {
                    const src = ctx.compareSourceHash();
                    if (src && src !== c.hash) {
                      ctx.loadDiffCompare(src, c.hash);
                      ctx.setCompareSourceHash(null);
                      return;
                    }
                    ctx.showCommitDetail(c.hash);
                  }}
                  onContextMenu={(e) => handleContextMenu(e, c.hash)}
                >
                  <Show when={density() === "detailed"}>
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
                  </Show>

                  <code style={{ color: "var(--accent-default, #38bdf8)", "font-family": "Space Mono, monospace", "font-size": density() === "compact" ? "10.5px" : "11.5px", "font-weight": 600, "flex-shrink": 0, padding: "2px 6px", background: "rgba(56, 189, 248, 0.1)", "border-radius": "4px" }}>
                    {c.hash.slice(0, 7)}
                  </code>

                  {/* Ref Badges: Tags & Branches */}
                  <For each={cRefs()}>
                    {(ref) => (
                      <span
                        style={{
                          display: "inline-flex",
                          "align-items": "center",
                          gap: "4px",
                          padding: "1px 7px",
                          "border-radius": "999px",
                          "font-size": "10.5px",
                          "font-weight": 700,
                          "font-family": "Space Mono, monospace",
                          background: ref.isTag ? "rgba(168, 85, 247, 0.24)" : (ref.isHead ? "rgba(245, 158, 11, 0.24)" : "rgba(56, 189, 248, 0.18)"),
                          border: ref.isTag ? "1px solid rgba(168, 85, 247, 0.45)" : (ref.isHead ? "1px solid rgba(245, 158, 11, 0.45)" : "1px solid rgba(56, 189, 248, 0.35)"),
                          color: ref.isTag ? "#e9d5ff" : (ref.isHead ? "#fef3c7" : "#38bdf8"),
                          "flex-shrink": 0,
                        }}
                      >
                        <span>{ref.isTag ? "🏷️" : "🌿"}</span>
                        <span>{ref.label}</span>
                      </span>
                    )}
                  </For>

                  <span
                    style={{
                      flex: 1,
                      overflow: "hidden",
                      "text-overflow": "ellipsis",
                      "white-space": "nowrap",
                      "font-size": density() === "compact" ? "12px" : "13px",
                      color: "var(--text-primary, #f8fafc)",
                      "font-weight": 500,
                      "min-width": 0,
                    }}
                    title={c.message}
                  >
                    {c.message}
                  </span>

                  <span
                    style={{
                      "font-size": "11px",
                      color: "rgba(255, 255, 255, 0.45)",
                      "font-family": "Space Mono, monospace",
                      "flex-shrink": 0,
                      "margin-left": "auto",
                      display: "flex",
                      "align-items": "center",
                      gap: "8px",
                    }}
                  >
                    <span style={{ color: "rgba(255, 255, 255, 0.65)" }}>{c.author}</span>
                    <span>•</span>
                    <span>{formatTimestamp(c.timestamp)}</span>
                  </span>
                </div>
              );
            }}
          </For>
        </Card>
      </Show>

      {/* Commit Detail Drawer */}
      <Show when={ctx.commitDetail()}>
        {(() => {
          const detail = ctx.commitDetail()!;
          const endingTags = createMemo(() => {
            const tags: string[] = [...(detail.tags || [])];
            const graphMatch = ctx.graph().find((g) => g.hash === detail.hash);
            if (graphMatch?.refs) {
              graphMatch.refs.forEach((r) => {
                const p = parseRef(r);
                if (p.isTag && !tags.includes(p.label)) tags.push(p.label);
              });
            }
            return tags;
          });

          const endingBranches = createMemo(() => {
            const branches: string[] = [...(detail.branches || [])];
            const graphMatch = ctx.graph().find((g) => g.hash === detail.hash);
            if (graphMatch?.refs) {
              graphMatch.refs.forEach((r) => {
                const p = parseRef(r);
                if (!p.isTag && !branches.includes(p.label)) branches.push(p.label);
              });
            }
            return branches;
          });

          return (
            <div style={{ "margin-top": "16px", width: "100%", "max-width": "100%", "box-sizing": "border-box", overflow: "hidden" }}>
              <Card style={{ width: "100%", "max-width": "100%", "box-sizing": "border-box", overflow: "hidden", border: "1px solid rgba(56, 189, 248, 0.3)" }}>
                <div style={S.cardHeader}>
                  <div style={{ display: "flex", "align-items": "center", gap: "8px" }}>
                    <span style={{ "font-weight": 700 }}>Commit Details</span>
                    <code style={{ color: "var(--accent-default, #38bdf8)", "font-family": "Space Mono, monospace", "font-size": "11.5px", padding: "2px 6px", background: "rgba(56, 189, 248, 0.12)", "border-radius": "4px" }}>{detail.hash.slice(0, 8)}</code>
                  </div>
                  <div style={{ display: "flex", gap: "8px", "align-items": "center" }}>
                    <Button size="sm" variant="primary" onClick={() => {
                      ctx.openDiffPrompt(detail.hash);
                    }}>View Diff</Button>
                    <Button size="sm" onClick={() => {
                      ctx.closeCommitDetail();
                    }}>✕</Button>
                  </div>
                </div>

                <div style={{ "font-size": "13px", "line-height": "1.6", "word-break": "break-word", overflow: "hidden" }}>
                  {/* Ending Tags & Branches Badges */}
                  <Show when={endingTags().length > 0 || endingBranches().length > 0}>
                    <div style={{ display: "flex", "align-items": "center", gap: "8px", "flex-wrap": "wrap", margin: "4px 0 12px", padding: "8px 12px", background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)", "border-radius": "8px" }}>
                      <span style={{ "font-size": "11px", "font-weight": 700, "text-transform": "uppercase", color: "var(--text-secondary, #94a3b8)", "font-family": "Space Mono, monospace", "letter-spacing": "0.5px" }}>
                        Ending at this commit:
                      </span>
                      <For each={endingTags()}>
                        {(tag) => (
                          <span style={{ display: "inline-flex", "align-items": "center", gap: "5px", padding: "3px 10px", "border-radius": "999px", background: "rgba(168, 85, 247, 0.22)", border: "1px solid rgba(168, 85, 247, 0.45)", color: "#e9d5ff", "font-size": "11.5px", "font-weight": 600, "font-family": "Space Mono, monospace" }}>
                            🏷️ {tag}
                          </span>
                        )}
                      </For>
                      <For each={endingBranches()}>
                        {(branch) => (
                          <span style={{ display: "inline-flex", "align-items": "center", gap: "5px", padding: "3px 10px", "border-radius": "999px", background: branch.includes("(HEAD)") ? "rgba(245, 158, 11, 0.22)" : "rgba(56, 189, 248, 0.18)", border: branch.includes("(HEAD)") ? "1px solid rgba(245, 158, 11, 0.45)" : "1px solid rgba(56, 189, 248, 0.4)", color: branch.includes("(HEAD)") ? "#fef3c7" : "#38bdf8", "font-size": "11.5px", "font-weight": 600, "font-family": "Space Mono, monospace" }}>
                            🌿 {branch}
                          </span>
                        )}
                      </For>
                    </div>
                  </Show>

                  <div style={{ "font-weight": 600, "font-size": "14px", "margin-bottom": "10px", "white-space": "pre-wrap", "word-break": "break-word", color: "var(--text-primary, #f8fafc)", "line-height": "1.6" }}>
                    {detail.message}
                  </div>

                  <Show when={detail.parent_hashes.length > 1}>
                    <div style={{ background: "rgba(15, 23, 42, 0.94)", border: "1px solid rgba(56, 189, 248, 0.45)", padding: "10px 14px", "border-radius": "10px", margin: "10px 0", "box-shadow": "0 4px 14px rgba(0,0,0,0.4)" }}>
                      <div style={{ display: "flex", "align-items": "center", gap: "6px", "font-weight": 700, "font-size": "12px", color: "#38bdf8", "text-shadow": "0 1px 2px rgba(0,0,0,0.8)" }}>
                        🔀 Merge Commit Breakdown
                      </div>
                      <div style={{ "font-size": "12px", margin: "6px 0 2px", color: "#f8fafc", display: "flex", "align-items": "center", gap: "6px", "flex-wrap": "wrap" }}>
                        <span style={{ color: "#94a3b8" }}>Merging <strong>Source Branch</strong></span>
                        <code style={{ background: "rgba(74, 222, 128, 0.2)", border: "1px solid rgba(74, 222, 128, 0.5)", color: "#86efac", padding: "2px 7px", "border-radius": "6px", "font-family": "Space Mono, monospace", "font-size": "11px", "font-weight": 700 }}>
                          {detail.parent_hashes[1].slice(0, 7)}
                        </code>
                        <span style={{ "font-weight": 700, color: "#94a3b8" }}>➔ Into Target/Base Branch</span>
                        <code style={{ background: "rgba(56, 189, 248, 0.2)", border: "1px solid rgba(56, 189, 248, 0.5)", color: "#7dd3fc", padding: "2px 7px", "border-radius": "6px", "font-family": "Space Mono, monospace", "font-size": "11px", "font-weight": 700 }}>
                          {detail.parent_hashes[0].slice(0, 7)}
                        </code>
                      </div>
                    </div>
                  </Show>

                  <div style={{ display: "flex", "flex-wrap": "wrap", gap: "12px", "font-size": "11.5px", color: "rgba(255, 255, 255, 0.6)", "font-family": "Space Mono, monospace", "border-top": "1px solid rgba(255, 255, 255, 0.08)", "padding-top": "8px" }}>
                    <div>Author: <span style={{ color: "var(--text-primary, #f8fafc)" }}>{detail.author}</span> &lt;{detail.email}&gt;</div>
                    <div>Date: <span style={{ color: "var(--text-primary, #f8fafc)" }}>{formatTimestamp(detail.timestamp)}</span></div>
                    <div>Full Hash: <code style={{ color: "var(--accent-default, #38bdf8)" }}>{detail.hash}</code></div>
                  </div>
                </div>
              </Card>
            </div>
          );
        })()}
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
