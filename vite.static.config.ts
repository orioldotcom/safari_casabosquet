import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  base: "/safari/",
  plugins: [react()],
  build: {
    outDir: "dist-static",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: `${root}index.html`,
        v2: `${root}v2/index.html`,
      },
    },
  },
});
