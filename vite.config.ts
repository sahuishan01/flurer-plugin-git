import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import { resolve } from "path";
import { readFileSync } from "fs";

const pkg = JSON.parse(readFileSync(resolve(__dirname, "package.json"), "utf-8"));

export default defineConfig({
  define: {
    __VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [solid()],
  publicDir: false,
  build: {
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, "src/index.tsx"),
      name: "FlurerGitPlugin",
      formats: ["iife"],
      fileName: () => "index.js",
    },
    rollupOptions: {
      external: [
        "solid-js",
        "solid-js/web",
        "solid-js/store",
        "@tauri-apps/api/core",
        "@tauri-apps/api/event",
        "@tauri-apps/plugin-shell",
      ],
      output: {
        globals: {
          "solid-js": "window.Solid",
          "solid-js/web": "window.SolidWeb",
          "solid-js/store": "window.SolidStore",
          "@tauri-apps/api/core": "window.TauriCore",
          "@tauri-apps/api/event": "window.TauriEvent",
          "@tauri-apps/plugin-shell": "window.TauriShell",
        },
      },
    },
  },
});
