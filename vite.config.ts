import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const basePath = "/visa-go/";

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Visa Go · 本地签证照工作台",
        short_name: "Visa Go",
        description: "在设备本地制作、检查和导出签证照片",
        theme_color: "#102c4c",
        background_color: "#edf3f7",
        display: "standalone",
        start_url: basePath,
        scope: basePath,
        lang: "zh-CN",
        icons: [
          { src: `${basePath}icons/icon-192.png`, sizes: "192x192", type: "image/png" },
          { src: `${basePath}icons/icon-512.png`, sizes: "512x512", type: "image/png" },
          { src: `${basePath}icons/icon-512.png`, sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ["**/*.{html,js,css,png,wasm,tflite,task}"],
        maximumFileSizeToCacheInBytes: 30 * 1024 * 1024,
        navigateFallback: `${basePath}index.html`,
      },
    }),
  ],
});
