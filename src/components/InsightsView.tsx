import { createSignal, createMemo, onMount, For, Show } from "solid-js";
import { useGit } from "../context";
import { Card, Button, EmptyState } from "./shared";
import { S } from "../styles";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function InsightsView() {
  const ctx = useGit();
  const [loading, setLoading] = createSignal(false);

  onMount(() => {
    if (!ctx.stats()) {
      setLoading(true);
      ctx.loadStats().finally(() => setLoading(false));
    }
  });

  const stats = () => ctx.stats();

  const maxPunchcardCount = createMemo(() => {
    const s = stats();
    if (!s || !s.punchcard) return 1;
    let max = 1;
    for (const p of s.punchcard) {
      if (p.count > max) max = p.count;
    }
    return max;
  });

  const getHeatColor = (count: number) => {
    if (count === 0) return "rgba(255, 255, 255, 0.04)";
    const ratio = count / maxPunchcardCount();
    if (ratio < 0.25) return "rgba(56, 189, 248, 0.25)";
    if (ratio < 0.5) return "rgba(56, 189, 248, 0.5)";
    if (ratio < 0.75) return "rgba(56, 189, 248, 0.75)";
    return "#38bdf8";
  };

  const getExtColor = (ext: string): string => {
    const map: Record<string, string> = {
      rs: "#dea584",
      ts: "#3178c6",
      tsx: "#2b7489",
      js: "#f1e05a",
      jsx: "#e34c26",
      json: "#cbcb41",
      css: "#563d7c",
      html: "#e34c26",
      md: "#083fa1",
      toml: "#9c4221",
      yml: "#cb171e",
      yaml: "#cb171e",
      sh: "#89e051",
    };
    return map[ext.toLowerCase()] || "#94a3b8";
  };

  return (
    <div style={{ padding: "20px 24px", display: "flex", "flex-direction": "column", gap: "20px", "max-width": "1000px", margin: "0 auto", width: "100%", "box-sizing": "border-box" }}>
      {/* Top Bar Header */}
      <div style={{ display: "flex", "align-items": "center", "justify-content": "space-between", "flex-wrap": "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ margin: 0, "font-size": "18px", "font-weight": 700, color: "var(--text-primary, #f8fafc)", "letter-spacing": "0.2px" }}>
            📊 Repository Analytics & Insights
          </h2>
          <div style={{ "font-size": "12px", color: "rgba(255, 255, 255, 0.45)", "font-family": "Space Mono, monospace", "margin-top": "2px" }}>
            Activity punchcard, contributors leaderboard, and language distribution
          </div>
        </div>
        <Button size="sm" onClick={() => ctx.loadStats()} disabled={ctx.loading()}>
          🔄 Recalculate Stats
        </Button>
      </div>

      <Show when={loading() || (ctx.loading() && !stats())}>
        <EmptyState message="Analyzing repository commits, contributors, and file structures..." />
      </Show>

      <Show when={stats()}>
        {(s) => (
          <div style={{ display: "flex", "flex-direction": "column", gap: "18px" }}>
            {/* Top Metric Cards Grid */}
            <div style={{ display: "grid", "grid-template-columns": "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
              <Card style={{ padding: "16px", background: "linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(15, 23, 42, 0.8))", border: "1px solid rgba(56, 189, 248, 0.25)" }}>
                <div style={{ "font-size": "11px", "text-transform": "uppercase", color: "rgba(255, 255, 255, 0.5)", "font-family": "Space Mono, monospace", "font-weight": 700 }}>
                  Total Commits
                </div>
                <div style={{ "font-size": "26px", "font-weight": 800, color: "#38bdf8", "font-family": "Space Mono, monospace", "margin-top": "6px" }}>
                  {s().totalCommits}
                </div>
              </Card>

              <Card style={{ padding: "16px", background: "linear-gradient(135deg, rgba(52, 211, 153, 0.1), rgba(15, 23, 42, 0.8))", border: "1px solid rgba(52, 211, 153, 0.25)" }}>
                <div style={{ "font-size": "11px", "text-transform": "uppercase", color: "rgba(255, 255, 255, 0.5)", "font-family": "Space Mono, monospace", "font-weight": 700 }}>
                  Contributors
                </div>
                <div style={{ "font-size": "26px", "font-weight": 800, color: "#34d399", "font-family": "Space Mono, monospace", "margin-top": "6px" }}>
                  {s().totalContributors}
                </div>
              </Card>

              <Card style={{ padding: "16px", background: "linear-gradient(135deg, rgba(192, 132, 252, 0.1), rgba(15, 23, 42, 0.8))", border: "1px solid rgba(192, 132, 252, 0.25)" }}>
                <div style={{ "font-size": "11px", "text-transform": "uppercase", color: "rgba(255, 255, 255, 0.5)", "font-family": "Space Mono, monospace", "font-weight": 700 }}>
                  Active Branches
                </div>
                <div style={{ "font-size": "26px", "font-weight": 800, color: "#c084fc", "font-family": "Space Mono, monospace", "margin-top": "6px" }}>
                  {ctx.branches().length}
                </div>
              </Card>

              <Card style={{ padding: "16px", background: "linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(15, 23, 42, 0.8))", border: "1px solid rgba(251, 191, 36, 0.25)" }}>
                <div style={{ "font-size": "11px", "text-transform": "uppercase", color: "rgba(255, 255, 255, 0.5)", "font-family": "Space Mono, monospace", "font-weight": 700 }}>
                  Languages / Types
                </div>
                <div style={{ "font-size": "26px", "font-weight": 800, color: "#fbbf24", "font-family": "Space Mono, monospace", "margin-top": "6px" }}>
                  {s().languages.length}
                </div>
              </Card>
            </div>

            {/* 24x7 Activity Punchcard */}
            <Card>
              <div style={S.cardHeader}>
                <span style={{ "font-weight": 700 }}>24-Hour × 7-Day Commit Punchcard</span>
                <span style={{ "font-size": "11px", color: "rgba(255, 255, 255, 0.45)", "font-family": "Space Mono, monospace" }}>
                  Darker = Higher commit density
                </span>
              </div>

              <div style={{ overflow: "auto", padding: "10px 0" }}>
                <div style={{ display: "flex", "flex-direction": "column", gap: "4px", "min-width": "620px" }}>
                  {/* Hours scale header */}
                  <div style={{ display: "flex", "align-items": "center", "margin-bottom": "4px" }}>
                    <div style={{ width: "40px", "font-size": "10px", color: "rgba(255,255,255,0.4)" }} />
                    <div style={{ flex: 1, display: "grid", "grid-template-columns": "repeat(24, 1fr)", gap: "3px" }}>
                      <For each={Array.from({ length: 24 }, (_, i) => i)}>
                        {(hour) => (
                          <div style={{ "font-size": "9.5px", "text-align": "center", color: "rgba(255,255,255,0.35)", "font-family": "Space Mono, monospace" }}>
                            {hour % 3 === 0 ? `${hour}` : ""}
                          </div>
                        )}
                      </For>
                    </div>
                  </div>

                  {/* 7 Days Rows */}
                  <For each={DAY_NAMES}>
                    {(dayName, dayIndex) => {
                      const dayPoints = () => s().punchcard.filter((p) => p.day === dayIndex());
                      return (
                        <div style={{ display: "flex", "align-items": "center" }}>
                          <div style={{ width: "40px", "font-size": "11px", color: "rgba(255, 255, 255, 0.6)", "font-family": "Space Mono, monospace" }}>
                            {dayName}
                          </div>
                          <div style={{ flex: 1, display: "grid", "grid-template-columns": "repeat(24, 1fr)", gap: "3px" }}>
                            <For each={dayPoints()}>
                              {(pt) => (
                                <div
                                  style={{
                                    height: "18px",
                                    "border-radius": "3px",
                                    background: getHeatColor(pt.count),
                                    transition: "all 0.15s ease",
                                    cursor: "pointer",
                                  }}
                                  title={`${dayName} at ${pt.hour}:00 — ${pt.count} commits`}
                                />
                              )}
                            </For>
                          </div>
                        </div>
                      );
                    }}
                  </For>
                </div>
              </div>
            </Card>

            {/* Bottom Grid: Contributors Leaderboard & Language Breakdown */}
            <div style={{ display: "grid", "grid-template-columns": "repeat(auto-fit, minmax(380px, 1fr))", gap: "16px" }}>
              {/* Contributors Leaderboard */}
              <Card>
                <div style={S.cardHeader}>
                  <span style={{ "font-weight": 700 }}>Top Contributors</span>
                  <span style={{ "font-size": "11px", color: "rgba(255, 255, 255, 0.45)", "font-family": "Space Mono, monospace" }}>
                    Ranked by commit volume
                  </span>
                </div>
                <div style={{ display: "flex", "flex-direction": "column", gap: "6px" }}>
                  <For each={s().contributors.slice(0, 8)}>
                    {(c, idx) => {
                      const percent = () => Math.round((c.commits / Math.max(1, s().totalCommits)) * 100);
                      return (
                        <div style={{ padding: "8px 12px", background: "rgba(255, 255, 255, 0.02)", "border-radius": "8px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                          <div style={{ display: "flex", "align-items": "center", "justify-content": "space-between", "margin-bottom": "4px" }}>
                            <div style={{ display: "flex", "align-items": "center", gap: "8px", overflow: "hidden" }}>
                              <span style={{ "font-size": "12px", "font-weight": 700, width: "20px", color: idx() === 0 ? "#fbbf24" : idx() === 1 ? "#cbd5e1" : idx() === 2 ? "#d97706" : "rgba(255,255,255,0.4)" }}>
                                {idx() === 0 ? "🥇" : idx() === 1 ? "🥈" : idx() === 2 ? "🥉" : `#${idx() + 1}`}
                              </span>
                              <span style={{ "font-size": "13px", "font-weight": 600, color: "var(--text-primary, #f8fafc)", overflow: "hidden", "text-overflow": "ellipsis", "white-space": "nowrap" }}>
                                {c.name}
                              </span>
                            </div>
                            <span style={{ "font-family": "Space Mono, monospace", "font-size": "12px", "font-weight": 700, color: "#38bdf8" }}>
                              {c.commits} commits ({percent()}%)
                            </span>
                          </div>
                          {/* Progress bar */}
                          <div style={{ height: "4px", "border-radius": "2px", background: "rgba(255, 255, 255, 0.08)", overflow: "hidden" }}>
                            <div style={{ width: `${percent()}%`, height: "100%", background: "linear-gradient(90deg, #38bdf8, #818cf8)", "border-radius": "2px" }} />
                          </div>
                        </div>
                      );
                    }}
                  </For>
                </div>
              </Card>

              {/* Codebase Language Breakdown */}
              <Card>
                <div style={S.cardHeader}>
                  <span style={{ "font-weight": 700 }}>Codebase Language Composition</span>
                  <span style={{ "font-size": "11px", color: "rgba(255, 255, 255, 0.45)", "font-family": "Space Mono, monospace" }}>
                    By file count & extension
                  </span>
                </div>

                {/* Composition Progress Bar */}
                <div style={{ height: "10px", "border-radius": "5px", display: "flex", overflow: "hidden", "margin-bottom": "16px", background: "rgba(255,255,255,0.06)" }}>
                  <For each={s().languages}>
                    {(lang) => (
                      <div
                        style={{
                          width: `${Math.max(2, lang.percent)}%`,
                          background: getExtColor(lang.ext),
                          transition: "width 0.3s ease",
                        }}
                        title={`${lang.ext}: ${lang.count} files (${lang.percent}%)`}
                      />
                    )}
                  </For>
                </div>

                {/* Legend list */}
                <div style={{ display: "grid", "grid-template-columns": "repeat(2, 1fr)", gap: "8px" }}>
                  <For each={s().languages}>
                    {(lang) => (
                      <div style={{ display: "flex", "align-items": "center", gap: "8px", "font-family": "Space Mono, monospace", "font-size": "11.5px" }}>
                        <div style={{ width: "10px", height: "10px", "border-radius": "3px", background: getExtColor(lang.ext), "flex-shrink": 0 }} />
                        <span style={{ "font-weight": 700, color: "var(--text-primary, #f8fafc)", "text-transform": "uppercase" }}>
                          {lang.ext}
                        </span>
                        <span style={{ color: "rgba(255, 255, 255, 0.4)", "font-size": "10.5px" }}>
                          {lang.count} files ({lang.percent}%)
                        </span>
                      </div>
                    )}
                  </For>
                </div>
              </Card>
            </div>
          </div>
        )}
      </Show>
    </div>
  );
}
