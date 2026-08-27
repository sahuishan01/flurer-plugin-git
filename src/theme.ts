import { createSignal, createRoot } from "solid-js";

export type ThemeId =
  | "minimal-dark"
  | "midnight-oled"
  | "grounded-warmth"
  | "nord-slate"
  | "deep-space-cyber"
  | "dracula-dusk"
  | "catppuccin-mocha"
  | "tokyo-night"
  | "construction-minimal";

export interface ThemeDef {
  id: ThemeId;
  name: string;
  description: string;
  colors: {
    bg: string;
    panelBg: string;
    panelRgb: string;
    cardBg: string;
    cardBorder: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    inputBg: string;
    accent: string;
    accentBg: string;
    btnPrimaryBg: string;
    btnPrimaryText: string;
    btnSecondaryBg: string;
    btnSecondaryText: string;
    btnDangerBg: string;
    btnDangerText: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
  };
}

export const THEMES: Record<ThemeId, ThemeDef> = {
  "minimal-dark": {
    id: "minimal-dark",
    name: "Minimal Dark",
    description: "Clean monochrome slate palette with restrained chrome",
    colors: {
      bg: "#0b0f19",
      panelBg: "#0f172a",
      panelRgb: "15, 23, 42",
      cardBg: "rgba(15, 23, 42, 0.55)",
      cardBorder: "rgba(255, 255, 255, 0.08)",
      textPrimary: "#f8fafc",
      textSecondary: "#94a3b8",
      textMuted: "#64748b",
      border: "rgba(255, 255, 255, 0.1)",
      inputBg: "rgba(0, 0, 0, 0.35)",
      accent: "#e2e8f0",
      accentBg: "rgba(255, 255, 255, 0.08)",
      btnPrimaryBg: "#1e293b",
      btnPrimaryText: "#f8fafc",
      btnSecondaryBg: "rgba(255, 255, 255, 0.05)",
      btnSecondaryText: "#cbd5e1",
      btnDangerBg: "rgba(153, 27, 27, 0.3)",
      btnDangerText: "#fca5a5",
      badgeBg: "rgba(255, 255, 255, 0.07)",
      badgeText: "#e2e8f0",
      badgeBorder: "rgba(255, 255, 255, 0.12)",
    },
  },
  "midnight-oled": {
    id: "midnight-oled",
    name: "Midnight OLED",
    description: "Pure true black contrast with sharp silver monochrome accents",
    colors: {
      bg: "#000000",
      panelBg: "#0a0a0a",
      panelRgb: "10, 10, 10",
      cardBg: "rgba(18, 18, 18, 0.8)",
      cardBorder: "rgba(255, 255, 255, 0.12)",
      textPrimary: "#ffffff",
      textSecondary: "#a1a1aa",
      textMuted: "#71717a",
      border: "rgba(255, 255, 255, 0.15)",
      inputBg: "#050505",
      accent: "#ffffff",
      accentBg: "rgba(255, 255, 255, 0.1)",
      btnPrimaryBg: "#27272a",
      btnPrimaryText: "#ffffff",
      btnSecondaryBg: "rgba(255, 255, 255, 0.06)",
      btnSecondaryText: "#d4d4d8",
      btnDangerBg: "#3f0f0f",
      btnDangerText: "#f87171",
      badgeBg: "rgba(255, 255, 255, 0.08)",
      badgeText: "#f4f4f5",
      badgeBorder: "rgba(255, 255, 255, 0.18)",
    },
  },
  "grounded-warmth": {
    id: "grounded-warmth",
    name: "Grounded Warmth",
    description: "Earthy obsidian with warm stone neutral tones",
    colors: {
      bg: "#12100e",
      panelBg: "#1c1917",
      panelRgb: "28, 25, 23",
      cardBg: "rgba(28, 25, 23, 0.7)",
      cardBorder: "rgba(255, 255, 255, 0.08)",
      textPrimary: "#f5f5f4",
      textSecondary: "#a8a29e",
      textMuted: "#78716c",
      border: "rgba(255, 255, 255, 0.09)",
      inputBg: "rgba(0, 0, 0, 0.3)",
      accent: "#e7e5e4",
      accentBg: "rgba(255, 255, 255, 0.08)",
      btnPrimaryBg: "#292524",
      btnPrimaryText: "#f5f5f4",
      btnSecondaryBg: "rgba(255, 255, 255, 0.05)",
      btnSecondaryText: "#d6d3d1",
      btnDangerBg: "rgba(127, 29, 29, 0.3)",
      btnDangerText: "#fca5a5",
      badgeBg: "rgba(255, 255, 255, 0.06)",
      badgeText: "#e7e5e4",
      badgeBorder: "rgba(255, 255, 255, 0.1)",
    },
  },
  "nord-slate": {
    id: "nord-slate",
    name: "Nord Slate",
    description: "Cool muted slate with steel monochrome chrome",
    colors: {
      bg: "#161b22",
      panelBg: "#21262d",
      panelRgb: "33, 38, 45",
      cardBg: "rgba(33, 38, 45, 0.7)",
      cardBorder: "rgba(240, 246, 252, 0.1)",
      textPrimary: "#f0f6fc",
      textSecondary: "#8b949e",
      textMuted: "#6e7681",
      border: "rgba(240, 246, 252, 0.12)",
      inputBg: "rgba(1, 4, 9, 0.4)",
      accent: "#c9d1d9",
      accentBg: "rgba(240, 246, 252, 0.08)",
      btnPrimaryBg: "#30363d",
      btnPrimaryText: "#f0f6fc",
      btnSecondaryBg: "rgba(240, 246, 252, 0.05)",
      btnSecondaryText: "#c9d1d9",
      btnDangerBg: "rgba(184, 30, 30, 0.3)",
      btnDangerText: "#ffa1a1",
      badgeBg: "rgba(240, 246, 252, 0.06)",
      badgeText: "#f0f6fc",
      badgeBorder: "rgba(240, 246, 252, 0.12)",
    },
  },
  "deep-space-cyber": {
    id: "deep-space-cyber",
    name: "Deep Space Cyber",
    description: "Futuristic dark blue with electric cyan accents",
    colors: {
      bg: "#040711",
      panelBg: "#0b1329",
      panelRgb: "11, 19, 41",
      cardBg: "rgba(11, 19, 41, 0.8)",
      cardBorder: "rgba(0, 240, 255, 0.2)",
      textPrimary: "#e0f7fa",
      textSecondary: "#80deea",
      textMuted: "#4dd0e1",
      border: "rgba(0, 240, 255, 0.25)",
      inputBg: "rgba(4, 7, 17, 0.6)",
      accent: "#00f0ff",
      accentBg: "rgba(0, 240, 255, 0.12)",
      btnPrimaryBg: "#005662",
      btnPrimaryText: "#e0f7fa",
      btnSecondaryBg: "rgba(0, 240, 255, 0.08)",
      btnSecondaryText: "#80deea",
      btnDangerBg: "rgba(255, 42, 109, 0.3)",
      btnDangerText: "#ff80ab",
      badgeBg: "rgba(0, 240, 255, 0.1)",
      badgeText: "#00f0ff",
      badgeBorder: "rgba(0, 240, 255, 0.3)",
    },
  },
  "dracula-dusk": {
    id: "dracula-dusk",
    name: "Dracula Dusk",
    description: "Rich dark gothic purple palette with vibrant magenta & cyan highlights",
    colors: {
      bg: "#1e1f29",
      panelBg: "#282a36",
      panelRgb: "40, 42, 54",
      cardBg: "rgba(40, 42, 54, 0.85)",
      cardBorder: "rgba(98, 114, 164, 0.3)",
      textPrimary: "#f8f8f2",
      textSecondary: "#6272a4",
      textMuted: "#6272a4",
      border: "rgba(98, 114, 164, 0.25)",
      inputBg: "#191a21",
      accent: "#ff79c6",
      accentBg: "rgba(255, 121, 198, 0.15)",
      btnPrimaryBg: "#44475a",
      btnPrimaryText: "#f8f8f2",
      btnSecondaryBg: "rgba(189, 147, 249, 0.1)",
      btnSecondaryText: "#bd93f9",
      btnDangerBg: "rgba(255, 85, 85, 0.3)",
      btnDangerText: "#ff5555",
      badgeBg: "rgba(255, 121, 198, 0.12)",
      badgeText: "#ff79c6",
      badgeBorder: "rgba(255, 121, 198, 0.3)",
    },
  },
  "catppuccin-mocha": {
    id: "catppuccin-mocha",
    name: "Catppuccin Mocha",
    description: "Warm pastel dark theme with lavender and mauve tones",
    colors: {
      bg: "#11111b",
      panelBg: "#1e1e2e",
      panelRgb: "30, 30, 46",
      cardBg: "rgba(30, 30, 46, 0.85)",
      cardBorder: "rgba(203, 166, 247, 0.2)",
      textPrimary: "#cdd6f4",
      textSecondary: "#a6adc8",
      textMuted: "#6c7086",
      border: "rgba(203, 166, 247, 0.2)",
      inputBg: "#181825",
      accent: "#cba6f7",
      accentBg: "rgba(203, 166, 247, 0.15)",
      btnPrimaryBg: "#313244",
      btnPrimaryText: "#cdd6f4",
      btnSecondaryBg: "rgba(180, 190, 254, 0.1)",
      btnSecondaryText: "#b4befe",
      btnDangerBg: "rgba(243, 139, 168, 0.3)",
      btnDangerText: "#f38ba8",
      badgeBg: "rgba(203, 166, 247, 0.12)",
      badgeText: "#cba6f7",
      badgeBorder: "rgba(203, 166, 247, 0.3)",
    },
  },
  "tokyo-night": {
    id: "tokyo-night",
    name: "Tokyo Night",
    description: "Deep neon blue-violet inspired by Tokyo night lights",
    colors: {
      bg: "#16161e",
      panelBg: "#1a1b26",
      panelRgb: "26, 27, 38",
      cardBg: "rgba(26, 27, 38, 0.85)",
      cardBorder: "rgba(125, 207, 255, 0.2)",
      textPrimary: "#c0caf5",
      textSecondary: "#7aa2f7",
      textMuted: "#565f89",
      border: "rgba(125, 207, 255, 0.2)",
      inputBg: "#13141c",
      accent: "#7dcfff",
      accentBg: "rgba(125, 207, 255, 0.15)",
      btnPrimaryBg: "#24283b",
      btnPrimaryText: "#c0caf5",
      btnSecondaryBg: "rgba(122, 162, 247, 0.1)",
      btnSecondaryText: "#7aa2f7",
      btnDangerBg: "rgba(247, 118, 142, 0.3)",
      btnDangerText: "#f7768e",
      badgeBg: "rgba(125, 207, 255, 0.12)",
      badgeText: "#7dcfff",
      badgeBorder: "rgba(125, 207, 255, 0.3)",
    },
  },
  "construction-minimal": {
    id: "construction-minimal",
    name: "Construction Minimal (Light)",
    description: "Clean off-white paper theme with high-contrast ink text and red accents",
    colors: {
      bg: "#f4f1eb",
      panelBg: "#fbfaf7",
      panelRgb: "251, 250, 247",
      cardBg: "rgba(255, 255, 255, 0.9)",
      cardBorder: "rgba(23, 20, 17, 0.15)",
      textPrimary: "#171411",
      textSecondary: "#57534e",
      textMuted: "#8a847a",
      border: "rgba(23, 20, 17, 0.12)",
      inputBg: "#ffffff",
      accent: "#ce3a24",
      accentBg: "rgba(206, 58, 36, 0.1)",
      btnPrimaryBg: "#171411",
      btnPrimaryText: "#fbfaf7",
      btnSecondaryBg: "rgba(23, 20, 17, 0.06)",
      btnSecondaryText: "#292524",
      btnDangerBg: "rgba(206, 58, 36, 0.15)",
      btnDangerText: "#991b1b",
      badgeBg: "rgba(23, 20, 17, 0.07)",
      badgeText: "#171411",
      badgeBorder: "rgba(23, 20, 17, 0.18)",
    },
  },
};

