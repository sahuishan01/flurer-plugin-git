import { invoke } from "@tauri-apps/api/core";
import type {
  GitStatus, GitChange, GitCommit, GitBranch, GitGraphEntry,
  GitDiff, DiffHunk, DiffLine, DiffFile, GitStashEntry, GitWorktree, GitCommitDetail,
  GitCommandLogEntry, GitTag, GitBlameLine, GitRemote, GitRepoStats, GitConflictFile,
  GitSignature, GitBisectState, GitLargeBlob, GitLfsInfo, GitRemoteWebLinks,
  GitReflogEntry, GitSubmodule, GitHook, GitRebaseTodoItem, MultiRepoStatus,
} from "./types";

let shellAvailable: boolean | null = null;

const commandLogs: GitCommandLogEntry[] = [];
const logListeners: Array<(logs: GitCommandLogEntry[]) => void> = [];

export function getCommandLogs(): GitCommandLogEntry[] {
  return [...commandLogs];
}

export function subscribeCommandLogs(listener: (logs: GitCommandLogEntry[]) => void): () => void {
  logListeners.push(listener);
  listener([...commandLogs]);
  return () => {
    const idx = logListeners.indexOf(listener);
    if (idx !== -1) logListeners.splice(idx, 1);
  };
}

export function clearCommandLogs(): void {
  commandLogs.length = 0;
  logListeners.forEach((l) => l([]));
}

function getShell() {
  const win = window as any;
  const shell = win.TauriShell || win.__TAURI_PLUGIN_SHELL__ || win.__TAURI__?.shell;
  return shell?.Command || null;
}

function stripAnsi(output: string): string {
  // eslint-disable-next-line no-control-regex
  return output.replace(/\x1b\[[0-9;]*[A-Za-z]/g, "");
}

export async function addSafeDirectory(repoPath: string): Promise<boolean> {
  const Command = getShell();
  if (!Command) return false;
  try {
    const normalized = repoPath.replace(/\\/g, "/");
    await Command.create("git", ["config", "--global", "--add", "safe.directory", normalized]).execute({ windowsHide: true });
    if (normalized !== repoPath) {
      await Command.create("git", ["config", "--global", "--add", "safe.directory", repoPath]).execute({ windowsHide: true });
    }
    return true;
  } catch {
    return false;
  }
}

async function execGit(repoPath: string, ...args: string[]): Promise<string> {
  const Command = getShell();
  if (Command) {
    const normalized = repoPath.replace(/\\/g, "/");
    const startTime = performance.now();
    const run = async () => {
      return await Command.create("git", [
        "-C", repoPath,
        "-c", "color.ui=never",
        "-c", "safe.directory=* ",
        "-c", `safe.directory=${normalized}`,
        ...args,
      ]).execute({ windowsHide: true });
    };

    let result = await run();

    // Check if dubious ownership was detected and auto-resolve
    if (result.code !== 0 && result.code !== 1) {
      const errStr = (result.stderr || "").toLowerCase();
      if (errStr.includes("dubious ownership") || errStr.includes("safe.directory")) {
        const added = await addSafeDirectory(repoPath);
        if (added) {
          result = await run();
        }
      }
    }

    const durationMs = Math.round(performance.now() - startTime);
    const entry: GitCommandLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      command: `git ${args.join(" ")}`,
      args,
      durationMs,
      exitCode: result.code,
      stdout: result.stdout || "",
      stderr: result.stderr || "",
      timestamp: Date.now(),
    };

    commandLogs.unshift(entry);
    if (commandLogs.length > 250) commandLogs.pop();
    logListeners.forEach((l) => l([...commandLogs]));

    // Exit code 0: success / no diffs
    // Exit code 1: differences found (standard git diff exit code)
    if (result.code !== 0 && result.code !== 1) {
      throw new Error(result.stderr.trim() || `git exited with code ${result.code}`);
    }
    return result.stdout;
  }
  throw new Error("Shell plugin not available");
}

function parsePorcelainStatus(output: string): GitChange[] {
  const changes: GitChange[] = [];
  for (const line of output.split("\n")) {
    if (!line || line.startsWith("##")) continue;
    const indexStatus = line[0];
    const workTreeStatus = line[1];
    let filePath = line.substring(3);

    if (filePath.includes(" -> ")) {
      const parts = filePath.split(" -> ");
      filePath = parts[parts.length - 1].replace(/^"|"$/g, "");
    } else {
      filePath = filePath.replace(/^"|"$/g, "");
    }

    if (indexStatus !== " " && indexStatus !== "?") {
      changes.push({ path: filePath, status: indexStatus, staged: true });
    }
    if (workTreeStatus !== " " && workTreeStatus !== "?") {
      changes.push({ path: filePath, status: workTreeStatus, staged: false });
    }
    if (indexStatus === "?" && workTreeStatus === "?") {
      changes.push({ path: filePath, status: "??", staged: false });
    }
  }
  return changes;
}

// ---- Public API ----

export async function gitRepoStatus(repoPath: string): Promise<GitStatus> {
  const Command = getShell();
  if (Command) {
    const [statusOut, branchOut] = await Promise.all([
      execGit(repoPath, "status", "--porcelain"),
      execGit(repoPath, "branch", "--show-current").catch(() => ""),
    ]);

    const branch = branchOut.trim() || "HEAD";
    const changes = parsePorcelainStatus(statusOut);

    let ahead = 0, behind = 0, hasRemote = false;
    try {
      const ab = await execGit(repoPath, "rev-list", "--left-right", "--count", `HEAD...@{upstream}`);
      const [a, b] = ab.trim().split("\t").map(Number);
      ahead = a;
      behind = b;
      hasRemote = true;
    } catch {}

    return { branch, ahead, behind, hasRemote, changes };
  }

  return invoke<GitStatus>("git_repo_status", { repoPath });
}

export async function gitLog(
  repoPath: string,
  maxCount: number,
  skip: number = 0,
  selectedBranches?: string[]
): Promise<GitCommit[]> {
  const Command = getShell();
  if (Command) {
    const branchArgs = (!selectedBranches || selectedBranches.length === 0 || selectedBranches.includes("all"))
      ? ["--all"]
      : selectedBranches;
    const out = await execGit(repoPath, "log", ...branchArgs, `--max-count=${maxCount}`, `--skip=${skip}`, "--format=%H%x1f%s%x1f%an%x1f%at");
    return out.trim().split("\n").filter(Boolean).map((line) => {
      const [hash, message, author, timestamp] = line.split("\x1f");
      return { hash, message, author, timestamp: parseInt(timestamp, 10) };
    });
  }

  return invoke<GitCommit[]>("git_log", { repoPath, maxCount, skip, selectedBranches: selectedBranches ?? null });
}

export async function gitStage(repoPath: string, filePath: string): Promise<void> {
  const Command = getShell();
  if (Command) {
    await execGit(repoPath, "add", filePath);
    return;
  }
  await invoke("git_stage", { repoPath, filePath });
}

export async function gitUnstage(repoPath: string, filePath: string): Promise<void> {
  const Command = getShell();
  if (Command) {
    await execGit(repoPath, "restore", "--staged", filePath);
    return;
  }
  await invoke("git_unstage", { repoPath, filePath });
}

