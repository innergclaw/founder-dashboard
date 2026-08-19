import { defineConfig } from "vite";

export default defineConfig({
  base: "/founder-dashboard/",
  build: {
    target: "es2022",
    sourcemap: false,
  },
});
