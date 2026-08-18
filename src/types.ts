export type GitView = "dashboard" | "graph" | "branches" | "changes" | "diff" | "history" | "stash" | "worktrees" | "insights";

export interface GitChange {
  path: string;
  status: string;
  staged: boolean;
}

export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  hasRemote: boolean;
  changes: GitChange[];
}

export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  timestamp: number;
}

export interface GitBranch {
  name: string;
  is_current: boolean;
  upstream: string | null;
  ahead?: number;
  behind?: number;
  lastCommit?: {
    hash: string;
    message: string;
    author: string;
    timestamp: number;
  };
}

export interface GitGraphEntry {
  hash: string;
  message: string;
  author: string;
  committer?: string;
  timestamp: number;
  parents: string[];
  refs: string[];
  signature?: GitSignature;
}

export interface DiffFile {
  oldPath: string;
  newPath: string;
  hunks: DiffHunk[];
  binary?: boolean;
}

export interface GitDiff {
  files?: DiffFile[];
  hunks: DiffHunk[];
}

export interface DiffHunk {
  old_start: number;
  old_lines: number;
  new_start: number;
  new_lines: number;
  lines: DiffLine[];
}

export interface DiffLine {
  origin: string;
  content: string;
}

export interface GitStashEntry {
  index: number;
  message: string;
  hash: string;
  timestamp: number;
}

export interface GitWorktree {
  path: string;
  head?: string;
  branch: string | null;
  locked: boolean;
}

export interface GitCommitDetail {
  hash: string;
  message: string;
  author: string;
  email: string;
  timestamp: number;
  parent_hashes: string[];
  refs?: string[];
  tags?: string[];
  branches?: string[];
  signature?: GitSignature;
}

export interface RecentRepo {
  path: string;
  name: string;
  lastOpened: number;
  branch?: string;
}

export interface BusyTask {
  title: string;
  detail?: string;
  cancellable?: boolean;
}

export interface GitCommandLogEntry {
  id: string;
  command: string;
  args: string[];
  durationMs: number;
  exitCode: number;
  stdout: string;
  stderr: string;
  timestamp: number;
}

export interface GitTag {
  name: string;
  hash: string;
  message?: string;
  author?: string;
  timestamp?: number;
}

export interface GitBlameLine {
  lineNum: number;
  commitHash: string;
  shortHash: string;
  author: string;
  timestamp: number;
  content: string;
  message: string;
}

export interface GitRemote {
  name: string;
  fetchUrl: string;
  pushUrl: string;
}

export interface GitRepoStats {
  totalCommits: number;
  totalContributors: number;
  contributors: Array<{ name: string; email: string; commits: number; additions: number; deletions: number }>;
  punchcard: Array<{ day: number; hour: number; count: number }>;
  weeklyActivity: Array<{ week: number; count: number }>;
  languages: Array<{ ext: string; count: number; lines: number; percent: number }>;
}

export interface GitConflictFile {
  path: string;
  conflictType: string;
  resolved: boolean;
}

export interface GitSignature {
  status: "G" | "B" | "U" | "X" | "Y" | "R" | "N"; // G: Good, B: Bad, U: Untrusted, X: Expired, Y: Expired Key, R: Revoked, N: None
  signer?: string;
  key?: string;
  fingerprint?: string;
}

export interface GitBisectState {
  active: boolean;
  currentCommit?: string;
  currentMessage?: string;
  goodCommits: string[];
  badCommits: string[];
  estimatedStepsRemaining?: number;
  revisionsRemaining?: number;
  log?: string[];
}

export interface GitLargeBlob {
  hash: string;
  path: string;
  sizeBytes: number;
  commitHash?: string;
  isLfsTracked?: boolean;
}

export interface GitLfsInfo {
  installed: boolean;
  patterns: string[];
  files: Array<{ path: string; size: string; oid: string }>;
}

export interface GitRemoteWebLinks {
  service: "github" | "gitlab" | "bitbucket" | "gitea" | "codeberg" | "custom";
  repoWebUrl: string;
  commitUrl: (hash: string) => string;
  branchUrl: (branch: string) => string;
  fileUrl: (path: string, ref?: string) => string;
  blameUrl: (path: string, ref?: string) => string;
  compareUrl: (base: string, head: string) => string;
}

export interface GitReflogEntry {
  index: number;
  selector: string;
  hash: string;
  action: string;
  message: string;
  timestamp: number;
}

export interface GitSubmodule {
  name: string;
  path: string;
  url: string;
  commit: string;
  status: "clean" | "modified" | "uninitialized";
}

export interface GitHook {
  name: string;
  active: boolean;
  sampleExists: boolean;
  content: string;
}

export interface GitRebaseTodoItem {
  id: string;
  action: "pick" | "reword" | "edit" | "squash" | "fixup" | "drop";
  hash: string;
  message: string;
  author: string;
}

export interface MultiRepoStatus {
  path: string;
  name: string;
  branch: string;
  ahead: number;
  behind: number;
  changesCount: number;
  clean: boolean;
}
