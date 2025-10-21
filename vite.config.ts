import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      src: path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    host: true,
    https: false,
  },
  build: {
    outDir: "build",
    sourcemap: true,
  },
  envPrefix: "VITE_",
});