export async function gitCommit(repoPath: string, message: string): Promise<void> {
  const Command = getShell();
  if (Command) {
    await execGit(repoPath, "commit", "-m", message);
    return;
  }
  await invoke("git_commit", { repoPath, message });
}

export async function gitPush(repoPath: string): Promise<void> {
  const Command = getShell();
  if (Command) {
    await execGit(repoPath, "push");
    return;
  }
  await invoke("git_push", { repoPath });
}

export async function gitPull(repoPath: string): Promise<void> {
  const Command = getShell();
  if (Command) {
    await execGit(repoPath, "pull");
    return;
  }
  await invoke("git_pull", { repoPath });
}

export async function gitFetch(repoPath: string): Promise<void> {
  const Command = getShell();
  if (Command) {
    await execGit(repoPath, "fetch", "--all", "--prune");
    return;
  }
  await invoke("git_fetch", { repoPath });
}

export async function gitBranches(repoPath: string): Promise<GitBranch[]> {
  const Command = getShell();
  if (Command) {
    const out = await execGit(
      repoPath,
      "branch",
      "-a",
      "--format=%(refname:short)\x1f%(HEAD)\x1f%(upstream:short)\x1f%(upstream:track)\x1f%(objectname:short)\x1f%(subject)\x1f%(authorname)\x1f%(committerdate:unix)"
    );
    return out.trim().split("\n").filter(Boolean).map((line) => {
      const [name, isCurrent, upstream, track, lastHash, lastSubject, lastAuthor, lastTimestamp] = line.split("\x1f");
      let ahead = 0;
      let behind = 0;
      if (track) {
        const aheadMatch = track.match(/ahead (\d+)/);
        const behindMatch = track.match(/behind (\d+)/);
        if (aheadMatch) ahead = parseInt(aheadMatch[1], 10);
        if (behindMatch) behind = parseInt(behindMatch[1], 10);
      }
      return {
        name,
        is_current: isCurrent === "*",
        upstream: upstream || null,
        ahead,
        behind,
        lastCommit: lastHash ? {
          hash: lastHash,
          message: lastSubject || "",
          author: lastAuthor || "",
          timestamp: parseInt(lastTimestamp, 10) || 0,
        } : undefined,
      };
    });
  }

  return invoke<GitBranch[]>("git_branches", { repoPath });
}

export async function gitDiscardFile(repoPath: string, filePath: string, isUntracked: boolean): Promise<void> {
  const Command = getShell();
  if (Command) {
    if (isUntracked) {
      await execGit(repoPath, "clean", "-f", "--", filePath);
    } else {
      await execGit(repoPath, "checkout", "HEAD", "--", filePath);
    }
    return;
  }
  await invoke("git_discard_file", { repoPath, filePath, isUntracked });
}

export async function gitBranchCreate(repoPath: string, name: string, startPoint?: string): Promise<void> {
  const Command = getShell();
  if (Command) {
    const args = ["branch", name];
    if (startPoint) args.push(startPoint);
    await execGit(repoPath, ...args);
    return;
  }
  await invoke("git_branch_create", { repoPath, name, startPoint: startPoint ?? null });
}

export async function gitBranchDelete(repoPath: string, name: string): Promise<void> {
  const Command = getShell();
  if (Command) {
    await execGit(repoPath, "branch", "-d", name);
    return;
  }
  await invoke("git_branch_delete", { repoPath, name });
}

export async function gitCheckout(repoPath: string, branch: string): Promise<void> {
  const Command = getShell();
  if (Command) {
    await execGit(repoPath, "checkout", branch);
    return;
  }
  await invoke("git_checkout", { repoPath, branch });
}

export async function gitMerge(repoPath: string, branch: string): Promise<void> {
  const Command = getShell();
  if (Command) {
    await execGit(repoPath, "merge", branch);
    return;
  }
  await invoke("git_merge", { repoPath, branch });
}

export async function gitRebase(repoPath: string, branch: string): Promise<void> {
  const Command = getShell();
  if (Command) {
    await execGit(repoPath, "rebase", branch);
    return;
  }
  await invoke("git_rebase", { repoPath, branch });
}

export async function gitCherryPick(repoPath: string, commitHash: string): Promise<void> {
  const Command = getShell();
  if (Command) {
    await execGit(repoPath, "cherry-pick", commitHash);
    return;
  }
  await invoke("git_cherry_pick", { repoPath, commitHash });
}

export async function gitRevert(repoPath: string, commitHash: string): Promise<void> {
  const Command = getShell();
  if (Command) {
    await execGit(repoPath, "revert", "--no-edit", commitHash);
    return;
  }
  await invoke("git_revert", { repoPath, commitHash });
}

export async function gitReset(repoPath: string, commitHash: string, mode: "soft" | "mixed" | "hard" = "mixed"): Promise<void> {
  const Command = getShell();
  if (Command) {
    await execGit(repoPath, "reset", `--${mode}`, commitHash);
    return;
  }
  await invoke("git_reset", { repoPath, commitHash, mode });
}

export async function gitRebaseAbort(repoPath: string): Promise<void> {
  const Command = getShell();
  if (Command) {
    await execGit(repoPath, "rebase", "--abort");
    return;
  }
  await invoke("git_rebase_abort", { repoPath });
}

export async function gitRebaseContinue(repoPath: string): Promise<void> {
  const Command = getShell();
  if (Command) {
    await execGit(repoPath, "rebase", "--continue");
    return;
  }
  await invoke("git_rebase_continue", { repoPath });
}

// ---- Diff ----

function parseDiff(output: string): GitDiff {
  const files: DiffFile[] = [];
  const allHunks: DiffHunk[] = [];
  let currentFile: DiffFile | null = null;
  let currentHunk: DiffHunk | null = null;

  if (!output || !output.trim()) {
    return { files: [], hunks: [] };
  }

  // Normalize CRLF to LF so Windows diff output matches regexes,
  // and strip any residual ANSI escape sequences
  const lines = stripAnsi(output).replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];

    if (rawLine.startsWith("diff --git ") || rawLine.startsWith("diff --no-index ")) {
      const prefix = rawLine.startsWith("diff --git ") ? "diff --git " : "diff --no-index ";
      const cleanLine = rawLine.substring(prefix.length).trim();
      let oldPath = "";
      let newPath = "";
      const match = cleanLine.match(/^(?:"?a\/(.*?)"?)\s+(?:"?b\/(.*?)"?)$/);
      if (match) {
        oldPath = match[1].replace(/^"|"$/g, "");
        newPath = match[2].replace(/^"|"$/g, "");
      } else {
        const parts = cleanLine.split(" ");
        if (parts.length >= 2) {
          oldPath = parts[0].replace(/^"?a\//, "").replace(/^"|"$/g, "");
          newPath = parts[1].replace(/^"?b\//, "").replace(/^"|"$/g, "");
        }
      }
      currentFile = { oldPath, newPath, hunks: [], binary: false };
      files.push(currentFile);
      currentHunk = null;
      continue;
    }

    if (currentFile && rawLine.startsWith("Binary files ")) {
      currentFile.binary = true;
      continue;
    }

    const hunkMatch = rawLine.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
    if (hunkMatch) {
      currentHunk = {
        old_start: parseInt(hunkMatch[1], 10),
        old_lines: parseInt(hunkMatch[2] || "1", 10),
        new_start: parseInt(hunkMatch[3], 10),
        new_lines: parseInt(hunkMatch[4] || "1", 10),
        lines: [],
      };
      allHunks.push(currentHunk);
      if (!currentFile) {
        currentFile = { oldPath: "", newPath: "", hunks: [], binary: false };
        files.push(currentFile);
      }
      currentFile.hunks.push(currentHunk);
      continue;
    }

if (currentHunk) {
        if (rawLine.startsWith("--- ") || rawLine.startsWith("+++ ") || rawLine.startsWith("index ") || rawLine.startsWith("mode ") || rawLine.startsWith("new file mode") || rawLine.startsWith("new file") || rawLine.startsWith("deleted file")) {
          continue;
        }
        // "\ No newline at end of file" marker — annotation, not a code line
        if (rawLine.startsWith("\\")) {
          continue;
        }
        if (rawLine.startsWith("+")) {
          currentHunk.lines.push({ origin: "+", content: rawLine.substring(1) });
        } else if (rawLine.startsWith("-")) {
          currentHunk.lines.push({ origin: "-", content: rawLine.substring(1) });
        } else if (rawLine.startsWith(" ")) {
          currentHunk.lines.push({ origin: " ", content: rawLine.substring(1) });
        }
      }
  }

  return { files, hunks: allHunks };
}

