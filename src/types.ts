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
