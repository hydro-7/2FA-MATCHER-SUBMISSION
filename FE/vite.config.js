import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backend = {
    target: env.VITE_BACKEND_ORIGIN || "http://localhost:8000",
    changeOrigin: true,
  };
  return {
    plugins: [react()],
    server: {
      port: Number(env.VITE_PORT) || 5173,
      proxy: { "/api": backend, "/images": backend },
    },
  };
});