export async function gitUntrackedFiles(repoPath: string): Promise<string[]> {
  const Command = getShell();
  if (Command) {
    const out = await execGit(repoPath, "ls-files", "--others", "--exclude-standard");
    return out.trim().split("\n").filter(Boolean);
  }
  return invoke<string[]>("git_untracked_files", { repoPath });
}

export async function gitDiff(repoPath: string, filePath: string = "."): Promise<GitDiff> {
  const Command = getShell();
  if (Command) {
    const args = ["diff"];
    if (filePath && filePath !== ".") args.push("--", filePath);
    let out = await execGit(repoPath, ...args);

    // Fallback 1: If empty and specific file requested, check staged diff
    if ((!out || !out.trim()) && filePath && filePath !== ".") {
      try {
        const stagedArgs = ["diff", "--cached", "--", filePath];
        out = await execGit(repoPath, ...stagedArgs);
      } catch {}
    }

    // Fallback 2: If still empty and specific file requested, check untracked file via --no-index
    if ((!out || !out.trim()) && filePath && filePath !== ".") {
      try {
        out = await execGit(repoPath, "diff", "--no-index", "--", "/dev/null", filePath);
      } catch {}
    }
    const parsed = parseDiff(out);

    // "All changes" mode: git diff never includes untracked files, so append
    // their /dev/null diffs so they show up in the diff section too
    if (!filePath || filePath === ".") {
      try {
        const untracked = await gitUntrackedFiles(repoPath);
        for (const u of untracked) {
          try {
            const uOut = await execGit(repoPath, "diff", "--no-index", "--", "/dev/null", u);
            const uParsed = parseDiff(uOut);
            if (parsed.files && uParsed.files) {
              parsed.files.push(...uParsed.files);
            }
            if (parsed.hunks && uParsed.hunks) {
              parsed.hunks.push(...uParsed.hunks);
            }
          } catch {}
        }
      } catch {}
    }
    return parsed;
  }
  return invoke<GitDiff>("git_diff", { repoPath, filePath });
}

export async function gitDiffStaged(repoPath: string, filePath: string = "."): Promise<GitDiff> {
  const Command = getShell();
  if (Command) {
    const args = ["diff", "--cached"];
    if (filePath && filePath !== ".") args.push("--", filePath);
    let out = await execGit(repoPath, ...args);

    // Fallback: If empty and specific file requested, check unstaged diff
    if ((!out || !out.trim()) && filePath && filePath !== ".") {
      try {
        const unstagedArgs = ["diff", "--", filePath];
        out = await execGit(repoPath, ...unstagedArgs);
      } catch {}
    }
    return parseDiff(out);
  }
  return invoke<GitDiff>("git_diff_staged", { repoPath, filePath });
}

export async function gitDiffCommit(repoPath: string, commitHash: string, filePath: string = "."): Promise<GitDiff> {
  const Command = getShell();
  if (Command) {
    let out = "";
    try {
      const args = ["show", "-m", "--patch", "--format=", commitHash];
      if (filePath && filePath !== ".") args.push("--", filePath);
      out = await execGit(repoPath, ...args);
    } catch {
      const args = ["diff", `${commitHash}~1`, commitHash];
      if (filePath && filePath !== ".") args.push("--", filePath);
      out = await execGit(repoPath, ...args);
    }
    return parseDiff(out);
  }
  return invoke<GitDiff>("git_diff_commit", { repoPath, commitHash, filePath });
}

export async function gitDiffBetween(repoPath: string, fromHash: string, toHash: string, filePath: string = "."): Promise<GitDiff> {
  const Command = getShell();
  if (Command) {
    const args = ["diff", fromHash, toHash];
    if (filePath && filePath !== ".") args.push("--", filePath);
    const out = await execGit(repoPath, ...args);
    return parseDiff(out);
  }
  return invoke<GitDiff>("git_diff_between", { repoPath, fromHash, toHash, filePath });
}

export async function gitDiffCommitWithWorkingTree(repoPath: string, commitHash: string, filePath: string = "."): Promise<GitDiff> {
  const Command = getShell();
  if (Command) {
    const args = ["diff", commitHash];
    if (filePath && filePath !== ".") args.push("--", filePath);
    const out = await execGit(repoPath, ...args);
    return parseDiff(out);
  }
  return invoke<GitDiff>("git_diff_between", { repoPath, fromHash: commitHash, toHash: "", filePath });
}

// ---- Graph ----

export async function gitGraph(
  repoPath: string,
  maxCount: number,
  skip: number = 0,
  selectedBranches?: string[]
): Promise<GitGraphEntry[]> {
  const Command = getShell();
  if (Command) {
    const branchArgs = (!selectedBranches || selectedBranches.length === 0 || selectedBranches.includes("all"))
      ? ["--all"]
      : selectedBranches;
    const out = await execGit(repoPath, "log", ...branchArgs, `--max-count=${maxCount}`, `--skip=${skip}`, "--topo-order", "--format=%H%x1f%P%x1f%s%x1f%an%x1f%cn%x1f%at%x1f%D%x1f%G?");
    return out.trim().split("\n").filter(Boolean).map((line) => {
      const [hash, parentsStr, message, author, committer, timestamp, refsStr, sigStatus] = line.split("\x1f");
      const parents = parentsStr ? parentsStr.split(" ") : [];
      const refs = refsStr ? refsStr.split(",").map((r) => r.trim()).filter(Boolean) : [];
      const signature: GitSignature | undefined = sigStatus && sigStatus !== "N" ? {
        status: sigStatus.toUpperCase() as any,
      } : undefined;
      return { hash, message, author, committer, timestamp: parseInt(timestamp, 10), parents, refs, signature };
    });
  }

  return invoke<GitGraphEntry[]>("git_graph", { repoPath, maxCount, skip, selectedBranches: selectedBranches ?? null });
}

