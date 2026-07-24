import { createMemo, For, Index, Show, onMount } from "solid-js";
import { useGit } from "../context";
import { formatTimestamp, surfaceBg } from "../utils";
import { EmptyState } from "./shared";
import { S } from "../styles";

const LANE_WIDTH = 24;
const ROW_HEIGHT = 36;
const DOT_RADIUS = 5;
const BRANCH_COLORS = ["#f59e0b", "#60a5fa", "#4ade80", "#f87171", "#c084fc", "#2dd4bf", "#fb923c", "#a78bfa"];

interface GraphRow {
  hash: string;
  message: string;
  author: string;
  timestamp: number;
  parents: string[];
  refs: string[];
  lane: number;
  mergeLane: number;
}

function assignLanes(entries: { hash: string; parents: string[]; refs: string[]; message: string; author: string; timestamp: number }[]): GraphRow[] {
  const lanes: (string | null)[] = [];
  const commitLane = new Map<string, number>();

  return entries.map((entry) => {
    let lane = -1;
    for (let i = 0; i < lanes.length; i++) {
      if (lanes[i] && entry.parents.includes(lanes[i]!)) {
        lane = i;
        break;
      }
    }
    if (lane === -1) {
      lane = lanes.findIndex((l) => l === null);
      if (lane === -1) {
        lane = lanes.length;
        lanes.push(null);
      }
    }
    commitLane.set(entry.hash, lane);

    const mergeLane = entry.parents.length > 1
      ? (commitLane.get(entry.parents[1]) ?? -1)
      : -1;

    lanes[lane] = entry.hash;

    return { ...entry, lane, mergeLane };
  });
}

export function GraphView() {
  const ctx = useGit();

  onMount(() => {
    if (ctx.graph().length === 0) {
      ctx.loadGraph();
    }
  });

  const rows = createMemo(() => assignLanes(ctx.graph()));
  const maxLanes = createMemo(() => {
    const r = rows();
    let max = 0;
    for (const row of r) {
      if (row.lane + 1 > max) max = row.lane + 1;
      if (row.mergeLane + 1 > max) max = row.mergeLane + 1;
    }
    return Math.max(max, 1);
  });

  const graphWidth = createMemo(() => maxLanes() * LANE_WIDTH + 8);

  function laneColor(lane: number): string {
    return BRANCH_COLORS[lane % BRANCH_COLORS.length];
  }

  return (
    <div style={{ padding: "16px 24px", background: surfaceBg(0.04), height: "100%" }}>
      <Show when={rows().length === 0}>
        <EmptyState message="Loading graph..." />
      </Show>

      <Show when={rows().length > 0}>
        <div style={{ overflow: "auto", background: surfaceBg(0.04) }}>
          <div style={{ "min-width": `${graphWidth() + 700}px` }}>
          <svg
            width={graphWidth() + 700}
            height={rows().length * ROW_HEIGHT + 20}
            style={{ "font-family": "Space Mono, monospace", "font-size": "12px", display: "block" }}
          >
            <Index each={rows()}>
              {(row, i) => {
                const y = i * ROW_HEIGHT + ROW_HEIGHT / 2;
                const cx = row().lane * LANE_WIDTH + LANE_WIDTH / 2;
                return (
                  <g>
                    {/* Vertical lane lines */}
                    <Index each={Array.from({ length: maxLanes() }, (_, j) => j)}>
                      {(laneIdx, li) => {
                        const x = li * LANE_WIDTH + LANE_WIDTH / 2;
                        return (
                          <line
                            x1={x}
                            y1={y - ROW_HEIGHT / 2}
                            x2={x}
                            y2={y + ROW_HEIGHT / 2}
                            stroke={laneColor(li)}
                            stroke-width="2"
                            opacity="0.3"
                          />
                        );
                      }}
                    </Index>

                    {/* Merge line */}
                    <Show when={row().mergeLane >= 0 && row().mergeLane !== row().lane}>
                      <line
                        x1={row().mergeLane * LANE_WIDTH + LANE_WIDTH / 2}
                        y1={y}
                        x2={cx}
                        y2={y}
                        stroke={laneColor(row().mergeLane)}
                        stroke-width="2"
                        opacity="0.5"
                      />
                    </Show>

                    {/* Commit dot */}
                    <circle
                      cx={cx}
                      cy={y}
                      r={DOT_RADIUS}
                      fill={laneColor(row().lane)}
                      stroke="var(--panel-bg, #1a1a2e)"
                      stroke-width="2"
                    />

                    {/* Ref labels — rendered as badge + text */}
                    <Index each={row().refs}>
                      {(ref, ri) => (
                        <g>
                          <rect
                            x={graphWidth() + 8 + ri * 120}
                            y={y - 8}
                            width={Math.min(ref().length * 7 + 14, 110)}
                            height={16}
                            rx={3}
                            fill={laneColor(row().lane)}
                            opacity="0.2"
                          />
                          <text
                            x={graphWidth() + 15 + ri * 120}
                            y={y + 4}
                            fill={laneColor(row().lane)}
                            font-size="10"
                            font-weight="600"
                          >
                            {ref().length > 12 ? ref().slice(0, 12) + "…" : ref()}
                          </text>
                        </g>
                      )}
                    </Index>

                    {/* Commit hash */}
                    <text
                      x={graphWidth() + 10 + Math.min(row().refs.length, 4) * 120}
                      y={y + 4}
                      fill="var(--accent-color, #f59e0b)"
                      font-size="11"
                      font-family="Space Mono, monospace"
                    >
                      {row().hash.slice(0, 7)}
                    </text>

                    {/* Commit message — foreignObject for natural text overflow */}
                    <foreignObject
                      x={graphWidth() + 100 + Math.min(row().refs.length, 4) * 120}
                      y={y - 10}
                      width={320}
                      height={ROW_HEIGHT - 4}
                    >
                      <div
                        xmlns="http://www.w3.org/1999/xhtml"
                        style={{
                          "font-size": "12px",
                          color: "var(--text-color)",
                          "line-height": `${ROW_HEIGHT - 4}px`,
                          overflow: "hidden",
                          "text-overflow": "ellipsis",
                          "white-space": "nowrap",
                        }}
                        title={row().message}
                      >
                        {row().message}
                      </div>
                    </foreignObject>

                    {/* Author + time */}
                    <text
                      x={graphWidth() + 430 + Math.min(row().refs.length, 4) * 120}
                      y={y + 4}
                      fill="var(--text-muted, #888)"
                      font-size="11"
                    >
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
