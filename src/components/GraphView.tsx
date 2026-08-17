import { createSignal, createMemo, createEffect, onCleanup, Index, For, Show, onMount } from "solid-js";
import ForceGraph2D from "force-graph";
import ForceGraph3D from "3d-force-graph";
import * as THREE from "three";
import { useGit } from "../context";
import {
  formatTimestamp, getGraphPanSpeed, getGraphZoomSpeed, getGraphRotateSpeed,
  getGraphFocusZoomStep, getGraphFocusTransitionTime,
  getSavedGraphDisplayMode, saveGraphDisplayMode,
  getSavedDagLayout, saveDagLayout,
} from "../utils";
import type { GitGraphEntry } from "../types";
import { EmptyState, Card, Button, CloseIcon, CommitContextMenu } from "./shared";
import { S } from "../styles";

const LANE_W = 16;
const ROW_H = 34;
const DOT_R = 4.5;
const LEGEND_H = 34;
const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#a855f7", "#14b8a6", "#f97316", "#8b5cf6"];

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
  isBranchTip?: boolean;
  isBranchRoot?: boolean;
  x?: number;
  y?: number;
  z?: number;
}

interface ForceLink {
  source: string;
  target: string;
  color: string;
  isMerge: boolean;
  lane: number;
}

function buildForceGraphData(entries: GitGraphEntry[], searchQuery: string) {
  const gData = buildGraph(entries);
  const nodes: ForceNode[] = [];
  const links: ForceLink[] = [];
  const nodeMap = new Map<string, ForceNode>();

  const query = searchQuery.trim().toLowerCase();

  // Identify child/parent references to locate branch ending tips
  const isParentOfAny = new Set<string>();
  gData.rows.forEach((r) => {
    r.parents.forEach((p) => isParentOfAny.add(p));
  });

  gData.rows.forEach((r, i) => {
    const isMerge = r.parents.length > 1;
    const hasRef = r.refs.length > 0;
    const isLeaf = !isParentOfAny.has(r.hash);
    const isBranchTip = hasRef || isLeaf;
    const isBranchRoot = r.parents.length === 0;
    const baseSize = isBranchTip ? 9 : (hasRef ? 8 : (isMerge ? 6 : 4));
    
    // Vibrant & High-Contrast Branch Lane Colors
    const branchColor = COLORS[r.lane % COLORS.length];

    const matchesSearch = query.length === 0 || (
      r.hash.toLowerCase().includes(query) ||
      r.message.toLowerCase().includes(query) ||
      r.author.toLowerCase().includes(query) ||
      r.refs.some(ref => ref.toLowerCase().includes(query))
    );

    const nodeColor = matchesSearch
      ? (isMerge ? "#38bdf8" : branchColor)
      : "rgba(148, 163, 184, 0.4)";

    // Initial column separation by branch lane
    const columnX = (r.lane - (gData.laneCount - 1) / 2) * 70;
    const depthZ = (r.lane % 2 === 0 ? 1 : -1) * (r.lane * 15);

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
      val: query && matchesSearch ? baseSize * 1.5 : baseSize,
      matchesSearch,
      isMerge,
      isBranchTip,
      isBranchRoot,
      x: columnX,
      z: depthZ,
    };
    nodes.push(node);
    nodeMap.set(r.hash, node);
  });

  // Flow: Parent (Older) ➔ Child (Newer)
  gData.edges.forEach((edge) => {
    const fromNode = nodeMap.get(gData.rows[edge.fromRow]?.hash);
    if (fromNode && edge.toHash && nodeMap.has(edge.toHash)) {
      const linkColor = edge.isMergeBranch
        ? "rgba(56, 189, 248, 0.85)"
        : COLORS[edge.viaLane % COLORS.length];

      links.push({
        source: edge.toHash, // Parent
        target: fromNode.id, // Child
        color: linkColor,
        isMerge: edge.isMergeBranch,
        lane: edge.viaLane,
      });
    }
  });

  return { nodes, links, laneCount: gData.laneCount, laneLabels: gData.laneLabels };
}

// Shared, zero-allocation 3D Geometry and Material cache to prevent memory & GC lag
const sharedSphereGeo = new THREE.SphereGeometry(1, 10, 10);
const sharedOctaGeo = new THREE.OctahedronGeometry(1, 0);
const sharedBeaconGeo = new THREE.RingGeometry(1.6, 2.2, 24);
const materialCache = new Map<string, THREE.MeshStandardMaterial>();
const beaconMaterialCache = new Map<string, THREE.MeshBasicMaterial>();
const spriteMaterialCache = new Map<string, THREE.SpriteMaterial>();

function getSharedMaterial(color: string): THREE.MeshStandardMaterial {
  if (!materialCache.has(color)) {
    materialCache.set(color, new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.35,
      roughness: 0.3,
      metalness: 0.1,
    }));
  }
  return materialCache.get(color)!;
}

function getSharedBeaconMaterial(color: string): THREE.MeshBasicMaterial {
  if (!beaconMaterialCache.has(color)) {
    beaconMaterialCache.set(color, new THREE.MeshBasicMaterial({
      color: color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.55,
    }));
  }
  return beaconMaterialCache.get(color)!;
}

function getBadgeSpriteMaterial(text: string, color: string): THREE.SpriteMaterial | null {
  const key = `${text}|${color}`;
  if (!spriteMaterialCache.has(key)) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    canvas.width = 512;
    canvas.height = 112;

    ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
    ctx.strokeStyle = color || "#38bdf8";
    ctx.lineWidth = 5;
    if (typeof ctx.roundRect === "function") {
      ctx.roundRect(6, 8, canvas.width - 12, canvas.height - 16, 22);
    } else {
      ctx.rect(6, 8, canvas.width - 12, canvas.height - 16);
    }
    ctx.fill();
    ctx.stroke();

    ctx.font = "bold 34px Space Mono, monospace";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const displayText = text.length > 25 ? text.slice(0, 25) + "…" : text;
    ctx.fillText(displayText, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
    spriteMaterialCache.set(key, spriteMaterial);
  }
  return spriteMaterialCache.get(key) || null;
}

