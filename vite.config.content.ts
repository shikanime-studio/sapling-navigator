import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "es2019",
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        content: "src/content.ts",
      },
      output: {
        format: "iife",
        entryFileNames: "[name].js",
      },
    },
  },
});
