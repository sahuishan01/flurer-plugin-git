import type { GitGraphEntry } from "./types";

function hashPath(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function getShell() {
  const win = window as any;
  const shell = win.TauriShell || win.__TAURI_PLUGIN_SHELL__ || win.__TAURI__?.shell;
  return shell?.Command || null;
}

export interface CachedGraph {
  repoPath: string;
  updatedAt: number;
  entries: GitGraphEntry[];
}

export async function loadGraphCache(repoPath: string): Promise<GitGraphEntry[] | null> {
  const key = `flurer_git_graph_${hashPath(repoPath)}`;
  
  // 1. Try local storage first (instant synchronous read)
  try {
    const local = localStorage.getItem(key);
    if (local) {
      const parsed: CachedGraph = JSON.parse(local);
      if (parsed && Array.isArray(parsed.entries) && parsed.entries.length > 0) {
        return parsed.entries;
      }
    }
  } catch {}

  // 2. Try disk file fallback ~/.config/flurer/git-cache/<key>.json
  const Command = getShell();
  if (Command) {
    try {
      const fileName = `${hashPath(repoPath)}.json`;
      const cmd = Command.create("sh", ["-c", `cat "$HOME/.config/flurer/git-cache/${fileName}"`]);
      const res = await cmd.execute({ windowsHide: true });
      if (res.code === 0 && res.stdout.trim()) {
        const parsed: CachedGraph = JSON.parse(res.stdout);
        if (parsed && Array.isArray(parsed.entries) && parsed.entries.length > 0) {
          // Re-populate localStorage for ultra-fast next load
          try { localStorage.setItem(key, JSON.stringify(parsed)); } catch {}
          return parsed.entries;
        }
      }
    } catch {}
  }

  return null;
}

export async function saveGraphCache(repoPath: string, entries: GitGraphEntry[]): Promise<void> {
  if (!entries || entries.length === 0) return;
  const key = `flurer_git_graph_${hashPath(repoPath)}`;
  const payload: CachedGraph = {
    repoPath,
    updatedAt: Date.now(),
    entries,
  };

  const jsonStr = JSON.stringify(payload);

  // 1. Persist to localStorage
  try {
    localStorage.setItem(key, jsonStr);
  } catch (e) {
    console.warn("localStorage save error:", e);
  }

  // 2. Persist to ~/.config/flurer/git-cache/<key>.json
  const Command = getShell();
  if (Command) {
    try {
      const fileName = `${hashPath(repoPath)}.json`;
      const safeJson = jsonStr.replace(/'/g, "'\\''");
      const script = `mkdir -p "$HOME/.config/flurer/git-cache" && printf '%s' '${safeJson}' > "$HOME/.config/flurer/git-cache/${fileName}"`;
      const cmd = Command.create("sh", ["-c", script]);
      await cmd.execute({ windowsHide: true });
    } catch (e) {
      console.warn("Disk cache save error:", e);
    }
  }
}
