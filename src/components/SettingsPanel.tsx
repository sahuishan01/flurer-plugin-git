import { createSignal } from "solid-js";
import {
  setSurfaceOpacity, getSurfaceOpacity,
  setSurfaceBlur, getSurfaceBlur,
  setButtonTintOpacity, getButtonTintOpacity,
  setGraphPanSpeed, getGraphPanSpeed,
  setGraphZoomSpeed, getGraphZoomSpeed,
  setGraphRotateSpeed, getGraphRotateSpeed,
  setGraphFocusZoomStep, getGraphFocusZoomStep,
  setGraphFocusTransitionTime, getGraphFocusTransitionTime,
  setMaxDiscoveredReposCap, getMaxDiscoveredReposCap,
  buttonBg,
} from "../utils";
import { BranchIcon, PushIcon, PullIcon } from "./shared";
import { S as baseStyles } from "../styles";

const S = {
  section: {
    padding: "16px",
  },
  header: {
    "font-size": "11px",
    "font-weight": 700,
    "text-transform": "uppercase" as const,
    "letter-spacing": "0.6px",
    color: "var(--accent-default, var(--accent-color, #f59e0b))",
    "margin-bottom": "12px",
    "margin-top": "16px",
    display: "flex",
    "align-items": "center",
    gap: "6px",
  },
  label: {
    display: "block",
    "font-size": "12px",
    "font-weight": 600,
    "margin-bottom": "6px",
    color: "var(--text-color, #fff)",
  },
  row: {
    display: "flex",
    "align-items": "center",
    gap: "12px",
  },
  slider: {
    flex: 1,
    height: "6px",
    appearance: "none" as const,
    background: "var(--border-strong, rgba(255,255,255,0.15))",
    outline: "none",
    "border-radius": "3px",
    cursor: "pointer",
  },
  value: {
    "font-family": "Space Mono, monospace",
    "font-size": "12px",
    "font-weight": 600,
    color: "var(--accent-default, var(--accent-color, #f59e0b))",
    "min-width": "42px",
    "text-align": "right" as const,
  },
  hint: {
    "font-size": "11px",
    color: "var(--text-muted, #888)",
    "margin-top": "4px",
    "margin-bottom": "16px",
  },
};

