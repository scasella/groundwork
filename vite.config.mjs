import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import {readFileSync} from "node:fs";
const siteConfigured=!!JSON.parse(readFileSync(new URL("./.openai/hosting.json",import.meta.url),"utf8")).project_id;

export default defineConfig({
  define: {"import.meta.env.VITE_GROUNDWORK_SITES": JSON.stringify(siteConfigured)},
  build: {
    outDir: "dist/client",
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "127.0.0.1",
    allowedHosts: ["terminal.local"],
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  plugins: [react()],
});
