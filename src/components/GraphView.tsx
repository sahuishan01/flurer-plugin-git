import { createSignal, createMemo, createEffect, onCleanup, Index, For, Show, onMount } from "solid-js";
import ForceGraph2D from "force-graph";
import ForceGraph3D from "3d-force-graph";
import { useGit } from "../context";
import { formatTimestamp } from "../utils";
import type { GitGraphEntry } from "../types";
import { EmptyState, Card, Button, CloseIcon, CommitContextMenu } from "./shared";
import { S } from "../styles";

const LANE_W = 16;
const ROW_H = 34;
const DOT_R = 4.5;
const LEGEND_H = 34;
const COLORS = ["#f59e0b", "#60a5fa", "#4ade80", "#f87171", "#c084fc", "#2dd4bf", "#fb923c", "#a78bfa"];

const GRAPH_CSS_ID = "flurer-git-graph-css";
const GRAPH_CSS = `
.flurer-git-row{transition:background .15s ease, box-shadow .15s ease;}
.flurer-git-row:hover{background:var(--control-bg, rgba(255,255,255,0.05));}
.flurer-git-chip{transition:filter .15s ease, transform .15s ease;}
.flurer-git-chip:hover{filter:brightness(1.18);transform:translateY(-1px);}
.flurer-git-merge{box-shadow:0 0 14px rgba(96,205,255,.18);}
.flurer-git-loadmore{transition:background .15s ease, border-color .15s ease, transform .15s ease;}
.flurer-git-loadmore:hover{background:var(--control-bg, rgba(255,255,255,0.06));transform:translateY(-1px);}
.flurer-git-lanechip{transition:filter .15s ease;}
.flurer-git-lanechip:hover{filter:brightness(1.15);}
.flurer-git-modebtn{transition:all .15s ease; cursor:pointer; padding:5px 11px; font-size:11px; font-weight:600; border-radius:6px; border:1px solid transparent; user-select:none;}
.flurer-git-modebtn:hover{filter:brightness(1.15);}
.flurer-git-modebtn-active{background:var(--accent-default, #f59e0b); color:#000; font-weight:700; border-color:var(--accent-default, #f59e0b);}
.flurer-git-modebtn-inactive{background:var(--control-bg, rgba(255,255,255,0.06)); color:var(--text-secondary, #a0a0a0); border-color:var(--border-subtle, rgba(255,255,255,0.1));}
@media (max-width:640px){.flurer-git-meta{display:none!important;}}
@media (max-width:480px){.flurer-git-refs{display:none!important;}}
@media (max-width:360px){.flurer-git-hash{display:none!important;}}
`;

export type GraphDisplayMode = "3d" | "2d" | "tree";
export type DagLayoutMode = "td" | "lr" | "radial" | "none";

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
  isMergeBranch: boolean;
  parentIndex: number;
}

interface GraphData {
  rows: GraphRow[];
  edges: GraphEdge[];
  laneCount: number;
  laneLabels: (string | null)[];
}

