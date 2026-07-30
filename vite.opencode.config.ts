import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  base: process.env.DEPLOY_PATH || "/safari/opencode/",
  plugins: [react()],
  build: {
    outDir: "dist-opencode",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: `${root}index.html`,
        v2: `${root}v2/index.html`,
      },
    },
  },
});
