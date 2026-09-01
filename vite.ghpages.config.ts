import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));

function gitCommit() {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "unknown";
  }
}

export default defineConfig({
  base: "/safari_casabosquet/",
  define: {
    __APP_COMMIT__: JSON.stringify(gitCommit()),
  },
  plugins: [react()],
  build: {
    outDir: "dist-ghpages",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: `${root}index.html`,
        v2: `${root}v2/index.html`,
      },
    },
  },
});
