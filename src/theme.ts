import { createSignal, createRoot } from "solid-js";

export type ThemeId = "minimal-dark" | "midnight-oled" | "grounded-warmth" | "nord-slate";

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
    name: "Minimal Dark (Default)",
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

export function applyTheme(id: ThemeId) {
  const theme = THEMES[id] || THEMES["minimal-dark"];
  setCurrentTheme(id);
  try {
    localStorage.setItem(THEME_KEY, id);
  } catch {}

  const root = document.documentElement;
  if (!root) return;

  const c = theme.colors;
  root.style.setProperty("--bg-primary", c.bg);
  root.style.setProperty("--panel-bg", c.panelBg);
  root.style.setProperty("--panel-rgb", c.panelRgb);
  root.style.setProperty("--card-bg", c.cardBg);
  root.style.setProperty("--card-border", c.cardBorder);
  root.style.setProperty("--text-primary", c.textPrimary);
  root.style.setProperty("--text-secondary", c.textSecondary);
  root.style.setProperty("--text-muted", c.textMuted);
  root.style.setProperty("--border-color", c.border);
  root.style.setProperty("--input-bg", c.inputBg);
  root.style.setProperty("--accent-default", c.accent);
  root.style.setProperty("--accent-bg", c.accentBg);
  root.style.setProperty("--btn-primary-bg", c.btnPrimaryBg);
  root.style.setProperty("--btn-primary-text", c.btnPrimaryText);
  root.style.setProperty("--btn-secondary-bg", c.btnSecondaryBg);
  root.style.setProperty("--btn-secondary-text", c.btnSecondaryText);
  root.style.setProperty("--btn-danger-bg", c.btnDangerBg);
  root.style.setProperty("--btn-danger-text", c.btnDangerText);
  root.style.setProperty("--badge-bg", c.badgeBg);
  root.style.setProperty("--badge-text", c.badgeText);
  root.style.setProperty("--badge-border", c.badgeBorder);
}

// Apply initial saved theme on load
applyTheme(getSavedTheme());
