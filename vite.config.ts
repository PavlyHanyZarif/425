import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const API_PORT = process.env.API_PORT || "3001";
const FRONTEND_PORT = Number(process.env.FRONTEND_PORT || 5173);

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: FRONTEND_PORT,
    strictPort: false,
    proxy: {
      "/api": `http://localhost:${API_PORT}`,
    },
  },
  preview: {
    host: "0.0.0.0",
    port: FRONTEND_PORT,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
