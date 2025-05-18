// vite.config.js
import { defineConfig } from "file:///C:/Users/aidar/Downloads/JobSearch/project/node_modules/vite/dist/node/index.js";
import vue from "file:///C:/Users/aidar/Downloads/JobSearch/project/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import path from "path";
var __vite_injected_original_dirname =
  "C:\\Users\\aidar\\Downloads\\JobSearch\\project";
var vite_config_default = defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
export { vite_config_default as default };
