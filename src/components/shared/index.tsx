import { Show, For, createSignal, createMemo, type JSX } from "solid-js";
import { useGit } from "../../context";
import { S } from "../../styles";
import { buttonBg } from "../../utils";

export function GitIcon(props: { size?: number }) {
  return (
    <svg width={props.size ?? 20} height={props.size ?? 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="18" cy="18" r="3" />
      <circle cx="6" cy="6" r="3" />
      <path d="M13 6H9a2 2 0 0 0-2 2v7" />
      <line x1="6" y1="15" x2="9" y2="15" />
      <line x1="18" y1="9" x2="15" y2="9" />
      <path d="M15 6v6a2 2 0 0 1-2 2h-2" />
    </svg>
  );
}

export function RefreshIcon(props: { size?: number }) {
  return (
    <svg width={props.size ?? 16} height={props.size ?? 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

export function PullIcon(props: { size?: number }) {
  return (
    <svg width={props.size ?? 14} height={props.size ?? 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="21 15 21 21 3 21 3 15" />
      <polyline points="12 3 12 15" />
      <polyline points="8 11 12 15 16 11" />
    </svg>
  );
}

export function PushIcon(props: { size?: number }) {
  return (
    <svg width={props.size ?? 14} height={props.size ?? 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="21 9 21 3 3 3 3 9" />
      <polyline points="12 21 12 9" />
      <polyline points="16 13 12 9 8 13" />
    </svg>
  );
}

export function FetchIcon(props: { size?: number }) {
  return (
    <svg width={props.size ?? 14} height={props.size ?? 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

export function BranchIcon(props: { size?: number }) {
  return (
    <svg width={props.size ?? 14} height={props.size ?? 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="6" y1="3" x2="6" y2="15" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M18 9a9 9 0 0 1-9 9" />
    </svg>
  );
}

export function TrashIcon(props: { size?: number }) {
  return (
    <svg width={props.size ?? 14} height={props.size ?? 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

export function PlusIcon(props: { size?: number }) {
  return (
    <svg width={props.size ?? 14} height={props.size ?? 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function FolderIcon(props: { size?: number }) {
  return (
    <svg width={props.size ?? 24} height={props.size ?? 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function BackIcon(props: { size?: number }) {
  return (
    <svg width={props.size ?? 16} height={props.size ?? 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

export function CloseIcon(props: { size?: number }) {
  return (
    <svg width={props.size ?? 16} height={props.size ?? 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function Button(props: { variant?: "primary" | "secondary" | "danger"; size?: "sm" | "md"; disabled?: boolean; onClick?: () => void; children: JSX.Element; style?: any; title?: string }) {
  const base = { ...S.btn, ...(props.size === "sm" ? { padding: "4px 10px", "font-size": "11.5px" } : {}) };
  const variantStyle = props.variant === "danger" ? S.btnDanger : props.variant === "primary" ? S.btnPrimary : S.btnSecondary;
  return (
    <button
      type="button"
      title={props.title}
      style={{
        ...base,
        ...variantStyle,
        opacity: props.disabled ? 0.5 : 1,
        cursor: props.disabled ? "not-allowed" : "pointer",
        ...props.style,
      }}
      disabled={props.disabled}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
}

export function Card(props: { children: JSX.Element; style?: any }) {
  return <div style={{ ...S.card, width: "100%", "box-sizing": "border-box", ...props.style }}>{props.children}</div>;
}

export function Badge(props: { variant: "staged" | "unstaged" | "untracked"; count: number }) {
  const variantStyle = props.variant === "staged" ? S.stagedBadge : props.variant === "unstaged" ? S.unstagedBadge : S.untrackedBadge;
  return <span style={{ ...S.badge, ...variantStyle, "margin-left": "8px" }}>{props.count}</span>;
}

export function TabBar(props: { tabs: { id: string; label: string; count?: number }[]; activeTab: string; onSelect: (id: string) => void }) {
  return (
    <div style={S.tabBar}>
      {props.tabs.map((tab) => (
        <button
          type="button"
          style={{
            ...S.tab,
            background: props.activeTab === tab.id ? "rgba(56, 189, 248, 0.08)" : "transparent",
            ...(props.activeTab === tab.id ? S.tabActive : {}),
            border: "none",
            "border-bottom": props.activeTab === tab.id ? "2px solid var(--accent-default, #38bdf8)" : "2px solid transparent",
          }}
          onClick={() => props.onSelect(tab.id)}
        >
          {tab.label}
          <Show when={tab.count !== undefined && tab.count > 0}>
            <span style={{ ...S.badge, background: "rgba(56, 189, 248, 0.2)", color: "#38bdf8", padding: "1px 6px", "font-size": "10px", "border-radius": "999px" }}>{tab.count}</span>
          </Show>
        </button>
      ))}
    </div>
  );
}

export function Toast() {
  const ctx = useGit();
  return (
    <Show when={ctx.toast()}>
      {(t) => {
        const isSuccess = t().type === "success";
        const isInfo = t().type === "info";
        const toastStyle = isSuccess ? S.toastSuccess : (isInfo ? (S as any).toastInfo : S.toastError);
        const icon = isSuccess ? "✓" : (isInfo ? "ℹ️" : "⚠");

        return (
          <div style={{ ...S.toast, ...toastStyle, display: "inline-flex", "align-items": "center", gap: "8px" }}>
            <span style={{ "font-size": "14px" }}>{icon}</span>
            <span>{t().message}</span>
          </div>
        );
      }}
    </Show>
  );
}

export function EmptyState(props: { message: string; children?: JSX.Element }) {
  return (
    <div style={S.emptyState}>
      {props.children}
      <div style={{ margin: "10px 0 0", "font-weight": 500 }}>{props.message}</div>
    </div>
  );
}

export function Spinner(props: { size?: number }) {
  const size = props.size ?? 24;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ animation: "spin 0.8s linear infinite" }}>
      <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(56, 189, 248, 0.2)" stroke-width="2.5" />
      <path d="M12 2 A10 10 0 0 1 22 12" fill="none" stroke="var(--accent-default, #38bdf8)" stroke-width="2.5" stroke-linecap="round" />
    </svg>
  );
}

export function GlobalLoadingOverlay() {
  const ctx = useGit();
  const task = createMemo(() => ctx.busyTask());

  return (
    <Show when={task()}>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(10, 14, 23, 0.72)",
          "backdrop-filter": "blur(14px)",
          "-webkit-backdrop-filter": "blur(14px)",
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
          "z-index": 100050,
          animation: "fadeIn 0.2s ease",
        }}
      >
        <div
          style={{
            background: "rgba(15, 23, 42, 0.94)",
            border: "1px solid rgba(56, 189, 248, 0.35)",
            "box-shadow": "0 24px 60px rgba(0, 0, 0, 0.7), 0 0 35px rgba(56, 189, 248, 0.2)",
            "border-radius": "16px",
            padding: "26px 36px",
            display: "flex",
            "flex-direction": "column",
            "align-items": "center",
            gap: "14px",
            "min-width": "300px",
            "max-width": "440px",
            "text-align": "center",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Glowing Animated Spinner */}
          <div style={{ position: "relative", width: "48px", height: "48px", display: "flex", "align-items": "center", "justify-content": "center" }}>
            <div style={{ position: "absolute", inset: "-4px", "border-radius": "50%", background: "radial-gradient(circle, rgba(56, 189, 248, 0.35) 0%, transparent 70%)", filter: "blur(4px)" }} />
            <Spinner size={36} />
          </div>

          <div>
            <div style={{ "font-size": "15px", "font-weight": 700, "font-family": "Space Mono, monospace", color: "var(--text-primary, #f8fafc)", "letter-spacing": "0.3px", "margin-bottom": "6px" }}>
              {task()!.title}
            </div>
            <Show when={task()!.detail}>
              <div style={{ "font-size": "12px", color: "var(--text-secondary, #94a3b8)", "font-family": "Space Mono, monospace", "word-break": "break-word", "line-height": "1.4" }}>
                {task()!.detail}
              </div>
            </Show>
          </div>

          <button
            type="button"
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "rgba(255, 255, 255, 0.6)",
              padding: "4px 14px",
              "border-radius": "6px",
              "font-size": "11px",
              cursor: "pointer",
              "margin-top": "4px",
              transition: "all 0.15s ease",
            }}
            onClick={() => ctx.setBusyTask(null)}
          >
            Hide (Run in Background)
          </button>
        </div>
      </div>
    </Show>
  );
}

export function ComparisonBar() {
  const ctx = useGit();
  const src = createMemo(() => ctx.compareSourceHash());

  return (
    <Show when={src()}>
      <div
        style={{
          position: "sticky",
          top: "8px",
          left: 0,
          right: 0,
          margin: "0 auto 12px",
          width: "max-content",
          "max-width": "95%",
          background: "rgba(15, 23, 42, 0.94)",
          border: "1px solid rgba(168, 85, 247, 0.55)",
          "box-shadow": "0 10px 30px rgba(0,0,0,0.6), 0 0 20px rgba(168, 85, 247, 0.25)",
          "border-radius": "999px",
          padding: "6px 16px",
          display: "flex",
          "align-items": "center",
          gap: "10px",
          "font-size": "12px",
          "z-index": 1000,
          "backdrop-filter": "blur(16px)",
          "-webkit-backdrop-filter": "blur(16px)",
          animation: "fadeIn 0.2s ease",
          "flex-wrap": "wrap",
        }}
      >
        <span style={{ display: "inline-flex", "align-items": "center", gap: "6px", "font-weight": 700, color: "#e9d5ff", "font-family": "Space Mono, monospace" }}>
          <span>⚔️ Base:</span>
          <code style={{ background: "rgba(168, 85, 247, 0.25)", border: "1px solid rgba(168, 85, 247, 0.5)", color: "#c084fc", padding: "1px 7px", "border-radius": "6px", "font-size": "11px" }}>
            {src()!.slice(0, 7)}
          </code>
        </span>

        <span style={{ color: "rgba(255, 255, 255, 0.65)", "font-size": "11.5px" }}>
          Click or right-click any commit to compare
        </span>

        <div style={{ display: "inline-flex", gap: "6px", "align-items": "center" }}>
          <button
            type="button"
            style={{
              background: "rgba(56, 189, 248, 0.15)",
              border: "1px solid rgba(56, 189, 248, 0.4)",
              color: "#38bdf8",
              padding: "3px 10px",
              "border-radius": "999px",
              "font-size": "11px",
              "font-weight": 600,
              cursor: "pointer",
            }}
            onClick={() => {
              const s = src()!;
              ctx.setCompareSourceHash(null);
              ctx.loadDiffWithCurrent(s);
            }}
          >
            📍 vs HEAD
          </button>
          <button
            type="button"
            style={{
              background: "rgba(74, 222, 128, 0.15)",
              border: "1px solid rgba(74, 222, 128, 0.4)",
              color: "#4ade80",
              padding: "3px 10px",
              "border-radius": "999px",
              "font-size": "11px",
              "font-weight": 600,
              cursor: "pointer",
            }}
            onClick={() => {
              const s = src()!;
              ctx.setCompareSourceHash(null);
              ctx.loadDiffWithWorkingTree(s);
            }}
          >
            📝 vs Working Tree
          </button>
          <button
            type="button"
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              color: "#f87171",
              padding: "3px 10px",
              "border-radius": "999px",
              "font-size": "11px",
              "font-weight": 600,
              cursor: "pointer",
            }}
            onClick={() => ctx.setCompareSourceHash(null)}
          >
            ✕ Cancel
          </button>
        </div>
      </div>
    </Show>
  );
}

export function ConfirmDialog(props: { open: boolean; message: string; onConfirm: () => void; onCancel: () => void; danger?: boolean }) {
  return (
    <Show when={props.open}>
      <div style={{ position: "fixed", inset: "0", background: "rgba(0,0,0,0.65)", "backdrop-filter": "blur(12px)", "-webkit-backdrop-filter": "blur(12px)", display: "flex", "align-items": "center", "justify-content": "center", "z-index": 10000 }} onClick={props.onCancel}>
        <div style={{ ...S.card, "max-width": "380px", width: "90%", padding: "24px", "box-shadow": "0 20px 40px rgba(0,0,0,0.6)" }} onClick={(e) => e.stopPropagation()}>
          <div style={{ "font-size": "14.5px", "font-weight": 500, "line-height": "1.5", "margin-bottom": "20px", color: "var(--text-primary, var(--text-color, #f8fafc))" }}>{props.message}</div>
          <div style={{ display: "flex", gap: "10px", "justify-content": "flex-end" }}>
            <Button onClick={props.onCancel}>Cancel</Button>
            <Button variant={props.danger ? "danger" : "primary"} onClick={props.onConfirm}>Confirm</Button>
          </div>
        </div>
      </div>
    </Show>
  );
}

export function CommitContextMenu(props: {
  x: number;
  y: number;
  hash: string;
  onClose: () => void;
}) {
  const ctx = useGit();

  const handleDiffPrevious = () => {
    ctx.loadDiff(".", "commit", props.hash);
    props.onClose();
  };

  const handleDiffCurrent = () => {
    ctx.loadDiffWithCurrent(props.hash);
    props.onClose();
  };

  const handleDiffWorkingTree = () => {
    ctx.loadDiffWithWorkingTree(props.hash);
    props.onClose();
  };

  const handleCompareSelect = () => {
    const src = ctx.compareSourceHash();
    if (src && src !== props.hash) {
      ctx.loadDiffCompare(src, props.hash);
      ctx.setCompareSourceHash(null);
    } else if (src === props.hash) {
      ctx.setCompareSourceHash(null);
      ctx.showToast("Deselected comparison source", "info");
    } else {
      ctx.setCompareSourceHash(props.hash);
    }
    props.onClose();
  };

  const handleCopyHash = () => {
    navigator.clipboard?.writeText(props.hash);
    ctx.showToast(`Copied commit hash ${props.hash.slice(0, 7)}`, "success");
    props.onClose();
  };

  const handleCheckout = () => {
    ctx.checkout(props.hash);
    props.onClose();
  };

  const compareLabel = () => {
    const src = ctx.compareSourceHash();
    if (!src) return "Select for Comparison";
    if (src === props.hash) return "Deselect Comparison Source";
    return `Compare with ${src.slice(0, 7)}`;
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        "z-index": 100000,
      }}
      onClick={props.onClose}
      onContextMenu={(e) => { e.preventDefault(); props.onClose(); }}
    >
      <div
        style={{
          position: "fixed",
          top: `${Math.min(props.y, window.innerHeight - 260)}px`,
          left: `${Math.min(props.x, window.innerWidth - 260)}px`,
          background: "rgba(15, 23, 42, 0.92)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          "border-radius": "10px",
          padding: "6px",
          "box-shadow": "0 16px 36px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)",
          "backdrop-filter": "blur(16px)",
          "-webkit-backdrop-filter": "blur(16px)",
          display: "flex",
          "flex-direction": "column",
          gap: "2px",
          "min-width": "230px",
          "z-index": 100001,
          "font-size": "12.5px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          style={menuBtnStyle}
          onClick={handleDiffPrevious}
        >
          ⏮️ Diff with Previous Commit
        </button>
        <button
          type="button"
          style={menuBtnStyle}
          onClick={handleDiffCurrent}
        >
          📍 Diff with HEAD
        </button>
        <button
          type="button"
          style={menuBtnStyle}
          onClick={handleDiffWorkingTree}
        >
          📝 Diff with Working Tree
        </button>
        <div style={{ height: "1px", background: "rgba(255,255,255,0.08)", margin: "4px 0" }} />
        <button
          type="button"
          style={{
            ...menuBtnStyle,
            color: ctx.compareSourceHash() ? "#c084fc" : undefined,
            "font-weight": ctx.compareSourceHash() ? 700 : undefined,
          }}
          onClick={handleCompareSelect}
        >
          ⚔️ {compareLabel()}
        </button>
        <div style={{ height: "1px", background: "rgba(255,255,255,0.08)", margin: "4px 0" }} />
        <button
          type="button"
          style={menuBtnStyle}
          onClick={handleCopyHash}
        >
          📋 Copy Hash ({props.hash.slice(0, 7)})
        </button>
        <button
          type="button"
          style={menuBtnStyle}
          onClick={() => {
            ctx.openTagModal(props.hash);
            props.onClose();
          }}
        >
          🏷️ Create Tag at this Commit
        </button>
        <button
          type="button"
          style={menuBtnStyle}
          onClick={() => {
            ctx.showCommitDetail(props.hash);
            props.onClose();
          }}
        >
          🔍 View Commit Details
        </button>
        <button
          type="button"
          style={menuBtnStyle}
          onClick={handleCheckout}
        >
          🌿 Checkout Commit
        </button>
      </div>
    </div>
  );
}

const menuBtnStyle = {
  display: "flex",
  "align-items": "center",
  gap: "8px",
  padding: "8px 12px",
  border: "none",
  background: "transparent",
  color: "var(--text-primary, #f8fafc)",
  "font-size": "12.5px",
  "font-weight": "500",
  cursor: "pointer",
  "border-radius": "6px",
  "text-align": "left" as const,
  width: "100%",
  transition: "background 0.15s ease, color 0.15s ease",
};

export function BranchMultiSelect() {
  const ctx = useGit();
  const [open, setOpen] = createSignal(false);

  const labelText = createMemo(() => {
    if (ctx.isAllBranchesSelected()) return "Branches: All";
    const selected = ctx.selectedBranches().filter((b) => b !== "all");
    if (selected.length === 1) return `Branch: ${selected[0]}`;
    return `Branches: (${selected.length}) ${selected.join(", ")}`;
  });

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        style={{
          display: "inline-flex",
          "align-items": "center",
          gap: "6px",
          padding: "5px 12px",
          background: "rgba(255, 255, 255, 0.06)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          "border-radius": "999px",
          "font-size": "12px",
          "font-weight": 600,
          color: "var(--text-primary, #f8fafc)",
          cursor: "pointer",
          transition: "all 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
          "backdrop-filter": "blur(8px)",
        }}
        onClick={() => setOpen(!open())}
        title="Filter graph & history by specific branches"
      >
        <BranchIcon size={14} />
        <span style={{ "max-width": "180px", overflow: "hidden", "text-overflow": "ellipsis", "white-space": "nowrap" }}>
          {labelText()}
        </span>
        <span style={{ "font-size": "10px", opacity: 0.7 }}>{open() ? "▲" : "▼"}</span>
      </button>

      <Show when={open()}>
        {/* Backdrop overlay for closing dropdown */}
        <div
          style={{ position: "fixed", inset: 0, "z-index": 99990 }}
          onClick={() => setOpen(false)}
        />

        {/* Dropdown Menu */}
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            background: "rgba(15, 23, 42, 0.94)",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            "border-radius": "10px",
            padding: "8px",
            "box-shadow": "0 16px 36px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)",
            "backdrop-filter": "blur(16px)",
            "-webkit-backdrop-filter": "blur(16px)",
            "min-width": "230px",
            "max-width": "320px",
            "max-height": "340px",
            "overflow-y": "auto",
            "z-index": 99991,
            display: "flex",
            "flex-direction": "column",
            gap: "4px",
            "font-size": "12px",
          }}
        >
          <div style={{ "font-size": "10.5px", "font-weight": 700, color: "rgba(255, 255, 255, 0.5)", "text-transform": "uppercase", padding: "4px 8px", "letter-spacing": "0.6px", "font-family": "Space Mono, monospace" }}>
            Filter History by Branch
          </div>

          {/* "All" Option */}
          <div
            style={{
              display: "flex",
              "align-items": "center",
              gap: "8px",
              padding: "6px 8px",
              "border-radius": "6px",
              cursor: "pointer",
              background: ctx.isAllBranchesSelected() ? "var(--accent-bg-soft, rgba(96, 205, 255, 0.15))" : "transparent",
              color: ctx.isAllBranchesSelected() ? "var(--accent-default, #60cdff)" : "var(--text-primary, var(--text-color))",
              "font-weight": ctx.isAllBranchesSelected() ? 600 : 400,
              transition: "background 0.15s",
            }}
            onClick={() => {
              ctx.selectAllBranches();
            }}
          >
            <input
              type="checkbox"
              checked={ctx.isAllBranchesSelected()}
              readOnly
              style={{ cursor: "pointer" }}
            />
            <span style={{ flex: 1 }}>All Branches (--all)</span>
          </div>

          <div style={{ height: "1px", background: "var(--glass-border, rgba(255, 255, 255, 0.08))", margin: "4px 0" }} />

          {/* Individual Branches */}
          <For each={ctx.branches()}>
            {(b) => {
              const isSelected = () => !ctx.isAllBranchesSelected() && ctx.selectedBranches().includes(b.name);
              return (
                <div
                  style={{
                    display: "flex",
                    "align-items": "center",
                    gap: "8px",
                    padding: "6px 8px",
                    "border-radius": "6px",
                    cursor: "pointer",
                    background: isSelected() ? "var(--accent-bg-soft, rgba(96, 205, 255, 0.15))" : "transparent",
                    color: isSelected() ? "var(--accent-default, #60cdff)" : "var(--text-primary, var(--text-color))",
                    "font-weight": isSelected() ? 600 : 400,
                    transition: "background 0.15s",
                  }}
                  onClick={() => {
                    ctx.toggleBranchSelection(b.name);
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected()}
                    readOnly
                    style={{ cursor: "pointer" }}
                  />
                  <span style={{ flex: 1, overflow: "hidden", "text-overflow": "ellipsis", "white-space": "nowrap" }}>
                    {b.name}
                  </span>
                  <Show when={b.is_current}>
                    <span style={{ "font-size": "10px", padding: "1px 5px", "border-radius": "4px", background: "rgba(34,197,94,0.2)", color: "#4ade80" }}>current</span>
                  </Show>
                </div>
              );
            }}
          </For>
        </div>
      </Show>
    </div>
  );
}

const modalOptionStyle = {
  padding: "12px 14px",
  background: "var(--control-bg, rgba(255, 255, 255, 0.05))",
  border: "var(--control-border, 1px solid rgba(255, 255, 255, 0.1))",
  "border-radius": "8px",
  cursor: "pointer",
  transition: "all 0.15s ease",
};

export function DiffCompareModal() {
  const ctx = useGit();
  const hash = () => ctx.diffPromptHash();

  return (
    <Show when={hash()}>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.55)",
          "backdrop-filter": "blur(8px)",
          "z-index": 99999,
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
          padding: "16px",
        }}
        onClick={() => ctx.closeDiffPrompt()}
      >
        <div
          style={{
            background: "var(--glass-bg, rgba(30, 30, 30, 0.95))",
            border: "var(--glass-border, 1px solid rgba(255, 255, 255, 0.16))",
            "border-radius": "12px",
            padding: "20px 24px",
            width: "100%",
            "max-width": "460px",
            "box-shadow": "var(--glass-shadow, 0 16px 40px rgba(0,0,0,0.6))",
            display: "flex",
            "flex-direction": "column",
            gap: "16px",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: "flex", "align-items": "center", "justify-content": "space-between" }}>
            <div style={{ display: "flex", "align-items": "center", gap: "8px" }}>
              <span style={{ "font-size": "15px", "font-weight": 700, color: "var(--text-primary, var(--text-color))", "text-shadow": "var(--text-shadow)" }}>
                Compare Commit Diff
              </span>
              <code style={{ color: "var(--accent-default, #f59e0b)", "font-family": "Space Mono, monospace", "font-size": "12px" }}>
                {hash()!.slice(0, 7)}
              </code>
            </div>
            <button
              type="button"
              style={{ background: "transparent", border: "none", color: "var(--text-muted, #888)", cursor: "pointer", padding: "4px" }}
              onClick={() => ctx.closeDiffPrompt()}
            >
              <CloseIcon size={16} />
            </button>
          </div>

          <div style={{ "font-size": "12px", color: "var(--text-secondary, #aaa)" }}>
            Select target to compare commit <code style={{ color: "var(--accent-default, #f59e0b)" }}>{hash()!.slice(0, 7)}</code> against:
          </div>

          <div style={{ display: "flex", "flex-direction": "column", gap: "10px" }}>
            {/* Option 1: Previous Commit */}
            <div
              style={modalOptionStyle}
              onClick={() => {
                const h = hash()!;
                ctx.closeDiffPrompt();
                ctx.loadDiff(".", "commit", h);
              }}
            >
              <div style={{ "font-size": "13px", "font-weight": 600, color: "var(--text-primary, var(--text-color))" }}>
                ⏮️ Previous Commit ({hash()!.slice(0, 7)}~1 ↔ {hash()!.slice(0, 7)})
              </div>
              <div style={{ "font-size": "11px", color: "var(--text-muted, #888)", "margin-top": "2px" }}>
                Show changes introduced specifically by this commit relative to its parent.
              </div>
            </div>

            {/* Option 2: Current HEAD */}
            <div
              style={modalOptionStyle}
              onClick={() => {
                const h = hash()!;
                ctx.closeDiffPrompt();
                ctx.loadDiffWithCurrent(h);
              }}
            >
              <div style={{ "font-size": "13px", "font-weight": 600, color: "var(--text-primary, var(--text-color))" }}>
                📍 Current HEAD ({hash()!.slice(0, 7)} ↔ HEAD)
              </div>
              <div style={{ "font-size": "11px", color: "var(--text-muted, #888)", "margin-top": "2px" }}>
                Show differences between this commit and the current checked-out branch commit.
              </div>
            </div>

            {/* Option 3: Working Tree */}
            <div
              style={modalOptionStyle}
              onClick={() => {
                const h = hash()!;
                ctx.closeDiffPrompt();
                ctx.loadDiffWithWorkingTree(h);
              }}
            >
              <div style={{ "font-size": "13px", "font-weight": 600, color: "var(--text-primary, var(--text-color))" }}>
                📝 Working Tree ({hash()!.slice(0, 7)} ↔ Uncommitted Changes)
              </div>
              <div style={{ "font-size": "11px", color: "var(--text-muted, #888)", "margin-top": "2px" }}>
                Show differences between this commit and your active working directory.
              </div>
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
}

export function ShortcutsModal() {
  const ctx = useGit();

  const shortcuts = [
    { section: "Navigation & Tabs", items: [
      { key: "1", desc: "Graph View" },
      { key: "2", desc: "Changes View" },
      { key: "3", desc: "Branches View" },
      { key: "4", desc: "History View" },
      { key: "5", desc: "Diff View" },
      { key: "6", desc: "Stash View" },
      { key: "7", desc: "Worktrees View" },
    ]},
    { section: "Graph View (2D & 3D)", items: [
      { key: "F", desc: "Focus Node at Center" },
      { key: "⇧ + F", desc: "Frame Active Branch" },
      { key: "Space", desc: "Fit Full Graph" },
      { key: "Right-Click", desc: "Commit Actions & Comparison" },
    ]},
    { section: "Changes & Staging", items: [
      { key: "Ctrl + Enter", desc: "Commit Staged Changes" },
      { key: "Click File", desc: "Open Split Diff Preview" },
      { key: "Right-Click", desc: "Stage, Unstage, or Discard" },
    ]},
    { section: "General", items: [
      { key: "?", desc: "Toggle Shortcuts Cheatsheet" },
      { key: "Esc", desc: "Close Modals / Details / Cancel Comparison" },
    ]},
  ];

  return (
    <Show when={ctx.shortcutsOpen()}>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(10, 14, 23, 0.75)",
          "backdrop-filter": "blur(16px)",
          "-webkit-backdrop-filter": "blur(16px)",
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
          "z-index": 100100,
          animation: "fadeIn 0.15s ease",
        }}
        onClick={ctx.closeShortcuts}
      >
        <div
          style={{
            background: "rgba(15, 23, 42, 0.95)",
            border: "1px solid rgba(56, 189, 248, 0.35)",
            "border-radius": "16px",
            padding: "24px 28px",
            "max-width": "620px",
            width: "90%",
            "box-shadow": "0 24px 60px rgba(0,0,0,0.7), 0 0 35px rgba(56, 189, 248, 0.15)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: "flex", "align-items": "center", "justify-content": "space-between", "margin-bottom": "18px", "border-bottom": "1px solid rgba(255, 255, 255, 0.08)", "padding-bottom": "12px" }}>
            <div style={{ display: "flex", "align-items": "center", gap: "8px" }}>
              <span style={{ "font-size": "18px" }}>⌨️</span>
              <span style={{ "font-weight": 700, "font-size": "16px", color: "var(--text-primary, #f8fafc)", "font-family": "Space Mono, monospace" }}>
                Keyboard Shortcuts
              </span>
            </div>
            <button
              type="button"
              onClick={ctx.closeShortcuts}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-secondary, #94a3b8)",
                cursor: "pointer",
                "font-size": "16px",
                padding: "4px",
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: "grid", "grid-template-columns": "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px", "max-height": "60vh", overflow: "auto" }}>
            <For each={shortcuts}>
              {(sec) => (
                <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.06)", "border-radius": "10px", padding: "12px 14px" }}>
                  <div style={{ "font-size": "11px", "font-weight": 700, "font-family": "Space Mono, monospace", color: "var(--accent-default, #38bdf8)", "text-transform": "uppercase", "letter-spacing": "0.5px", "margin-bottom": "10px" }}>
                    {sec.section}
                  </div>
                  <div style={{ display: "flex", "flex-direction": "column", gap: "8px" }}>
                    <For each={sec.items}>
                      {(item) => (
                        <div style={{ display: "flex", "align-items": "center", "justify-content": "space-between", gap: "10px", "font-size": "12px" }}>
                          <span style={{ color: "var(--text-secondary, #94a3b8)" }}>{item.desc}</span>
                          <kbd style={{ background: "rgba(15, 23, 42, 0.9)", border: "1px solid rgba(255, 255, 255, 0.18)", "border-radius": "5px", padding: "2px 7px", "font-family": "Space Mono, monospace", "font-size": "11px", "font-weight": 700, color: "#f8fafc", "box-shadow": "0 2px 4px rgba(0,0,0,0.3)" }}>
                            {item.key}
                          </kbd>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>
      </div>
    </Show>
  );
}

export function StatusBar() {
  const ctx = useGit();
  const branchName = () => ctx.status()?.branch || "detached";
  const changesCount = () => ctx.status()?.changes.length || 0;
  const stagedCount = () => ctx.status()?.changes.filter((c) => c.staged).length || 0;
  const unstagedCount = () => changesCount() - stagedCount();

  return (
    <div style={S.statusBar}>
      <div style={{ display: "flex", "align-items": "center", gap: "14px", overflow: "hidden" }}>
        {/* Branch tracking badge */}
        <div style={{ display: "flex", "align-items": "center", gap: "6px", "white-space": "nowrap" }}>
          <span style={{ color: "#38bdf8", "font-weight": 700 }}>🌿 {branchName()}</span>
          <Show when={ctx.status()?.hasRemote}>
            <span style={{ color: "#4ade80", "font-size": "10.5px" }}>
              ↑{ctx.status()!.ahead} ↓{ctx.status()!.behind}
            </span>
          </Show>
        </div>

        <span style={{ opacity: 0.3 }}>|</span>

        {/* Changes summary */}
        <div style={{ display: "flex", "align-items": "center", gap: "8px", "white-space": "nowrap" }}>
          <Show when={changesCount() > 0} fallback={<span style={{ color: "#4ade80" }}>✓ Working tree clean</span>}>
            <span style={{ color: stagedCount() > 0 ? "#4ade80" : "inherit" }}>
              ● {stagedCount()} staged
            </span>
            <span style={{ color: unstagedCount() > 0 ? "#f59e0b" : "inherit" }}>
              ● {unstagedCount()} unstaged
            </span>
          </Show>
        </div>
      </div>

      <div style={{ display: "flex", "align-items": "center", gap: "12px", "white-space": "nowrap" }}>
        {/* Active view indicator */}
        <span style={{ "text-transform": "uppercase", "font-size": "10px", "font-weight": 700, padding: "1px 6px", "border-radius": "4px", background: "rgba(255, 255, 255, 0.08)", color: "var(--text-primary, #fff)" }}>
          {ctx.activeView()}
        </span>

        {/* Output Console trigger button */}
        <button
          type="button"
          onClick={ctx.toggleConsole}
          title="Toggle Git Command Output Console"
          style={{
            background: ctx.consoleOpen() ? "rgba(56, 189, 248, 0.2)" : "rgba(255, 255, 255, 0.06)",
            border: ctx.consoleOpen() ? "1px solid rgba(56, 189, 248, 0.4)" : "1px solid rgba(255, 255, 255, 0.12)",
            color: ctx.consoleOpen() ? "#38bdf8" : "var(--text-primary, #f8fafc)",
            padding: "2px 8px",
            "border-radius": "4px",
            "font-size": "10.5px",
            "font-family": "Space Mono, monospace",
            cursor: "pointer",
            display: "inline-flex",
            "align-items": "center",
            gap: "4px",
            transition: "all 0.15s ease",
          }}
        >
          <span>&gt;_</span>
          <span>Log ({ctx.commandLogs().length})</span>
        </button>

        {/* Shortcuts trigger button */}
        <button
          type="button"
          onClick={ctx.toggleShortcuts}
          title="Press '?' for keyboard shortcuts"
          style={{
            background: "rgba(255, 255, 255, 0.06)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            color: "var(--text-primary, #f8fafc)",
            padding: "2px 8px",
            "border-radius": "4px",
            "font-size": "10.5px",
            "font-family": "Space Mono, monospace",
            cursor: "pointer",
            display: "inline-flex",
            "align-items": "center",
            gap: "4px",
          }}
        >
          <span>⌨️</span>
          <span>Shortcuts [?]</span>
        </button>
      </div>
    </div>
  );
}

export function CommandConsoleModal() {
  const ctx = useGit();
  const [filterQuery, setFilterQuery] = createSignal("");
  const [expandedIds, setExpandedIds] = createSignal<Set<string>>(new Set());

  const filteredLogs = createMemo(() => {
    const q = filterQuery().toLowerCase().trim();
    if (!q) return ctx.commandLogs();
    return ctx.commandLogs().filter(
      (l) =>
        l.command.toLowerCase().includes(q) ||
        l.stdout.toLowerCase().includes(q) ||
        l.stderr.toLowerCase().includes(q)
    );
  });

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyCommand = (cmd: string, e: MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(cmd);
    ctx.showToast("Copied command to clipboard", "success");
  };

  return (
    <Show when={ctx.consoleOpen()}>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(10, 14, 23, 0.75)",
          "backdrop-filter": "blur(14px)",
          "-webkit-backdrop-filter": "blur(14px)",
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
          "z-index": 100050,
        }}
        onClick={ctx.toggleConsole}
      >
        <div
          style={{
            background: "rgba(15, 23, 42, 0.95)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            "border-radius": "12px",
            width: "880px",
            "max-width": "92vw",
            height: "640px",
            "max-height": "85vh",
            display: "flex",
            "flex-direction": "column",
            overflow: "hidden",
            "box-shadow": "0 24px 48px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Bar */}
          <div
            style={{
              padding: "14px 20px",
              background: "rgba(10, 14, 23, 0.8)",
              "border-bottom": "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              "align-items": "center",
              "justify-content": "space-between",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", "align-items": "center", gap: "10px" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  "border-radius": "6px",
                  background: "rgba(56, 189, 248, 0.15)",
                  border: "1px solid rgba(56, 189, 248, 0.3)",
                  display: "flex",
                  "align-items": "center",
                  "justify-content": "center",
                  color: "#38bdf8",
                  "font-family": "Space Mono, monospace",
                  "font-weight": 700,
                  "font-size": "13px",
                }}
              >
                &gt;_
              </div>
              <div>
                <div style={{ "font-size": "14px", "font-weight": 700, color: "#fff" }}>
                  Git Command Execution Log
                </div>
                <div style={{ "font-size": "11px", color: "rgba(255, 255, 255, 0.45)", "font-family": "Space Mono, monospace" }}>
                  Real-time transparent CLI invocation history ({ctx.commandLogs().length} commands)
                </div>
              </div>
            </div>

            <div style={{ display: "flex", "align-items": "center", gap: "8px" }}>
              <input
                type="text"
                placeholder="Filter commands or output..."
                value={filterQuery()}
                onInput={(e) => setFilterQuery(e.currentTarget.value)}
                style={{
                  padding: "6px 12px",
                  background: "rgba(0, 0, 0, 0.3)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  "border-radius": "6px",
                  color: "#fff",
                  "font-size": "12px",
                  "font-family": "Space Mono, monospace",
                  width: "220px",
                  outline: "none",
                }}
              />
              <Button size="sm" onClick={ctx.clearCommandLogs}>
                Clear
              </Button>
              <button
                type="button"
                onClick={ctx.toggleConsole}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "rgba(255, 255, 255, 0.6)",
                  cursor: "pointer",
                  "font-size": "16px",
                  padding: "4px 8px",
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Console Content */}
          <div
            style={{
              flex: 1,
              overflow: "auto",
              padding: "12px 16px",
              background: "#080c14",
              display: "flex",
              "flex-direction": "column",
              gap: "8px",
            }}
          >
            <Show
              when={filteredLogs().length > 0}
              fallback={
                <div style={{ padding: "48px 20px", "text-align": "center", color: "rgba(255, 255, 255, 0.4)", "font-family": "Space Mono, monospace", "font-size": "12.5px" }}>
                  No git commands recorded yet. Execute actions to view live output logs.
                </div>
              }
            >
              <For each={filteredLogs()}>
                {(log) => {
                  const isExpanded = () => expandedIds().has(log.id);
                  const isSuccess = log.exitCode === 0;
                  const hasOutput = log.stdout.trim().length > 0 || log.stderr.trim().length > 0;
                  const timeStr = new Date(log.timestamp).toLocaleTimeString();

                  return (
                    <div
                      style={{
                        background: "rgba(15, 23, 42, 0.7)",
                        border: `1px solid ${isSuccess ? "rgba(255, 255, 255, 0.08)" : "rgba(239, 68, 68, 0.3)"}`,
                        "border-radius": "8px",
                        overflow: "hidden",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {/* Command Line Header */}
                      <div
                        style={{
                          padding: "8px 12px",
                          display: "flex",
                          "align-items": "center",
                          "justify-content": "space-between",
                          gap: "8px",
                          cursor: hasOutput ? "pointer" : "default",
                          background: isExpanded() ? "rgba(0,0,0,0.3)" : "transparent",
                        }}
                        onClick={() => hasOutput && toggleExpand(log.id)}
                      >
                        <div style={{ display: "flex", "align-items": "center", gap: "8px", flex: 1, overflow: "hidden" }}>
                          {/* Exit code badge */}
                          <span
                            style={{
                              "font-size": "10px",
                              "font-weight": 700,
                              padding: "2px 6px",
                              "border-radius": "4px",
                              background: isSuccess ? "rgba(52, 211, 153, 0.15)" : "rgba(239, 68, 68, 0.2)",
                              color: isSuccess ? "#34d399" : "#f87171",
                              "font-family": "Space Mono, monospace",
                            }}
                          >
                            {isSuccess ? "✓ 0" : `✗ ${log.exitCode}`}
                          </span>

                          <span style={{ "font-size": "10.5px", color: "rgba(255, 255, 255, 0.35)", "font-family": "Space Mono, monospace" }}>
                            {timeStr}
                          </span>

                          <span
                            style={{
                              "font-family": "Space Mono, monospace",
                              "font-size": "12px",
                              "font-weight": 600,
                              color: "#38bdf8",
                              overflow: "hidden",
                              "text-overflow": "ellipsis",
                              "white-space": "nowrap",
                            }}
                          >
                            $ {log.command}
                          </span>
                        </div>

                        <div style={{ display: "flex", "align-items": "center", gap: "8px" }}>
                          <span style={{ "font-size": "10.5px", color: "rgba(255, 255, 255, 0.4)", "font-family": "Space Mono, monospace" }}>
                            {log.durationMs}ms
                          </span>
                          <button
                            type="button"
                            onClick={(e) => copyCommand(log.command, e)}
                            style={{
                              background: "rgba(255, 255, 255, 0.05)",
                              border: "1px solid rgba(255, 255, 255, 0.1)",
                              color: "rgba(255, 255, 255, 0.7)",
                              padding: "2px 6px",
                              "border-radius": "4px",
                              "font-size": "10px",
                              cursor: "pointer",
                              "font-family": "Space Mono, monospace",
                            }}
                            title="Copy command"
                          >
                            📋
                          </button>
                          <Show when={hasOutput}>
                            <span style={{ "font-size": "11px", color: "rgba(255, 255, 255, 0.4)" }}>
                              {isExpanded() ? "▲" : "▼"}
                            </span>
                          </Show>
                        </div>
                      </div>

                      {/* Expandable Output Drawer */}
                      <Show when={isExpanded() && hasOutput}>
                        <div
                          style={{
                            padding: "10px 14px",
                            background: "#030712",
                            "border-top": "1px solid rgba(255, 255, 255, 0.06)",
                            "font-family": "Space Mono, monospace",
                            "font-size": "11px",
                            "line-height": "17px",
                            "white-space": "pre-wrap",
                            "word-break": "break-all",
                            "max-height": "220px",
                            overflow: "auto",
                          }}
                        >
                          <Show when={log.stdout}>
                            <div style={{ color: "var(--text-primary, #e2e8f0)" }}>{log.stdout}</div>
                          </Show>
                          <Show when={log.stderr}>
                            <div style={{ color: "#fca5a5", "margin-top": log.stdout ? "6px" : 0 }}>{log.stderr}</div>
                          </Show>
                        </div>
                      </Show>
                    </div>
                  );
                }}
              </For>
            </Show>
          </div>
        </div>
      </div>
    </Show>
  );
}

export function TagManagementModal() {
  const ctx = useGit();
  const [tagName, setTagName] = createSignal("");
  const [tagMessage, setTagMessage] = createSignal("");
  const [searchFilter, setSearchFilter] = createSignal("");

  onMount(() => {
    ctx.loadTags();
  });

  const targetHash = () => ctx.tagModalCommit() || "HEAD";

  const handleCreate = async () => {
    const name = tagName().trim();
    if (!name) return;
    await ctx.createTag(name, ctx.tagModalCommit() || undefined, tagMessage().trim() || undefined);
    setTagName("");
    setTagMessage("");
  };

  const filteredTags = createMemo(() => {
    const q = searchFilter().toLowerCase().trim();
    if (!q) return ctx.tags();
    return ctx.tags().filter(
      (t) => t.name.toLowerCase().includes(q) || (t.message && t.message.toLowerCase().includes(q))
    );
  });

  return (
    <Show when={ctx.tagModalCommit() !== null}>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(10, 14, 23, 0.75)",
          "backdrop-filter": "blur(14px)",
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
          "z-index": 100050,
        }}
        onClick={ctx.closeTagModal}
      >
        <div
          style={{
            background: "rgba(15, 23, 42, 0.96)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            "border-radius": "12px",
            width: "620px",
            "max-width": "90vw",
            "max-height": "82vh",
            display: "flex",
            "flex-direction": "column",
            overflow: "hidden",
            "box-shadow": "0 24px 48px rgba(0,0,0,0.7)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              padding: "16px 20px",
              background: "rgba(10, 14, 23, 0.8)",
              "border-bottom": "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              "align-items": "center",
              "justify-content": "space-between",
            }}
          >
            <div style={{ display: "flex", "align-items": "center", gap: "10px" }}>
              <span style={{ "font-size": "18px" }}>🏷️</span>
              <div>
                <div style={{ "font-size": "15px", "font-weight": 700, color: "#fff" }}>
                  Tag Management
                </div>
                <div style={{ "font-size": "11.5px", color: "rgba(255, 255, 255, 0.45)", "font-family": "Space Mono, monospace" }}>
                  Target commit: {targetHash()?.slice(0, 8)}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={ctx.closeTagModal}
              style={{ background: "transparent", border: "none", color: "rgba(255, 255, 255, 0.6)", cursor: "pointer", "font-size": "16px", padding: "4px" }}
            >
              ✕
            </button>
          </div>

          {/* Form */}
          <div style={{ padding: "16px 20px", "border-bottom": "1px solid rgba(255, 255, 255, 0.08)", display: "flex", "flex-direction": "column", gap: "10px" }}>
            <div style={{ "font-size": "12.5px", "font-weight": 700, color: "var(--text-primary, #f8fafc)" }}>
              Create New Tag
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                placeholder="v1.0.0, release-2026..."
                value={tagName()}
                onInput={(e) => setTagName(e.currentTarget.value)}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  background: "rgba(0, 0, 0, 0.3)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  "border-radius": "6px",
                  color: "#fff",
                  "font-size": "12px",
                  "font-family": "Space Mono, monospace",
                }}
              />
              <Button variant="primary" onClick={handleCreate} disabled={!tagName().trim()}>
                Create Tag
              </Button>
            </div>
            <input
              type="text"
              placeholder="Optional annotation message..."
              value={tagMessage()}
              onInput={(e) => setTagMessage(e.currentTarget.value)}
              style={{
                padding: "6px 12px",
                background: "rgba(0, 0, 0, 0.2)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                "border-radius": "6px",
                color: "#fff",
                "font-size": "11.5px",
                "font-family": "Space Mono, monospace",
              }}
            />
          </div>

          {/* Existing Tags List */}
          <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>
            <div style={{ display: "flex", "align-items": "center", "justify-content": "space-between", "margin-bottom": "12px" }}>
              <div style={{ "font-size": "12px", "font-weight": 700, color: "rgba(255, 255, 255, 0.7)" }}>
                Existing Tags ({ctx.tags().length})
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  placeholder="Filter tags..."
                  value={searchFilter()}
                  onInput={(e) => setSearchFilter(e.currentTarget.value)}
                  style={{
                    padding: "4px 8px",
                    background: "rgba(0, 0, 0, 0.3)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    "border-radius": "4px",
                    color: "#fff",
                    "font-size": "11px",
                    "font-family": "Space Mono, monospace",
                    width: "140px",
                  }}
                />
                <Button size="sm" onClick={() => ctx.pushTags()}>
                  Push All Tags ↗
                </Button>
              </div>
            </div>

            <Show
              when={filteredTags().length > 0}
              fallback={
                <div style={{ padding: "32px 0", "text-align": "center", color: "rgba(255, 255, 255, 0.4)", "font-size": "12px" }}>
                  No tags found in this repository.
                </div>
              }
            >
              <div style={{ display: "flex", "flex-direction": "column", gap: "6px" }}>
                <For each={filteredTags()}>
                  {(tag) => (
                    <div
                      style={{
                        padding: "8px 12px",
                        background: "rgba(255, 255, 255, 0.03)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        "border-radius": "6px",
                        display: "flex",
                        "align-items": "center",
                        "justify-content": "space-between",
                        gap: "8px",
                      }}
                    >
                      <div style={{ display: "flex", "align-items": "center", gap: "8px", overflow: "hidden" }}>
                        <span style={{ "font-weight": 700, color: "#38bdf8", "font-family": "Space Mono, monospace", "font-size": "12.5px" }}>
                          🏷️ {tag.name}
                        </span>
                        <span style={{ "font-size": "11px", color: "rgba(255, 255, 255, 0.4)", "font-family": "Space Mono, monospace" }}>
                          @{tag.hash.slice(0, 7)}
                        </span>
                        <Show when={tag.message}>
                          <span style={{ "font-size": "11.5px", color: "rgba(255, 255, 255, 0.7)", overflow: "hidden", "text-overflow": "ellipsis", "white-space": "nowrap" }}>
                            — {tag.message}
                          </span>
                        </Show>
                      </div>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          type="button"
                          onClick={() => ctx.pushTags(tag.name)}
                          style={{ background: "transparent", border: "1px solid rgba(255, 255, 255, 0.1)", color: "rgba(255, 255, 255, 0.8)", padding: "2px 8px", "border-radius": "4px", "font-size": "10.5px", cursor: "pointer" }}
                          title="Push this tag to origin"
                        >
                          Push
                        </button>
                        <button
                          type="button"
                          onClick={() => ctx.deleteTag(tag.name)}
                          style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#f87171", padding: "2px 8px", "border-radius": "4px", "font-size": "10.5px", cursor: "pointer" }}
                          title="Delete tag"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </div>
        </div>
      </div>
    </Show>
  );
}

export function FileLogModal() {
  const ctx = useGit();
  const fileLog = () => ctx.fileLogModal();

  return (
    <Show when={fileLog()}>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(10, 14, 23, 0.75)",
          "backdrop-filter": "blur(14px)",
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
          "z-index": 100050,
        }}
        onClick={ctx.closeFileLog}
      >
        <div
          style={{
            background: "rgba(15, 23, 42, 0.96)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            "border-radius": "12px",
            width: "780px",
            "max-width": "92vw",
            height: "580px",
            "max-height": "85vh",
            display: "flex",
            "flex-direction": "column",
            overflow: "hidden",
            "box-shadow": "0 24px 48px rgba(0,0,0,0.7)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              padding: "16px 20px",
              background: "rgba(10, 14, 23, 0.8)",
              "border-bottom": "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              "align-items": "center",
              "justify-content": "space-between",
            }}
          >
            <div style={{ display: "flex", "align-items": "center", gap: "10px", overflow: "hidden" }}>
              <span style={{ "font-size": "18px" }}>📜</span>
              <div style={{ overflow: "hidden" }}>
                <div style={{ "font-size": "14px", "font-weight": 700, color: "#fff", overflow: "hidden", "text-overflow": "ellipsis", "white-space": "nowrap" }}>
                  File History: {fileLog()!.path}
                </div>
                <div style={{ "font-size": "11.5px", color: "rgba(255, 255, 255, 0.45)", "font-family": "Space Mono, monospace" }}>
                  {fileLog()!.commits.length} commits modifying this file
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={ctx.closeFileLog}
              style={{ background: "transparent", border: "none", color: "rgba(255, 255, 255, 0.6)", cursor: "pointer", "font-size": "16px", padding: "4px" }}
            >
              ✕
            </button>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflow: "auto", padding: "12px 16px", display: "flex", "flex-direction": "column", gap: "6px" }}>
            <For each={fileLog()!.commits}>
              {(c) => (
                <div
                  style={{
                    padding: "10px 14px",
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    "border-radius": "8px",
                    display: "flex",
                    "align-items": "center",
                    "justify-content": "space-between",
                    gap: "12px",
                  }}
                >
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div style={{ display: "flex", "align-items": "center", gap: "8px", "margin-bottom": "4px" }}>
                      <span style={{ "font-family": "Space Mono, monospace", "font-size": "11px", color: "#38bdf8", "font-weight": 700 }}>
                        {c.hash.slice(0, 7)}
                      </span>
                      <span style={{ "font-size": "11px", color: "rgba(255, 255, 255, 0.45)" }}>
                        {c.author} • {formatRelativeDate(c.timestamp)}
                      </span>
                    </div>
                    <div style={{ "font-size": "12.5px", color: "var(--text-primary, #f8fafc)", overflow: "hidden", "text-overflow": "ellipsis", "white-space": "nowrap", "font-weight": 500 }}>
                      {c.message}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <Button
                      size="sm"
                      onClick={() => {
                        ctx.loadDiff(fileLog()!.path, "commit", c.hash);
                        ctx.switchView("diff");
                        ctx.closeFileLog();
                      }}
                    >
                      Inspect Diff ↗
                    </Button>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>
      </div>
    </Show>
  );
}

export function BlameModal() {
  const ctx = useGit();
  const blame = () => ctx.blameModal();

  return (
    <Show when={blame()}>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(10, 14, 23, 0.75)",
          "backdrop-filter": "blur(14px)",
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
          "z-index": 100050,
        }}
        onClick={ctx.closeBlame}
      >
        <div
          style={{
            background: "rgba(15, 23, 42, 0.96)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            "border-radius": "12px",
            width: "980px",
            "max-width": "94vw",
            height: "720px",
            "max-height": "88vh",
            display: "flex",
            "flex-direction": "column",
            overflow: "hidden",
            "box-shadow": "0 24px 48px rgba(0,0,0,0.7)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              padding: "16px 20px",
              background: "rgba(10, 14, 23, 0.8)",
              "border-bottom": "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              "align-items": "center",
              "justify-content": "space-between",
            }}
          >
            <div style={{ display: "flex", "align-items": "center", gap: "10px", overflow: "hidden" }}>
              <span style={{ "font-size": "18px" }}>🔍</span>
              <div style={{ overflow: "hidden" }}>
                <div style={{ "font-size": "14px", "font-weight": 700, color: "#fff", overflow: "hidden", "text-overflow": "ellipsis", "white-space": "nowrap" }}>
                  Git Blame: {blame()!.path}
                </div>
                <div style={{ "font-size": "11.5px", color: "rgba(255, 255, 255, 0.45)", "font-family": "Space Mono, monospace" }}>
                  {blame()!.lines.length} annotated lines
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={ctx.closeBlame}
              style={{ background: "transparent", border: "none", color: "rgba(255, 255, 255, 0.6)", cursor: "pointer", "font-size": "16px", padding: "4px" }}
            >
              ✕
            </button>
          </div>

          {/* Line by line Blame View */}
          <div style={{ flex: 1, overflow: "auto", background: "#080c14", padding: "8px 0" }}>
            <For each={blame()!.lines}>
              {(l) => (
                <div
                  style={{
                    display: "flex",
                    "font-family": "Space Mono, monospace",
                    "font-size": "11.5px",
                    "line-height": "20px",
                    "border-bottom": "1px solid rgba(255,255,255,0.02)",
                    "&:hover": { background: "rgba(255,255,255,0.04)" },
                  }}
                >
                  {/* Blame Gutter Info */}
                  <div
                    style={{
                      width: "320px",
                      display: "flex",
                      "align-items": "center",
                      gap: "8px",
                      padding: "0 10px",
                      background: "rgba(15, 23, 42, 0.6)",
                      "border-right": "1px solid rgba(255, 255, 255, 0.08)",
                      color: "rgba(255, 255, 255, 0.55)",
                      "flex-shrink": 0,
                      overflow: "hidden",
                    }}
                    title={`${l.author} (${formatRelativeDate(l.timestamp)}): ${l.message}`}
                  >
                    <span
                      style={{ color: "#38bdf8", cursor: "pointer", "font-weight": 600 }}
                      onClick={() => {
                        ctx.showCommitDetail(l.commitHash);
                      }}
                    >
                      {l.shortHash}
                    </span>
                    <span style={{ color: "rgba(255, 255, 255, 0.8)", overflow: "hidden", "text-overflow": "ellipsis", "white-space": "nowrap", "max-width": "110px" }}>
                      {l.author}
                    </span>
                    <span style={{ "font-size": "10.5px", color: "rgba(255, 255, 255, 0.35)", "white-space": "nowrap" }}>
                      {formatRelativeDate(l.timestamp)}
                    </span>
                  </div>

                  {/* Line Number */}
                  <div style={{ width: "45px", "text-align": "right", padding: "0 8px", color: "rgba(255, 255, 255, 0.3)", "flex-shrink": 0, "user-select": "none" }}>
                    {l.lineNum}
                  </div>

                  {/* Source Code Content */}
                  <div style={{ flex: 1, padding: "0 12px", color: "var(--text-primary, #f8fafc)", "white-space": "pre-wrap", "word-break": "break-all" }}>
                    {l.content}
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>
      </div>
    </Show>
  );
}

