import { createMemo, Index, Show, onMount } from "solid-js";
import { useGit } from "../context";
import { formatTimestamp, surfaceBg } from "../utils";
import { EmptyState } from "./shared";
import { S } from "../styles";

const LANE_W = 24;
const ROW_H = 36;
const DOT_R = 5;
const BRANCH_COLORS = ["#f59e0b", "#60a5fa", "#4ade80", "#f87171", "#c084fc", "#2dd4bf", "#fb923c", "#a78bfa"];

interface GraphRow {
  hash: string; message: string; author: string; timestamp: number;
  parents: string[]; refs: string[]; lane: number; mergeLane: number;
}

/** Assign each commit to a lane, tracking which lane each parent hash occupies. */
function assignLanes(
  entries: { hash: string; parents: string[]; refs: string[]; message: string; author: string; timestamp: number }[]
): GraphRow[] {
  const lanes: (string | null)[] = [];
  const commitLane = new Map<string, number>();

  return entries.map((entry) => {
    let lane = -1;
    // Try to continue in a lane where the first parent already sits
    for (let i = 0; i < lanes.length; i++) {
      if (lanes[i] && entry.parents.includes(lanes[i]!)) {
        lane = i;
        break;
      }
    }
    if (lane === -1) {
      lane = lanes.findIndex((l) => l === null);
      if (lane === -1) { lane = lanes.length; lanes.push(null); }
    }
    commitLane.set(entry.hash, lane);
    const mergeLane = entry.parents.length > 1
      ? (commitLane.get(entry.parents[1]) ?? -1) : -1;
    lanes[lane] = entry.hash;
    return { ...entry, lane, mergeLane };
  });
}

