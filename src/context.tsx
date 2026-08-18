import { createContext, useContext, createSignal, createMemo, onMount, type Accessor, type JSX, type ParentProps } from "solid-js";
import { saveRecentRepo, getSavedBranchSelection, saveBranchSelection, getSavedActiveView, saveActiveView } from "./utils";
import { loadGraphCache, saveGraphCache } from "./cache";
import * as git from "./git";
import type {
  GitView, GitStatus, GitCommit, GitBranch, GitGraphEntry,
  GitDiff, GitStashEntry, GitWorktree, GitCommitDetail, BusyTask,
} from "./types";

interface GitContextValue {
  activeView: Accessor<GitView>;
  switchView: (view: GitView) => void;

  repoPath: Accessor<string | null>;
  openRepo: (path: string) => void;
  backToDashboard: () => void;

  status: Accessor<GitStatus | null>;
  branches: Accessor<GitBranch[]>;
  commits: Accessor<GitCommit[]>;
  historyHasMore: Accessor<boolean>;
  graph: Accessor<GitGraphEntry[]>;
  graphHasMore: Accessor<boolean>;
  graphLoading: Accessor<boolean>;
  stashes: Accessor<GitStashEntry[]>;
  worktrees: Accessor<GitWorktree[]>;
  commitDetail: Accessor<GitCommitDetail | null>;

  selectedDiffFile: Accessor<string | null>;
  selectDiffFile: (path: string | null) => void;
  diffResult: Accessor<GitDiff | null>;
  diffMode: Accessor<"staged" | "unstaged" | "commit" | "compare">;
  diffCommitHash: Accessor<string | null>;
  compareSourceHash: Accessor<string | null>;
  setCompareSourceHash: (hash: string | null) => void;
  diffCompareCommits: Accessor<{ from: string; to: string } | null>;
  setDiffMode: (mode: "staged" | "unstaged" | "commit" | "compare") => void;

  loading: Accessor<boolean>;
  busyTask: Accessor<BusyTask | null>;
  setBusyTask: (task: BusyTask | null) => void;
  error: Accessor<string | null>;
  toast: Accessor<{ message: string; type: "success" | "error" | "info" } | null>;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  shellAvailable: Accessor<boolean>;

  refresh: () => Promise<void>;
  stage: (path: string) => Promise<void>;
  unstage: (path: string) => Promise<void>;
  stageAll: () => Promise<void>;
  unstageAll: () => Promise<void>;
  discardFile: (path: string, isUntracked?: boolean) => Promise<void>;
  commit: (message: string) => Promise<void>;
  push: () => Promise<void>;
  pull: () => Promise<void>;
  fetchRemote: () => Promise<void>;
  createBranch: (name: string, start_point?: string) => Promise<void>;
  deleteBranch: (name: string) => Promise<void>;
  checkout: (branch: string) => Promise<void>;
  merge: (branch: string) => Promise<void>;
  cherryPick: (commitHash: string) => Promise<void>;
  stash: (message?: string) => Promise<void>;
  stashPop: (index: number) => Promise<void>;
  stashDrop: (index: number) => Promise<void>;
  loadStashDiff: (index: number) => Promise<GitDiff | null>;
  addWorktree: (path: string, branch?: string) => Promise<void>;
  removeWorktree: (path: string) => Promise<void>;
  loadDiff: (filePath: string, mode: "staged" | "unstaged" | "commit" | "compare", commitHash?: string) => Promise<void>;
  loadDiffCompare: (fromHash: string, toHash: string, filePath?: string) => Promise<void>;
  loadDiffWithCurrent: (commitHash: string, filePath?: string) => Promise<void>;
  loadDiffWithWorkingTree: (commitHash: string, filePath?: string) => Promise<void>;
  diffPromptHash: Accessor<string | null>;
  openDiffPrompt: (hash: string) => void;
  closeDiffPrompt: () => void;
  loadGraph: () => Promise<void>;
  loadMoreGraph: () => Promise<void>;
  loadHistory: (maxCount: number) => Promise<void>;
  loadMoreHistory: () => Promise<void>;
  loadBranches: () => Promise<void>;
  loadStashes: () => Promise<void>;
  loadWorktrees: () => Promise<void>;
  showCommitDetail: (hash: string) => Promise<void>;
  closeCommitDetail: () => void;
  selectedBranches: Accessor<string[]>;
  isAllBranchesSelected: Accessor<boolean>;
  toggleBranchSelection: (branchName: string) => void;
  selectAllBranches: () => void;
  isDubiousOwnership: Accessor<boolean>;
  trustRepository: () => Promise<void>;
  shortcutsOpen: Accessor<boolean>;
  openShortcuts: () => void;
  closeShortcuts: () => void;
  toggleShortcuts: () => void;
}

