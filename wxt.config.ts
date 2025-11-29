import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    permissions: ["storage", "alarms", "webRequest"],
    host_permissions: ["*://*.twitter.com/*", "*://*.x.com/*", "*://x.com/*", "*://twitter.com/*"],
  },
});
