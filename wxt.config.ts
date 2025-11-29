import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
// See https://wxt.dev/api/config.html
export default defineConfig({
  webExt: {
    disabled: true,
  },
  vite: () => ({
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./"),
      },
    },
  }),
  modules: ["@wxt-dev/module-react"],
  manifest: {
    permissions: ["storage", "alarms", "webRequest"],
    host_permissions: ["*://*.twitter.com/*", "*://*.x.com/*", "*://x.com/*", "*://twitter.com/*"],
  },
});