const GitContext = createContext<GitContextValue>();

export function useGit(): GitContextValue {
  const ctx = useContext(GitContext);
  if (!ctx) throw new Error("useGit must be used within GitProvider");
  return ctx;
}

export function GitProvider(props: ParentProps & { initialPath?: string | null }) {
  const initialView = props.initialPath ? ((getSavedActiveView(props.initialPath) as GitView) || "graph") : "dashboard";
  const [activeView, setActiveView] = createSignal<GitView>(initialView);
  const [repoPath, setRepoPath] = createSignal<string | null>(props.initialPath ?? null);
  const [status, setStatus] = createSignal<GitStatus | null>(null);
  const [branches, setBranches] = createSignal<GitBranch[]>([]);
  const [commits, setCommits] = createSignal<GitCommit[]>([]);
  const [historyHasMore, setHistoryHasMore] = createSignal(true);
  let historyPage = 0;
  const [graph, setGraph] = createSignal<GitGraphEntry[]>([]);
  const [graphHasMore, setGraphHasMore] = createSignal(true);
  const [graphLoading, setGraphLoading] = createSignal(false);
  let graphPage = 0; // non-reactive page counter for --skip
  const [stashes, setStashes] = createSignal<GitStashEntry[]>([]);
  const [worktrees, setWorktrees] = createSignal<GitWorktree[]>([]);
  const [selectedBranches, setSelectedBranches] = createSignal<string[]>(["all"]);

  const isAllBranchesSelected = createMemo(() => {
    const sb = selectedBranches();
    return sb.length === 0 || sb.includes("all");
  });
  const [commitDetail, setCommitDetail] = createSignal<GitCommitDetail | null>(null);
  const [selectedDiffFile, setSelectedDiffFile] = createSignal<string | null>(null);
  const [diffResult, setDiffResult] = createSignal<GitDiff | null>(null);
  const [diffMode, setDiffMode] = createSignal<"staged" | "unstaged" | "commit" | "compare">("unstaged");
  const [diffCommitHash, setDiffCommitHash] = createSignal<string | null>(null);
  const [compareSourceHash, setCompareSourceHash] = createSignal<string | null>(null);
  const [diffCompareCommits, setDiffCompareCommits] = createSignal<{ from: string; to: string } | null>(null);
  const [diffPromptHash, setDiffPromptHash] = createSignal<string | null>(null);

  function openDiffPrompt(hash: string) {
    setDiffPromptHash(hash);
  }

  function closeDiffPrompt() {
    setDiffPromptHash(null);
  }

  const [loading, setLoading] = createSignal(false);
  const [busyTask, setBusyTask] = createSignal<BusyTask | null>(null);
  const [error, setError] = createSignal<string | null>(null);
  const [isDubiousOwnership, setIsDubiousOwnership] = createSignal(false);
  const [toast, setToast] = createSignal<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [shellAvail, setShellAvail] = createSignal(false);
  const [shortcutsOpen, setShortcutsOpen] = createSignal(false);
  const openShortcuts = () => setShortcutsOpen(true);
  const closeShortcuts = () => setShortcutsOpen(false);
  const toggleShortcuts = () => setShortcutsOpen((prev) => !prev);

  async function withBusyTask<T>(title: string, detail: string | undefined, task: () => Promise<T>): Promise<T> {
    setBusyTask({ title, detail });
    setLoading(true);
    try {
      return await task();
    } finally {
      setBusyTask(null);
      setLoading(false);
    }
  }

  function handleSetCompareSourceHash(hash: string | null) {
    setCompareSourceHash(hash);
    if (hash) {
      showToast(`Selected commit ${hash.slice(0, 7)} for comparison. Click or right-click another commit to compare.`, "info");
    }
  }

  onMount(() => {
    if (props.initialPath) {
      openRepo(props.initialPath);
    }
    setShellAvail(git.hasShellPlugin());
  });

  let toastTimer: ReturnType<typeof setTimeout> | null = null;

  function showToast(message: string, type: "success" | "error" | "info" = "success") {
    setToast({ message, type });
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => setToast(null), 3500);
  }

  async function trustRepository() {
    const p = repoPath();
    if (!p) return;
    return withBusyTask("Trusting Repository", "Adding path to git safe.directory...", async () => {
      try {
        const ok = await git.addSafeDirectory(p);
        if (ok) {
          showToast("Added directory to git safe.directory", "success");
          setIsDubiousOwnership(false);
          setError(null);
          await refresh();
          await loadGraph();
        } else {
          showToast("Failed to add safe.directory", "error");
        }
      } catch (err) {
        showToast(`Error: ${err}`, "error");
      }
    });
  }

  async function refresh() {
    const path = repoPath();
    if (!path) return;
    setLoading(true);
    setError(null);
    try {
      const s = await git.gitRepoStatus(path);
      setStatus(s);
      setIsDubiousOwnership(false);
      saveRecentRepo(path, s.branch);
      try {
        const c = await git.gitLog(path, 100);
        setCommits(c);
        setHistoryHasMore(c.length >= 100);
      } catch {}
      try {
        const b = await git.gitBranches(path);
        setBranches(b);
      } catch {}
    } catch (err: any) {
      const errMessage = String(err);
      const isDubious = errMessage.toLowerCase().includes("dubious ownership") || errMessage.toLowerCase().includes("safe.directory");
      setIsDubiousOwnership(isDubious);
      setError(`Not a git repository: ${err}`);
      setStatus(null);
      setCommits([]);
      setBranches([]);
    } finally {
      setLoading(false);
    }
  }

  function openRepo(path: string) {
    setRepoPath(path);
    setIsDubiousOwnership(false);
    const saved = getSavedBranchSelection(path);
    setSelectedBranches(saved ?? ["all"]);
    const savedView = getSavedActiveView(path) as GitView | null;
    setActiveView(savedView || "graph");
    setGraph([]);
    setGraphHasMore(true);
    setGraphLoading(false);
    setStashes([]);
    setWorktrees([]);
    setCommitDetail(null);
    setSelectedDiffFile(null);
    setDiffResult(null);
    refresh();
    loadGraph();
  }

  function backToDashboard() {
    setRepoPath(null);
    setStatus(null);
    setIsDubiousOwnership(false);
    setBranches([]);
    setCommits([]);
    setGraph([]);
    setGraphHasMore(true);
    setGraphLoading(false);
    setStashes([]);
    setWorktrees([]);
    setCommitDetail(null);
    setSelectedDiffFile(null);
    setDiffResult(null);
    setActiveView("dashboard");
  }

  function switchView(view: GitView) {
    setActiveView(view);
    setSelectedDiffFile(null);
    setDiffResult(null);
    const p = repoPath();
    if (p) saveActiveView(p, view);
  }

  async function stage(path: string) {
    const p = repoPath();
    if (!p) return;
    await git.gitStage(p, path);
    await refresh();
  }

  async function unstage(path: string) {
    const p = repoPath();
    if (!p) return;
    await git.gitUnstage(p, path);
    await refresh();
  }

  async function stageAll() {
    const s = status();
    const p = repoPath();
    if (!s || !p) return;
    return withBusyTask("Staging All Changes", "Adding all modified & untracked files...", async () => {
      for (const c of s.changes) {
        if (!c.staged) await git.gitStage(p, c.path);
      }
      await refresh();
    });
  }

  async function unstageAll() {
    const s = status();
    const p = repoPath();
    if (!s || !p) return;
    return withBusyTask("Unstaging All Changes", "Resetting staged index...", async () => {
      for (const c of s.changes) {
        if (c.staged) await git.gitUnstage(p, c.path);
      }
      await refresh();
    });
  }

  async function discardFile(filePath: string, isUntracked: boolean = false) {
    const p = repoPath();
    if (!p) return;
    return withBusyTask("Discarding File Changes", filePath, async () => {
      try {
        await git.gitDiscardFile(p, filePath, isUntracked);
        showToast(`Discarded changes to "${filePath}"`, "success");
        await refresh();
      } catch (err) {
        showToast(`Failed to discard changes: ${err}`, "error");
      }
    });
  }

  async function commit(message: string) {
    const p = repoPath();
    if (!p) return;
    return withBusyTask("Creating Commit", message.slice(0, 48), async () => {
      try {
        await git.gitCommit(p, message);
        showToast("Committed successfully", "success");
        await refresh();
      } catch (err) {
        showToast(`Commit failed: ${err}`, "error");
      }
    });
  }

  async function push() {
    const p = repoPath();
    if (!p) return;
    return withBusyTask("Pushing Commits", "Pushing local commits to remote...", async () => {
      try {
        await git.gitPush(p);
        showToast("Push completed", "success");
        await refresh();
      } catch (err) {
        showToast(`Push failed: ${err}`, "error");
      }
    });
  }

  async function pull() {
    const p = repoPath();
    if (!p) return;
    return withBusyTask("Pulling Changes", "Fetching and merging remote commits...", async () => {
      try {
        await git.gitPull(p);
        showToast("Pull completed", "success");
        await refresh();
      } catch (err) {
        showToast(`Pull failed: ${err}`, "error");
      }
    });
  }

  async function fetchRemote() {
    const p = repoPath();
    if (!p) return;
    return withBusyTask("Fetching Remotes", "Fetching all branches and tags from remote...", async () => {
      try {
        await git.gitFetch(p);
        showToast("Fetch completed", "success");
        await refresh();
      } catch (err) {
        showToast(`Fetch failed: ${err}`, "error");
      }
    });
  }

  async function createBranch(name: string, start_point?: string) {
    const p = repoPath();
    if (!p) return;
    return withBusyTask("Creating Branch", `Creating "${name}"...`, async () => {
      try {
        await git.gitBranchCreate(p, name, start_point);
        showToast(`Branch "${name}" created`, "success");
        await refresh();
      } catch (err) {
        showToast(`Failed to create branch: ${err}`, "error");
      }
    });
  }

  async function deleteBranch(name: string) {
    const p = repoPath();
    if (!p) return;
    return withBusyTask("Deleting Branch", `Deleting "${name}"...`, async () => {
      try {
        await git.gitBranchDelete(p, name);
        showToast(`Branch "${name}" deleted`, "success");
        await refresh();
      } catch (err) {
        showToast(`Failed to delete branch: ${err}`, "error");
      }
    });
  }

  async function checkout(branch: string) {
    const p = repoPath();
    if (!p) return;
    return withBusyTask("Switching Branch", `Checking out "${branch}"...`, async () => {
      try {
        await git.gitCheckout(p, branch);
        showToast(`Switched to "${branch}"`, "success");
        await refresh();
      } catch (err) {
        showToast(`Checkout failed: ${err}`, "error");
      }
    });
  }

  async function merge(branch: string) {
    const p = repoPath();
    if (!p) return;
    return withBusyTask("Merging Branch", `Merging "${branch}" into current branch...`, async () => {
      try {
        await git.gitMerge(p, branch);
        showToast(`Merged "${branch}"`, "success");
        await refresh();
      } catch (err) {
        showToast(`Merge failed: ${err}`, "error");
      }
    });
  }

  async function cherryPick(commitHash: string) {
    const p = repoPath();
    if (!p) return;
    return withBusyTask("Cherry-Picking", `Applying commit ${commitHash.slice(0, 7)}...`, async () => {
      try {
        await git.gitCherryPick(p, commitHash);
        showToast("Cherry-pick completed", "success");
        await refresh();
      } catch (err) {
        showToast(`Cherry-pick failed: ${err}`, "error");
      }
    });
  }

  async function stash(message?: string) {
    const p = repoPath();
    if (!p) return;
    return withBusyTask("Stashing Changes", message || "WIP on current branch", async () => {
      try {
        await git.gitStash(p, message);
        showToast("Changes stashed", "success");
        await refresh();
        await loadStashes();
      } catch (err) {
        showToast(`Stash failed: ${err}`, "error");
      }
    });
  }

  async function stashPop(index: number) {
    const p = repoPath();
    if (!p) return;
    return withBusyTask("Popping Stash", `Applying stash@{${index}}...`, async () => {
      try {
        await git.gitStashPop(p, index);
        showToast("Stash popped", "success");
        await refresh();
        await loadStashes();
      } catch (err) {
        showToast(`Stash pop failed: ${err}`, "error");
      }
    });
  }

  async function stashDrop(index: number) {
    const p = repoPath();
    if (!p) return;
    return withBusyTask("Dropping Stash", `Deleting stash@{${index}}...`, async () => {
      try {
        await git.gitStashDrop(p, index);
        showToast("Stash dropped", "success");
        await loadStashes();
      } catch (err) {
        showToast(`Stash drop failed: ${err}`, "error");
      }
    });
  }

  async function loadStashDiff(index: number): Promise<GitDiff | null> {
    const p = repoPath();
    if (!p) return null;
    return withBusyTask("Inspecting Stash", `stash@{${index}}`, async () => {
      try {
        return await git.gitStashDiff(p, index);
      } catch (err) {
        showToast(`Failed to inspect stash: ${err}`, "error");
        return null;
      }
    });
  }

  async function addWorktree(path: string, branch?: string) {
    const p = repoPath();
    if (!p) return;
    return withBusyTask("Creating Worktree", path, async () => {
      try {
        await git.gitWorktreeAdd(p, path, branch);
        showToast("Worktree added", "success");
        await loadWorktrees();
      } catch (err) {
        showToast(`Failed to add worktree: ${err}`, "error");
      }
    });
  }

  async function removeWorktree(path: string) {
    const p = repoPath();
    if (!p) return;
    return withBusyTask("Removing Worktree", path, async () => {
      try {
        await git.gitWorktreeRemove(p, path);
        showToast("Worktree removed", "success");
        await loadWorktrees();
      } catch (err) {
        showToast(`Failed to remove worktree: ${err}`, "error");
      }
    });
  }

  let diffReqId = 0;

  async function loadDiff(filePath: string, mode: "staged" | "unstaged" | "commit" | "compare", commitHash?: string) {
    const myReq = ++diffReqId;
    setSelectedDiffFile(filePath === "." ? null : filePath);
    setDiffMode(mode);
    setDiffCommitHash(commitHash ?? null);
    if (mode === "commit" && commitHash) {
      setDiffCompareCommits({ from: `${commitHash.slice(0, 7)}~1`, to: commitHash.slice(0, 7) });
    } else if (mode === "staged" || mode === "unstaged") {
      setDiffCompareCommits(null);
    }
    setDiffResult(null);
    const p = repoPath();
    if (!p) return;
    const taskTitle = mode === "commit" ? "Calculating Commit Diff" : (mode === "staged" ? "Calculating Staged Diff" : "Calculating Unstaged Diff");
    const taskDetail = filePath && filePath !== "." ? filePath : (commitHash ? `Commit ${commitHash.slice(0, 7)}` : "All files");
    return withBusyTask(taskTitle, taskDetail, async () => {
      try {
        let diff: GitDiff;
        if (mode === "commit" && commitHash) {
          diff = await git.gitDiffCommit(p, commitHash, filePath);
        } else if (mode === "staged") {
          diff = await git.gitDiffStaged(p, filePath);
        } else {
          diff = await git.gitDiff(p, filePath);
        }
        if (myReq !== diffReqId) return;
        setDiffResult(diff);
        if (activeView() !== "diff") setActiveView("diff");
      } catch (err) {
        if (myReq !== diffReqId) return;
        showToast(`Failed to load diff: ${err}`, "error");
      }
    });
  }

  async function loadDiffCompare(fromHash: string, toHash: string, filePath: string = ".") {
    const myReq = ++diffReqId;
    setSelectedDiffFile(filePath === "." ? null : filePath);
    setDiffMode("compare");
    setDiffCommitHash(toHash);
    setDiffCompareCommits({ from: fromHash, to: toHash });
    setDiffResult(null);
    const p = repoPath();
    if (!p) return;
    return withBusyTask("Comparing Commits", `Diffing ${fromHash.slice(0, 7)} ↔ ${toHash.slice(0, 7)}...`, async () => {
      try {
        const diff = await git.gitDiffBetween(p, fromHash, toHash, filePath);
        if (myReq !== diffReqId) return;
        setDiffResult(diff);
        if (activeView() !== "diff") setActiveView("diff");
      } catch (err) {
        if (myReq !== diffReqId) return;
        showToast(`Failed to load diff comparison: ${err}`, "error");
      }
    });
  }

  async function loadDiffWithCurrent(commitHash: string, filePath: string = ".") {
    const myReq = ++diffReqId;
    setSelectedDiffFile(filePath === "." ? null : filePath);
    setDiffMode("compare");
    setDiffCommitHash(commitHash);
    setDiffCompareCommits({ from: commitHash, to: "HEAD" });
    setDiffResult(null);
    const p = repoPath();
    if (!p) return;
    return withBusyTask("Diff with HEAD", `Diffing ${commitHash.slice(0, 7)} ↔ HEAD...`, async () => {
      try {
        const diff = await git.gitDiffBetween(p, commitHash, "HEAD", filePath);
        if (myReq !== diffReqId) return;
        setDiffResult(diff);
        if (activeView() !== "diff") setActiveView("diff");
      } catch (err) {
        if (myReq !== diffReqId) return;
        showToast(`Failed to load diff with current: ${err}`, "error");
      }
    });
  }

  async function loadDiffWithWorkingTree(commitHash: string, filePath: string = ".") {
    const myReq = ++diffReqId;
    setSelectedDiffFile(filePath === "." ? null : filePath);
    setDiffMode("compare");
    setDiffCommitHash(commitHash);
    setDiffCompareCommits({ from: commitHash, to: "Working Tree" });
    setDiffResult(null);
    const p = repoPath();
    if (!p) return;
    return withBusyTask("Diff with Working Tree", `Diffing ${commitHash.slice(0, 7)} ↔ Uncommitted changes...`, async () => {
      try {
        const diff = await git.gitDiffCommitWithWorkingTree(p, commitHash, filePath);
        if (myReq !== diffReqId) return;
        setDiffResult(diff);
        if (activeView() !== "diff") setActiveView("diff");
      } catch (err) {
        if (myReq !== diffReqId) return;
        showToast(`Failed to load diff with working tree: ${err}`, "error");
      }
    });
  }

  const GRAPH_PAGE_SIZE = 1000;

  async function loadGraph(overrideBranches?: string[]) {
    const p = repoPath();
    if (!p) return;
    const bList = overrideBranches ?? selectedBranches();

    // Instant load from cache
    try {
      const cached = await loadGraphCache(p);
      if (cached && cached.length > 0 && graph().length === 0) {
        setGraph(cached);
      }
    } catch {}

    setGraphLoading(true);
    graphPage = 0;
    try {
      const g = await git.gitGraph(p, GRAPH_PAGE_SIZE, 0, bList);
      setGraph(g);
      graphPage = 1;
      setGraphHasMore(g.length >= GRAPH_PAGE_SIZE);
      saveGraphCache(p, g).catch(() => {});
    } catch (err) {
      showToast(`Failed to load graph: ${err}`, "error");
    } finally {
      setGraphLoading(false);
    }
  }

  async function loadMoreGraph() {
    const p = repoPath();
    if (!p || graphLoading() || !graphHasMore()) return;
    setGraphLoading(true);
    try {
      const g = await git.gitGraph(p, GRAPH_PAGE_SIZE, graphPage * GRAPH_PAGE_SIZE, selectedBranches());
      if (g.length > 0) {
        const updated = [...graph(), ...g];
        setGraph(updated);
        graphPage++;
        saveGraphCache(p, updated).catch(() => {});
      }
      setGraphHasMore(g.length >= GRAPH_PAGE_SIZE);
    } catch (err) {
      showToast(`Failed to load more graph: ${err}`, "error");
    } finally {
      setGraphLoading(false);
    }
  }

  const HISTORY_PAGE_SIZE = 100;
  let historyLoading = false;

  async function loadHistory(maxCount: number = 100, overrideBranches?: string[]) {
    const p = repoPath();
    if (!p) return;
    const bList = overrideBranches ?? selectedBranches();
    try {
      const c = await git.gitLog(p, maxCount, 0, bList);
      setCommits(c);
      setHistoryHasMore(c.length >= maxCount);
    } catch {}
  }

  async function loadMoreHistory() {
    const p = repoPath();
    if (!p || !historyHasMore() || historyLoading) return;
    historyLoading = true;
    try {
      const offset = commits().length;
      const c = await git.gitLog(p, HISTORY_PAGE_SIZE, offset, selectedBranches());
      if (c.length > 0) {
        setCommits((prev) => [...prev, ...c]);
      }
      setHistoryHasMore(c.length >= HISTORY_PAGE_SIZE);
    } catch {} finally {
      historyLoading = false;
    }
  }