// ---- Stash ----

export async function gitStash(repoPath: string, message?: string): Promise<void> {
  const Command = getShell();
  if (Command) {
    if (message) {
      await execGit(repoPath, "stash", "push", "-m", message);
    } else {
      await execGit(repoPath, "stash");
    }
    return;
  }
  await invoke("git_stash", { repoPath, message: message ?? null });
}

export async function gitStashList(repoPath: string): Promise<GitStashEntry[]> {
  const Command = getShell();
  if (Command) {
    const out = await execGit(repoPath, "stash", "list", "--format=%gd%x1f%gs%x1f%H%x1f%ci");
    return out.trim().split("\n").filter(Boolean).map((line, i) => {
      const [ref, message, hash, timestamp] = line.split("\x1f");
      const index = parseInt(ref.match(/\{(\d+)\}/)?.[1] || String(i), 10);
      return { index, message, hash, timestamp: new Date(timestamp).getTime() / 1000 };
    });
  }

  return invoke<GitStashEntry[]>("git_stash_list", { repoPath });
}

export async function gitStashPop(repoPath: string, index: number): Promise<void> {
  const Command = getShell();
  if (Command) {
    await execGit(repoPath, "stash", "pop", `stash@{${index}}`);
    return;
  }
  await invoke("git_stash_pop", { repoPath, index });
}

export async function gitStashDrop(repoPath: string, index: number): Promise<void> {
  const Command = getShell();
  if (Command) {
    await execGit(repoPath, "stash", "drop", `stash@{${index}}`);
    return;
  }
  await invoke("git_stash_drop", { repoPath, index });
}

export async function gitStashDiff(repoPath: string, index: number): Promise<GitDiff> {
  const Command = getShell();
  if (Command) {
    const out = await execGit(repoPath, "stash", "show", "-p", `stash@{${index}}`);
    return parseDiff(out);
  }
  return invoke<GitDiff>("git_stash_diff", { repoPath, index });
}

// ---- Worktrees ----

export async function gitWorktreeList(repoPath: string): Promise<GitWorktree[]> {
  const Command = getShell();
  if (Command) {
    const out = await execGit(repoPath, "worktree", "list", "--porcelain");
    const worktrees: GitWorktree[] = [];
    let current: Partial<GitWorktree> = {};

    for (const line of out.split("\n")) {
      if (line.startsWith("worktree ")) {
        if (current.path) worktrees.push(current as GitWorktree);
        current = { path: line.substring(9), locked: false };
      } else if (line.startsWith("HEAD ")) {
        current.head = line.substring(5);
      } else if (line.startsWith("branch ")) {
        current.branch = line.substring(7).replace("refs/heads/", "");
      } else if (line === "locked") {
        current.locked = true;
      }
    }
    if (current.path) worktrees.push(current as GitWorktree);
    return worktrees;
  }

  return invoke<GitWorktree[]>("git_worktree_list", { repoPath });
}

export async function gitWorktreeAdd(repoPath: string, worktreePath: string, branch?: string): Promise<void> {
  const Command = getShell();
  if (Command) {
    const args = ["worktree", "add", worktreePath];
    if (branch) args.push(branch);
    await execGit(repoPath, ...args);
    return;
  }
  await invoke("git_worktree_add", { repoPath, worktreePath, branch: branch ?? null });
}

export async function gitWorktreeRemove(repoPath: string, worktreePath: string): Promise<void> {
  const Command = getShell();
  if (Command) {
    await execGit(repoPath, "worktree", "remove", "--force", worktreePath);
    return;
  }
  await invoke("git_worktree_remove", { repoPath, worktreePath });
}

// ---- Commit Detail ----

export async function gitShow(repoPath: string, commitHash: string): Promise<GitCommitDetail> {
  const Command = getShell();
  if (Command) {
    const out = await execGit(repoPath, "show", "--format=%H%x1f%s%x1f%an%x1f%ae%x1f%at%x1f%P%x1f%D%x1f%G?%x1f%GS%x1f%GK%x1f%GF%x1f%B", "--no-patch", commitHash);
    const [hash, subject, author, email, timestamp, parentHashes, refsStr, sigStatus, signer, key, fingerprint, ...bodyParts] = out.trim().split("\x1f");
    const fullBody = bodyParts.join("\x1f").trim() || subject || "";
    const rawRefs = refsStr ? refsStr.split(",").map((r) => r.trim()).filter(Boolean) : [];
    const tags: string[] = [];
    const branches: string[] = [];

    rawRefs.forEach((r) => {
      if (r.startsWith("tag: ")) {
        tags.push(r.substring(5).trim());
      } else if (r.startsWith("HEAD -> ")) {
        branches.push(r.substring(8).trim() + " (HEAD)");
      } else if (r === "HEAD") {
        branches.push("HEAD");
      } else {
        branches.push(r);
      }
    });

    const signature: GitSignature | undefined = sigStatus && sigStatus !== "N" ? {
      status: (sigStatus.toUpperCase() as any),
      signer: signer || undefined,
      key: key || undefined,
      fingerprint: fingerprint || undefined,
    } : undefined;

    return {
      hash,
      message: fullBody,
      author,
      email,
      timestamp: parseInt(timestamp, 10),
      parent_hashes: parentHashes ? parentHashes.split(" ") : [],
      refs: rawRefs,
      tags,
      branches,
      signature,
    };
  }

  return invoke<GitCommitDetail>("git_show", { repoPath, commitHash });
}

// ---- Hunk Staging / Discarding & Amend ----