function buildGraph(entries: GitGraphEntry[]): GraphData {
  const lanes: (string | null)[] = [];
  const hashRow = new Map<string, number>();
  entries.forEach((e, i) => hashRow.set(e.hash, i));

  const rows: GraphRow[] = [];
  const edges: GraphEdge[] = [];

  const compactLanes = () => {
    while (lanes.length > 0 && lanes[lanes.length - 1] === null) {
      lanes.pop();
    }
  };

  const allocLane = (hash: string): number => {
    const existing = lanes.indexOf(hash);
    if (existing !== -1) return existing;
    const free = lanes.indexOf(null);
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
      for (let k = 1; k < expecting.length; k++) lanes[expecting[k]] = null;
      compactLanes();
    } else {
      lane = allocLane(e.hash);
    }

    rows.push({ ...e, lane });

    if (e.parents.length === 0) {
      lanes[lane] = null;
      compactLanes();
      return;
    }

    const p1 = e.parents[0];
    const existingP1 = lanes.indexOf(p1);
    let p1ViaLane: number;
    if (existingP1 !== -1 && existingP1 !== lane) {
      lanes[lane] = null;
      compactLanes();
      p1ViaLane = existingP1;
    } else {
      lanes[lane] = p1;
      p1ViaLane = lane;
    }
    edges.push({ fromRow: i, fromLane: lane, viaLane: p1ViaLane, toHash: e.parents[0], toRow: null, toLane: null, isMergeBranch: false, parentIndex: 0 });

    for (let k = 1; k < e.parents.length; k++) {
      const via = allocLane(e.parents[k]);
      edges.push({ fromRow: i, fromLane: lane, viaLane: via, toHash: e.parents[k], toRow: null, toLane: null, isMergeBranch: true, parentIndex: k });
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

  const laneLabels: (string | null)[] = new Array(laneCount).fill(null);
  for (const r of rows) {
    if (laneLabels[r.lane] === null) {
      for (const ref of r.refs) {
        const name = ref.replace("HEAD -> ", "").replace("HEAD, ", "");
        if (name && !name.startsWith("refs/") && !name.startsWith("tag:") && !name.startsWith("*")) {
          laneLabels[r.lane] = name;
          break;
        }
      }
    }
  }

  return { rows, edges, laneCount, laneLabels };
}

interface ForceNode {
  id: string;
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  timestamp: number;
  refs: string[];
  parents: string[];
  lane: number;
  rowIndex: number;
  color: string;
  val: number;
  matchesSearch: boolean;
  isMerge: boolean;
}

interface ForceLink {
  source: string;
  target: string;
  color: string;
  isMerge: boolean;
}

function buildForceGraphData(entries: GitGraphEntry[], searchQuery: string) {
  const gData = buildGraph(entries);
  const nodes: ForceNode[] = [];
  const links: ForceLink[] = [];
  const nodeMap = new Map<string, ForceNode>();

  const authorColors = new Map<string, string>();
  const getAuthorColor = (author: string) => {
    if (!authorColors.has(author)) {
      const idx = authorColors.size % COLORS.length;
      authorColors.set(author, COLORS[idx]);
    }
    return authorColors.get(author)!;
  };

  const query = searchQuery.trim().toLowerCase();

  gData.rows.forEach((r, i) => {
    const isMerge = r.parents.length > 1;
    const hasRef = r.refs.length > 0;
    const baseSize = hasRef ? 8 : (isMerge ? 6 : 4);
    const authorCol = getAuthorColor(r.author);

    const matchesSearch = query.length === 0 || (
      r.hash.toLowerCase().includes(query) ||
      r.message.toLowerCase().includes(query) ||
      r.author.toLowerCase().includes(query) ||
      r.refs.some(ref => ref.toLowerCase().includes(query))
    );

    const nodeColor = matchesSearch
      ? (isMerge ? "#60cdff" : authorCol)
      : "rgba(100, 116, 139, 0.2)";

    const node: ForceNode = {
      id: r.hash,
      hash: r.hash,
      shortHash: r.hash.slice(0, 7),
      message: r.message,
      author: r.author,
      timestamp: r.timestamp,
      refs: r.refs,
      parents: r.parents,
      lane: r.lane,
      rowIndex: i,
      color: nodeColor,
      val: query && matchesSearch ? baseSize * 1.6 : baseSize,
      matchesSearch,
      isMerge,
    };
    nodes.push(node);
    nodeMap.set(r.hash, node);
  });

  gData.edges.forEach((edge) => {
    const fromNode = nodeMap.get(gData.rows[edge.fromRow]?.hash);
    if (fromNode && edge.toHash && nodeMap.has(edge.toHash)) {
      links.push({
        source: fromNode.id,
        target: edge.toHash,
        color: edge.isMergeBranch ? "rgba(96, 205, 255, 0.65)" : "rgba(245, 158, 11, 0.45)",
        isMerge: edge.isMergeBranch,
      });
    }
  });

  return { nodes, links };
}

function lighten(hex: string, alpha: number): string {
  return `${hex}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`;
}

export function GraphView() {
  const ctx = useGit();
  const [displayMode, setDisplayMode] = createSignal<GraphDisplayMode>("3d");
  const [dagLayout, setDagLayout] = createSignal<DagLayoutMode>("td");
  const [searchQuery, setSearchQuery] = createSignal("");
  const [selectedHash, setSelectedHash] = createSignal<string | null>(null);
  const [menuPos, setMenuPos] = createSignal<{ x: number; y: number; hash: string } | null>(null);

  let graphContainerRef!: HTMLDivElement;
  let forceInstance: any = null;

  onMount(() => {
    if (ctx.graph().length === 0) ctx.loadGraph();
    if (!document.getElementById(GRAPH_CSS_ID)) {
      const st = document.createElement("style");
      st.id = GRAPH_CSS_ID;
      st.textContent = GRAPH_CSS;
      document.head.appendChild(st);
    }
  });

  onCleanup(() => {
    if (forceInstance) {
      if (typeof forceInstance._destructor === "function") {
        try { forceInstance._destructor(); } catch {}
      }
      forceInstance = null;
    }
  });

  // Render 3D WebGL / 2D Canvas force graph dynamically with DAG structure
  createEffect(() => {
    const mode = displayMode();
    const dagMode = dagLayout();
    const entries = ctx.graph();
    const query = searchQuery();
    const container = graphContainerRef;

    if (!container || mode === "tree") {
      if (forceInstance) {
        if (typeof forceInstance._destructor === "function") {
          try { forceInstance._destructor(); } catch {}
        }
        container.innerHTML = "";
        forceInstance = null;
      }
      return;
    }

    if (forceInstance) {
      if (typeof forceInstance._destructor === "function") {
        try { forceInstance._destructor(); } catch {}
      }
      container.innerHTML = "";
      forceInstance = null;
    }

    if (entries.length === 0) return;

    const data = buildForceGraphData(entries, query);

    if (mode === "3d") {
      const inst = ForceGraph3D()(container)
        .graphData(data)
        .nodeId("id")
        .nodeVal("val")
        .nodeColor((node: any) => node.color);

      if (dagMode !== "none") {
        if (dagMode === "radial") {
          inst.dagMode("radialout").dagLevelDistance(55);
        } else {
          inst.dagMode(dagMode).dagLevelDistance(45);
        }
      }

      inst
        .nodeLabel((node: any) => `
          <div style="background: rgba(15, 23, 42, 0.95); border: 1px solid rgba(255,255,255,0.18); padding: 8px 12px; border-radius: 8px; font-family: monospace; font-size: 11px; color: #fff; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
            <div style="color: #f59e0b; font-weight: bold;">${node.shortHash} ${node.isMerge ? '🔀 MERGE' : ''} ${node.refs && node.refs.length ? '<span style="color:#60cdff;">[' + node.refs.join(', ') + ']</span>' : ''}</div>
            <div style="margin: 4px 0; color: #f8fafc; font-weight: 500;">${node.message}</div>
            <div style="color: #94a3b8; font-size: 10px;">${node.author} • ${formatTimestamp(node.timestamp)}</div>
          </div>
        `)
        .linkDirectionalArrowLength(5)
        .linkDirectionalArrowRelPos(0.85)
        .linkDirectionalParticles((link: any) => link.isMerge ? 3 : 1)
        .linkDirectionalParticleWidth(1.8)
        .linkDirectionalParticleSpeed(0.005)
        .linkColor((link: any) => link.color)
        .backgroundColor("rgba(0,0,0,0)")
        .onNodeClick((node: any) => {
          if (!node) return;
          const distance = 45;
          const distRatio = 1 + distance / Math.hypot(node.x || 1, node.y || 1, node.z || 1);
          inst.cameraPosition(
            { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
            { x: node.x, y: node.y, z: node.z },
            1200
          );
          setSelectedHash(node.hash);
          ctx.showCommitDetail(node.hash);
        });

      forceInstance = inst;
    } else if (mode === "2d") {
      const inst = ForceGraph2D()(container)
        .graphData(data)
        .nodeId("id")
        .nodeVal("val")
        .nodeColor((node: any) => node.color);

      if (dagMode !== "none") {
        if (dagMode === "radial") {
          inst.dagMode("radialout").dagLevelDistance(55);
        } else {
          inst.dagMode(dagMode).dagLevelDistance(45);
        }
      }

      inst
        .nodeLabel((node: any) => `${node.shortHash}${node.isMerge ? ' 🔀 MERGE' : ''}: ${node.message} (${node.author})`)
        .linkDirectionalArrowLength(5)
        .linkDirectionalArrowRelPos(0.85)
        .linkDirectionalParticles((link: any) => link.isMerge ? 3 : 1)
        .linkDirectionalParticleWidth(1.8)
        .linkDirectionalParticleSpeed(0.005)
        .linkColor((link: any) => link.color)
        .backgroundColor("rgba(0,0,0,0)")
        .onNodeClick((node: any) => {
          if (!node) return;
          inst.centerAt(node.x, node.y, 800);
          inst.zoom(2.5, 800);
          setSelectedHash(node.hash);
          ctx.showCommitDetail(node.hash);
        });

      forceInstance = inst;
    }
  });

  const data = createMemo(() => buildGraph(ctx.graph()));

  const rowMaxLanes = createMemo(() => {
    const gData = data();
    const maxLanes = new Array(gData.rows.length).fill(0);
    gData.rows.forEach((r, i) => { maxLanes[i] = Math.max(maxLanes[i], r.lane); });
    gData.edges.forEach((e) => {
      const start = e.fromRow;
      const end = e.toRow !== null ? e.toRow : gData.rows.length - 1;
      for (let r = start; r <= end; r++) {
        if (r < maxLanes.length) {
          maxLanes[r] = Math.max(maxLanes[r], e.viaLane, e.fromLane);
          if (e.toLane !== null && r === end) maxLanes[r] = Math.max(maxLanes[r], e.toLane);
        }
      }
    });
    return maxLanes;
  });

  const laneW = () => data().laneCount * LANE_W;
  const rowsH = () => data().rows.length * ROW_H;
  const svgH = () => LEGEND_H + rowsH() + ROW_H;
  const bottomY = () => LEGEND_H + data().rows.length * ROW_H;
  const graphW = () => data().laneCount * LANE_W + 8;

  const laneX = (l: number) => l * LANE_W + LANE_W / 2;
  const rowY = (r: number) => LEGEND_H + r * ROW_H + ROW_H / 2;
  const laneColor = (l: number) => COLORS[l % COLORS.length];

  function handleScroll(e: Event) {
    const el = e.currentTarget as HTMLDivElement;
    if (!el || ctx.graphLoading() || !ctx.graphHasMore()) return;
    if (el.scrollTop > 50 && el.scrollHeight - el.scrollTop - el.clientHeight < 300) {
      ctx.loadMoreGraph();
    }
  }

  function handleRowClick(hash: string) {
    setSelectedHash(hash);
    ctx.showCommitDetail(hash);
  }

  function handleContextMenu(e: MouseEvent, hash: string) {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY, hash });
  }

  const edgePath = (e: GraphEdge): string => {
    const x1 = laneX(e.fromLane);
    const y1 = rowY(e.fromRow);
    const vx = laneX(e.viaLane);
    const y2 = e.toRow !== null ? rowY(e.toRow) : bottomY();
    const x2 = e.toLane !== null ? laneX(e.toLane) : vx;

    if (e.toRow !== null && e.toRow === e.fromRow + 1) {
      if (x1 === x2) {
        return `M ${x1} ${y1} L ${x2} ${y2}`;
      }
      if (vx === x1 || vx === x2) {
        return `M ${x1} ${y1} C ${x1} ${y1 + ROW_H / 2}, ${x2} ${y2 - ROW_H / 2}, ${x2} ${y2}`;
      }
      return `M ${x1} ${y1} C ${x1} ${y1 + ROW_H / 2}, ${vx} ${y1 + ROW_H / 2}, ${vx} ${y1 + ROW_H / 2} C ${vx} ${y1 + ROW_H / 2}, ${x2} ${y2 - ROW_H / 2}, ${x2} ${y2}`;
    }

    let d = `M ${x1} ${y1}`;

    if (vx !== x1) {
      d += ` C ${x1} ${y1 + ROW_H / 2}, ${vx} ${y1 + ROW_H / 2}, ${vx} ${y1 + ROW_H}`;
    } else {
      d += ` L ${vx} ${y1 + ROW_H}`;
    }

    if (y2 - ROW_H > y1 + ROW_H) {
      d += ` L ${vx} ${y2 - ROW_H}`;
    }

    if (x2 !== vx && e.toRow !== null) {
      d += ` C ${vx} ${y2 - ROW_H / 2}, ${x2} ${y2 - ROW_H / 2}, ${x2} ${y2}`;
    } else {
      d += ` L ${x2} ${y2}`;
    }

    return d;
  };

  return (
    <div style={{ display: "flex", "flex-direction": "column", height: "100%", width: "100%", overflow: "hidden", padding: "16px 20px", "box-sizing": "border-box" }}>
      {/* Dynamic Graph Toolbar */}
      <div style={{ display: "flex", "align-items": "center", "justify-content": "space-between", "margin-bottom": "12px", gap: "12px", "flex-wrap": "wrap", "flex-shrink": 0 }}>
        {/* Mode & DAG Selectors */}
        <div style={{ display: "flex", "align-items": "center", gap: "8px", "flex-wrap": "wrap" }}>
          {/* Mode Selector */}
          <div style={{ display: "flex", "align-items": "center", gap: "4px", background: "var(--control-bg, rgba(255,255,255,0.04))", padding: "4px", "border-radius": "8px", border: "1px solid var(--border-subtle, rgba(255,255,255,0.08))" }}>
            <button
              class={`flurer-git-modebtn ${displayMode() === "3d" ? "flurer-git-modebtn-active" : "flurer-git-modebtn-inactive"}`}
              onClick={() => setDisplayMode("3d")}
            >
              🌐 3D WebGL
            </button>
            <button
              class={`flurer-git-modebtn ${displayMode() === "2d" ? "flurer-git-modebtn-active" : "flurer-git-modebtn-inactive"}`}
              onClick={() => setDisplayMode("2d")}
            >
              🎨 2D Canvas
            </button>
            <button
              class={`flurer-git-modebtn ${displayMode() === "tree" ? "flurer-git-modebtn-active" : "flurer-git-modebtn-inactive"}`}
              onClick={() => setDisplayMode("tree")}
            >
              📜 Tree View
            </button>
          </div>

          {/* DAG Layout Selector (Only visible for 2D / 3D) */}
          <Show when={displayMode() !== "tree"}>
            <div style={{ display: "flex", "align-items": "center", gap: "4px", background: "var(--control-bg, rgba(255,255,255,0.04))", padding: "4px", "border-radius": "8px", border: "1px solid var(--border-subtle, rgba(255,255,255,0.08))" }}>
              <span style={{ "font-size": "10px", "font-weight": 700, color: "var(--text-secondary, #888)", "margin-left": "4px", "text-transform": "uppercase", "letter-spacing": "0.5px" }}>DAG Flow:</span>
              <button
                class={`flurer-git-modebtn ${dagLayout() === "td" ? "flurer-git-modebtn-active" : "flurer-git-modebtn-inactive"}`}
                onClick={() => setDagLayout("td")}
                title="Top-Down Chronological Branch DAG"
              >
                ⬇️ Top-Down
              </button>
              <button
                class={`flurer-git-modebtn ${dagLayout() === "lr" ? "flurer-git-modebtn-active" : "flurer-git-modebtn-inactive"}`}
                onClick={() => setDagLayout("lr")}
                title="Left-Right Horizontal Branch DAG"
              >
                ➡️ Left-Right
              </button>
              <button
                class={`flurer-git-modebtn ${dagLayout() === "radial" ? "flurer-git-modebtn-active" : "flurer-git-modebtn-inactive"}`}
                onClick={() => setDagLayout("radial")}
                title="Radial Spanning Graph"
              >
                🌀 Radial
              </button>
              <button
                class={`flurer-git-modebtn ${dagLayout() === "none" ? "flurer-git-modebtn-active" : "flurer-git-modebtn-inactive"}`}
                onClick={() => setDagLayout("none")}
                title="Unconstrained Physics Cloud"
              >
                🌌 Free
              </button>
            </div>
          </Show>
        </div>

        {/* Filter Input & Controls */}
        <div style={{ display: "flex", "align-items": "center", gap: "8px", flex: 1, "max-width": "360px" }}>
          <input
            type="text"
            placeholder="🔍 Search commits, authors, hashes..."
            value={searchQuery()}
            onInput={(e) => setSearchQuery(e.currentTarget.value)}
            style={{
              width: "100%",
              padding: "6px 12px",
              "font-size": "12px",
              "border-radius": "6px",
              border: "1px solid var(--border-subtle, rgba(255,255,255,0.12))",
              background: "var(--input-bg, rgba(0,0,0,0.2))",
              color: "var(--text-primary, #fff)",
              outline: "none",
            }}
          />
          <Show when={displayMode() !== "tree"}>
            <button
              onClick={() => {
                if (forceInstance && typeof forceInstance.zoomToFit === "function") {
                  forceInstance.zoomToFit(400, 20);
                }
              }}
              title="Recenter / Fit Graph"
              style={{
                padding: "6px 10px",
                "font-size": "11px",
                "font-weight": 600,
                "border-radius": "6px",
                border: "1px solid var(--border-subtle, rgba(255,255,255,0.12))",
                background: "var(--control-bg, rgba(255,255,255,0.06))",
                color: "var(--text-primary, #fff)",
                cursor: "pointer",
                "white-space": "nowrap",
              }}
            >
              🎯 Fit
            </button>
          </Show>
        </div>
      </div>

      <Show when={ctx.graph().length === 0}>
        <EmptyState message="Loading graph..." />
      </Show>

      {/* Force-directed Interactive 2D/3D Container */}
      <Show when={displayMode() !== "tree" && ctx.graph().length > 0}>
        <div style={{ flex: 1, width: "100%", position: "relative", overflow: "hidden", "border-radius": "10px", border: "1px solid var(--border-subtle, rgba(255,255,255,0.08))", background: "rgba(10, 14, 23, 0.6)" }}>
          <div ref={graphContainerRef} style={{ width: "100%", height: "100%" }} />
          <div style={{ position: "absolute", bottom: "10px", left: "14px", "font-size": "11px", color: "var(--text-secondary, rgba(255,255,255,0.5))", "pointer-events": "none", "font-family": "Space Mono, monospace" }}>
            {displayMode() === "3d" ? "Rotate: Drag • Zoom: Scroll • Pan: Right Click • Focus: Left Click Node" : "Pan: Drag • Zoom: Scroll • Focus: Click Node"}
          </div>
        </div>
      </Show>

      {/* Standard Git Tree View */}
      <Show when={displayMode() === "tree" && data().rows.length > 0}>
        <div onScroll={handleScroll} style={{ flex: 1, width: "100%", overflow: "auto" }}>
          <div class="flurer-git-tree" style={{ width: "100%", "min-width": `calc(${graphW() + 340}px)`, position: "relative", height: `${svgH()}px` }}>
            {/* Legend: lane → branch name */}
            <div class="flurer-git-legend" style={{ position: "absolute", left: 0, top: 0, width: "100%", height: `${LEGEND_H}px`, display: "flex", "align-items": "center", gap: "8px", padding: `0 14px 0 ${laneW() + 10}px`, "box-sizing": "border-box", overflow: "hidden", "border-bottom": "1px solid var(--border-subtle, rgba(255,255,255,0.06))" }}>
              <For each={data().laneLabels}>
                {(label, idx) => (
                  <Show when={label}>
                    <span class="flurer-git-lanechip" style={{ display: "inline-flex", "align-items": "center", gap: "6px", padding: "3px 10px", "border-radius": "999px", "font-size": "10.5px", "font-weight": 600, "font-family": "Space Mono,monospace", background: lighten(laneColor(idx()), 0.14), border: `1px solid ${lighten(laneColor(idx()), 0.4)}`, color: laneColor(idx()), "white-space": "nowrap", cursor: "default" }}>
                      <span style={{ width: "7px", height: "7px", "border-radius": "50%", background: laneColor(idx()), display: "inline-block", "flex-shrink": 0 }} />
                      {label}
                    </span>
                  </Show>
                )}
              </For>
            </div>

            {/* SVG layer: edges + dots + text */}
            <svg width="100%" height={svgH()} style={{ position: "absolute", left: 0, top: 0, display: "block" }}>
              <defs>
                <Index each={COLORS}>
                  {(color, idx) => (
                    <marker id={`merge-arrow-${idx}`} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={color()} />
                    </marker>
                  )}
                </Index>
              </defs>
              <Index each={data().edges}>
                {(edge) => {
                  const isMerge = () => edge().isMergeBranch || edge().parentIndex > 0;
                  const strokeCol = () => laneColor(edge().viaLane);
                  const markerId = () => `url(#merge-arrow-${edge().viaLane % COLORS.length})`;
                  return (
                    <path d={edgePath(edge())} fill="none" stroke={strokeCol()} stroke-width={isMerge() ? "2.5" : "2"} stroke-dasharray={isMerge() ? "5,3" : "none"} opacity={isMerge() ? "0.95" : "0.65"} stroke-linejoin="round" stroke-linecap="round" marker-start={isMerge() ? markerId() : undefined} />
                  );
                }}
              </Index>
              <Index each={data().rows}>
                {(row, i) => {
                  const y = rowY(i);
                  const cx = laneX(row().lane);
                  const color = laneColor(row().lane);
                  const maxLane = () => rowMaxLanes()[i] ?? row().lane;
                  const railsW = () => (maxLane() + 1) * LANE_W;
                  const refStart = () => railsW() + 8;
                  const textX = () => refStart() + (row().refs.length > 0 ? Math.min(row().refs.length, 3) * 130 : 0) + 6;
                  const isSelected = () => selectedHash() === row().hash;
                  const isMergeCommit = () => row().parents.length > 1;
                  const msgLeft = () => textX() + (isMergeCommit() ? 202 : 78);

                  return (
                    <g style={{ cursor: "pointer" }} onClick={() => handleRowClick(row().hash)} onContextMenu={(e) => handleContextMenu(e, row().hash)}>
                      <rect x="0" y={y - ROW_H / 2} width="100%" height={ROW_H} fill={isSelected() ? "rgba(245, 158, 11, 0.14)" : "transparent"} style={{ transition: "fill 0.15s" }} />

                      <Show when={isMergeCommit()}>
                        <circle cx={cx} cy={y} r={DOT_R + 4.5} fill="rgba(96, 205, 255, 0.25)" stroke={color} stroke-width="1.5" />
                        <polygon points={`${cx},${y - DOT_R - 2} ${cx + DOT_R + 2},${y} ${cx},${y + DOT_R + 2} ${cx - DOT_R - 2},${y}`} fill="var(--accent-default, #60cdff)" stroke="var(--option-bg, #000)" stroke-width="1.5" />
                      </Show>
                      <Show when={!isMergeCommit()}>
                        <circle cx={cx} cy={y} r={DOT_R} fill={color} stroke="var(--panel-bg,#1a1a2e)" stroke-width="2" />
                        <circle cx={cx} cy={y} r={DOT_R + 2.5} fill="none" stroke={color} stroke-width="1.5" opacity={isSelected() ? "0.8" : "0.3"} />
                      </Show>

                      <Index each={row().refs}>
                        {(ref, ri) => {
                          const rx = refStart() + ri * 130;
                          const tw = Math.min(ref().length * 7.2 + 16, 120);
                          return (
                            <g>
                              <rect x={rx} y={y - 9} width={tw} height={18} rx={4} fill={lighten(color, 0.22)} stroke={color} stroke-width="1" />
                              <text class="flurer-git-refs" x={rx + 8} y={y + 4} fill={color} font-size="10" font-weight="700" font-family="Space Mono,monospace">
                                {ref().length > 14 ? ref().slice(0, 14) + "…" : ref()}
                              </text>
                            </g>
                          );
                        }}
                      </Index>

                      <text class="flurer-git-hash" x={textX()} y={y + 4} fill="var(--accent-default, var(--accent-color,#f59e0b))" font-size="11" font-family="Space Mono,monospace" style={{ "text-shadow": "var(--text-shadow)" }}>
                        {row().hash.slice(0, 7)}
                      </text>

                      <Show when={isMergeCommit()}>
                        <g>
                          <rect x={textX() + 65} y={y - 9} width="128" height="17" rx="4" fill="rgba(96, 205, 255, 0.22)" stroke="rgba(96, 205, 255, 0.45)" />
                          <text x={textX() + 71} y={y + 3} fill="var(--accent-default, #60cdff)" font-size="10" font-weight="700" font-family="Space Mono,monospace" style={{ "text-shadow": "var(--text-shadow)" }}>
                            {"🔀 MERGE ("}{row().parents[1].slice(0, 5)}{"➔"}{row().parents[0].slice(0, 5)}{")"}
                          </text>
                        </g>
                      </Show>

                      <foreignObject x={msgLeft()} y={y - 10} width={`calc(100% - ${msgLeft() + 24}px)`} height={ROW_H}>
                        <div xmlns="http://www.w3.org/1999/xhtml" style={{ display: "flex", "align-items": "center", gap: "10px", width: "100%", height: "100%" }}>
                          <div style={{ flex: 1, "min-width": 0, "font-size": "12px", color: isSelected() ? "var(--accent-default, var(--accent-color, #f59e0b))" : "var(--text-primary, var(--text-color))", "font-weight": isSelected() ? "600" : "400", "text-shadow": "var(--text-shadow)", "white-space": "nowrap", overflow: "hidden", "text-overflow": "ellipsis" }} title={row().message}>
                            {row().message}
                          </div>
                          <div class="flurer-git-meta" style={{ flex: "0 0 auto", "white-space": "nowrap", "font-size": "11px", color: "var(--text-secondary, #c0c0c0)", "text-shadow": "var(--text-shadow)" }}>
                            {row().author}{row().committer && row().committer !== row().author ? ` · ${row().committer}` : ""}{" · "}{formatTimestamp(row().timestamp)}
                          </div>
                        </div>
                      </foreignObject>
                    </g>
                  );
                }}
              </Index>
            </svg>
          </div>

          <Show when={ctx.graphHasMore() && !ctx.graphLoading()}>
            <div class="flurer-git-loadmore" onClick={() => ctx.loadMoreGraph()} style={{ margin: "10px auto 0", padding: "7px 18px", "font-size": "11px", "font-weight": 600, color: "var(--accent-default, var(--accent-color,#f59e0b))", "text-align": "center", cursor: "pointer", "user-select": "none", "border-radius": "999px", border: "1px solid rgba(245,158,11,0.35)", background: "rgba(245,158,11,0.08)", width: "max-content" }}>
              Load older commits ↓
            </div>
          </Show>
          <Show when={ctx.graphLoading()}>
            <div style={{ padding: "10px 16px", "font-size": "12px", color: "var(--text-secondary,#888)", "text-align": "center" }}>
              Loading more commits…
            </div>
          </Show>
        </div>
      </Show>

      {/* Selected Commit Detail Drawer */}
      <Show when={ctx.commitDetail()}>
        <div style={{ "margin-top": "12px", "flex-shrink": 0 }}>
          <Card>
            <div style={S.cardHeader}>
              <div style={{ display: "flex", "align-items": "center", gap: "8px" }}>
                <span style={{ "font-weight": 600, color: "var(--text-primary, var(--text-color))", "text-shadow": "var(--text-shadow)" }}>Commit Details</span>
                <code style={{ color: "var(--accent-default, var(--accent-color, #f59e0b))", "font-family": "Space Mono, monospace", "font-size": "12px" }}>
                  {ctx.commitDetail()!.hash.slice(0, 7)}
                </code>
              </div>
              <div style={{ display: "flex", gap: "8px", "align-items": "center" }}>
                <Button size="sm" variant="primary" onClick={() => {
                  const d = ctx.commitDetail();
                  if (d) ctx.openDiffPrompt(d.hash);
                }}>View Diff</Button>
                <Button size="sm" onClick={() => {
                  ctx.closeCommitDetail();
                  setSelectedHash(null);
                }}>✕</Button>
              </div>
            </div>

            <div style={{ "font-size": "13px", "line-height": "1.5" }}>
              <div style={{ "white-space": "pre-wrap", "font-weight": 500, "margin-bottom": "8px", color: "var(--text-primary, var(--text-color))", "text-shadow": "var(--text-shadow)", "word-break": "break-word" }}>
                {ctx.commitDetail()!.message}
              </div>

              <Show when={ctx.commitDetail()!.parent_hashes.length > 1}>
                <div style={{ background: "linear-gradient(135deg, rgba(96,205,255,0.14), rgba(129,140,248,0.12))", border: "1px solid rgba(96,205,255,0.3)", padding: "10px 14px", "border-radius": "10px", margin: "10px 0", "box-shadow": "0 2px 10px rgba(0,0,0,0.12)" }}>
                  <div style={{ display: "flex", "align-items": "center", gap: "6px", "font-weight": 600, "font-size": "12px", color: "var(--accent-default, #60cdff)", "text-shadow": "var(--text-shadow)" }}>
                    🔀 Merge Commit Breakdown
                  </div>
                  <div style={{ "font-size": "12px", margin: "6px 0 2px", color: "var(--text-primary, var(--text-color))", "text-shadow": "var(--text-shadow)", display: "flex", "align-items": "center", gap: "6px", "flex-wrap": "wrap" }}>
                    <span>Merging <strong>Source Branch</strong></span>
                    <code style={{ background: "rgba(74, 222, 128, 0.2)", color: "#4ade80", padding: "2px 6px", "border-radius": "6px", "font-family": "Space Mono, monospace", "font-size": "11px" }}>
                      {ctx.commitDetail()!.parent_hashes[1].slice(0, 7)}
                    </code>
                    <span style={{ "font-weight": 700 }}>➔ Into Target/Base Branch</span>
                    <code style={{ background: "rgba(96, 165, 250, 0.2)", color: "#60a5fa", padding: "2px 6px", "border-radius": "6px", "font-family": "Space Mono, monospace", "font-size": "11px" }}>
                      {ctx.commitDetail()!.parent_hashes[0].slice(0, 7)}
                    </code>
                  </div>
                </div>
              </Show>

              <div style={{ display: "flex", "flex-wrap": "wrap", gap: "16px", "font-size": "11px", color: "var(--text-secondary, #888)", "border-top": "1px solid var(--border-subtle, rgba(255,255,255,0.06))", "padding-top": "8px" }}>
                <div><strong>Author:</strong> {ctx.commitDetail()!.author} &lt;{ctx.commitDetail()!.email}&gt;</div>
                <div><strong>Date:</strong> {formatTimestamp(ctx.commitDetail()!.timestamp)}</div>
                <div><strong>Full Hash:</strong> <code style={{ "font-family": "Space Mono, monospace" }}>{ctx.commitDetail()!.hash}</code></div>
              </div>
            </div>
          </Card>
        </div>
      </Show>

      {/* Right-click Context Menu */}
      <Show when={menuPos()}>
        <CommitContextMenu x={menuPos()!.x} y={menuPos()!.y} hash={menuPos()!.hash} onClose={() => setMenuPos(null)} />
      </Show>
    </div>
  );
}