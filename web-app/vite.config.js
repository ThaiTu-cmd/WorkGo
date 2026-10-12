import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/api/v1/identity": {
        target: "http://localhost:8888",
        changeOrigin: true,
      },
      "/api/v1/catalog": {
        target: "http://localhost:8888",
        changeOrigin: true,
      },
      "/catalog": {
        target: "http://localhost:8082",
        changeOrigin: true,
      },
    },
  },
});