function createNode3DSprite(node: ForceNode): THREE.Object3D {
  const group = new THREE.Group();

  const radius = Math.max(3.5, Math.sqrt(Math.max(0, node.val || 4)) * 1.4);
  const mesh = new THREE.Mesh(
    node.isMerge ? sharedOctaGeo : sharedSphereGeo,
    getSharedMaterial(node.color || "#f59e0b")
  );
  mesh.scale.set(radius, radius, radius);
  group.add(mesh);

  const isBranchEnd = node.isBranchTip || (node.refs && node.refs.length > 0);

  // Outer Glowing Beacon Ring for Branch Ending Nodes
  if (isBranchEnd) {
    const beaconMesh = new THREE.Mesh(
      sharedBeaconGeo,
      getSharedBeaconMaterial(node.color || "#38bdf8")
    );
    beaconMesh.scale.set(radius, radius, 1);
    group.add(beaconMesh);
  }

  // Floating 3D Branch / Tag Badge Sprite
  if (node.refs && node.refs.length > 0) {
    const labels = node.refs.map(r => r.replace("HEAD -> ", "").replace("HEAD, ", ""));
    const text = labels.join(" • ");
    const spriteMaterial = getBadgeSpriteMaterial(text, node.color || "#38bdf8");
    if (spriteMaterial) {
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.set(0, radius + 15, 0);
      sprite.scale.set(58, 14.5, 1);
      group.add(sprite);
    }
  } else if (node.isBranchTip) {
    // Un-tagged branch tip commit
    const text = `Tip: ${node.shortHash}`;
    const spriteMaterial = getBadgeSpriteMaterial(text, node.color || "#38bdf8");
    if (spriteMaterial) {
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.set(0, radius + 13, 0);
      sprite.scale.set(44, 11, 1);
      group.add(sprite);
    }
  }

  group.userData = { isNodeGroup: true, node, baseRadius: radius };
  return group;
}

function lighten(hex: string, alpha: number): string {
  return `${hex}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`;
}

