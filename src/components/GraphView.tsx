import { createMemo, Index, Show, onMount, createEffect, onCleanup } from "solid-js";
import { useGit } from "../context";
import { formatTimestamp, surfaceBg } from "../utils";
import type { GitGraphEntry } from "../types";
import { EmptyState } from "./shared";

const LANE_W = 16;
const ROW_H = 34;
const DOT_R = 4.5;
const COLORS = ["#f59e0b", "#60a5fa", "#4ade80", "#f87171", "#c084fc", "#2dd4bf", "#fb923c", "#a78bfa"];

interface GraphRow extends GitGraphEntry {
  lane: number;
}

interface GraphEdge {
  fromRow: number;
  fromLane: number;
  viaLane: number;
  toHash: string;
  toRow: number | null;
  toLane: number | null;
}

interface GraphData {
  rows: GraphRow[];
  edges: GraphEdge[];
  laneCount: number;
}

// Assigns each commit a lane (column) and builds routed edges to its parents.
// Entries must be newest-first, topologically ordered (parents after children).
function buildGraph(entries: GitGraphEntry[]): GraphData {
  // lanes[i] = hash of the commit expected to appear next in lane i (null = lane is free)
  const lanes: (string | null)[] = [];
  const hashRow = new Map<string, number>();
  entries.forEach((e, i) => hashRow.set(e.hash, i));

  const rows: GraphRow[] = [];
  const edges: GraphEdge[] = [];

  // Reserves a lane slot for `hash`.  If the hash is already expected in some
  // lane, returns that lane without mutating.  Otherwise reuses a free slot
  // (preferring the rightmost free slot so that freed lanes cluster at the end,
  // keeping the lanes array as compact as possible).
  const allocLane = (hash: string): number => {
    const existing = lanes.indexOf(hash);
    if (existing !== -1) return existing;
    // XXX: lastIndexOf finds the rightmost null — this groups freed slots
    // towards the boundary so the lanes array stays compact.
    const free = lanes.lastIndexOf(null);
    if (free !== -1) {
      lanes[free] = hash;
      return free;
    }
    lanes.push(hash);
    return lanes.length - 1;
  };

  entries.forEach((e, i) => {
    const expecting: number[] = [];
    lanes.forEach((h, li) => {
      if (h === e.hash) expecting.push(li);
    });

    let lane: number;
    if (expecting.length > 0) {
      lane = expecting[0];
      // any other lanes waiting on this commit converge into it here
      for (let k = 1; k < expecting.length; k++) lanes[expecting[k]] = null;
    } else {
      lane = allocLane(e.hash);
    }

    rows.push({ ...e, lane });

    if (e.parents.length === 0) {
      lanes[lane] = null;
      return;
    }

    // First parent continues down this lane UNLESS it is already tracked
    // by a different lane (which happens when a feature branch traces back
    // to an earlier mainline commit).  In that case we free this lane
    // immediately instead of holding a duplicate reservation that would
    // stretch the branch line far down the graph — converging early is
    // both correct (the parent is already expected) and economical.
    const p1 = e.parents[0];
    const existingP1 = lanes.indexOf(p1);
    if (existingP1 !== -1 && existingP1 !== lane) {
      lanes[lane] = null;
    } else {
      lanes[lane] = p1;
    }
    edges.push({ fromRow: i, fromLane: lane, viaLane: lane, toHash: e.parents[0], toRow: null, toLane: null });
    // Merge parents fork into their own lanes.
    // allocLane already checks for existing reservations, so if a merge
    // parent traces back to a commit already being tracked it reuses that
    // slot instead of inflating.
    for (let k = 1; k < e.parents.length; k++) {
      const via = allocLane(e.parents[k]);
      edges.push({ fromRow: i, fromLane: lane, viaLane: via, toHash: e.parents[k], toRow: null, toLane: null });
    }
  });

  let laneCount = 1;
  for (const r of rows) laneCount = Math.max(laneCount, r.lane + 1);
  for (const e of edges) {
    laneCount = Math.max(laneCount, e.viaLane + 1);
    const toRow = hashRow.get(e.toHash);
    if (toRow !== undefined) {
      e.toRow = toRow;
      e.toLane = rows[toRow].lane;
    }
  }

  return { rows, edges, laneCount };
}

