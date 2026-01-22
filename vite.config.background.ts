import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "es2019",
    outDir: "dist",
    emptyOutDir: false,
    rollupOptions: {
      input: {
        background: "src/background.ts",
      },
      output: {
        format: "iife",
        entryFileNames: "[name].js",
      },
    },
  },
});
