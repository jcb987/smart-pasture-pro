import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// PWA (service worker) registration for install + offline support
import { registerSW } from "virtual:pwa-register";

// Ensure users receive the latest published version (avoid “stuck on old cached build”)
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // Auto-refresh to apply the new service worker immediately
    updateSW(true);
    window.location.reload();
  },
});

createRoot(document.getElementById("root")!).render(<App />);
