import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// PWA (service worker) registration for install + offline support
import { registerSW } from "virtual:pwa-register";

// Ensure users receive the latest published version (avoid “stuck on old cached build”)
// Notes:
// - Installed PWAs can get stuck on an old cached build.
// - We force periodic update checks and auto-apply the new service worker.
// - A sessionStorage guard prevents reload loops.
const SW_RELOAD_GUARD_KEY = "pwa_sw_reloaded";
const isProd = import.meta.env.PROD;

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    const alreadyReloaded = sessionStorage.getItem(SW_RELOAD_GUARD_KEY) === "1";
    if (alreadyReloaded) return;

    sessionStorage.setItem(SW_RELOAD_GUARD_KEY, "1");
    // Auto-refresh to apply the new service worker immediately
    updateSW(true);
    window.location.reload();
  },
  onRegisteredSW(_swUrl, registration) {
    if (!isProd) return;

    // Proactively check for updates (helps when the app is installed as a PWA)
    try {
      registration?.update();
      window.setInterval(() => registration?.update(), 60 * 1000);
    } catch {
      // ignore
    }
  },
});

// Extra safety: trigger an update check shortly after boot in production.
// If an update exists, onNeedRefresh() will apply it and reload once.
if (isProd) {
  window.setTimeout(() => {
    try {
      updateSW();
    } catch {
      // ignore
    }
  }, 1500);
}

createRoot(document.getElementById("root")!).render(<App />);