export function createHunkPatch(filePath: string, hunk: DiffHunk): string {
  const normPath = filePath.replace(/^\.\//, "");
  let patch = `--- a/${normPath}\n+++ b/${normPath}\n@@ -${hunk.old_start},${hunk.old_lines} +${hunk.new_start},${hunk.new_lines} @@\n`;
  for (const line of hunk.lines) {
    patch += `${line.origin}${line.content}\n`;
  }
  return patch;
}

export async function gitApplyHunk(repoPath: string, filePath: string, hunk: DiffHunk, mode: "stage" | "unstage" | "discard"): Promise<void> {
  const patch = createHunkPatch(filePath, hunk);
  const Command = getShell();
  if (Command) {
    const isWindows = navigator.userAgent.includes("Windows");
    const applyFlag = mode === "stage" ? "--cached" : (mode === "unstage" ? "--cached --reverse" : "--reverse");

    if (!isWindows) {
      await Command.create("sh", [
        "-c",
        `cat << 'FLURER_EOF' | git -C "${repoPath}" -c safe.directory=* apply ${applyFlag} --whitespace=nowarn -\n${patch}\nFLURER_EOF`
      ]).execute({ windowsHide: true });
      return;
    } else {
      await Command.create("powershell", [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        `$p = @'\n${patch}\n'@; $p | git -C "${repoPath}" -c safe.directory=* apply ${applyFlag} --whitespace=nowarn -`
      ]).execute({ windowsHide: true });
      return;
    }
  }
  await invoke("git_apply_hunk", { repoPath, filePath, hunk, mode });
}

export async function gitCommitAmend(repoPath: string, message?: string): Promise<void> {
  const Command = getShell();
  if (Command) {
    if (message) {
      await execGit(repoPath, "commit", "--amend", "-m", message);
    } else {
      await execGit(repoPath, "commit", "--amend", "--no-edit");
    }
    return;
  }
  await invoke("git_commit_amend", { repoPath, message: message ?? null });
}

// ---- Tag Management ----

export async function gitTagList(repoPath: string): Promise<GitTag[]> {
  const Command = getShell();
  if (Command) {
    const out = await execGit(
      repoPath,
      "tag",
      "-l",
      "--format=%(refname:short)\x1f%(objectname:short)\x1f%(subject)\x1f%(taggername)\x1f%(taggerdate:unix)"
    );
    return out.trim().split("\n").filter(Boolean).map((line) => {
      const [name, hash, message, author, timestamp] = line.split("\x1f");
      return {
        name,
        hash,
        message: message || "",
        author: author || "",
        timestamp: parseInt(timestamp, 10) || undefined,
      };
    });
  }
  return invoke<GitTag[]>("git_tag_list", { repoPath });
}

export async function gitTagCreate(repoPath: string, name: string, commitHash?: string, message?: string): Promise<void> {
  const Command = getShell();
  if (Command) {
    const args = ["tag"];
    if (message) {
      args.push("-a", name, "-m", message);
    } else {
      args.push(name);
    }
    if (commitHash) args.push(commitHash);
    await execGit(repoPath, ...args);
    return;
  }
  await invoke("git_tag_create", { repoPath, name, commitHash: commitHash ?? null, message: message ?? null });
}

export async function gitTagDelete(repoPath: string, name: string): Promise<void> {
  const Command = getShell();
  if (Command) {
    await execGit(repoPath, "tag", "-d", name);
    return;
  }
  await invoke("git_tag_delete", { repoPath, name });
}

export async function gitTagPush(repoPath: string, name?: string): Promise<void> {
  const Command = getShell();
  if (Command) {
    if (name) {
      await execGit(repoPath, "push", "origin", `refs/tags/${name}`);
    } else {
      await execGit(repoPath, "push", "origin", "--tags");
    }
    return;
  }
  await invoke("git_tag_push", { repoPath, name: name ?? null });
}

// ---- Per-File Log ----

export async function gitFileLog(repoPath: string, filePath: string, maxCount = 50): Promise<GitCommit[]> {
  const Command = getShell();
  if (Command) {
    const out = await execGit(
      repoPath,
      "log",
      `--max-count=${maxCount}`,
      "--format=%H%x1f%s%x1f%an%x1f%at",
      "--follow",
      "--",
      filePath
    );
    return out.trim().split("\n").filter(Boolean).map((line) => {
      const [hash, message, author, timestamp] = line.split("\x1f");
      return { hash, message, author, timestamp: parseInt(timestamp, 10) };
    });
  }
  return invoke<GitCommit[]>("git_file_log", { repoPath, filePath, maxCount });
}

// ---- Git Blame ----

export async function gitBlame(repoPath: string, filePath: string): Promise<GitBlameLine[]> {
  const Command = getShell();
  if (Command) {
    const out = await execGit(repoPath, "blame", "--line-porcelain", "--", filePath);
    const lines: GitBlameLine[] = [];
    const rawLines = out.split("\n");

    let curHash = "";
    let curAuthor = "";
    let curTime = 0;
    let curMsg = "";
    let lineNum = 1;

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      if (line.match(/^[0-9a-f]{40}\s/)) {
        curHash = line.split(" ")[0];
      } else if (line.startsWith("author ")) {
        curAuthor = line.substring(7);
      } else if (line.startsWith("author-time ")) {
        curTime = parseInt(line.substring(12), 10) || 0;
      } else if (line.startsWith("summary ")) {
        curMsg = line.substring(8);
      } else if (line.startsWith("\t")) {
        lines.push({
          lineNum: lineNum++,
          commitHash: curHash,
          shortHash: curHash.slice(0, 7),
          author: curAuthor,
          timestamp: curTime,
          message: curMsg,
          content: line.substring(1),
        });
      }
    }
    return lines;
  }
  return invoke<GitBlameLine[]>("git_blame", { repoPath, filePath });
}

// ---- Git Remotes ----

export async function gitRemotes(repoPath: string): Promise<GitRemote[]> {
  const Command = getShell();
  if (Command) {
    const out = await execGit(repoPath, "remote", "-v");
    const map = new Map<string, { fetchUrl: string; pushUrl: string }>();
    for (const line of out.trim().split("\n").filter(Boolean)) {
      const parts = line.split(/\s+/);
      if (parts.length >= 3) {
        const name = parts[0];
        const url = parts[1];
        const type = parts[2];
        const existing = map.get(name) || { fetchUrl: "", pushUrl: "" };
        if (type.includes("fetch")) existing.fetchUrl = url;
        if (type.includes("push")) existing.pushUrl = url;
        map.set(name, existing);
      }
    }
    return Array.from(map.entries()).map(([name, { fetchUrl, pushUrl }]) => ({
      name,
      fetchUrl: fetchUrl || pushUrl,
      pushUrl: pushUrl || fetchUrl,
    }));
  }
  return invoke<GitRemote[]>("git_remotes", { repoPath });
}

export async function gitRemoteAdd(repoPath: string, name: string, url: string): Promise<void> {
  const Command = getShell();
  if (Command) {
    await execGit(repoPath, "remote", "add", name, url);
    return;
  }
  await invoke("git_remote_add", { repoPath, name, url });
}

export async function gitRemoteRemove(repoPath: string, name: string): Promise<void> {
  const Command = getShell();
  if (Command) {
    await execGit(repoPath, "remote", "remove", name);
    return;
  }
  await invoke("git_remote_remove", { repoPath, name });
}

// ---- Git Config ----

export async function gitConfigGet(repoPath: string, key: string): Promise<string> {
  const Command = getShell();
  if (Command) {
    try {
      const out = await execGit(repoPath, "config", "--get", key);
      return out.trim();
    } catch {
      return "";
    }
  }
  return invoke<string>("git_config_get", { repoPath, key });
}

export async function gitConfigSet(repoPath: string, key: string, value: string): Promise<void> {
  const Command = getShell();
  if (Command) {
    await execGit(repoPath, "config", key, value);
    return;
  }
  await invoke("git_config_set", { repoPath, key, value });
}

// ---- Conflicts ----

export async function gitConflictFiles(repoPath: string): Promise<GitConflictFile[]> {
  const Command = getShell();
  if (Command) {
    const out = await execGit(repoPath, "status", "--porcelain");
    const conflicts: GitConflictFile[] = [];
    for (const line of out.split("\n").filter(Boolean)) {
      const code = line.substring(0, 2);
      const filePath = line.substring(3).replace(/^"|"$/g, "");
      if (code === "UU" || code === "AA" || code === "DD" || code === "AU" || code === "UA" || code === "DU" || code === "UD") {
        conflicts.push({ path: filePath, conflictType: code, resolved: false });
      }
    }
    return conflicts;
  }
  return invoke<GitConflictFile[]>("git_conflict_files", { repoPath });
}