function selectAllBranches() {
  setSelectedBranches(["all"]);
  persistBranchSelection(["all"]);
  refreshHistoryAndGraph(["all"]);
}

function persistBranchSelection(branches: string[]) {
  const p = repoPath();
  if (p) saveBranchSelection(p, branches);
}

function toggleBranchSelection(branchName: string) {
  if (branchName === "all") {
    selectAllBranches();
    return;
  }

  const current = selectedBranches().filter((b) => b !== "all");
  let next: string[];
  if (current.includes(branchName)) {
    next = current.filter((b) => b !== branchName);
    if (next.length === 0) next = ["all"];
  } else {
    next = [...current, branchName];
  }
  setSelectedBranches(next);
  persistBranchSelection(next);
  refreshHistoryAndGraph(next);
}

  async function refreshHistoryAndGraph(branchesToUse?: string[]) {
    await loadGraph(branchesToUse);
    await loadHistory(100, branchesToUse);
  }

  async function loadBranches() {
    const p = repoPath();
    if (!p) return;
    try {
      const b = await git.gitBranches(p);
      setBranches(b);
    } catch {}
  }

  async function loadStashes() {
    const p = repoPath();
    if (!p) return;
    try {
      const s = await git.gitStashList(p);
      setStashes(s);
    } catch {}
  }

  async function loadWorktrees() {
    const p = repoPath();
    if (!p) return;
    try {
      const w = await git.gitWorktreeList(p);
      setWorktrees(w);
    } catch {}
  }

  async function showCommitDetail(hash: string) {
    const p = repoPath();
    if (!p) return;
    try {
      const d = await git.gitShow(p, hash);
      setCommitDetail(d);
    } catch {}
  }

  function closeCommitDetail() {
    setCommitDetail(null);
  }

  const ctx: GitContextValue = {
    activeView, switchView,
    repoPath, openRepo, backToDashboard,
    status, branches, commits, historyHasMore, graph, graphHasMore, graphLoading,
    stashes, worktrees, commitDetail,
    selectedBranches, isAllBranchesSelected, toggleBranchSelection, selectAllBranches,
    selectedDiffFile, selectDiffFile: setSelectedDiffFile,
    diffResult, diffMode, diffCommitHash, compareSourceHash, setCompareSourceHash: handleSetCompareSourceHash, diffCompareCommits, setDiffMode,
    loading, busyTask, setBusyTask, error, toast, showToast, shellAvailable: shellAvail,
    refresh, stage, unstage, stageAll, unstageAll, discardFile, commit,
    push, pull, fetchRemote,
    createBranch, deleteBranch, checkout, merge, cherryPick,
    stash, stashPop, stashDrop, loadStashDiff,
    addWorktree, removeWorktree,
    loadDiff, loadDiffCompare, loadDiffWithCurrent, loadDiffWithWorkingTree,
    diffPromptHash, openDiffPrompt, closeDiffPrompt,
    loadGraph, loadMoreGraph, loadHistory, loadMoreHistory, loadBranches, loadStashes, loadWorktrees,
    showCommitDetail, closeCommitDetail,
    isDubiousOwnership, trustRepository,
    shortcutsOpen, openShortcuts, closeShortcuts, toggleShortcuts,
  };

  return <GitContext.Provider value={ctx}>{props.children}</GitContext.Provider>;
}
