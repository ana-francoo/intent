import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "./package.json";

export default defineManifest({
  manifest_version: 3,
  name: "Intent",
  short_name: "Intent",
  version: pkg.version,
  permissions: ["storage", "activeTab", "tabs", "scripting"],
  host_permissions: [
    "https://www.google.com/*",
    "https://www.google-analytics.com/*",
  ],
  externally_connectable: {
    matches: ["http://localhost:5173/*", "https://useintent.app/*"],
  },
  icons: {
    48: "logo.png",
  },
  action: {
    default_icon: {
      48: "logo.png",
    },
    default_title: "Intent",
    default_popup: "src/popup/landing.html",
  },
  web_accessible_resources: [
    {
      resources: [
        "src/assets/logo2.png",
        "src/assets/pin-open.png",
        "src/popup/landing.html",
        "vendor/*",
      ],
      matches: ["https://*/*"],
    },
  ],
  background: {
    service_worker: "src/background.ts",
  },
  content_scripts: [
    {
      js: ["src/content/earlyInterceptor.ts"],
      matches: ["https://*/*"],
      run_at: "document_start",
    },
    {
      js: ["src/content/main.tsx"],
      matches: ["https://*/*"],
      run_at: "document_end",
    },
  ],
});