export function SettingsPanel(props: any) {
  const [previewBackdropMode, setPreviewBackdropMode] = createSignal<"mesh" | "wallpaper" | "dark" | "light">("mesh");

  const initialSurface = props.pluginSettings?.surfaceOpacity ?? getSurfaceOpacity();
  if (props.pluginSettings?.surfaceOpacity !== undefined && initialSurface !== getSurfaceOpacity()) {
    setSurfaceOpacity(initialSurface);
  }

  const initialBlur = props.pluginSettings?.surfaceBlur ?? getSurfaceBlur();
  if (props.pluginSettings?.surfaceBlur !== undefined && initialBlur !== getSurfaceBlur()) {
    setSurfaceBlur(initialBlur);
  }

  const initialButton = props.pluginSettings?.buttonTintOpacity ?? getButtonTintOpacity();
  if (props.pluginSettings?.buttonTintOpacity !== undefined && initialButton !== getButtonTintOpacity()) {
    setButtonTintOpacity(initialButton);
  }

  const initialPan = props.pluginSettings?.graphPanSpeed ?? getGraphPanSpeed();
  if (props.pluginSettings?.graphPanSpeed !== undefined && initialPan !== getGraphPanSpeed()) {
    setGraphPanSpeed(initialPan);
  }

  const initialZoom = props.pluginSettings?.graphZoomSpeed ?? getGraphZoomSpeed();
  if (props.pluginSettings?.graphZoomSpeed !== undefined && initialZoom !== getGraphZoomSpeed()) {
    setGraphZoomSpeed(initialZoom);
  }

  const initialRotate = props.pluginSettings?.graphRotateSpeed ?? getGraphRotateSpeed();
  if (props.pluginSettings?.graphRotateSpeed !== undefined && initialRotate !== getGraphRotateSpeed()) {
    setGraphRotateSpeed(initialRotate);
  }

  const initialFocusStep = props.pluginSettings?.graphFocusZoomStep ?? getGraphFocusZoomStep();
  if (props.pluginSettings?.graphFocusZoomStep !== undefined && initialFocusStep !== getGraphFocusZoomStep()) {
    setGraphFocusZoomStep(initialFocusStep);
  }

  const initialFocusTime = props.pluginSettings?.graphFocusTransitionTime ?? getGraphFocusTransitionTime();
  if (props.pluginSettings?.graphFocusTransitionTime !== undefined && initialFocusTime !== getGraphFocusTransitionTime()) {
    setGraphFocusTransitionTime(initialFocusTime);
  }

  const initialMaxCap = props.pluginSettings?.maxDiscoveredReposCap ?? getMaxDiscoveredReposCap();
  if (props.pluginSettings?.maxDiscoveredReposCap !== undefined && initialMaxCap !== getMaxDiscoveredReposCap()) {
    setMaxDiscoveredReposCap(initialMaxCap);
  }

  function syncAll() {
    props.onPluginSettingsChange?.({
      surfaceOpacity: getSurfaceOpacity(),
      surfaceBlur: getSurfaceBlur(),
      buttonTintOpacity: getButtonTintOpacity(),
      graphPanSpeed: getGraphPanSpeed(),
      graphZoomSpeed: getGraphZoomSpeed(),
      graphRotateSpeed: getGraphRotateSpeed(),
      graphFocusZoomStep: getGraphFocusZoomStep(),
      graphFocusTransitionTime: getGraphFocusTransitionTime(),
      maxDiscoveredReposCap: getMaxDiscoveredReposCap(),
    });
  }

  function onSurfaceChange(e: Event) {
    const val = parseFloat((e.target as HTMLInputElement).value);
    setSurfaceOpacity(val);
    syncAll();
  }

  function onBlurChange(e: Event) {
    const val = parseInt((e.target as HTMLInputElement).value, 10);
    setSurfaceBlur(val);
    syncAll();
  }

  function onButtonChange(e: Event) {
    const val = parseFloat((e.target as HTMLInputElement).value);
    setButtonTintOpacity(val);
    syncAll();
  }

  function onPanChange(e: Event) {
    const val = parseFloat((e.target as HTMLInputElement).value);
    setGraphPanSpeed(val);
    syncAll();
  }

  function onZoomChange(e: Event) {
    const val = parseFloat((e.target as HTMLInputElement).value);
    setGraphZoomSpeed(val);
    syncAll();
  }

  function onRotateChange(e: Event) {
    const val = parseFloat((e.target as HTMLInputElement).value);
    setGraphRotateSpeed(val);
    syncAll();
  }

  function onFocusStepChange(e: Event) {
    const val = parseFloat((e.target as HTMLInputElement).value);
    setGraphFocusZoomStep(val);
    syncAll();
  }

  function onFocusTimeChange(e: Event) {
    const val = parseInt((e.target as HTMLInputElement).value, 10);
    setGraphFocusTransitionTime(val);
    syncAll();
  }

  return (
    <div style={S.section}>
      <div style={{ ...S.header, "margin-top": "0" }}>
        🌐 Graph Navigation Sensitivity
      </div>

      <label style={S.label}>Pan Sensitivity</label>
      <div style={S.row}>
        <input
          type="range"
          min="0.1"
          max="3.0"
          step="0.05"
          value={getGraphPanSpeed()}
          onInput={onPanChange}
          style={S.slider}
        />
        <span style={S.value}>{getGraphPanSpeed().toFixed(2)}x</span>
      </div>
      <div style={S.hint}>
        Controls drag & right-click panning speed across 2D & 3D graphs.
      </div>

      <label style={S.label}>Zoom Sensitivity</label>
      <div style={S.row}>
        <input
          type="range"
          min="0.1"
          max="3.0"
          step="0.05"
          value={getGraphZoomSpeed()}
          onInput={onZoomChange}
          style={S.slider}
        />
        <span style={S.value}>{getGraphZoomSpeed().toFixed(2)}x</span>
      </div>
      <div style={S.hint}>
        Controls mouse wheel and trackpad zoom speed.
      </div>

      <label style={S.label}>3D Orbit Rotation Sensitivity</label>
      <div style={S.row}>
        <input
          type="range"
          min="0.1"
          max="3.0"
          step="0.05"
          value={getGraphRotateSpeed()}
          onInput={onRotateChange}
          style={S.slider}
        />
        <span style={S.value}>{getGraphRotateSpeed().toFixed(2)}x</span>
      </div>
      <div style={S.hint}>
        Controls 3D camera rotation speed when dragging.
      </div>

      <div style={S.header}>
        🎯 Focus & Framing Behavior
      </div>

      <label style={S.label}>Focus Zoom Step (Distance Delta)</label>
      <div style={S.row}>
        <input
          type="range"
          min="0.05"
          max="0.50"
          step="0.05"
          value={getGraphFocusZoomStep()}
          onInput={onFocusStepChange}
          style={S.slider}
        />
        <span style={S.value}>{Math.round(getGraphFocusZoomStep() * 100)}%</span>
      </div>
      <div style={S.hint}>
        Percentage of camera distance zoomed in per [F] focus action (e.g. 20% zooms in 1/5 closer).
      </div>

      <label style={S.label}>Focus Camera Transition Time</label>
      <div style={S.row}>
        <input
          type="range"
          min="200"
          max="1500"
          step="50"
          value={getGraphFocusTransitionTime()}
          onInput={onFocusTimeChange}
          style={S.slider}
        />
        <span style={S.value}>{getGraphFocusTransitionTime()}ms</span>
      </div>
      <div style={S.hint}>
        Smooth camera interpolation duration during [F] focus, branch framing, and search selection.
      </div>

      <div style={S.header}>
        <BranchIcon size={14} /> Submodule & Repo Discovery
      </div>
      <label style={S.label}>Max Discovered Repositories Cap</label>
      <div style={S.row}>
        <input
          type="range"
          min="5"
          max="500"
          step="5"
          value={getMaxDiscoveredReposCap()}
          onInput={(e) => {
            const val = parseInt((e.target as HTMLInputElement).value, 10);
            setMaxDiscoveredReposCap(val);
            syncAll();
          }}
          style={S.slider}
        />
        <span style={S.value}>{getMaxDiscoveredReposCap()}</span>
      </div>
      <div style={S.hint}>
        Maximum limit on total submodules and git repositories returned during recursive directory discovery (5–500).
      </div>

      <div style={S.header}>
        🎨 Theme & Translucent Surface Appearance
      </div>

      {/* Live Interactive Preview Card */}
      <div style={{
        "margin-bottom": "20px",
        "border-radius": "12px",
        overflow: "hidden",
        border: "1px solid var(--border-strong, rgba(255, 255, 255, 0.15))",
        position: "relative",
        "box-shadow": "0 8px 30px rgba(0, 0, 0, 0.35)",
        "min-height": "170px",
      }}>
        {/* Background scenery / wallpaper gradient */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: previewBackdropMode() === "mesh"
            ? "radial-gradient(at 0% 0%, rgba(56, 189, 248, 0.45) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(168, 85, 247, 0.45) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(245, 158, 11, 0.4) 0px, transparent 50%), radial-gradient(at 0% 100%, rgba(34, 197, 94, 0.35) 0px, transparent 50%), #0f172a"
            : previewBackdropMode() === "wallpaper"
            ? "linear-gradient(135deg, #312e81 0%, #0f172a 45%, #064e3b 100%)"
            : previewBackdropMode() === "light"
            ? "linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 50%, #94a3b8 100%)"
            : "#070a12",
          "z-index": 0,
        }}>
          {/* Visual elements under glass to highlight blur and translucency */}
          <div style={{
            position: "absolute",
            top: "8px",
            right: "20px",
            width: "80px",
            height: "80px",
            "border-radius": "50%",
            background: "linear-gradient(135deg, #f59e0b, #ef4444)",
            opacity: 0.85,
          }} />
          <div style={{
            position: "absolute",
            bottom: "6px",
            left: "24px",
            width: "110px",
            height: "55px",
            "border-radius": "28px",
            background: "linear-gradient(135deg, #38bdf8, #818cf8)",
            opacity: 0.75,
          }} />
        </div>

        {/* Live Glass Panel Surface Overlay */}
        <div style={{
          position: "relative",
          "z-index": 1,
          padding: "14px 16px",
          background: `rgba(var(--panel-rgb, 15, 23, 42), ${getSurfaceOpacity()})`,
          "backdrop-filter": `blur(${getSurfaceBlur()}px)`,
          "-webkit-backdrop-filter": `blur(${getSurfaceBlur()}px)`,
          display: "flex",
          "flex-direction": "column",
          gap: "10px",
        }}>
          {/* Header with Title + Backdrop Selector */}
          <div style={{ display: "flex", "align-items": "center", "justify-content": "space-between", "flex-wrap": "wrap", gap: "8px" }}>
            <div style={{ display: "flex", "align-items": "center", gap: "8px" }}>
              <span style={{ "font-size": "11.5px", "font-weight": 700, "letter-spacing": "0.4px", color: "var(--text-primary, #f8fafc)", "text-transform": "uppercase" }}>
                ✨ Live Appearance Preview
              </span>
              <span style={{ "font-size": "10.5px", padding: "1px 6px", "border-radius": "4px", background: "rgba(56, 189, 248, 0.2)", color: "#38bdf8", "font-family": "Space Mono, monospace" }}>
                {Math.round(getSurfaceOpacity() * 100)}% opacity • {getSurfaceBlur()}px blur
              </span>
            </div>

            {/* Backdrop Switcher */}
            <div style={{ display: "flex", "align-items": "center", gap: "4px" }}>
              <span style={{ "font-size": "10.5px", color: "rgba(255, 255, 255, 0.5)", "margin-right": "2px" }}>Backdrop:</span>
              {(["mesh", "wallpaper", "dark", "light"] as const).map((m) => (
                <button
                  type="button"
                  onClick={() => setPreviewBackdropMode(m)}
                  style={{
                    padding: "2px 7px",
                    "font-size": "10px",
                    "font-family": "Space Mono, monospace",
                    "border-radius": "4px",
                    border: previewBackdropMode() === m ? "1px solid #38bdf8" : "1px solid rgba(255,255,255,0.12)",
                    background: previewBackdropMode() === m ? "rgba(56, 189, 248, 0.25)" : "rgba(0,0,0,0.35)",
                    color: previewBackdropMode() === m ? "#38bdf8" : "rgba(255,255,255,0.65)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Sample Git UI Items */}
          <div style={{ display: "flex", "align-items": "center", gap: "8px", "flex-wrap": "wrap" }}>
            <span style={baseStyles.branchBadge}>
              <BranchIcon size={12} />
              <span>feature/glassmorphism</span>
              <span style={{ "font-size": "10px", padding: "0 4px", "border-radius": "3px", background: "rgba(0,0,0,0.3)", color: "#fff" }}>↑1 ↓0</span>
            </span>

            <button
              type="button"
              style={{
                ...baseStyles.btn,
                ...baseStyles.btnPrimary,
                background: buttonBg("#0284c7"),
                padding: "4px 10px",
                "font-size": "11px",
              }}
            >
              <PushIcon size={12} /> Push
            </button>

            <button
              type="button"
              style={{
                ...baseStyles.btn,
                ...baseStyles.btnSecondary,
                padding: "4px 10px",
                "font-size": "11px",
              }}
            >
              <PullIcon size={12} /> Pull
            </button>
          </div>

          {/* Sample Card & Diff row */}
          <div style={{
            background: "rgba(var(--panel-rgb, 15, 23, 42), 0.45)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            "border-radius": "8px",
            padding: "8px 12px",
            display: "flex",
            "flex-direction": "column",
            gap: "5px",
          }}>
            <div style={{ display: "flex", "align-items": "center", "justify-content": "space-between", "font-size": "11.5px" }}>
              <span style={{ "font-weight": 600, color: "var(--text-primary, #f8fafc)" }}>
                📄 src/styles.ts
              </span>
              <span style={{ color: "#4ade80", "font-family": "Space Mono, monospace", "font-size": "10.5px" }}>
                +14 lines modified
              </span>
            </div>

            {/* Sample diff line */}
            <div style={{
              display: "flex",
              "font-family": "Space Mono, monospace",
              "font-size": "11px",
              background: "rgba(34, 197, 94, 0.14)",
              color: "#4ade80",
              "border-left": "3px solid #34d399",
              padding: "2px 6px",
              "border-radius": "0 4px 4px 0",
            }}>
              <span>+ background: "rgba(var(--panel-rgb), var(--plugin-surface-opacity))"</span>
            </div>
          </div>
        </div>
      </div>

      <label style={S.label}>Surface Opacity</label>
      <div style={S.row}>
        <input
          type="range"
          min="0"
          max="1"
          step="0.02"
          value={getSurfaceOpacity()}
          onInput={onSurfaceChange}
          style={S.slider}
        />
        <span style={S.value}>{Math.round(getSurfaceOpacity() * 100)}%</span>
      </div>
      <div style={S.hint}>
        Controls the translucent glass opacity of the Git panel surface (0% fully transparent to 100% opaque).
      </div>

      <label style={S.label}>Surface Blur</label>
      <div style={S.row}>
        <input
          type="range"
          min="0"
          max="32"
          step="1"
          value={getSurfaceBlur()}
          onInput={onBlurChange}
          style={S.slider}
        />
        <span style={S.value}>{getSurfaceBlur()}px</span>
      </div>
      <div style={S.hint}>
        Controls the backdrop blur radius behind the Git panel.
      </div>

      <label style={S.label}>Button tint opacity</label>
      <div style={S.row}>
        <input
          type="range"
          min="0"
          max="0.5"
          step="0.01"
          value={getButtonTintOpacity()}
          onInput={onButtonChange}
          style={S.slider}
        />
        <span style={S.value}>{Math.round(getButtonTintOpacity() * 100)}%</span>
      </div>
      <div style={S.hint}>
        Controls how much accent color blends into button backgrounds.
      </div>
    </div>
  );
}
