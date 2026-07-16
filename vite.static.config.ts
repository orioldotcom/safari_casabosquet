import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/safari/",
  plugins: [react()],
  build: {
    outDir: "dist-static",
    emptyOutDir: true,
  },
});