export function GraphView() {
  const ctx = useGit();
  onMount(() => { if (ctx.graph().length === 0) ctx.loadGraph(); });

  const rows = createMemo(() => assignLanes(ctx.graph()));
  const maxLanes = createMemo(() => {
    let max = 0;
    for (const r of rows()) {
      if (r.lane + 1 > max) max = r.lane + 1;
      if (r.mergeLane + 1 > max) max = r.mergeLane + 1;
    }
    return Math.max(max, 1);
  });
  const gw = () => maxLanes() * LANE_W + 8;
  const color = (l: number) => BRANCH_COLORS[l % BRANCH_COLORS.length];

  // Build a hash→row-index lookup for parent-connection lines
  const hashRow = createMemo(() => {
    const map = new Map<string, number>();
    rows().forEach((r, i) => map.set(r.hash, i));
    return map;
  });

  return (
    <div style={{ padding: "16px 24px", background: surfaceBg(0.04), height: "100%" }}>
      <Show when={rows().length === 0}><EmptyState message="Loading graph..." /></Show>
      <Show when={rows().length > 0}>
        <div style={{ overflow: "auto", background: surfaceBg(0.04) }}>
          <div style={{ "min-width": `${gw() + 700}px` }}>
          <svg width={gw() + 700} height={rows().length * ROW_H + 20}
               style={{ "font-family": "Space Mono, monospace", "font-size": "12px", display: "block" }}>
            <Index each={rows()}>
              {(row, i) => {
                const y = i * ROW_H + ROW_H / 2;
                const cx = row().lane * LANE_W + LANE_W / 2;

                // Parent connection: line from this commit UP to its first parent
                const parentLines: JSX.Element[] = [];
                const addedLanes = new Set<number>();

                if (row().parents.length > 0) {
                  const pRow = hashRow().get(row().parents[0]);
                  if (pRow !== undefined && pRow > i) {
                    const py = pRow * ROW_H + ROW_H / 2;
                    const px = rows()[pRow].lane * LANE_W + LANE_W / 2;
                    if (px === cx) {
                      // Same lane — straight vertical line
                      parentLines.push(
                        <line x1={cx} y1={y - DOT_R - 1} x2={cx} y2={py + DOT_R + 1}
                              stroke={color(row().lane)} stroke-width="2" opacity="0.6" />
                      );
                    } else {
                      // Different lane — angled line
                      const midY = (y + py) / 2;
                      parentLines.push(
                        <polyline
                          points={`${cx},${y - DOT_R - 1} ${cx},${midY} ${px},${midY} ${px},${py + DOT_R + 1}`}
                          fill="none" stroke={color(row().lane)} stroke-width="2" opacity="0.6"
                          stroke-linejoin="round"
                        />
                      );
                    }
                    addedLanes.add(row().lane);
                  }
                }

                // Merge line from secondary parent
                if (row().mergeLane >= 0 && row().mergeLane !== row().lane) {
                  const mpRow = hashRow().get(row().parents[1]);
                  if (mpRow !== undefined && mpRow > i) {
                    const mpy = mpRow * ROW_H + ROW_H / 2;
                    const mpx = rows()[mpRow].lane * LANE_W + LANE_W / 2;
                    parentLines.push(
                      <polyline
                        points={`${mpx},${mpy + DOT_R + 1} ${mpx},${(mpy + y) / 2} ${cx},${(mpy + y) / 2} ${cx},${y - DOT_R - 1}`}
                        fill="none" stroke={color(row().mergeLane)} stroke-width="2" opacity="0.4"
                        stroke-linejoin="round" stroke-dasharray="4,3"
                      />
                    );
                  }
                }

                // T-shaped terminal line at the BOTTOM end of each lane
                const laneEnd: JSX.Element[] = [];
                if (i === rows().length - 1) {
                  for (let l = 0; l < maxLanes(); l++) {
                    const lx = l * LANE_W + LANE_W / 2;
                    laneEnd.push(
                      <line x1={lx - 5} y1={y + DOT_R + 1} x2={lx + 5} y2={y + DOT_R + 1}
                            stroke={color(l)} stroke-width="2" opacity="0.4" />
                    );
                  }
                }

                return (
                  <g>
                    {/* Connection lines (drawn before dots so dots sit on top) */}
                    {parentLines}

                    {/* Lane-end markers */}
                    {laneEnd}

                    {/* Merge horizontal line on this row */}
                    <Show when={row().mergeLane >= 0 && row().mergeLane !== row().lane}>
                      <line x1={row().mergeLane * LANE_W + LANE_W / 2} y1={y}
                            x2={cx} y2={y}
                            stroke={color(row().mergeLane)} stroke-width="2" opacity="0.5" />
                    </Show>

                    {/* Commit dot */}
                    <circle cx={cx} cy={y} r={DOT_R}
                            fill={color(row().lane)}
                            stroke="var(--panel-bg, #1a1a2e)" stroke-width="2" />

                    {/* Ref labels */}
                    <Index each={row().refs}>
                      {(ref, ri) => (
                        <g>
                          <rect x={gw() + 8 + ri * 120} y={y - 8}
                                width={Math.min(ref().length * 7 + 14, 110)} height={16}
                                rx={3} fill={color(row().lane)} opacity="0.2" />
                          <text x={gw() + 15 + ri * 120} y={y + 4}
                                fill={color(row().lane)} font-size="10" font-weight="600">
                            {ref().length > 12 ? ref().slice(0, 12) + "…" : ref()}
                          </text>
                        </g>
                      )}
                    </Index>

                    {/* Commit hash */}
                    <text x={gw() + 10 + Math.min(row().refs.length, 4) * 120} y={y + 4}
                          fill="var(--accent-color, #f59e0b)" font-size="11"
                          font-family="Space Mono, monospace">
                      {row().hash.slice(0, 7)}
                    </text>

                    {/* Commit message */}
                    <foreignObject x={gw() + 100 + Math.min(row().refs.length, 4) * 120}
                                   y={y - 10} width={320} height={ROW_H - 4}>
                      <div xmlns="http://www.w3.org/1999/xhtml"
                           style={{ "font-size": "12px", color: "var(--text-color)",
                                    "line-height": `${ROW_H - 4}px`, overflow: "hidden",
                                    "text-overflow": "ellipsis", "white-space": "nowrap" }}
                           title={row().message}>{row().message}</div>
                    </foreignObject>

                    {/* Author + time */}
                    <text x={gw() + 430 + Math.min(row().refs.length, 4) * 120} y={y + 4}
                          fill="var(--text-muted, #888)" font-size="11">
                      {row().author.length > 18 ? row().author.slice(0, 18) + "…" : row().author} · {formatTimestamp(row().timestamp)}
                    </text>
                  </g>
                );
              }}
            </Index>
          </svg>
          </div>
        </div>
      </Show>
    </div>
  );
}