export async function gitResolveConflict(repoPath: string, filePath: string, resolution: "ours" | "theirs" | "mark"): Promise<void> {
  const Command = getShell();
  if (Command) {
    if (resolution === "ours") {
      await execGit(repoPath, "checkout", "--ours", "--", filePath);
      await execGit(repoPath, "add", filePath);
    } else if (resolution === "theirs") {
      await execGit(repoPath, "checkout", "--theirs", "--", filePath);
      await execGit(repoPath, "add", filePath);
    } else {
      await execGit(repoPath, "add", filePath);
    }
    return;
  }
  await invoke("git_resolve_conflict", { repoPath, filePath, resolution });
}

// ---- Repository Statistics ----

export async function gitRepoStats(repoPath: string): Promise<GitRepoStats> {
  const Command = getShell();
  if (Command) {
    // 1. Shortlog for contributors
    const shortlogOut = await execGit(repoPath, "shortlog", "-sne", "--all");
    const contributors: Array<{ name: string; email: string; commits: number; additions: number; deletions: number }> = [];
    let totalCommits = 0;

    for (const line of shortlogOut.trim().split("\n").filter(Boolean)) {
      const match = line.trim().match(/^(\d+)\s+(.+?)\s+<(.+?)>$/);
      if (match) {
        const count = parseInt(match[1], 10);
        totalCommits += count;
        contributors.push({
          commits: count,
          name: match[2],
          email: match[3],
          additions: 0,
          deletions: 0,
        });
      }
    }

    // 2. Punchcard from commit timestamps
    const timestampsOut = await execGit(repoPath, "log", "--format=%at", "--max-count=1500");
    const punchcardMap = new Map<string, number>();
    for (const line of timestampsOut.trim().split("\n").filter(Boolean)) {
      const ts = parseInt(line, 10);
      if (ts) {
        const date = new Date(ts * 1000);
        const day = date.getDay(); // 0-6
        const hour = date.getHours(); // 0-23
        const key = `${day}-${hour}`;
        punchcardMap.set(key, (punchcardMap.get(key) || 0) + 1);
      }
    }

    const punchcard: Array<{ day: number; hour: number; count: number }> = [];
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        punchcard.push({ day: d, hour: h, count: punchcardMap.get(`${d}-${h}`) || 0 });
      }
    }

    // 3. Languages from git ls-files
    const filesOut = await execGit(repoPath, "ls-files");
    const langMap = new Map<string, { count: number; lines: number }>();
    let totalFiles = 0;

    for (const f of filesOut.trim().split("\n").filter(Boolean)) {
      totalFiles++;
      const ext = f.includes(".") ? f.substring(f.lastIndexOf(".") + 1).toLowerCase() : "other";
      const existing = langMap.get(ext) || { count: 0, lines: 0 };
      existing.count++;
      langMap.set(ext, existing);
    }

    const languages = Array.from(langMap.entries())
      .map(([ext, { count, lines }]) => ({
        ext,
        count,
        lines,
        percent: totalFiles > 0 ? Math.round((count / totalFiles) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return {
      totalCommits,
      totalContributors: contributors.length,
      contributors,
      punchcard,
      weeklyActivity: [],
      languages,
    };
  }

  return invoke<GitRepoStats>("git_repo_stats", { repoPath });
}

// ---- Git Bisect Flow ----

export async function gitBisectStart(repoPath: string, badHash?: string, goodHash?: string): Promise<GitBisectState> {
  const Command = getShell();
  if (Command) {
    await execGit(repoPath, "bisect", "start");
    if (badHash) {
      await execGit(repoPath, "bisect", "bad", badHash);
    }
    if (goodHash) {
      await execGit(repoPath, "bisect", "good", goodHash);
    }
    return gitBisectStatus(repoPath);
  }
  return { active: false, goodCommits: [], badCommits: [] };
}

export async function gitBisectMark(repoPath: string, status: "good" | "bad" | "skip"): Promise<GitBisectState> {
  const Command = getShell();
  if (Command) {
    await execGit(repoPath, "bisect", status);
    return gitBisectStatus(repoPath);
  }
  return { active: false, goodCommits: [], badCommits: [] };
}

export async function gitBisectReset(repoPath: string): Promise<void> {
  const Command = getShell();
  if (Command) {
    await execGit(repoPath, "bisect", "reset");
    return;
  }
}

export async function gitBisectStatus(repoPath: string): Promise<GitBisectState> {
  const Command = getShell();
  if (Command) {
    try {
      const logOut = await execGit(repoPath, "bisect", "log");
      if (!logOut.trim() || logOut.includes("We are not bisecting")) {
        return { active: false, goodCommits: [], badCommits: [] };
      }
      const lines = logOut.trim().split("\n");
      const goodCommits: string[] = [];
      const badCommits: string[] = [];
      for (const l of lines) {
        const trimmed = l.trim();
        if (trimmed.startsWith("#") || !trimmed) continue;
        const matchGood = trimmed.match(/^git bisect good ([0-9a-fA-F]+)/);
        if (matchGood) goodCommits.push(matchGood[1]);
        const matchBad = trimmed.match(/^git bisect bad ([0-9a-fA-F]+)/);
        if (matchBad) badCommits.push(matchBad[1]);
      }

      let currentCommit = "";
      let currentMessage = "";
      try {
        const headOut = await execGit(repoPath, "log", "-1", "--format=%H%x1f%s");
        const [h, s] = headOut.trim().split("\x1f");
        currentCommit = h || "";
        currentMessage = s || "";
      } catch {}

      return {
        active: true,
        currentCommit,
        currentMessage,
        goodCommits,
        badCommits,
        log: lines.filter((l) => l.trim() && !l.startsWith("#")),
      };
    } catch {
      return { active: false, goodCommits: [], badCommits: [] };
    }
  }
  return { active: false, goodCommits: [], badCommits: [] };
}

// ---- Large Blob & LFS Inspector ----

export async function gitInspectLargeBlobs(repoPath: string, limit: number = 30): Promise<GitLargeBlob[]> {
  const Command = getShell();
  if (Command) {
    try {
      const lsOut = await execGit(repoPath, "ls-tree", "-r", "-l", "--full-name", "HEAD");
      const blobs: GitLargeBlob[] = [];
      for (const line of lsOut.trim().split("\n").filter(Boolean)) {
        const tabIdx = line.indexOf("\t");
        if (tabIdx === -1) continue;
        const meta = line.substring(0, tabIdx).trim().split(/\s+/);
        const path = line.substring(tabIdx + 1).trim();
        if (meta.length >= 4 && meta[1] === "blob") {
          const hash = meta[2];
          const sizeBytes = parseInt(meta[3], 10) || 0;
          blobs.push({ hash, path, sizeBytes });
        }
      }

      blobs.sort((a, b) => b.sizeBytes - a.sizeBytes);
      return blobs.slice(0, limit);
    } catch {
      return [];
    }
  }
  return [];
}

export async function gitLfsInfo(repoPath: string): Promise<GitLfsInfo> {
  const Command = getShell();
  if (Command) {
    let installed = false;
    try {
      const v = await execGit(repoPath, "lfs", "version");
      installed = v.toLowerCase().includes("git-lfs");
    } catch {
      installed = false;
    }

    const patterns: string[] = [];
    if (installed) {
      try {
        const trackOut = await execGit(repoPath, "lfs", "track");
        for (const line of trackOut.trim().split("\n")) {
          const trimmed = line.trim();
          if (/^Listing tracked patterns/i.test(trimmed) || !trimmed) continue;
          const matchPat = trimmed.match(/^(.+?)\s+\(/);
          if (matchPat) patterns.push(matchPat[1]);
          else patterns.push(trimmed);
        }
      } catch {}
    }

    const files: Array<{ path: string; size: string; oid: string }> = [];
    if (installed) {
      try {
        const lsOut = await execGit(repoPath, "lfs", "ls-files", "-l");
        for (const line of lsOut.trim().split("\n").filter(Boolean)) {
          const parts = line.trim().split(/\s+[*|-]\s+/);
          if (parts.length >= 2) {
            files.push({ oid: parts[0], path: parts[1], size: "" });
          }
        }
      } catch {}
    }

    return { installed, patterns, files };
  }
  return { installed: false, patterns: [], files: [] };
}

export async function gitLfsTrack(repoPath: string, pattern: string): Promise<void> {
  const Command = getShell();
  if (Command) {
    await execGit(repoPath, "lfs", "track", pattern);
    await execGit(repoPath, "add", ".gitattributes");
    return;
  }
}

export async function gitLfsUntrack(repoPath: string, pattern: string): Promise<void> {
  const Command = getShell();
  if (Command) {
    await execGit(repoPath, "lfs", "untrack", pattern);
    await execGit(repoPath, "add", ".gitattributes");
    return;
  }
}

// ---- Git Patch & Archive Export ----

export async function gitCreatePatch(repoPath: string, commitHash?: string, fromHash?: string, toHash?: string): Promise<string> {
  const Command = getShell();
  if (Command) {
    if (commitHash) {
      return await execGit(repoPath, "format-patch", "-1", commitHash, "--stdout");
    }
    if (fromHash && toHash) {
      return await execGit(repoPath, "diff", `${fromHash}..${toHash}`);
    }
    return await execGit(repoPath, "diff");
  }
  return "";
}

export async function gitExportArchive(
  repoPath: string,
  ref: string,
  outputPath: string,
  format: "zip" | "tar.gz" | "tar" = "zip",
  prefix?: string
): Promise<void> {
  const Command = getShell();
  if (Command) {
    const fmt = format === "tar.gz" ? "tgz" : format;
    const args = ["archive", `--format=${fmt}`, `-o`, outputPath];
    if (prefix) {
      args.push(`--prefix=${prefix.endsWith("/") ? prefix : prefix + "/"}`);
    }
    args.push(ref || "HEAD");
    await execGit(repoPath, ...args);
    return;
  }
  await invoke("git_export_archive", { repoPath, ref, outputPath, format, prefix });
}

// ---- Remote Web Links Parser ----

export function parseRemoteWebLinks(remoteUrl: string): GitRemoteWebLinks | null {
  if (!remoteUrl) return null;
  let clean = remoteUrl.trim();
  clean = clean.replace(/\.git$/, "");

  let host = "";
  let userRepo = "";

  const sshMatch = clean.match(/^(?:ssh:\/\/)?git@([^:]+):(.+)$/);
  if (sshMatch) {
    host = sshMatch[1].toLowerCase();
    userRepo = sshMatch[2].replace(/^\/+/, "");
  } else {
    const httpMatch = clean.match(/^https?:\/\/([^/]+)\/(.+)$/);
    if (httpMatch) {
      host = httpMatch[1].toLowerCase();
      userRepo = httpMatch[2].replace(/^\/+/, "");
    }
  }

  if (!host || !userRepo) return null;

  let service: GitRemoteWebLinks["service"] = "custom";
  if (host.includes("github.com")) service = "github";
  else if (host.includes("gitlab.com")) service = "gitlab";
  else if (host.includes("bitbucket.org")) service = "bitbucket";
  else if (host.includes("codeberg.org")) service = "codeberg";
  else if (host.includes("gitea")) service = "gitea";

  const baseUrl = `https://${host}/${userRepo}`;

  return {
    service,
    repoWebUrl: baseUrl,
    commitUrl: (hash: string) => {
      if (service === "bitbucket") return `${baseUrl}/commits/${hash}`;
      if (service === "gitlab") return `${baseUrl}/-/commit/${hash}`;
      return `${baseUrl}/commit/${hash}`;
    },
    branchUrl: (branch: string) => {
      const cleanBranch = branch.replace(/^origin\//, "");
      if (service === "bitbucket") return `${baseUrl}/branch/${encodeURIComponent(cleanBranch)}`;
      if (service === "gitlab") return `${baseUrl}/-/tree/${encodeURIComponent(cleanBranch)}`;
      return `${baseUrl}/tree/${encodeURIComponent(cleanBranch)}`;
    },
    fileUrl: (path: string, ref = "HEAD") => {
      const cleanRef = ref.replace(/^origin\//, "");
      const cleanPath = path.replace(/^\.\//, "");
      if (service === "bitbucket") return `${baseUrl}/src/${encodeURIComponent(cleanRef)}/${cleanPath}`;
      if (service === "gitlab") return `${baseUrl}/-/blob/${encodeURIComponent(cleanRef)}/${cleanPath}`;
      return `${baseUrl}/blob/${encodeURIComponent(cleanRef)}/${cleanPath}`;
    },
    blameUrl: (path: string, ref = "HEAD") => {
      const cleanRef = ref.replace(/^origin\//, "");
      const cleanPath = path.replace(/^\.\//, "");
      if (service === "bitbucket") return `${baseUrl}/annotate/${encodeURIComponent(cleanRef)}/${cleanPath}`;
      if (service === "gitlab") return `${baseUrl}/-/blame/${encodeURIComponent(cleanRef)}/${cleanPath}`;
      return `${baseUrl}/blame/${encodeURIComponent(cleanRef)}/${cleanPath}`;
    },
    compareUrl: (base: string, head: string) => {
      if (service === "bitbucket") return `${baseUrl}/branches/compare/${head}%0D${base}`;
      if (service === "gitlab") return `${baseUrl}/-/compare/${base}...${head}`;
      return `${baseUrl}/compare/${base}...${head}`;
    },
  };
}

// ---- Git Reflog Flow ----

export async function gitReflog(repoPath: string, limit: number = 60): Promise<GitReflogEntry[]> {
  const Command = getShell();
  if (Command) {
    try {
      const out = await execGit(repoPath, "reflog", "show", `--format=%gd%x1f%H%x1f%gs%x1f%at`, `-n`, String(limit));
      return out.trim().split("\n").filter(Boolean).map((line, idx) => {
        const [selector, hash, gs, timestamp] = line.split("\x1f");
        let action = "commit";
        let message = gs || "";
        const colonIdx = message.indexOf(": ");
        if (colonIdx !== -1) {
          action = message.substring(0, colonIdx).trim();
          message = message.substring(colonIdx + 2).trim();
        }
        return {
          index: idx,
          selector: selector || `HEAD@{${idx}}`,
          hash: hash || "",
          action,
          message,
          timestamp: parseInt(timestamp, 10) || 0,
        };
      });
    } catch {
      return [];
    }
  }
  return [];
}

// ---- Git Pickaxe & History Grep Search ----

export async function gitPickaxeSearch(
  repoPath: string,
  query: string,
  mode: "string" | "regex" | "author" | "message" = "string",
  limit: number = 50
): Promise<GitCommit[]> {
  const Command = getShell();
  if (!query || !query.trim()) return [];
  if (Command) {
    try {
      const args = ["log", `--max-count=${limit}`, `--format=%H%x1f%s%x1f%an%x1f%at%x1f%P%x1f%D`];
      if (mode === "string") {
        args.push(`-S${query.trim()}`);
      } else if (mode === "regex") {
        args.push(`-G${query.trim()}`);
      } else if (mode === "author") {
        args.push(`--author=${query.trim()}`);
      } else if (mode === "message") {
        args.push(`--grep=${query.trim()}`);
      }
      const out = await execGit(repoPath, ...args);
      return out.trim().split("\n").filter(Boolean).map((line) => {
        const [hash, subject, author, timestamp, parentHashes, refsStr] = line.split("\x1f");
        return {
          hash,
          message: subject || "",
          author: author || "",
          timestamp: parseInt(timestamp, 10) || 0,
          parent_hashes: parentHashes ? parentHashes.split(" ") : [],
          refs: refsStr ? refsStr.split(",").map((r) => r.trim()).filter(Boolean) : [],
        };
      });
    } catch {
      return [];
    }
  }
  return [];
}

// ---- Git Submodules Management ----

export async function gitSubmoduleList(repoPath: string): Promise<GitSubmodule[]> {
  const Command = getShell();
  if (Command) {
    try {
      const configMap = new Map<string, { url: string; name: string }>();
      try {
        const configOut = await execGit(repoPath, "config", "--file", ".gitmodules", "--get-regexp", "submodule\\.");
        for (const line of configOut.trim().split("\n").filter(Boolean)) {
          const spaceIdx = line.indexOf(" ");
          if (spaceIdx === -1) continue;
          const key = line.substring(0, spaceIdx).trim();
          const val = line.substring(spaceIdx + 1).trim();
          const m = key.match(/^submodule\.(.+?)\.(url|path)$/);
          if (m) {
            const subName = m[1];
            const prop = m[2];
            const existing = configMap.get(subName) || { name: subName, url: "" };
            if (prop === "url") existing.url = val;
            configMap.set(subName, existing);
          }
        }
      } catch {}

      const statusOut = await execGit(repoPath, "submodule", "status", "--recursive");
      const list: GitSubmodule[] = [];
      for (const line of statusOut.trim().split("\n").filter(Boolean)) {
        const trimmed = line.trim();
        const prefix = line.charAt(0);
        let status: GitSubmodule["status"] = "clean";
        if (prefix === "-") status = "uninitialized";
        else if (prefix === "+") status = "modified";

        const parts = trimmed.substring(prefix === " " ? 0 : 1).trim().split(/\s+/);
        if (parts.length >= 2) {
          const commit = parts[0];
          const path = parts[1];
          const name = path.includes("/") ? path.substring(path.lastIndexOf("/") + 1) : path;
          const conf = configMap.get(name) || { url: "" };
          list.push({
            name,
            path,
            url: conf.url,
            commit,
            status,
          });
        }
      }
      return list;
    } catch {
      return [];
    }
  }
  return [];
}

export async function gitSubmoduleUpdate(repoPath: string, init: boolean = true, recursive: boolean = true): Promise<void> {
  const Command = getShell();
  if (Command) {
    const args = ["submodule", "update"];
    if (init) args.push("--init");
    if (recursive) args.push("--recursive");
    await execGit(repoPath, ...args);
  }
}

export async function gitSubmoduleAdd(repoPath: string, url: string, path: string): Promise<void> {
  const Command = getShell();
  if (Command) {
    await execGit(repoPath, "submodule", "add", url, path);
  }
}

export async function gitSubmoduleSync(repoPath: string): Promise<void> {
  const Command = getShell();
  if (Command) {
    await execGit(repoPath, "submodule", "sync", "--recursive");
  }
}

// ---- Git Client Hooks Configuration ----

const KNOWN_HOOKS = [
  "pre-commit",
  "commit-msg",
  "pre-push",
  "prepare-commit-msg",
  "post-commit",
  "post-merge",
  "post-checkout",
  "pre-rebase",
];

export async function gitHooksList(repoPath: string): Promise<GitHook[]> {
  const Command = getShell();
  if (Command) {
    const hooks: GitHook[] = [];
    for (const name of KNOWN_HOOKS) {
      let active = false;
      let content = "";
      try {
        const out = await execGit(repoPath, "rev-parse", "--git-path", `hooks/${name}`);
        const hookPath = out.trim();
        if (hookPath) {
          try {
            const shCmd = new Command("sh", ["-c", `cat "${hookPath}" 2>/dev/null || true`]);
            const res = await shCmd.execute();
            if (res.code === 0 && res.stdout && res.stdout.trim()) {
              content = res.stdout;
              active = true;
            }
          } catch {}
        }
      } catch {}

      hooks.push({
        name,
        active,
        sampleExists: true,
        content: content || `#!/bin/sh\n# ${name} hook\n# Exit with non-zero status to cancel the action\n\necho "Executing ${name}..."\n`,
      });
    }
    return hooks;
  }
  return [];
}

export async function gitHookSave(repoPath: string, hookName: string, content: string, active: boolean): Promise<void> {
  const Command = getShell();
  if (Command) {
    const out = await execGit(repoPath, "rev-parse", "--git-path", `hooks/${hookName}`);
    const hookPath = out.trim();
    if (hookPath) {
      if (active) {
        const b64 = btoa(unescape(encodeURIComponent(content)));
        const shCmd = new Command("sh", ["-c", `echo "${b64}" | base64 -d > "${hookPath}" && chmod +x "${hookPath}"`]);
        await shCmd.execute();
      } else {
        const shCmd = new Command("sh", ["-c", `rm -f "${hookPath}"`]);
        await shCmd.execute();
      }
    }
  }
}

// ---- Interactive Rebase Execution ----

export async function gitExecuteInteractiveRebasePlan(
  repoPath: string,
  baseHash: string,
  plan: GitRebaseTodoItem[]
): Promise<void> {
  const Command = getShell();
  if (Command) {
    let todoContent = "";
    for (const item of plan) {
      todoContent += `${item.action} ${item.hash} ${item.message.split("\n")[0]}\n`;
    }

    const b64 = btoa(unescape(encodeURIComponent(todoContent)));
    const script = `
      set -e
      TODO_FILE="${repoPath}/.git/flurer_rebase_todo"
      echo "${b64}" | base64 -d > "$TODO_FILE"
      export GIT_SEQUENCE_EDITOR="cp '$TODO_FILE'"
      git -C "${repoPath}" rebase -i "${baseHash}"
      rm -f "$TODO_FILE"
    `;

    const shCmd = new Command("sh", ["-c", script]);
    const res = await shCmd.execute();
    if (res.code !== 0) {
      throw new Error(res.stderr || `Rebase process failed with code ${res.code}`);
    }
  }
}

// ---- Utility: detect shell availability ----

export function hasShellPlugin(): boolean {
  return getShell() !== null;
}