export function GraphView() {
  const ctx = useGit();
  const [displayMode, _setDisplayMode] = createSignal<GraphDisplayMode>(getSavedGraphDisplayMode());
  const [dagLayout, _setDagLayout] = createSignal<DagLayoutMode>(getSavedDagLayout());

  function setDisplayMode(mode: GraphDisplayMode) {
    _setDisplayMode(mode);
    saveGraphDisplayMode(mode);
  }

  function setDagLayout(layout: DagLayoutMode) {
    _setDagLayout(layout);
    saveDagLayout(layout);
  }

  const [searchQuery, setSearchQuery] = createSignal("");
  const [selectedHash, setSelectedHash] = createSignal<string | null>(null);
  const [hoveredNode, setHoveredNode] = createSignal<ForceNode | null>(null);
  const [menuPos, setMenuPos] = createSignal<{ x: number; y: number; hash: string } | null>(null);

  const [scrollTop, setScrollTop] = createSignal(0);
  const [viewportH, setViewportH] = createSignal(700);

  let graphContainerRef!: HTMLDivElement;
  let treeContainerRef: HTMLDivElement | undefined;
  let forceInstance: any = null;
  let mousePos: { x: number; y: number; inContainer: boolean } = { x: 0, y: 0, inContainer: false };

  function focusOnNode(node: ForceNode, zoomRatio?: number, customDuration?: number) {
    if (!node || !forceInstance) return;
    const mode = displayMode();
    const duration = customDuration ?? getGraphFocusTransitionTime();
    const zoomStep = zoomRatio ?? getGraphFocusZoomStep();

    if (mode === "3d" && forceInstance.camera) {
      const camera = forceInstance.camera();
      const controls = forceInstance.controls ? forceInstance.controls() : null;
      const nx = node.x || 0;
      const ny = node.y || 0;
      const nz = node.z || 0;

      // Calculate camera offset relative to the node, zooming in by configured zoomStep
      let offset = new THREE.Vector3(0, 0, 100);
      if (camera && controls && controls.target) {
        const curOffset = camera.position.clone().sub(controls.target);
        if (curOffset.z > 15) {
          const curDist = curOffset.length();
          const targetDist = Math.max(55, curDist * (1.0 - zoomStep));
          offset = curOffset.normalize().multiplyScalar(targetDist);
        } else {
          offset.set(0, 0, Math.max(65, (curOffset.length() || 100) * (1.0 - zoomStep)));
        }
      }

      const camX = nx + offset.x;
      const camY = ny + offset.y;
      const camZ = nz + offset.z;

      forceInstance.cameraPosition(
        { x: camX, y: camY, z: camZ },
        { x: nx, y: ny, z: nz },
        duration
      );
    } else if (mode === "2d") {
      const curZoom = typeof forceInstance.zoom === "function" ? forceInstance.zoom() : 1;
      const targetZoom = Math.min(10, Math.max(0.2, curZoom * (1.0 + zoomStep * 1.5)));
      forceInstance.centerAt(node.x, node.y, duration);
      forceInstance.zoom(targetZoom, duration);
    }

    setSelectedHash(node.hash);
    ctx.showCommitDetail(node.hash);
  }

  function focusBranch(branchIdentifier: number | string) {
    const mode = displayMode();
    const duration = getGraphFocusTransitionTime();

    if (mode === "tree") {
      const idx = data().rows.findIndex((r: any) =>
        typeof branchIdentifier === "number"
          ? r.lane === branchIdentifier
          : (r.refs && r.refs.some((ref: string) => ref.toLowerCase().includes(String(branchIdentifier).toLowerCase())))
      );
      if (idx !== -1 && treeContainerRef) {
        const targetY = rowY(idx) - viewportH() / 2;
        treeContainerRef.scrollTo({ top: Math.max(0, targetY), behavior: "smooth" });
        setSelectedHash(data().rows[idx].hash);
        ctx.showCommitDetail(data().rows[idx].hash);
      }
      return;
    }

    if (!forceInstance) return;
    const graphData = forceInstance.graphData();
    const nodes: ForceNode[] = graphData?.nodes || [];
    const branchNodes = nodes.filter((n) => {
      if (typeof branchIdentifier === "number") {
        return n.lane === branchIdentifier;
      }
      const str = String(branchIdentifier).toLowerCase();
      return (
        n.refs?.some((ref) => ref.toLowerCase().includes(str)) ||
        (data().laneLabels[n.lane] && data().laneLabels[n.lane]?.toLowerCase().includes(str))
      );
    });

    if (branchNodes.length === 0) return;

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    branchNodes.forEach((n) => {
      const x = n.x || 0;
      const y = n.y || 0;
      const z = n.z || 0;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    });

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const cz = (minZ + maxZ) / 2;
    const spanX = Math.max(40, maxX - minX);
    const spanY = Math.max(40, maxY - minY);
    const spanZ = Math.max(10, maxZ - minZ);
    const radius = Math.hypot(spanX, spanY, spanZ) / 2;

    if (mode === "3d" && forceInstance.camera) {
      const camera = forceInstance.camera();
      const fov = (((camera?.fov || 50)) * Math.PI) / 180;
      const frameDist = Math.max(85, (radius / Math.tan(fov / 2)) * 1.30);

      forceInstance.cameraPosition(
        { x: cx, y: cy, z: cz + frameDist },
        { x: cx, y: cy, z: cz },
        duration
      );
    } else if (mode === "2d") {
      const container = graphContainerRef;
      const w = container ? container.clientWidth : 800;
      const h = container ? container.clientHeight : 600;
      const targetZoom = Math.min(4, Math.max(0.02, Math.min(w / (spanX + 160), h / (spanY + 160))));

      forceInstance.centerAt(cx, cy, duration);
      forceInstance.zoom(targetZoom, duration);
    }

    const tipNode = branchNodes.find((n) => n.isBranchTip) || branchNodes[0];
    if (tipNode) {
      setSelectedHash(tipNode.hash);
      ctx.showCommitDetail(tipNode.hash);
    }
  }

  function resetToFit() {
    const mode = displayMode();
    const duration = getGraphFocusTransitionTime();

    if (mode === "tree") {
      if (treeContainerRef) {
        treeContainerRef.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      }
    } else if (forceInstance && typeof forceInstance.zoomToFit === "function") {
      forceInstance.zoomToFit(duration, 45);
    }
  }

  function focusVisibleCenter() {
    const mode = displayMode();
    const duration = getGraphFocusTransitionTime();

    if (mode === "3d" && forceInstance && forceInstance.camera) {
      const camera = forceInstance.camera();
      if (!camera) return;
      const frustum = new THREE.Frustum();
      const matrix = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      frustum.setFromProjectionMatrix(matrix);

      const graphData = forceInstance.graphData();
      const nodes: ForceNode[] = graphData?.nodes || [];
      const visibleNodes: ForceNode[] = [];

      for (const n of nodes) {
        if (typeof n.x === "number" && typeof n.y === "number") {
          const pos = new THREE.Vector3(n.x, n.y, n.z || 0);
          if (frustum.containsPoint(pos)) {
            visibleNodes.push(n);
          }
        }
      }

      if (visibleNodes.length > 0) {
        let sumX = 0, sumY = 0, sumZ = 0;
        for (const n of visibleNodes) {
          sumX += n.x!;
          sumY += n.y!;
          sumZ += (n.z || 0);
        }
        const cx = sumX / visibleNodes.length;
        const cy = sumY / visibleNodes.length;
        const cz = sumZ / visibleNodes.length;

        const controls = forceInstance.controls();
        if (controls && controls.target) {
          const currentTarget = controls.target.clone();
          const currentCamPos = camera.position.clone();
          const curOffset = currentCamPos.clone().sub(currentTarget);

          let offset = curOffset;
          // Ensure camera stays safely in front of the target in positive Z space
          if (offset.z < 25) {
            offset = new THREE.Vector3(0, 0, Math.max(80, curOffset.length() || 100));
          }

          const targetCamPos = new THREE.Vector3(cx, cy, cz).add(offset);

          forceInstance.cameraPosition(
            { x: targetCamPos.x, y: targetCamPos.y, z: targetCamPos.z },
            { x: cx, y: cy, z: cz },
            duration
          );
        }
      } else if (typeof forceInstance.zoomToFit === "function") {
        forceInstance.zoomToFit(duration, 35);
      }
    } else if (mode === "2d" && forceInstance && typeof forceInstance.screen2GraphCoords === "function") {
      const container = graphContainerRef;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const topLeft = forceInstance.screen2GraphCoords(0, 0);
      const bottomRight = forceInstance.screen2GraphCoords(rect.width, rect.height);

      if (topLeft && bottomRight) {
        const minX = Math.min(topLeft.x, bottomRight.x);
        const maxX = Math.max(topLeft.x, bottomRight.x);
        const minY = Math.min(topLeft.y, bottomRight.y);
        const maxY = Math.max(topLeft.y, bottomRight.y);

        const graphData = forceInstance.graphData();
        const nodes: ForceNode[] = graphData?.nodes || [];
        const visibleNodes = nodes.filter((n: any) =>
          typeof n.x === "number" && typeof n.y === "number" &&
          n.x >= minX && n.x <= maxX && n.y >= minY && n.y <= maxY
        );

        if (visibleNodes.length > 0) {
          let sumX = 0, sumY = 0;
          for (const n of visibleNodes) {
            sumX += n.x!;
            sumY += n.y!;
          }
          const cx = sumX / visibleNodes.length;
          const cy = sumY / visibleNodes.length;
          forceInstance.centerAt(cx, cy, duration);
        } else if (typeof forceInstance.zoomToFit === "function") {
          forceInstance.zoomToFit(duration, 35);
        }
      }
    } else if (mode === "tree") {
      const hash = selectedHash();
      if (hash && treeContainerRef) {
        const idx = data().rows.findIndex((r: any) => r.hash === hash);
        if (idx !== -1) {
          const targetY = rowY(idx) - viewportH() / 2;
          treeContainerRef.scrollTo({ top: Math.max(0, targetY), behavior: "smooth" });
        }
      } else if (treeContainerRef) {
        treeContainerRef.scrollTo({ left: 0, behavior: "smooth" });
      }
    }
  }

  function focusAtCursor() {
    const node = hoveredNode();
    if (node) {
      focusOnNode(node);
      return;
    }

    const mode = displayMode();
    const container = graphContainerRef;
    const duration = getGraphFocusTransitionTime();
    const zoomStep = getGraphFocusZoomStep();

    if (mode === "3d" && forceInstance && forceInstance.camera && container && mousePos.inContainer) {
      const camera = forceInstance.camera();
      const controls = forceInstance.controls ? forceInstance.controls() : null;
      if (camera) {
        const rect = container.getBoundingClientRect();
        const ndcX = (mousePos.x / rect.width) * 2 - 1;
        const ndcY = -(mousePos.y / rect.height) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);

        const graphData = forceInstance.graphData();
        const nodes: ForceNode[] = graphData?.nodes || [];

        // 1. Raycast against node objects in scene
        const scene = forceInstance.scene();
        if (scene) {
          const intersects = raycaster.intersectObjects(scene.children, true);
          for (const hit of intersects) {
            let obj: any = hit.object;
            while (obj && obj !== scene) {
              if (obj.__data && obj.__data.hash) {
                focusOnNode(obj.__data);
                return;
              }
              obj = obj.parent;
            }
          }
        }

        // 2. Projected 2D screen distance to graph nodes (snap if within 70px)
        let closestNode: ForceNode | null = null;
        let minScreenDist = 70;

        for (const n of nodes) {
          if (typeof n.x === "number" && typeof n.y === "number") {
            const v = new THREE.Vector3(n.x, n.y, n.z || 0).project(camera);
            if (v.z < 1) {
              const screenX = ((v.x + 1) / 2) * rect.width;
              const screenY = ((-v.y + 1) / 2) * rect.height;
              const dist = Math.hypot(screenX - mousePos.x, screenY - mousePos.y);
              if (dist < minScreenDist) {
                minScreenDist = dist;
                closestNode = n;
              }
            }
          }
        }

        if (closestNode) {
          focusOnNode(closestNode);
          return;
        }

        // 3. Raycast onto the graph XY plane at cursor
        const planeZ = nodes.length > 0 ? (nodes[0].z || 0) : 0;
        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -planeZ);
        const hitPoint = new THREE.Vector3();
        const hit = raycaster.ray.intersectPlane(plane, hitPoint);

        if (hit && controls && controls.target) {
          const curCamPos = camera.position.clone();
          const curTarget = controls.target.clone();
          const curOffset = curCamPos.clone().sub(curTarget);
          const curDist = curOffset.length();
          const targetDist = Math.max(60, curDist * (1.0 - zoomStep));

          let offset = curOffset.normalize().multiplyScalar(targetDist);
          if (offset.z < 25) {
            offset = new THREE.Vector3(0, 0, Math.max(65, targetDist));
          }

          const targetCamPos = hitPoint.clone().add(offset);
          forceInstance.cameraPosition(
            { x: targetCamPos.x, y: targetCamPos.y, z: targetCamPos.z },
            { x: hitPoint.x, y: hitPoint.y, z: hitPoint.z },
            duration
          );
          return;
        }
      }
    } else if (mode === "2d" && forceInstance && typeof forceInstance.screen2GraphCoords === "function" && container && mousePos.inContainer) {
      const graphCoords = forceInstance.screen2GraphCoords(mousePos.x, mousePos.y);
      if (graphCoords) {
        const graphData = forceInstance.graphData();
        const nodes: ForceNode[] = graphData?.nodes || [];

        let closestNode: ForceNode | null = null;
        let minDist = 45;

        for (const n of nodes) {
          if (typeof n.x === "number" && typeof n.y === "number") {
            const d = Math.hypot(n.x - graphCoords.x, n.y - graphCoords.y);
            if (d < minDist) {
              minDist = d;
              closestNode = n;
            }
          }
        }

        if (closestNode) {
          focusOnNode(closestNode);
          return;
        }

        const curZoom = typeof forceInstance.zoom === "function" ? forceInstance.zoom() : 1;
        const targetZoom = Math.min(10, Math.max(0.2, curZoom * (1.0 + zoomStep * 1.5)));
        forceInstance.centerAt(graphCoords.x, graphCoords.y, duration);
        forceInstance.zoom(targetZoom, duration);
        return;
      }
    }

    focusVisibleCenter();
  }

  onMount(() => {
    if (ctx.graph().length === 0) ctx.loadGraph();
    if (!document.getElementById(GRAPH_CSS_ID)) {
      const st = document.createElement("style");
      st.id = GRAPH_CSS_ID;
      st.textContent = GRAPH_CSS;
      document.head.appendChild(st);
    }

    const handlePointerMove = (e: PointerEvent) => {
      if (graphContainerRef) {
        const rect = graphContainerRef.getBoundingClientRect();
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          mousePos = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            inContainer: true,
          };
        } else {
          mousePos.inContainer = false;
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || "").toUpperCase();
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        if (e.shiftKey) {
          const hNode = hoveredNode();
          const sHash = selectedHash();
          const targetNode = hNode || (sHash ? data().rows.find((r: any) => r.hash === sHash) : null);
          if (targetNode) {
            focusBranch(targetNode.lane);
          } else {
            focusBranch(0);
          }
        } else {
          focusAtCursor();
        }
      } else if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        resetToFit();
      } else if (e.key === "Escape") {
        setSelectedHash(null);
        ctx.closeCommitDetail();
      }
    };

    const handleDblClick = (e: MouseEvent) => {
      const tag = (document.activeElement?.tagName || "").toUpperCase();
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (graphContainerRef && graphContainerRef.contains(e.target as Node)) {
        resetToFit();
      }
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("dblclick", handleDblClick);
    onCleanup(() => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("dblclick", handleDblClick);
    });
  });

  onCleanup(() => {
    if (forceInstance) {
      if (typeof forceInstance._destructor === "function") {
        try { forceInstance._destructor(); } catch {}
      }
      forceInstance = null;
    }
  });

  // Render 3D WebGL / 2D Canvas force graph with high performance & silky smooth interaction
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
        .nodeRelSize(4.5)
        .nodeColor((node: any) => node.color)
        .warmupTicks(30)
        .cooldownTicks(50)
        .cooldownTime(1200);

      if (dagMode !== "none") {
        if (dagMode === "radial") {
          inst.dagMode("radialout").dagLevelDistance(22);
        } else {
          inst.dagMode(dagMode).dagLevelDistance(38);
        }
      }

      inst
        .nodeThreeObject((node: any) => createNode3DSprite(node))
        .nodeLabel((node: any) => `
          <div style="background: rgba(15, 23, 42, 0.95); border: 1px solid rgba(255,255,255,0.18); padding: 8px 12px; border-radius: 8px; font-family: monospace; font-size: 11px; color: #fff; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
            <div style="color: ${COLORS[node.lane % COLORS.length]}; font-weight: bold;">${node.shortHash} (Lane ${node.lane}) ${node.isMerge ? '🔀 MERGE' : ''} ${node.refs && node.refs.length ? '<span style="color:#38bdf8;">[' + node.refs.join(', ') + ']</span>' : ''}</div>
            <div style="margin: 4px 0; color: #f8fafc; font-weight: 500;">${node.message}</div>
            <div style="color: #94a3b8; font-size: 10px;">${node.author} • ${formatTimestamp(node.timestamp)}</div>
          </div>
        `)
        .linkCurvature((link: any) => link.isMerge ? 0.35 : 0.08)
        .linkWidth((link: any) => {
          const srcId = typeof link.source === "object" ? link.source.id : link.source;
          const tgtId = typeof link.target === "object" ? link.target.id : link.target;
          const activeId = hoveredNode()?.id || selectedHash();
          const isHigh = activeId && (srcId === activeId || tgtId === activeId);
          return isHigh ? 4.0 : (link.isMerge ? 2.2 : 1.4);
        })
        .linkDirectionalArrowLength(4.5)
        .linkDirectionalArrowRelPos(0.85)
        .linkColor((link: any) => {
          const srcId = typeof link.source === "object" ? link.source.id : link.source;
          const tgtId = typeof link.target === "object" ? link.target.id : link.target;
          const activeId = hoveredNode()?.id || selectedHash();
          if (activeId) {
            if (srcId === activeId || tgtId === activeId) return "#38bdf8";
            return "rgba(100, 116, 139, 0.2)";
          }
          return link.color;
        })
        .linkDirectionalParticles((link: any) => {
          const srcId = typeof link.source === "object" ? link.source.id : link.source;
          const tgtId = typeof link.target === "object" ? link.target.id : link.target;
          const activeId = hoveredNode()?.id || selectedHash();
          if (activeId && (srcId === activeId || tgtId === activeId)) return 6;
          return link.isMerge ? 2 : 0;
        })
        .linkDirectionalParticleWidth((link: any) => {
          const srcId = typeof link.source === "object" ? link.source.id : link.source;
          const tgtId = typeof link.target === "object" ? link.target.id : link.target;
          const activeId = hoveredNode()?.id || selectedHash();
          return (activeId && (srcId === activeId || tgtId === activeId)) ? 3.8 : 1.8;
        })
        .linkDirectionalParticleSpeed(0.008)
        .linkDirectionalParticleColor(() => "#38bdf8")
        .backgroundColor("rgba(0,0,0,0)")
        .onNodeHover((node: any) => setHoveredNode(node || null))
        .onNodeClick((node: any) => {
          if (!node) return;
          focusOnNode(node);
        })
        .onBackgroundClick(() => {
          setSelectedHash(null);
          ctx.closeCommitDetail();
        });

      // Dynamic distance scaling: nodes scale smoothly with camera distance so they never vanish
      if (typeof inst.onRenderFramePost === "function") {
        inst.onRenderFramePost(({ camera, scene }: any) => {
          if (!camera || !scene) return;
          const camPos = camera.position;
          scene.traverse((obj: any) => {
            if (obj.userData?.isNodeGroup) {
              const dist = camPos.distanceTo(obj.position);
              const scale = Math.max(1.0, Math.pow(dist / 140, 0.58));
              obj.scale.set(scale, scale, scale);
            }
          });
        });
      }

      // Configure OrbitControls for smooth damping and reliable panning
      setTimeout(() => {
        const controls = inst.controls();
        if (controls) {
          controls.enableDamping = true;
          controls.dampingFactor = 0.08;
          controls.rotateSpeed = 0.6 * getGraphRotateSpeed();
          controls.zoomSpeed = 0.8 * getGraphZoomSpeed();
          controls.panSpeed = 0.8 * getGraphPanSpeed();
          controls.minDistance = 1;
          controls.maxDistance = 25000;
          controls.screenSpacePanning = true;
        }
      }, 20);

      forceInstance = inst;
    } else if (mode === "2d") {
      const inst = ForceGraph2D()(container)
        .graphData(data)
        .nodeId("id")
        .nodeVal("val")
        .nodeColor((node: any) => node.color)
        .warmupTicks(30)
        .cooldownTicks(50)
        .cooldownTime(1200)
        .enablePanInteraction(true)
        .enableZoomInteraction(true)
        .zoomSpeed(0.6 * getGraphZoomSpeed())
        .minZoom(0.005)
        .maxZoom(100);

      if (dagMode !== "none") {
        if (dagMode === "radial") {
          inst.dagMode("radialout").dagLevelDistance(22);
        } else {
          inst.dagMode(dagMode).dagLevelDistance(38);
        }
      }

      inst
        .linkCurvature((link: any) => link.isMerge ? 0.35 : 0.08)
        .linkWidth((link: any) => {
          const srcId = typeof link.source === "object" ? link.source.id : link.source;
          const tgtId = typeof link.target === "object" ? link.target.id : link.target;
          const activeId = hoveredNode()?.id || selectedHash();
          const isHigh = activeId && (srcId === activeId || tgtId === activeId);

          const curZoom = inst.zoom() || 1;
          const minScreenW = (isHigh ? 3.5 : (link.isMerge ? 2.2 : 1.4)) / curZoom;
          return Math.max(isHigh ? 4.0 : (link.isMerge ? 2.2 : 1.4), minScreenW);
        })
        .linkColor((link: any) => {
          const srcId = typeof link.source === "object" ? link.source.id : link.source;
          const tgtId = typeof link.target === "object" ? link.target.id : link.target;
          const activeId = hoveredNode()?.id || selectedHash();
          if (activeId) {
            if (srcId === activeId || tgtId === activeId) return "#38bdf8";
            return "rgba(100, 116, 139, 0.18)";
          }
          return link.color;
        })
        .onNodeHover((node: any) => setHoveredNode(node || null))
        .nodeCanvasObject((node: any, canvasCtx: CanvasRenderingContext2D, globalScale: number) => {
          const x = node.x;
          const y = node.y;
          const isBranchEnd = node.isBranchTip || (node.refs && node.refs.length > 0);
          const activeId = hoveredNode()?.id || selectedHash();
          const isSelf = activeId === node.id;
          const isConnected = activeId && (node.parents?.includes(activeId) || (hoveredNode()?.parents?.includes(node.id)));
          const isHigh = isSelf || isConnected;
          const isDimmed = activeId && !isHigh;

          if (isDimmed) {
            canvasCtx.globalAlpha = 0.30;
          } else {
            canvasCtx.globalAlpha = 1.0;
          }

          // Dynamic screen radius scaling: as globalScale decreases (zoomed out), screen radius dynamically adapts
          const zoomComp = Math.pow(Math.max(0.005, globalScale), 0.36);
          const targetScreenR = (isHigh ? 8.5 : (isBranchEnd ? 6.8 : 4.2)) / zoomComp;
          const baseR = Math.sqrt(Math.max(0, node.val || 4)) * 1.6;
          const minScreenRadius = targetScreenR / globalScale;
          const r = Math.max(baseR, minScreenRadius);
          const laneCol = COLORS[node.lane % COLORS.length];

          // 1. Highlight Connectivity Beacon Halo
          if (isHigh) {
            canvasCtx.beginPath();
            canvasCtx.arc(x, y, r * 2.4, 0, 2 * Math.PI, false);
            canvasCtx.fillStyle = "rgba(56, 189, 248, 0.35)";
            canvasCtx.fill();
            canvasCtx.lineWidth = Math.max(2.2 / globalScale, 1.2 / globalScale);
            canvasCtx.strokeStyle = "#38bdf8";
            canvasCtx.stroke();
          } else if (isBranchEnd) {
            // Radiant glowing beacon halo for branch ends
            const beaconRadius = Math.max(r * 2.1, 12 / globalScale);
            canvasCtx.beginPath();
            canvasCtx.arc(x, y, beaconRadius, 0, 2 * Math.PI, false);
            canvasCtx.fillStyle = node.color ? `${node.color}33` : "rgba(56, 189, 248, 0.25)";
            canvasCtx.fill();
            canvasCtx.lineWidth = Math.max(1.8 / globalScale, 0.9 / globalScale);
            canvasCtx.strokeStyle = node.color || "#38bdf8";
            canvasCtx.stroke();
          }

          // 2. Node Circle with Saturated Fill
          canvasCtx.beginPath();
          canvasCtx.arc(x, y, r, 0, 2 * Math.PI, false);
          canvasCtx.fillStyle = isHigh ? "#38bdf8" : (node.color || laneCol);
          canvasCtx.fill();
          canvasCtx.lineWidth = Math.max(isHigh ? 2.8 / globalScale : (isBranchEnd ? 2.5 / globalScale : 1.6 / globalScale), 0.8 / globalScale);
          canvasCtx.strokeStyle = isHigh ? "#ffffff" : (isBranchEnd ? "#ffffff" : (node.isMerge ? "#38bdf8" : laneCol));
          canvasCtx.stroke();

          // 3. High-Contrast Center Dot on Branch Ends & Active Nodes
          if (isHigh || isBranchEnd) {
            canvasCtx.beginPath();
            canvasCtx.arc(x, y, r * 0.45, 0, 2 * Math.PI, false);
            canvasCtx.fillStyle = "#ffffff";
            canvasCtx.fill();
          }

          // 4. DYNAMIC TEXT SIZING & BADGES: Always readable regardless of zoom
          const badgeScreenFontSize = globalScale < 0.35 ? 13 : 11.5;
          const badgeGraphFontSize = badgeScreenFontSize / globalScale;

          if (node.refs && node.refs.length > 0) {
            canvasCtx.font = `700 ${badgeGraphFontSize}px Space Mono, monospace`;
            let badgeX = x + r + 6 / globalScale;

            for (let i = 0; i < Math.min(node.refs.length, 3); i++) {
              const ref = node.refs[i];
              const isTag = ref.startsWith("tag:") || ref.includes("v0.") || ref.startsWith("v");
              const isHead = ref.includes("HEAD");
              const label = ref.replace("HEAD -> ", "").replace("HEAD, ", "");
              const textWidth = canvasCtx.measureText(label).width;
              const paddingX = 6 / globalScale;
              const badgeH = badgeGraphFontSize + 6 / globalScale;
              const badgeW = textWidth + paddingX * 2;
              const badgeY = y - badgeH / 2;

              // Badge Pill Background
              canvasCtx.fillStyle = isTag ? "rgba(168, 85, 247, 0.95)" : (isHead ? "rgba(245, 158, 11, 0.95)" : laneCol);
              canvasCtx.beginPath();
              if (typeof canvasCtx.roundRect === "function") {
                canvasCtx.roundRect(badgeX, badgeY, badgeW, badgeH, 5 / globalScale);
              } else {
                canvasCtx.rect(badgeX, badgeY, badgeW, badgeH);
              }
              canvasCtx.fill();

              // Badge Text
              canvasCtx.fillStyle = "#ffffff";
              canvasCtx.fillText(label, badgeX + paddingX, badgeY + badgeH - 3.5 / globalScale);

              badgeX += badgeW + 4 / globalScale;
            }
          } else if (node.isBranchTip || isHigh) {
            // Branch tip or highlighted node
            canvasCtx.font = `700 ${badgeGraphFontSize}px Space Mono, monospace`;
            const tipLabel = isSelf ? `Active: ${node.shortHash}` : (node.isBranchTip ? `Tip: ${node.shortHash}` : node.shortHash);
            const textWidth = canvasCtx.measureText(tipLabel).width;
            const paddingX = 6 / globalScale;
            const badgeH = badgeGraphFontSize + 6 / globalScale;
            const badgeW = textWidth + paddingX * 2;
            const badgeX = x + r + 6 / globalScale;
            const badgeY = y - badgeH / 2;

            canvasCtx.fillStyle = "rgba(15, 23, 42, 0.92)";
            canvasCtx.beginPath();
            if (typeof canvasCtx.roundRect === "function") {
              canvasCtx.roundRect(badgeX, badgeY, badgeW, badgeH, 5 / globalScale);
            } else {
              canvasCtx.rect(badgeX, badgeY, badgeW, badgeH);
            }
            canvasCtx.fill();
            canvasCtx.strokeStyle = isHigh ? "#38bdf8" : (node.color || "#38bdf8");
            canvasCtx.lineWidth = 1.5 / globalScale;
            canvasCtx.stroke();

            canvasCtx.fillStyle = isHigh ? "#38bdf8" : "#f8fafc";
            canvasCtx.fillText(tipLabel, badgeX + paddingX, badgeY + badgeH - 3.5 / globalScale);
          } else if (globalScale >= 0.22) {
            // Show commit hash & message snippet with subtle backdrop when zoomed in
            const msgScreenFontSize = 10.5;
            const msgGraphFontSize = msgScreenFontSize / globalScale;
            canvasCtx.font = `500 ${msgGraphFontSize}px Space Mono, monospace`;

            const shortText = `${node.shortHash} ${node.message?.slice(0, 26) || ""}`;
            const textWidth = canvasCtx.measureText(shortText).width;
            const padX = 5 / globalScale;
            const labelH = msgGraphFontSize + 5 / globalScale;
            const labelW = textWidth + padX * 2;
            const labelX = x + r + 5 / globalScale;
            const labelY = y - labelH / 2;

            canvasCtx.fillStyle = "rgba(15, 23, 42, 0.78)";
            canvasCtx.beginPath();
            if (typeof canvasCtx.roundRect === "function") {
              canvasCtx.roundRect(labelX, labelY, labelW, labelH, 4 / globalScale);
            } else {
              canvasCtx.rect(labelX, labelY, labelW, labelH);
            }
            canvasCtx.fill();

            canvasCtx.fillStyle = "rgba(255, 255, 255, 0.88)";
            canvasCtx.fillText(shortText, labelX + padX, labelY + labelH - 2.8 / globalScale);
          }

          canvasCtx.globalAlpha = 1.0;
        })
        .nodeLabel((node: any) => `${node.shortHash} (Lane ${node.lane})${node.isMerge ? ' 🔀 MERGE' : ''}: ${node.message} (${node.author})`)
        .linkDirectionalArrowLength(4.5)
        .linkDirectionalArrowRelPos(0.85)
        .linkColor((link: any) => link.color)
        .backgroundColor("rgba(0,0,0,0)")
        .onNodeHover((node: any) => setHoveredNode(node || null))
        .onNodeClick((node: any) => {
          if (!node) return;
          focusOnNode(node);
        })
        .onBackgroundClick(() => {
          setSelectedHash(null);
          ctx.closeCommitDetail();
        });

      forceInstance = inst;
    }
  });

  // Dynamically update OrbitControls & Canvas zoom/pan/rotate sensitivity on setting changes
  createEffect(() => {
    const pan = getGraphPanSpeed();
    const zoom = getGraphZoomSpeed();
    const rot = getGraphRotateSpeed();
    if (forceInstance) {
      const mode = displayMode();
      if (mode === "3d" && typeof forceInstance.controls === "function") {
        const controls = forceInstance.controls();
        if (controls) {
          controls.rotateSpeed = 0.6 * rot;
          controls.zoomSpeed = 0.8 * zoom;
          controls.panSpeed = 0.8 * pan;
        }
      } else if (mode === "2d" && typeof forceInstance.zoomSpeed === "function") {
        forceInstance.zoomSpeed(0.6 * zoom);
      }
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
    if (!el) return;
    setScrollTop(el.scrollTop);
    setViewportH(el.clientHeight || 700);
    if (ctx.graphLoading() || !ctx.graphHasMore()) return;
    if (el.scrollTop > 50 && el.scrollHeight - el.scrollTop - el.clientHeight < 300) {
      ctx.loadMoreGraph();
    }
  }

  const BUFFER_ROWS = 25;
  const visibleRange = createMemo(() => {
    const total = data().rows.length;
    if (total === 0) return { start: 0, end: 0 };
    const st = scrollTop();
    const vh = viewportH();
    const start = Math.max(0, Math.floor((st - LEGEND_H) / ROW_H) - BUFFER_ROWS);
    const end = Math.min(total, Math.ceil((st + vh - LEGEND_H) / ROW_H) + BUFFER_ROWS);
    return { start, end };
  });

  const visibleRows = createMemo(() => {
    const { start, end } = visibleRange();
    return data().rows.slice(start, end).map((r, i) => ({
      row: r,
      index: start + i,
    }));
  });

  const visibleEdges = createMemo(() => {
    const { start, end } = visibleRange();
    const allEdges = data().edges;
    const totalRows = data().rows.length;
    return allEdges.filter((e) => {
      const from = e.fromRow;
      const to = e.toRow !== null ? e.toRow : totalRows - 1;
      return from <= end && to >= start;
    });
  });

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

  function handleSearchKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      const q = searchQuery().trim().toLowerCase();
      if (!q) return;
      const entries = ctx.graph();
      const match = entries.find((r) =>
        r.hash.toLowerCase().includes(q) ||
        r.message.toLowerCase().includes(q) ||
        r.author.toLowerCase().includes(q) ||
        r.refs.some((ref) => ref.toLowerCase().includes(q))
      );
      if (match) {
        if (displayMode() === "tree") {
          const idx = data().rows.findIndex((r: any) => r.hash === match.hash);
          if (idx !== -1 && treeContainerRef) {
            const targetY = rowY(idx) - viewportH() / 2;
            treeContainerRef.scrollTo({ top: Math.max(0, targetY), behavior: "smooth" });
            setSelectedHash(match.hash);
            ctx.showCommitDetail(match.hash);
          }
        } else if (forceInstance) {
          const graphData = forceInstance.graphData();
          const n = graphData?.nodes?.find((item: any) => item.hash === match.hash);
          if (n) {
            focusOnNode(n);
          }
        }
      }
    }
  }

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
        <div style={{ display: "flex", "align-items": "center", gap: "8px", flex: 1, "max-width": "500px", "justify-content": "flex-end" }}>
          <input
            type="text"
            placeholder="🔍 Search commits, branches (Enter to focus)..."
            value={searchQuery()}
            onInput={(e) => setSearchQuery(e.currentTarget.value)}
            onKeyDown={handleSearchKeyDown}
            style={{
              flex: 1,
              "min-width": "180px",
              padding: "6px 12px",
              "font-size": "12px",
              "border-radius": "6px",
              border: "1px solid var(--border-subtle, rgba(255,255,255,0.12))",
              background: "var(--input-bg, rgba(0,0,0,0.25))",
              color: "var(--text-primary, #fff)",
              outline: "none",
            }}
          />
          <Show when={displayMode() !== "tree"}>
            <button
              onClick={focusAtCursor}
              title="Focus Target Node / Cursor Point (Key: 'F')"
              class="flurer-git-modebtn flurer-git-modebtn-inactive"
              style={{ padding: "5px 9px", "font-size": "11px", display: "inline-flex", "align-items": "center", gap: "4px", "white-space": "nowrap" }}
            >
              🎯 Focus <span style={{ opacity: 0.6, "font-size": "10px", "font-family": "Space Mono, monospace" }}>[F]</span>
            </button>
            <button
              onClick={() => {
                const hNode = hoveredNode();
                const sHash = selectedHash();
                const targetNode = hNode || (sHash ? data().rows.find((r: any) => r.hash === sHash) : null);
                if (targetNode) {
                  focusBranch(targetNode.lane);
                } else {
                  focusBranch(0);
                }
              }}
              title="Frame Active / Selected Branch (Key: 'Shift + F')"
              class="flurer-git-modebtn flurer-git-modebtn-inactive"
              style={{ padding: "5px 9px", "font-size": "11px", display: "inline-flex", "align-items": "center", gap: "4px", "white-space": "nowrap" }}
            >
              🌿 Branch <span style={{ opacity: 0.6, "font-size": "10px", "font-family": "Space Mono, monospace" }}>[⇧F]</span>
            </button>
            <button
              onClick={resetToFit}
              title="Reset & Frame Full Graph (Key: 'Space' or Dbl-Click)"
              class="flurer-git-modebtn flurer-git-modebtn-inactive"
              style={{ padding: "5px 9px", "font-size": "11px", display: "inline-flex", "align-items": "center", gap: "4px", "white-space": "nowrap" }}
            >
              🔍 Fit <span style={{ opacity: 0.6, "font-size": "10px", "font-family": "Space Mono, monospace" }}>[Space]</span>
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
          {/* Top Floating Branch Chips Bar */}
          <Show when={data().laneLabels.some(Boolean)}>
            <div style={{
              position: "absolute",
              top: "10px",
              left: "14px",
              "z-index": 10,
              display: "flex",
              "align-items": "center",
              gap: "6px",
              "flex-wrap": "wrap",
              "max-width": "calc(100% - 28px)",
              "pointer-events": "auto",
            }}>
              <For each={data().laneLabels}>
                {(label, idx) => (
                  <Show when={label}>
                    <span
                      class="flurer-git-lanechip"
                      onClick={() => focusBranch(idx())}
                      title={`Click to focus & frame branch: ${label}`}
                      style={{
                        display: "inline-flex",
                        "align-items": "center",
                        gap: "6px",
                        padding: "3px 10px",
                        "border-radius": "999px",
                        "font-size": "10.5px",
                        "font-weight": 600,
                        "font-family": "Space Mono, monospace",
                        background: "rgba(15, 23, 42, 0.82)",
                        "backdrop-filter": "blur(8px)",
                        border: `1px solid ${lighten(laneColor(idx()), 0.45)}`,
                        color: laneColor(idx()),
                        "white-space": "nowrap",
                        cursor: "pointer",
                        "box-shadow": "0 2px 8px rgba(0,0,0,0.3)",
                      }}
                    >
                      <span style={{ width: "7px", height: "7px", "border-radius": "50%", background: laneColor(idx()), display: "inline-block", "flex-shrink": 0 }} />
                      {label}
                    </span>
                  </Show>
                )}
              </For>
            </div>
          </Show>

          <div ref={graphContainerRef} style={{ width: "100%", height: "100%" }} />

          {/* Bottom Modern Glass HUD Pill */}
          <div style={{
            position: "absolute",
            bottom: "10px",
            left: "14px",
            display: "flex",
            "align-items": "center",
            gap: "10px",
            "font-size": "11px",
            color: "var(--text-secondary, rgba(255,255,255,0.75))",
            "font-family": "Space Mono, monospace",
            background: "rgba(10, 14, 23, 0.85)",
            "backdrop-filter": "blur(12px)",
            padding: "5px 12px",
            "border-radius": "6px",
            border: "1px solid rgba(255,255,255,0.12)",
            "box-shadow": "0 4px 14px rgba(0,0,0,0.4)",
            "pointer-events": "none",
            "user-select": "none",
          }}>
            <span><strong style={{ color: "#38bdf8" }}>[F]</strong> Focus</span>
            <span style={{ opacity: 0.35 }}>•</span>
            <span><strong style={{ color: "#38bdf8" }}>[⇧F]</strong> Branch</span>
            <span style={{ opacity: 0.35 }}>•</span>
            <span><strong style={{ color: "#38bdf8" }}>[Space]</strong> Fit</span>
            <span style={{ opacity: 0.35 }}>•</span>
            <span>{displayMode() === "3d" ? "Right-Drag: Pan • Drag: Orbit" : "Drag: Pan • Scroll: Zoom"}</span>
          </div>
        </div>
      </Show>

      {/* Standard Git Tree View */}
      <Show when={displayMode() === "tree" && data().rows.length > 0}>
        <div ref={treeContainerRef} onScroll={handleScroll} style={{ flex: 1, width: "100%", overflow: "auto" }}>
          <div class="flurer-git-tree" style={{ width: "100%", "min-width": `calc(${graphW() + 340}px)`, position: "relative", height: `${svgH()}px` }}>
            {/* Legend: lane → branch name */}
            <div class="flurer-git-legend" style={{ position: "absolute", left: 0, top: 0, width: "100%", height: `${LEGEND_H}px`, display: "flex", "align-items": "center", gap: "8px", padding: `0 14px 0 ${laneW() + 10}px`, "box-sizing": "border-box", overflow: "hidden", "border-bottom": "1px solid var(--border-subtle, rgba(255,255,255,0.06))" }}>
              <For each={data().laneLabels}>
                {(label, idx) => (
                  <Show when={label}>
                    <span
                      class="flurer-git-lanechip"
                      onClick={() => focusBranch(idx())}
                      title={`Click to scroll to branch: ${label}`}
                      style={{ display: "inline-flex", "align-items": "center", gap: "6px", padding: "3px 10px", "border-radius": "999px", "font-size": "10.5px", "font-weight": 600, "font-family": "Space Mono,monospace", background: lighten(laneColor(idx()), 0.14), border: `1px solid ${lighten(laneColor(idx()), 0.4)}`, color: laneColor(idx()), "white-space": "nowrap", cursor: "pointer" }}
                    >
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
              <Index each={visibleEdges()}>
                {(edge) => {
                  const isMerge = () => edge().isMergeBranch || edge().parentIndex > 0;
                  const strokeCol = () => laneColor(edge().viaLane);
                  const markerId = () => `url(#merge-arrow-${edge().viaLane % COLORS.length})`;
                  return (
                    <path d={edgePath(edge())} fill="none" stroke={strokeCol()} stroke-width={isMerge() ? "2.5" : "2"} stroke-dasharray={isMerge() ? "5,3" : "none"} opacity={isMerge() ? "0.95" : "0.65"} stroke-linejoin="round" stroke-linecap="round" marker-start={isMerge() ? markerId() : undefined} />
                  );
                }}
              </Index>
              <Index each={visibleRows()}>
                {(item) => {
                  const i = item().index;
                  const row = () => item().row;
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