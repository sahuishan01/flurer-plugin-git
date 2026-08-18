import { Show, Switch, Match, createMemo, onMount, onCleanup } from "solid-js";
import { useGit } from "../context";
import { basename } from "../utils";
import {
  GitIcon, RefreshIcon, PullIcon, PushIcon, FetchIcon, CloseIcon,
  BranchIcon, Button, TabBar, BranchMultiSelect, DiffCompareModal,
  Toast, ComparisonBar, GlobalLoadingOverlay, StatusBar, ShortcutsModal,
  CommandConsoleModal, TagManagementModal, FileLogModal, BlameModal,
} from "./shared";
import { S } from "../styles";
import { ChangesView } from "./ChangesView";
import { DiffView } from "./DiffView";
import { BranchesView } from "./BranchesView";
import { HistoryView } from "./HistoryView";
import { GraphView } from "./GraphView";
import { StashView } from "./StashView";
import { WorktreesView } from "./WorktreesView";

const TABS = [
  { id: "graph", label: "Graph" },
  { id: "changes", label: "Changes" },
  { id: "branches", label: "Branches" },
  { id: "history", label: "History" },
  { id: "diff", label: "Diff" },
  { id: "stash", label: "Stash" },
  { id: "worktrees", label: "Worktrees" },
];

type RepoViewProps = {
  onClose: () => void;
};

