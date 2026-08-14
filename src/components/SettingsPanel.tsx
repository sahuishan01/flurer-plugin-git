import {
  setSurfaceOpacity, getSurfaceOpacity,
  setButtonTintOpacity, getButtonTintOpacity,
  setGraphPanSpeed, getGraphPanSpeed,
  setGraphZoomSpeed, getGraphZoomSpeed,
  setGraphRotateSpeed, getGraphRotateSpeed,
} from "../utils";

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
  const initialSurface = props.pluginSettings?.surfaceOpacity ?? getSurfaceOpacity();
  if (initialSurface !== getSurfaceOpacity()) setSurfaceOpacity(initialSurface);

  const initialButton = props.pluginSettings?.buttonTintOpacity ?? getButtonTintOpacity();
  if (initialButton !== getButtonTintOpacity()) setButtonTintOpacity(initialButton);

  const initialPan = props.pluginSettings?.graphPanSpeed ?? getGraphPanSpeed();
  if (initialPan !== getGraphPanSpeed()) setGraphPanSpeed(initialPan);

  const initialZoom = props.pluginSettings?.graphZoomSpeed ?? getGraphZoomSpeed();
  if (initialZoom !== getGraphZoomSpeed()) setGraphZoomSpeed(initialZoom);

  const initialRotate = props.pluginSettings?.graphRotateSpeed ?? getGraphRotateSpeed();
  if (initialRotate !== getGraphRotateSpeed()) setGraphRotateSpeed(initialRotate);

  function syncAll() {
    props.onPluginSettingsChange?.({
      surfaceOpacity: getSurfaceOpacity(),
      buttonTintOpacity: getButtonTintOpacity(),
      graphPanSpeed: getGraphPanSpeed(),
      graphZoomSpeed: getGraphZoomSpeed(),
      graphRotateSpeed: getGraphRotateSpeed(),
    });
  }

  function onSurfaceChange(e: Event) {
    const val = parseFloat((e.target as HTMLInputElement).value);
    setSurfaceOpacity(val);
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
        🎨 Theme & Surface Opacity
      </div>

      <label style={S.label}>Surface tint opacity</label>
      <div style={S.row}>
        <input
          type="range"
          min="0"
          max="0.2"
          step="0.005"
          value={getSurfaceOpacity()}
          onInput={onSurfaceChange}
          style={S.slider}
        />
        <span style={S.value}>{Math.round(getSurfaceOpacity() * 100)}%</span>
      </div>
      <div style={S.hint}>
        Controls the tint strength of card and panel backgrounds.
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