export function GraphView() {
  const ctx = useGit();
  onMount(() => {
    if (ctx.graph().length === 0) ctx.loadGraph();
  });

  const data = createMemo(() => buildGraph(ctx.graph()));
  const laneX = (l: number) => l * LANE_W + LANE_W / 2;
  const rowY = (r: number) => r * ROW_H + ROW_H / 2;
  const laneColor = (l: number) => COLORS[l % COLORS.length];
  const graphW = () => data().laneCount * LANE_W + 8;
  const svgH = () => data().rows.length * ROW_H + 20;
  const bottomY = () => data().rows.length * ROW_H;

  // Infinite scroll: load next page when user scrolls near the bottom
  let scrollRef: HTMLDivElement | undefined;
  createEffect(() => {
    const el = scrollRef;
    if (!el) return;
    const handler = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (scrollHeight - scrollTop - clientHeight < 400 && ctx.graphHasMore() && !ctx.graphLoading()) {
        ctx.loadMoreGraph();
      }
    };
    el.addEventListener("scroll", handler, { passive: true });
    onCleanup(() => el.removeEventListener("scroll", handler));
  });

  // Re-check scroll position after a load completes — scrolling to the bottom
  // and staying there doesn't fire a new scroll event, so the next page would
  // never trigger without this.  Also re-checks whenever graph data grows
  // (data appended) so the auto-chain keeps going.
  createEffect(() => {
    const loading = ctx.graphLoading();
    const el = scrollRef;
    const rowCount = data().rows.length; // track graph data changes too
    if (!loading && el && ctx.graphHasMore()) {
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (scrollHeight - scrollTop - clientHeight < 800) {
        ctx.loadMoreGraph();
      }
    }
  });

  // Routes an edge: straight down when child and parent share a lane, otherwise
  // fork horizontally just below the child row and/or converge just above the parent row.
  const edgePoints = (e: GraphEdge): string => {
    const x1 = laneX(e.fromLane);
    const y1 = rowY(e.fromRow);
    const vx = laneX(e.viaLane);
    const y2 = e.toRow !== null ? rowY(e.toRow) : bottomY();
    const x2 = e.toLane !== null ? laneX(e.toLane) : vx;

    const pts: string[] = [`${x1},${y1}`];
    if (vx !== x1) {
      const forkY = y1 + ROW_H / 2;
      pts.push(`${x1},${forkY}`, `${vx},${forkY}`);
    }
    if (x2 !== vx) {
      const joinY = y2 - ROW_H / 2;
      pts.push(`${vx},${joinY}`, `${x2},${joinY}`);
    }
    pts.push(`${x2},${y2}`);
    return pts.join(" ");
  };

  return (
    <div style={{ padding: "16px 24px", background: surfaceBg(0.04), height: "100%" }}>
      <Show when={data().rows.length === 0}>
        <EmptyState message="Loading graph..." />
      </Show>
      <Show when={data().rows.length > 0}>
        <div ref={scrollRef} style={{ overflow: "auto", background: surfaceBg(0.04), "max-height": "calc(100vh - 200px)" }}>
          <div style={{ "min-width": `${graphW() + 940}px` }}>
            <svg width={graphW() + 940} height={svgH()} style={{ display: "block" }}>
              <Index each={data().edges}>
                {(edge) => (
                  <polyline
                    points={edgePoints(edge())}
                    fill="none"
                    stroke={laneColor(edge().viaLane)}
                    stroke-width="2"
                    opacity="0.55"
                    stroke-linejoin="round"
                    stroke-linecap="round"
                  />
                )}
              </Index>
              <Index each={data().rows}>
                {(row, i) => {
                  const y = rowY(i);
                  const cx = laneX(row().lane);
                  const color = laneColor(row().lane);
                  const textX = graphW() + 14 + Math.min(row().refs.length, 3) * 130;
                  return (
                    <g>
                      <circle cx={cx} cy={y} r={DOT_R} fill={color} stroke="var(--panel-bg,#1a1a2e)" stroke-width="2" />
                      <circle cx={cx} cy={y} r={DOT_R + 2.5} fill="none" stroke={color} stroke-width="1.5" opacity="0.3" />
                      <Index each={row().refs}>
                        {(ref, ri) => {
                          const rx = graphW() + 8 + ri * 130;
                          const tw = Math.min(ref().length * 7.2 + 16, 120);
                          return (
                            <g>
                              <rect x={rx} y={y - 9} width={tw} height={18} rx={4} fill={color} opacity="0.18" />
                              <text x={rx + 8} y={y + 4} fill={color} font-size="10" font-weight="700" font-family="Space Mono,monospace">
                                {ref().length > 14 ? ref().slice(0, 14) + "…" : ref()}
                              </text>
                            </g>
                          );
                        }}
                      </Index>
                      <text x={textX} y={y + 4} fill="var(--accent-color,#f59e0b)" font-size="11" font-family="Space Mono,monospace">
                        {row().hash.slice(0, 7)}
                      </text>
                      <foreignObject x={textX + 78} y={y - 10} width="300" height={ROW_H}>
                        <div
                          xmlns="http://www.w3.org/1999/xhtml"
                          style={{
                            "font-size": "12px",
                            color: "var(--text-color)",
                            "line-height": `${ROW_H}px`,
                            overflow: "hidden",
                            "text-overflow": "ellipsis",
                            "white-space": "nowrap",
                          }}
                          title={row().message}
                        >
                          {row().message}
                        </div>
                      </foreignObject>
                      <text x={textX + 394} y={y + 4} fill="var(--text-muted,#888)" font-size="11">
                        {row().author}{" · "}{formatTimestamp(row().timestamp)}
                      </text>
                    </g>
                  );
                }}
              </Index>
            </svg>
            <Show when={ctx.graphLoading()}>
              <div style={{ padding: "12px 16px", "font-size": "12px", color: "var(--text-muted,#888)", "text-align": "center" }}>
                Loading more commits…
              </div>
            </Show>
          </div>
        </div>
      </Show>
    </div>
  );
}
