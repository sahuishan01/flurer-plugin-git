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
      {(t) => (
        <div style={{ ...S.toast, ...(t().type === "success" ? S.toastSuccess : S.toastError) }}>
          <span style={{ "margin-right": "8px" }}>{t().type === "success" ? "✓" : "⚠"}</span>
          {t().message}
        </div>
      )}
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
  const size = props.size ?? 20;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ animation: "spin 1s linear infinite" }}>
      <circle cx="12" cy="12" r="10" fill="none" stroke="var(--accent-default, #38bdf8)" stroke-width="2.5" stroke-dasharray="31.4 31.4" />
    </svg>
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
    } else {
      ctx.setCompareSourceHash(props.hash);
    }
    props.onClose();
  };

  const handleCopyHash = () => {
    navigator.clipboard?.writeText(props.hash);
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
          style={menuBtnStyle}
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

