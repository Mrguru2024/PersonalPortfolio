import { defineConfig } from "vite";
import path from "path";

// Try to import react plugin, but handle if it's not installed
let reactPlugin: any = null;
try {
  const reactModule = await import("@vitejs/plugin-react");
  reactPlugin = reactModule.default;
} catch (error) {
  // Plugin not installed - Vite will work but React features may be limited
  console.warn("[Vite] @vitejs/plugin-react not found. React support may be limited.");
}

// Try to import runtime error overlay, but handle if it's not installed
let runtimeErrorOverlay: any = null;
try {
  const overlayModule = await import("@replit/vite-plugin-runtime-error-modal");
  runtimeErrorOverlay = overlayModule.default;
} catch (error) {
  // Plugin not installed - Vite will work without error overlay
  console.warn("[Vite] @replit/vite-plugin-runtime-error-modal not found. Error overlay will not be available.");
}

export default defineConfig({
  plugins: [
    ...(reactPlugin ? [reactPlugin()] : []),
    ...(runtimeErrorOverlay ? [runtimeErrorOverlay()] : []),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
});
