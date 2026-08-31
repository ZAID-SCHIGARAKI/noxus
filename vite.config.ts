import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    // Keep the production bundle compatible with older iPhone Safari versions.
    target: "safari13",
    sourcemap: true,
  },
});