export function RepoView(props: RepoViewProps) {
  const ctx = useGit();

  const repoName = createMemo(() => {
    const p = ctx.repoPath();
    return p ? basename(p) : "";
  });

  const changeCount = createMemo(() => {
    const s = ctx.status();
    return s ? s.changes.length : 0;
  });

  function handleTabSelect(id: string) {
    ctx.switchView(id as any);
  }

  const tabsWithCount = createMemo(() =>
    TABS.map((t) => ({
      ...t,
      count: t.id === "changes" ? changeCount() : undefined,
    }))
  );

  onMount(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);

      if (e.key === "Escape") {
        if (ctx.consoleOpen()) {
          ctx.toggleConsole();
          return;
        }
        if (ctx.tagModalCommit() !== null) {
          ctx.closeTagModal();
          return;
        }
        if (ctx.fileLogModal() !== null) {
          ctx.closeFileLog();
          return;
        }
        if (ctx.blameModal() !== null) {
          ctx.closeBlame();
          return;
        }
        if (ctx.shortcutsOpen()) {
          ctx.closeShortcuts();
          return;
        }
        if (ctx.commitDetail()) {
          ctx.closeCommitDetail();
          return;
        }
        if (ctx.diffPromptHash()) {
          ctx.closeDiffPrompt();
          return;
        }
        if (ctx.compareSourceHash()) {
          ctx.setCompareSourceHash(null);
          return;
        }
      }

      if (isInput) return;

      if (e.key === "?") {
        ctx.toggleShortcuts();
        return;
      }

      const num = parseInt(e.key, 10);
      if (!isNaN(num) && num >= 1 && num <= TABS.length) {
        ctx.switchView(TABS[num - 1].id as any);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    onCleanup(() => window.removeEventListener("keydown", handleGlobalKeyDown));
  });

  return (
    <div style={{ height: "100%", width: "100%", display: "flex", "flex-direction": "column", overflow: "hidden", "box-sizing": "border-box", position: "relative" }}>
      <div style={{ ...S.section, "border-bottom": "1px solid rgba(255, 255, 255, 0.08)", "flex-shrink": 0, background: "rgba(10, 14, 23, 0.65)", "backdrop-filter": "blur(16px)" }}>
        <div style={S.toolbar}>
          <Button onClick={props.onClose} size="sm" title="Close repository tab">
            <CloseIcon size={14} />
          </Button>
          <div style={{ width: "32px", height: "32px", "border-radius": "8px", background: "linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(14, 165, 233, 0.1))", border: "1px solid rgba(56, 189, 248, 0.3)", display: "flex", "align-items": "center", "justify-content": "center", color: "#38bdf8", "flex-shrink": 0 }}>
            <GitIcon size={18} />
          </div>
          <div style={{ flex: 1, overflow: "hidden", "min-width": "160px" }}>
            <h2 style={{ margin: 0, "font-size": "15px", "font-weight": 700, "white-space": "nowrap", overflow: "hidden", "text-overflow": "ellipsis", color: "var(--text-primary, #f8fafc)", "letter-spacing": "0.2px" }}>{repoName()}</h2>
            <div style={{ "font-size": "11px", color: "rgba(255, 255, 255, 0.45)", "font-family": "Space Mono, monospace", "white-space": "nowrap", overflow: "hidden", "text-overflow": "ellipsis" }}>{ctx.repoPath()}</div>
          </div>
          <Show when={ctx.status()}>
            {(s) => (
              <div style={{ display: "flex", "align-items": "center", gap: "8px", "flex-wrap": "wrap" }}>
                <span style={S.branchBadge}>
                  <BranchIcon size={13} />
                  <span>{s().branch}</span>
                  <Show when={s().hasRemote}>
                    <span style={{ "font-size": "10.5px", "margin-left": "4px", padding: "1px 5px", "border-radius": "4px", background: "rgba(0, 0, 0, 0.25)", color: "#ffffff" }}>
                      ↑{s().ahead} ↓{s().behind}
                    </span>
                  </Show>
                </span>
                <BranchMultiSelect />
                <Button variant="secondary" size="sm" onClick={ctx.pull} disabled={ctx.loading()} title="Pull remote changes">
                  <PullIcon size={13} /> Pull
                </Button>
                <Button variant="primary" size="sm" onClick={ctx.push} disabled={ctx.loading()} title="Push commits to remote">
                  <PushIcon size={13} /> Push
                </Button>
                <Button variant="secondary" size="sm" onClick={ctx.fetchRemote} disabled={ctx.loading()} title="Fetch remote branches">
                  <FetchIcon size={13} /> Fetch
                </Button>
                <Button variant="secondary" size="sm" onClick={ctx.refresh} disabled={ctx.loading()} title="Refresh git status">
                  <RefreshIcon size={13} />
                </Button>
              </div>
            )}
          </Show>
        </div>
      </div>

      <Show when={ctx.error()}>
        {(e) => (
          <div style={{ ...S.statusMsg, background: "rgba(239, 68, 68, 0.15)", color: "#fca5a5", border: "1px solid rgba(239, 68, 68, 0.3)", "margin": "8px 24px 0", "font-size": "12px", display: "flex", "align-items": "center", "justify-content": "space-between", gap: "12px", "flex-wrap": "wrap" }}>
            <div style={{ flex: 1, "min-width": "240px", "line-height": "1.4" }}>{e()}</div>
            <Show when={ctx.isDubiousOwnership()}>
              <Button variant="primary" size="sm" onClick={ctx.trustRepository} disabled={ctx.loading()}>
                🛡️ Trust Repository (safe.directory)
              </Button>
            </Show>
          </div>
        )}
      </Show>

      <TabBar tabs={tabsWithCount()} activeTab={ctx.activeView()} onSelect={handleTabSelect} />

      <ComparisonBar />

      <Show when={ctx.loading() && !ctx.status()}>
        <div style={{ ...S.emptyState, "padding-top": "60px" }}>
          <div style={{ "font-size": "14px", opacity: 0.6 }}>Loading repository status…</div>
        </div>
      </Show>

      <div style={{ flex: 1, width: "100%", overflow: "auto", "box-sizing": "border-box" }}>
        <Switch fallback={<GraphView />}>
          <Match when={ctx.activeView() === "graph"}><GraphView /></Match>
          <Match when={ctx.activeView() === "changes"}><ChangesView /></Match>
          <Match when={ctx.activeView() === "branches"}><BranchesView /></Match>
          <Match when={ctx.activeView() === "history"}><HistoryView /></Match>
          <Match when={ctx.activeView() === "diff"}><DiffView /></Match>
          <Match when={ctx.activeView() === "stash"}><StashView /></Match>
          <Match when={ctx.activeView() === "worktrees"}><WorktreesView /></Match>
        </Switch>
      </div>

      <StatusBar />
      <DiffCompareModal />
      <ShortcutsModal />
      <CommandConsoleModal />
      <TagManagementModal />
      <FileLogModal />
      <BlameModal />
      <GlobalLoadingOverlay />
      <Toast />
    </div>
  );
}