const THEME_KEY = "flurer-git-theme";

function getSavedTheme(): ThemeId {
  try {
    const saved = localStorage.getItem(THEME_KEY) as ThemeId;
    if (saved && THEMES[saved]) return saved;
  } catch {}
  return "minimal-dark";
}

export const [currentTheme, setCurrentTheme] = createRoot(() => createSignal<ThemeId>(getSavedTheme()));

export function getThemeStyles(id: ThemeId = currentTheme()): Record<string, string> {
  const theme = THEMES[id] || THEMES["minimal-dark"];
  const c = theme.colors;
  return {
    "--bg-primary": c.bg,
    "--panel-bg": c.panelBg,
    "--panel-rgb": c.panelRgb,
    "--card-bg": c.cardBg,
    "--card-border": c.cardBorder,
    "--text-primary": c.textPrimary,
    "--text-secondary": c.textSecondary,
    "--text-muted": c.textMuted,
    "--border-color": c.border,
    "--input-bg": c.inputBg,
    "--accent-default": c.accent,
    "--accent-bg": c.accentBg,
    "--btn-primary-bg": c.btnPrimaryBg,
    "--btn-primary-text": c.btnPrimaryText,
    "--btn-secondary-bg": c.btnSecondaryBg,
    "--btn-secondary-text": c.btnSecondaryText,
    "--btn-danger-bg": c.btnDangerBg,
    "--btn-danger-text": c.btnDangerText,
    "--badge-bg": c.badgeBg,
    "--badge-text": c.badgeText,
    "--badge-border": c.badgeBorder,
  };
}

export function applyTheme(id: ThemeId) {
  setCurrentTheme(id);
  try {
    localStorage.setItem(THEME_KEY, id);
  } catch {}
}
