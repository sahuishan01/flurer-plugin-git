import { createSignal, For, Show, onMount } from "solid-js";
import { surfaceBg } from "../utils";
import { FolderIcon, CloseIcon, Button } from "./shared";

export function DirectoryPickerModal(props: {
  open: boolean;
  initialPath?: string;
  onSelect: (path: string) => void;
  onClose: () => void;
}) {
  const [currentPath, setCurrentPath] = createSignal(props.initialPath || "/home/opc");
  const [items, setItems] = createSignal<{ name: string; is_dir: boolean; path: string }[]>([]);
  const [loading, setLoading] = createSignal(false);

  async function loadDir(dirPath: string) {
    setLoading(true);
    setCurrentPath(dirPath);
    try {
      if (window.TauriCore?.invoke) {
        const res = await window.TauriCore.invoke<any[]>("list_directory", { path: dirPath });
        if (Array.isArray(res)) {
          const dirs = res
            .filter((item) => item.is_dir || item.isDir)
            .map((item) => ({
              name: item.name,
              is_dir: true,
              path: item.path || `${dirPath}/${item.name}`.replace(/\/+/g, "/"),
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
          setItems(dirs);
        }
      }
    } catch (err) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  onMount(() => {
    if (props.open) {
      loadDir(currentPath());
    }
  });

  function handleNavigateUp() {
    const p = currentPath();
    const parent = p.substring(0, Math.max(p.lastIndexOf("/"), p.lastIndexOf("\\")));
    if (parent) loadDir(parent);
    else if (p !== "/") loadDir("/");
  }

  function handleConfirm() {
    props.onSelect(currentPath());
    props.onClose();
  }

  return (
    <Show when={props.open}>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.65)",
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
          "z-index": 100000,
          padding: "20px",
        }}
        onClick={props.onClose}
      >
        <div
          style={{
            background: "var(--panel-bg, #1a1a2e)",
            border: "1px solid var(--border-strong, rgba(255,255,255,0.15))",
            "border-radius": "12px",
            width: "560px",
            "max-width": "95vw",
            "max-height": "80vh",
            display: "flex",
            "flex-direction": "column",
            overflow: "hidden",
            "box-shadow": "0 16px 40px rgba(0, 0, 0, 0.6)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ padding: "14px 18px", "border-bottom": "1px solid var(--border-subtle, rgba(255,255,255,0.06))", display: "flex", "align-items": "center", "justify-content": "space-between" }}>
            <div style={{ display: "flex", "align-items": "center", gap: "8px" }}>
              <FolderIcon size={18} />
              <span style={{ "font-weight": 600, "font-size": "14px", color: "var(--text-color)" }}>Select Repository Directory</span>
            </div>
            <button
              type="button"
              onClick={props.onClose}
              style={{ background: "none", border: "none", color: "var(--text-muted, #888)", cursor: "pointer", padding: "4px", display: "inline-flex", "align-items": "center" }}
            >
              <CloseIcon size={16} />
            </button>
          </div>

          {/* Navigation Bar */}
          <div style={{ padding: "10px 18px", background: surfaceBg(0.04), "border-bottom": "1px solid var(--border-subtle, rgba(255,255,255,0.06))", display: "flex", "align-items": "center", gap: "8px" }}>
            <Button size="sm" onClick={handleNavigateUp} disabled={currentPath() === "/"}>
              ↑ Up
            </Button>
            <input
              type="text"
              value={currentPath()}
              onKeyDown={(e) => {
                if (e.key === "Enter") loadDir((e.currentTarget as HTMLInputElement).value);
              }}
              style={{
                flex: 1,
                padding: "6px 10px",
                "font-size": "12px",
                "font-family": "Space Mono, monospace",
                background: "var(--panel-bg, #1a1a2e)",
                border: "1px solid var(--border-strong, rgba(255,255,255,0.15))",
                color: "var(--text-color, #e4e4e7)",
                "border-radius": "4px",
              }}
            />
          </div>

          {/* Subdirectories List */}
          <div style={{ flex: 1, "overflow-y": "auto", padding: "8px 12px", "min-height": "240px" }}>
            <Show when={loading()}>
              <div style={{ padding: "20px", "text-align": "center", color: "var(--text-muted, #888)", "font-size": "13px" }}>
                Loading directories...
              </div>
            </Show>
            <Show when={!loading() && items().length === 0}>
              <div style={{ padding: "20px", "text-align": "center", color: "var(--text-muted, #888)", "font-size": "13px" }}>
                No subdirectories found.
              </div>
            </Show>
            <For each={items()}>
              {(item) => (
                <div
                  style={{
                    display: "flex",
                    "align-items": "center",
                    gap: "10px",
                    padding: "8px 10px",
                    "border-radius": "6px",
                    cursor: "pointer",
                    "font-size": "13px",
                    transition: "background 0.15s",
                    color: "var(--text-color)",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = surfaceBg(0.08); }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  onDblClick={() => loadDir(item.path)}
                  onClick={() => setCurrentPath(item.path)}
                >
                  <FolderIcon size={16} />
                  <span style={{ flex: 1, overflow: "hidden", "text-overflow": "ellipsis", "white-space": "nowrap" }}>
                    {item.name}
                  </span>
                  <Button size="sm" onClick={(e) => { e.stopPropagation(); loadDir(item.path); }}>
                    Enter
                  </Button>
                </div>
              )}
            </For>
          </div>

          {/* Footer */}
          <div style={{ padding: "12px 18px", "border-top": "1px solid var(--border-subtle, rgba(255,255,255,0.06))", display: "flex", "align-items": "center", "justify-content": "space-between", background: surfaceBg(0.02) }}>
            <span style={{ "font-size": "11px", color: "var(--text-muted, #888)", "font-family": "Space Mono, monospace", overflow: "hidden", "text-overflow": "ellipsis", "white-space": "nowrap", "max-width": "280px" }}>
              {currentPath()}
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <Button onClick={props.onClose}>Cancel</Button>
              <Button variant="primary" onClick={handleConfirm}>
                Select Directory
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
}
