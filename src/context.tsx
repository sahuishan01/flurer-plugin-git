import { createContext, useContext, createSignal, createMemo, onMount, onCleanup, type Accessor, type JSX, type ParentProps } from "solid-js";
import {
  saveRecentRepo, getSavedBranchSelection, saveBranchSelection,
  getSavedActiveView, saveActiveView, basename, getSavedOpenTabs,
} from "./utils";
import { loadGraphCache, saveGraphCache } from "./cache";
import * as git from "./git";
import type {
  GitView, GitStatus, GitChange, GitCommit, GitBranch, GitGraphEntry,
  GitDiff, DiffHunk, GitStashEntry, GitWorktree, GitCommitDetail, BusyTask,
  GitCommandLogEntry, GitTag, GitBlameLine, GitRemote, GitRepoStats, GitConflictFile,
  GitBisectState, GitLargeBlob, GitLfsInfo, GitRemoteWebLinks,
  GitReflogEntry, GitSubmodule, GitHook, GitRebaseTodoItem, MultiRepoStatus,
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
  tags: Accessor<GitTag[]>;
  remotes: Accessor<GitRemote[]>;
  conflicts: Accessor<GitConflictFile[]>;
  stats: Accessor<GitRepoStats | null>;

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
  stageHunk: (filePath: string, hunk: DiffHunk) => Promise<void>;
  unstageHunk: (filePath: string, hunk: DiffHunk) => Promise<void>;
  discardHunk: (filePath: string, hunk: DiffHunk) => Promise<void>;
  discardFile: (path: string, isUntracked?: boolean) => Promise<void>;
  commit: (message: string) => Promise<void>;
  commitAmend: (message?: string) => Promise<void>;
  isAmend: Accessor<boolean>;
  setIsAmend: (val: boolean) => void;
  push: () => Promise<void>;
  pull: () => Promise<void>;
  fetchRemote: () => Promise<void>;
  createBranch: (name: string, start_point?: string) => Promise<void>;
  deleteBranch: (name: string) => Promise<void>;
  checkout: (branch: string) => Promise<void>;
  merge: (branch: string) => Promise<void>;
  cherryPick: (commitHash: string) => Promise<void>;
  revertCommit: (commitHash: string) => Promise<void>;
  resetBranch: (commitHash: string, mode: "soft" | "mixed" | "hard") => Promise<void>;
  resetModalCommit: Accessor<string | null>;
  openResetModal: (commitHash: string) => void;
  closeResetModal: () => void;
  rebaseOnto: (upstreamRef: string) => Promise<void>;
  rebaseAbort: () => Promise<void>;
  rebaseContinue: () => Promise<void>;
  bisectState: Accessor<GitBisectState>;
  startBisect: (badHash?: string, goodHash?: string) => Promise<void>;
  markBisect: (status: "good" | "bad" | "skip") => Promise<void>;
  resetBisect: () => Promise<void>;
  bisectModalOpen: Accessor<boolean>;
  openBisectModal: () => void;
  closeBisectModal: () => void;
  largeBlobs: Accessor<GitLargeBlob[]>;
  lfsInfo: Accessor<GitLfsInfo | null>;
  loadLargeBlobs: () => Promise<void>;
  loadLfsInfo: () => Promise<void>;
  trackLfsPattern: (pattern: string) => Promise<void>;
  untrackLfsPattern: (pattern: string) => Promise<void>;
  storageModalOpen: Accessor<boolean>;
  openStorageModal: () => void;
  closeStorageModal: () => void;
  createPatch: (commitHash?: string, fromHash?: string, toHash?: string) => Promise<string>;
  exportArchive: (ref: string, outputPath: string, format?: "zip" | "tar.gz" | "tar", prefix?: string) => Promise<void>;
  patchModalCommit: Accessor<{ commitHash?: string; range?: string } | null>;
  openPatchModal: (commitHash?: string, range?: string) => void;
  closePatchModal: () => void;
  remoteWebLinks: Accessor<GitRemoteWebLinks | null>;

  reflogEntries: Accessor<GitReflogEntry[]>;
  loadReflog: () => Promise<void>;
  reflogModalOpen: Accessor<boolean>;
  openReflogModal: () => void;
  closeReflogModal: () => void;
  checkoutReflog: (entry: GitReflogEntry) => Promise<void>;

  pickaxeModalOpen: Accessor<boolean>;
  openPickaxeModal: () => void;
  closePickaxeModal: () => void;
  pickaxeResults: Accessor<GitCommit[]>;
  searchPickaxe: (query: string, mode: "string" | "regex" | "author" | "message") => Promise<void>;

  submodules: Accessor<GitSubmodule[]>;
  loadSubmodules: () => Promise<void>;
  updateSubmodules: () => Promise<void>;
  addSubmodule: (url: string, path: string) => Promise<void>;
  submodulesModalOpen: Accessor<boolean>;
  openSubmodulesModal: () => void;
  closeSubmodulesModal: () => void;

  hooks: Accessor<GitHook[]>;
  loadHooks: () => Promise<void>;
  saveHook: (name: string, content: string, active: boolean) => Promise<void>;
  hooksModalOpen: Accessor<boolean>;
  openHooksModal: () => void;
  closeHooksModal: () => void;

  rebasePlanModalBase: Accessor<string | null>;
  openInteractiveRebaseModal: (baseHash: string) => void;
  closeInteractiveRebaseModal: () => void;
  executeInteractiveRebase: (baseHash: string, plan: GitRebaseTodoItem[]) => Promise<void>;

  workspaceOverviewOpen: Accessor<boolean>;
  openWorkspaceOverview: () => void;
  closeWorkspaceOverview: () => void;
  multiRepoStatuses: Accessor<MultiRepoStatus[]>;
  loadMultiRepoStatuses: (repoPaths: string[]) => Promise<void>;
  batchFetchAllRepos: (repoPaths: string[]) => Promise<void>;
  stash: (message?: string) => Promise<void>;
  stashPop: (index: number) => Promise<void>;
  stashDrop: (index: number) => Promise<void>;
  loadStashDiff: (index: number) => Promise<GitDiff | null>;
  addWorktree: (path: string, branch?: string) => Promise<void>;
  removeWorktree: (path: string) => Promise<void>;
  loadDiff: (filePath: string, mode: "staged" | "unstaged" | "commit" | "compare", commitHash?: string, switchTab?: boolean) => Promise<void>;
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
  loadTags: () => Promise<void>;
  createTag: (name: string, commitHash?: string, message?: string) => Promise<void>;
  deleteTag: (name: string) => Promise<void>;
  pushTags: (name?: string) => Promise<void>;
  loadRemotes: () => Promise<void>;
  addRemote: (name: string, url: string) => Promise<void>;
  removeRemote: (name: string) => Promise<void>;
  loadConflicts: () => Promise<void>;
  resolveConflict: (path: string, resolution: "ours" | "theirs" | "mark") => Promise<void>;
  loadStats: () => Promise<void>;
  fileLogModal: Accessor<{ path: string; commits: GitCommit[] } | null>;
  openFileLog: (path: string) => Promise<void>;
  closeFileLog: () => void;
  blameModal: Accessor<{ path: string; lines: GitBlameLine[] } | null>;
  openBlame: (path: string) => Promise<void>;
  closeBlame: () => void;
  tagModalCommit: Accessor<string | null>;
  openTagModal: (commitHash: string) => void;
  closeTagModal: () => void;
  remotesModalOpen: Accessor<boolean>;
  openRemotesModal: () => void;
  closeRemotesModal: () => void;
  commandLogs: Accessor<GitCommandLogEntry[]>;
  consoleOpen: Accessor<boolean>;
  toggleConsole: () => void;
  clearCommandLogs: () => void;
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

export function GitProvider(props: ParentProps & { initialPath?: string | null; onOpenRepoInNewTab?: (path: string) => void }) {
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

  const [isAmend, setIsAmend] = createSignal(false);
  const [commandLogs, setCommandLogs] = createSignal<GitCommandLogEntry[]>(git.getCommandLogs());
  const [consoleOpen, setConsoleOpen] = createSignal(false);
  const toggleConsole = () => setConsoleOpen((prev) => !prev);
  const clearCommandLogs = () => {
    git.clearCommandLogs();
    setCommandLogs([]);
  };

  const [tags, setTags] = createSignal<GitTag[]>([]);
  const [remotes, setRemotes] = createSignal<GitRemote[]>([]);
  const [conflicts, setConflicts] = createSignal<GitConflictFile[]>([]);
  const [stats, setStats] = createSignal<GitRepoStats | null>(null);
  const [fileLogModal, setFileLogModal] = createSignal<{ path: string; commits: GitCommit[] } | null>(null);
  const [blameModal, setBlameModal] = createSignal<{ path: string; lines: GitBlameLine[] } | null>(null);
  const [tagModalCommit, setTagModalCommit] = createSignal<string | null>(null);
  const [remotesModalOpen, setRemotesModalOpen] = createSignal(false);
  const [resetModalCommit, setResetModalCommit] = createSignal<string | null>(null);
  const [bisectState, setBisectState] = createSignal<GitBisectState>({ active: false, goodCommits: [], badCommits: [] });
  const [bisectModalOpen, setBisectModalOpen] = createSignal(false);
  const [largeBlobs, setLargeBlobs] = createSignal<GitLargeBlob[]>([]);
  const [lfsInfo, setLfsInfo] = createSignal<GitLfsInfo | null>(null);
  const [storageModalOpen, setStorageModalOpen] = createSignal(false);
  const [patchModalCommit, setPatchModalCommit] = createSignal<{ commitHash?: string; range?: string } | null>(null);

  const [reflogEntries, setReflogEntries] = createSignal<GitReflogEntry[]>([]);
  const [reflogModalOpen, setReflogModalOpen] = createSignal(false);
  const openReflogModal = () => {
    setReflogModalOpen(true);
    loadReflog();
  };
  const closeReflogModal = () => setReflogModalOpen(false);

  const [pickaxeModalOpen, setPickaxeModalOpen] = createSignal(false);
  const [pickaxeResults, setPickaxeResults] = createSignal<GitCommit[]>([]);
  const openPickaxeModal = () => setPickaxeModalOpen(true);
  const closePickaxeModal = () => setPickaxeModalOpen(false);

  const [submodules, setSubmodules] = createSignal<GitSubmodule[]>([]);
  const [submodulesModalOpen, setSubmodulesModalOpen] = createSignal(false);
  const openSubmodulesModal = () => {
    setSubmodulesModalOpen(true);
    loadSubmodules();
  };
  const closeSubmodulesModal = () => setSubmodulesModalOpen(false);

  const [hooks, setHooks] = createSignal<GitHook[]>([]);
  const [hooksModalOpen, setHooksModalOpen] = createSignal(false);
  const openHooksModal = () => {
    setHooksModalOpen(true);
    loadHooks();
  };
  const closeHooksModal = () => setHooksModalOpen(false);

  const [rebasePlanModalBase, setRebasePlanModalBase] = createSignal<string | null>(null);
  const openInteractiveRebaseModal = (baseHash: string) => setRebasePlanModalBase(baseHash);
  const closeInteractiveRebaseModal = () => setRebasePlanModalBase(null);

  const [workspaceOverviewOpen, setWorkspaceOverviewOpen] = createSignal(false);
  const [multiRepoStatuses, setMultiRepoStatuses] = createSignal<MultiRepoStatus[]>([]);
  const openWorkspaceOverview = () => {
    setWorkspaceOverviewOpen(true);
    const paths = getSavedOpenTabs();
    if (paths.length > 0) loadMultiRepoStatuses(paths);
  };
  const closeWorkspaceOverview = () => setWorkspaceOverviewOpen(false);

  const openTagModal = (commitHash: string) => setTagModalCommit(commitHash);
  const closeTagModal = () => setTagModalCommit(null);
  const openRemotesModal = () => setRemotesModalOpen(true);
  const closeRemotesModal = () => setRemotesModalOpen(false);
  const openResetModal = (commitHash: string) => setResetModalCommit(commitHash);
  const closeResetModal = () => setResetModalCommit(null);
  const openBisectModal = () => setBisectModalOpen(true);
  const closeBisectModal = () => setBisectModalOpen(false);
  const openStorageModal = () => setStorageModalOpen(true);
  const closeStorageModal = () => setStorageModalOpen(false);
  const openPatchModal = (commitHash?: string, range?: string) => setPatchModalCommit({ commitHash, range });
  const closePatchModal = () => setPatchModalCommit(null);

  const remoteWebLinks = createMemo(() => {
    const rList = remotes();
    const origin = rList.find((r) => r.name === "origin") || rList[0];
    if (!origin || !origin.fetchUrl) return null;
    return git.parseRemoteWebLinks(origin.fetchUrl);
  });

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
    if (props.onOpenRepoInNewTab && path !== repoPath()) {
      props.onOpenRepoInNewTab(path);
      return;
    }
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

  async function stageHunk(filePath: string, hunk: DiffHunk) {
    const p = repoPath();
    if (!p) return;
    return withBusyTask("Staging Hunk", filePath, async () => {
      try {
        await git.gitApplyHunk(p, filePath, hunk, "stage");
        showToast("Hunk staged", "success");
        await refresh();
      } catch (err) {
        showToast(`Failed to stage hunk: ${err}`, "error");
      }
    });
  }

  async function unstageHunk(filePath: string, hunk: DiffHunk) {
    const p = repoPath();
    if (!p) return;
    return withBusyTask("Unstaging Hunk", filePath, async () => {
      try {
        await git.gitApplyHunk(p, filePath, hunk, "unstage");
        showToast("Hunk unstaged", "success");
        await refresh();
      } catch (err) {
        showToast(`Failed to unstage hunk: ${err}`, "error");
      }
    });
  }

  async function discardHunk(filePath: string, hunk: DiffHunk) {
    const p = repoPath();
    if (!p) return;
    return withBusyTask("Discarding Hunk", filePath, async () => {
      try {
        await git.gitApplyHunk(p, filePath, hunk, "discard");
        showToast("Hunk changes discarded", "success");
        await refresh();
      } catch (err) {
        showToast(`Failed to discard hunk: ${err}`, "error");
      }
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

  async function commitAmend(message?: string) {
    const p = repoPath();
    if (!p) return;
    return withBusyTask("Amending Commit", message ? message.slice(0, 48) : "Updating previous commit...", async () => {
      try {
        await git.gitCommitAmend(p, message);
        showToast("Amended commit successfully", "success");
        setIsAmend(false);
        await refresh();
      } catch (err) {
        showToast(`Amend failed: ${err}`, "error");
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
        await loadGraph();
      } catch (err) {
        showToast(`Cherry-pick failed: ${err}`, "error");
      }
    });
  }

  async function revertCommit(commitHash: string) {
    const p = repoPath();
    if (!p) return;
    return withBusyTask("Reverting Commit", `Reverting ${commitHash.slice(0, 7)}...`, async () => {
      try {
        await git.gitRevert(p, commitHash);
        showToast(`Reverted commit ${commitHash.slice(0, 7)}`, "success");
        await refresh();
        await loadGraph();
      } catch (err) {
        showToast(`Revert failed: ${err}`, "error");
      }
    });
  }

  async function resetBranch(commitHash: string, mode: "soft" | "mixed" | "hard") {
    const p = repoPath();
    if (!p) return;
    return withBusyTask("Resetting Branch", `git reset --${mode} ${commitHash.slice(0, 7)}`, async () => {
      try {
        await git.gitReset(p, commitHash, mode);
        showToast(`Reset branch to ${commitHash.slice(0, 7)} (${mode})`, "success");
        closeResetModal();
        await refresh();
        await loadGraph();
      } catch (err) {
        showToast(`Reset failed: ${err}`, "error");
      }
    });
  }

  async function rebaseOnto(upstreamRef: string) {
    const p = repoPath();
    if (!p) return;
    return withBusyTask("Rebasing Branch", `Rebasing current branch onto ${upstreamRef}...`, async () => {
      try {
        await git.gitRebase(p, upstreamRef);
        showToast(`Rebase onto ${upstreamRef} succeeded`, "success");
        await refresh();
        await loadGraph();
      } catch (err) {
        showToast(`Rebase failed: ${err}`, "error");
        await refresh();
      }
    });
  }

  async function rebaseAbort() {
    const p = repoPath();
    if (!p) return;
    return withBusyTask("Aborting Rebase", "Aborting current rebase...", async () => {
      try {
        await git.gitRebaseAbort(p);
        showToast("Rebase aborted", "success");
        await refresh();
        await loadGraph();
      } catch (err) {
        showToast(`Failed to abort rebase: ${err}`, "error");
      }
    });
  }

  async function rebaseContinue() {
    const p = repoPath();
    if (!p) return;
    return withBusyTask("Continuing Rebase", "Applying next commit...", async () => {
      try {
        await git.gitRebaseContinue(p);
        showToast("Rebase continued", "success");
        await refresh();
        await loadGraph();
      } catch (err) {
        showToast(`Rebase continue failed: ${err}`, "error");
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

  async function loadDiff(filePath: string, mode: "staged" | "unstaged" | "commit" | "compare", commitHash?: string, switchTab: boolean = true) {
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
        if (switchTab && activeView() !== "diff") setActiveView("diff");
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

  async function loadTags() {
    const p = repoPath();
    if (!p) return;
    try {
      const t = await git.gitTagList(p);
      setTags(t);
    } catch {}
  }

  async function createTag(name: string, commitHash?: string, message?: string) {
    const p = repoPath();
    if (!p) return;
    return withBusyTask("Creating Tag", name, async () => {
      try {
        await git.gitTagCreate(p, name, commitHash, message);
        showToast(`Tag "${name}" created`, "success");
        await loadTags();
        await refresh();
      } catch (err) {
        showToast(`Failed to create tag: ${err}`, "error");
      }
    });
  }

  async function deleteTag(name: string) {
    const p = repoPath();
    if (!p) return;
    return withBusyTask("Deleting Tag", name, async () => {
      try {
        await git.gitTagDelete(p, name);
        showToast(`Tag "${name}" deleted`, "success");
        await loadTags();
        await refresh();
      } catch (err) {
        showToast(`Failed to delete tag: ${err}`, "error");
      }
    });
  }

  async function pushTags(name?: string) {
    const p = repoPath();
    if (!p) return;
    return withBusyTask("Pushing Tags", name ? `Pushing tag ${name}...` : "Pushing all tags to origin...", async () => {
      try {
        await git.gitTagPush(p, name);
        showToast(name ? `Pushed tag "${name}"` : "Pushed tags to remote", "success");
      } catch (err) {
        showToast(`Failed to push tags: ${err}`, "error");
      }
    });
  }

  async function loadRemotes() {
    const p = repoPath();
    if (!p) return;
    try {
      const r = await git.gitRemotes(p);
      setRemotes(r);
    } catch {}
  }

  async function addRemote(name: string, url: string) {
    const p = repoPath();
    if (!p) return;
    return withBusyTask("Adding Remote", name, async () => {
      try {
        await git.gitRemoteAdd(p, name, url);
        showToast(`Remote "${name}" added`, "success");
        await loadRemotes();
      } catch (err) {
        showToast(`Failed to add remote: ${err}`, "error");
      }
    });
  }

  async function removeRemote(name: string) {
    const p = repoPath();
    if (!p) return;
    return withBusyTask("Removing Remote", name, async () => {
      try {
        await git.gitRemoteRemove(p, name);
        showToast(`Remote "${name}" removed`, "success");
        await loadRemotes();
      } catch (err) {
        showToast(`Failed to remove remote: ${err}`, "error");
      }
    });
  }

  async function loadConflicts() {
    const p = repoPath();
    if (!p) return;
    try {
      const c = await git.gitConflictFiles(p);
      setConflicts(c);
    } catch {}
  }

  async function resolveConflict(path: string, resolution: "ours" | "theirs" | "mark") {
    const p = repoPath();
    if (!p) return;
    return withBusyTask("Resolving Conflict", path, async () => {
      try {
        await git.gitResolveConflict(p, path, resolution);
        showToast(`Conflict resolved: "${path}"`, "success");
        await refresh();
        await loadConflicts();
      } catch (err) {
        showToast(`Failed to resolve conflict: ${err}`, "error");
      }
    });
  }

  async function loadStats() {
    const p = repoPath();
    if (!p) return;
    return withBusyTask("Analyzing Repository", "Calculating commit punchcard, contributors, and metrics...", async () => {
      try {
        const s = await git.gitRepoStats(p);
        setStats(s);
      } catch (err) {
        showToast(`Failed to load stats: ${err}`, "error");
      }
    });
  }

  async function openFileLog(path: string) {
    const p = repoPath();
    if (!p) return;
    return withBusyTask("Loading File History", path, async () => {
      try {
        const commits = await git.gitFileLog(p, path, 60);
        setFileLogModal({ path, commits });
      } catch (err) {
        showToast(`Failed to load file history: ${err}`, "error");
      }
    });
  }

  function closeFileLog() {
    setFileLogModal(null);
  }

  async function openBlame(path: string) {
    const p = repoPath();
    if (!p) return;
    return withBusyTask("Calculating Git Blame", path, async () => {
      try {
        const lines = await git.gitBlame(p, path);
        setBlameModal({ path, lines });
      } catch (err) {
        showToast(`Failed to load blame: ${err}`, "error");
      }
    });
  }

  function closeBlame() {
    setBlameModal(null);
  }

  async function startBisect(badHash?: string, goodHash?: string) {
    const p = repoPath();
    if (!p) return;
    return withBusyTask("Starting Git Bisect", "Initializing binary search...", async () => {
      try {
        const state = await git.gitBisectStart(p, badHash, goodHash);
        setBisectState(state);
        showToast("Git Bisect started", "success");
        await refresh();
        await loadGraph();
      } catch (err) {
        showToast(`Failed to start bisect: ${err}`, "error");
      }
    });
  }

  async function markBisect(status: "good" | "bad" | "skip") {
    const p = repoPath();
    if (!p) return;
    return withBusyTask("Marking Bisect Step", `Marking commit as ${status.toUpperCase()}...`, async () => {
      try {
        const state = await git.gitBisectMark(p, status);
        setBisectState(state);
        showToast(`Marked as ${status}`, "success");
        await refresh();
        await loadGraph();
      } catch (err) {
        showToast(`Bisect step error: ${err}`, "error");
      }
    });
  }

  async function resetBisect() {
    const p = repoPath();
    if (!p) return;
    return withBusyTask("Aborting Bisect", "Resetting bisect state...", async () => {
      try {
        await git.gitBisectReset(p);
        setBisectState({ active: false, goodCommits: [], badCommits: [] });
        showToast("Bisect session ended", "success");
        await refresh();
        await loadGraph();
      } catch (err) {
        showToast(`Failed to reset bisect: ${err}`, "error");
      }
    });
  }

  async function loadLargeBlobs() {
    const p = repoPath();
    if (!p) return;
    return withBusyTask("Scanning Large Files", "Analyzing repository blob sizes...", async () => {
      try {
        const blobs = await git.gitInspectLargeBlobs(p, 40);
        setLargeBlobs(blobs);
      } catch (err) {
        showToast(`Failed to scan files: ${err}`, "error");
      }
    });
  }

  async function loadLfsInfo() {
    const p = repoPath();
    if (!p) return;
    try {
      const info = await git.gitLfsInfo(p);
      setLfsInfo(info);
    } catch {}
  }

  async function trackLfsPattern(pattern: string) {
    const p = repoPath();
    if (!p) return;
    return withBusyTask("Tracking LFS Pattern", pattern, async () => {
      try {
        await git.gitLfsTrack(p, pattern);
        showToast(`LFS tracking enabled for "${pattern}"`, "success");
        await loadLfsInfo();
        await refresh();
      } catch (err) {
        showToast(`Failed to track LFS: ${err}`, "error");
      }
    });
  }

  async function untrackLfsPattern(pattern: string) {
    const p = repoPath();
    if (!p) return;
    return withBusyTask("Untracking LFS Pattern", pattern, async () => {
      try {
        await git.gitLfsUntrack(p, pattern);
        showToast(`LFS tracking removed for "${pattern}"`, "success");
        await loadLfsInfo();
        await refresh();
      } catch (err) {
        showToast(`Failed to untrack LFS: ${err}`, "error");
      }
    });
  }

  async function createPatch(commitHash?: string, fromHash?: string, toHash?: string): Promise<string> {
    const p = repoPath();
    if (!p) return "";
    return withBusyTask("Generating Patch", "Exporting unified patch format...", async () => {
      try {
        return await git.gitCreatePatch(p, commitHash, fromHash, toHash);
      } catch (err) {
        showToast(`Failed to create patch: ${err}`, "error");
        return "";
      }
    });
  }

  async function exportArchive(ref: string, outputPath: string, format: "zip" | "tar.gz" | "tar" = "zip", prefix?: string) {
    const p = repoPath();
    if (!p) return;
    return withBusyTask("Exporting Archive", `Saving ${ref} as ${format}...`, async () => {
      try {
        await git.gitExportArchive(p, ref, outputPath, format, prefix);
        showToast(`Exported ${format.toUpperCase()} archive successfully`, "success");
      } catch (err) {
        showToast(`Failed to export archive: ${err}`, "error");
      }
    });
  }

  async function loadReflog() {
    const p = repoPath();
    if (!p) return;
    return withBusyTask("Reading Reflog", "Loading HEAD recovery reflog...", async () => {
      try {
        const entries = await git.gitReflog(p, 80);
        setReflogEntries(entries);
      } catch (err) {
        showToast(`Failed to load reflog: ${err}`, "error");
      }
    });
  }

  async function checkoutReflog(entry: GitReflogEntry) {
    const p = repoPath();
    if (!p) return;
    return withBusyTask("Checking Out Reflog Entry", `Restoring ${entry.selector} (${entry.hash.slice(0, 7)})...`, async () => {
      try {
        await git.gitCheckout(p, entry.hash);
        showToast(`Restored to ${entry.selector}`, "success");
        closeReflogModal();
        await refresh();
        await loadGraph();
      } catch (err) {
        showToast(`Failed to restore: ${err}`, "error");
      }
    });
  }

  async function searchPickaxe(query: string, mode: "string" | "regex" | "author" | "message") {
    const p = repoPath();
    if (!p || !query.trim()) return;
    return withBusyTask("Pickaxe Code Search", `Searching git history for "${query}"...`, async () => {
      try {
        const results = await git.gitPickaxeSearch(p, query, mode, 60);
        setPickaxeResults(results);
        if (results.length === 0) {
          showToast(`No commits found matching "${query}"`, "info");
        }
      } catch (err) {
        showToast(`Pickaxe search failed: ${err}`, "error");
      }
    });
  }

  async function loadSubmodules() {
    const p = repoPath();
    if (!p) return;
    try {
      const list = await git.gitSubmoduleList(p);
      setSubmodules(list);
    } catch {}
  }

  async function updateSubmodules() {
    const p = repoPath();
    if (!p) return;
    return withBusyTask("Updating Submodules", "git submodule update --init --recursive", async () => {
      try {
        await git.gitSubmoduleUpdate(p, true, true);
        showToast("Submodules updated successfully", "success");
        await loadSubmodules();
        await refresh();
      } catch (err) {
        showToast(`Submodule update failed: ${err}`, "error");
      }
    });
  }

  async function addSubmodule(url: string, path: string) {
    const p = repoPath();
    if (!p) return;
    return withBusyTask("Adding Submodule", `Cloning ${url} into ${path}...`, async () => {
      try {
        await git.gitSubmoduleAdd(p, url, path);
        showToast(`Submodule "${path}" added`, "success");
        await loadSubmodules();
        await refresh();
      } catch (err) {
        showToast(`Failed to add submodule: ${err}`, "error");
      }
    });
  }

  async function loadHooks() {
    const p = repoPath();
    if (!p) return;
    try {
      const hList = await git.gitHooksList(p);
      setHooks(hList);
    } catch {}
  }

  async function saveHook(name: string, content: string, active: boolean) {
    const p = repoPath();
    if (!p) return;
    return withBusyTask("Saving Git Hook", name, async () => {
      try {
        await git.gitHookSave(p, name, content, active);
        showToast(`Hook "${name}" ${active ? "activated" : "deactivated"}`, "success");
        await loadHooks();
      } catch (err) {
        showToast(`Failed to save hook: ${err}`, "error");
      }
    });
  }

  async function executeInteractiveRebase(baseHash: string, plan: GitRebaseTodoItem[]) {
    const p = repoPath();
    if (!p) return;
    return withBusyTask("Interactive Rebase", `Executing ${plan.length} commit operations...`, async () => {
      try {
        await git.gitExecuteInteractiveRebasePlan(p, baseHash, plan);
        showToast("Interactive rebase completed successfully", "success");
        closeInteractiveRebaseModal();
        await refresh();
        await loadGraph();
      } catch (err) {
        showToast(`Rebase failed: ${err}`, "error");
        await refresh();
      }
    });
  }

  async function loadMultiRepoStatuses(repoPaths: string[]) {
    const statuses: MultiRepoStatus[] = [];
    for (const rp of repoPaths) {
      try {
        const s = await git.gitRepoStatus(rp);
        const name = basename(rp);
        statuses.push({
          path: rp,
          name,
          branch: s.branch,
          ahead: s.ahead,
          behind: s.behind,
          changesCount: s.changes.length,
          clean: s.changes.length === 0,
        });
      } catch {
        statuses.push({
          path: rp,
          name: basename(rp),
          branch: "unknown",
          ahead: 0,
          behind: 0,
          changesCount: 0,
          clean: true,
        });
      }
    }
    setMultiRepoStatuses(statuses);
  }

  async function batchFetchAllRepos(repoPaths: string[]) {
    return withBusyTask("Batch Fetching All Repos", `Fetching remotes across ${repoPaths.length} repositories...`, async () => {
      for (const rp of repoPaths) {
        try {
          await git.gitFetch(rp);
        } catch {}
      }
      await loadMultiRepoStatuses(repoPaths);
      showToast("Fetched all repositories", "success");
    });
  }

  const ctx: GitContextValue = {
    activeView, switchView,
    repoPath, openRepo, backToDashboard,
    status, branches, commits, historyHasMore, graph, graphHasMore, graphLoading,
    stashes, worktrees, commitDetail,
    tags, remotes, conflicts, stats,
    selectedBranches, isAllBranchesSelected, toggleBranchSelection, selectAllBranches,
    selectedDiffFile, selectDiffFile: setSelectedDiffFile,
    diffResult, diffMode, diffCommitHash, compareSourceHash, setCompareSourceHash: handleSetCompareSourceHash, diffCompareCommits, setDiffMode,
    loading, busyTask, setBusyTask, error, toast, showToast, shellAvailable: shellAvail,
    refresh, stage, unstage, stageAll, unstageAll, stageHunk, unstageHunk, discardHunk, discardFile, commit, commitAmend,
    isAmend, setIsAmend,
    push, pull, fetchRemote,
    createBranch, deleteBranch, checkout, merge, cherryPick,
    revertCommit, resetBranch, resetModalCommit, openResetModal, closeResetModal,
    rebaseOnto, rebaseAbort, rebaseContinue,
    bisectState, startBisect, markBisect, resetBisect, bisectModalOpen, openBisectModal, closeBisectModal,
    largeBlobs, lfsInfo, loadLargeBlobs, loadLfsInfo, trackLfsPattern, untrackLfsPattern, storageModalOpen, openStorageModal, closeStorageModal,
    createPatch, exportArchive, patchModalCommit, openPatchModal, closePatchModal,
    remoteWebLinks,
    reflogEntries, loadReflog, reflogModalOpen, openReflogModal, closeReflogModal, checkoutReflog,
    pickaxeModalOpen, openPickaxeModal, closePickaxeModal, pickaxeResults, searchPickaxe,
    submodules, loadSubmodules, updateSubmodules, addSubmodule, submodulesModalOpen, openSubmodulesModal, closeSubmodulesModal,
    hooks, loadHooks, saveHook, hooksModalOpen, openHooksModal, closeHooksModal,
    rebasePlanModalBase, openInteractiveRebaseModal, closeInteractiveRebaseModal, executeInteractiveRebase,
    workspaceOverviewOpen, openWorkspaceOverview, closeWorkspaceOverview, multiRepoStatuses, loadMultiRepoStatuses, batchFetchAllRepos,
    stash, stashPop, stashDrop, loadStashDiff,
    addWorktree, removeWorktree,
    loadDiff, loadDiffCompare, loadDiffWithCurrent, loadDiffWithWorkingTree,
    diffPromptHash, openDiffPrompt, closeDiffPrompt,
    loadGraph, loadMoreGraph, loadHistory, loadMoreHistory, loadBranches, loadStashes, loadWorktrees,
    loadTags, createTag, deleteTag, pushTags,
    loadRemotes, addRemote, removeRemote,
    loadConflicts, resolveConflict,
    loadStats,
    fileLogModal, openFileLog, closeFileLog,
    blameModal, openBlame, closeBlame,
    tagModalCommit, openTagModal, closeTagModal,
    remotesModalOpen, openRemotesModal, closeRemotesModal,
    commandLogs, consoleOpen, toggleConsole, clearCommandLogs,
    showCommitDetail, closeCommitDetail,
    isDubiousOwnership, trustRepository,
    shortcutsOpen, openShortcuts, closeShortcuts, toggleShortcuts,
  };

  return <GitContext.Provider value={ctx}>{props.children}</GitContext.Provider>;
}
