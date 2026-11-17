"use client";

import { useEffect, useState } from "react";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function PWARegister() {
  const [installEvent, setInstallEvent] = useState<BIPEvent | null>(null);
  const [updateReady, setUpdateReady] = useState<ServiceWorker | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // --- Service worker ---
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").then((reg) => {
        reg.addEventListener("updatefound", () => {
          const sw = reg.installing;
          sw?.addEventListener("statechange", () => {
            if (sw.state === "installed" && navigator.serviceWorker.controller) setUpdateReady(sw);
          });
        });
      });
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshing) { refreshing = true; location.reload(); }
      });
    }

    // --- Installation ---
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const hidden = localStorage.getItem("bfc-install-dismissed") === "1";
    setIsIOS(ios && !standalone);
    setDismissed(standalone || hidden);

    const onBIP = (e: Event) => { e.preventDefault(); setInstallEvent(e as BIPEvent); };
    const onInstalled = () => { setInstallEvent(null); setDismissed(true); };
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => { localStorage.setItem("bfc-install-dismissed", "1"); setDismissed(true); };

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  };

  const bar: React.CSSProperties = {
    position: "fixed", left: 12, right: 12, bottom: "max(12px, env(safe-area-inset-bottom))", zIndex: 9999,
    display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 14,
    background: "#171717", color: "#fff", border: "1px solid #2a2a2a", boxShadow: "0 8px 30px rgba(0,0,0,.5)",
    fontSize: 14, maxWidth: 480, margin: "0 auto",
  };
  const btn: React.CSSProperties = {
    background: "#dc2626", color: "#fff", border: 0, borderRadius: 8, padding: "8px 14px", fontWeight: 600, cursor: "pointer",
  };
  const ghost: React.CSSProperties = { background: "transparent", color: "#a3a3a3", border: 0, cursor: "pointer", fontSize: 18 };

  if (updateReady)
    return (
      <div style={bar} role="status">
        <span style={{ flex: 1 }}>Une nouvelle version de BFC est disponible.</span>
        <button style={btn} onClick={() => updateReady.postMessage("SKIP_WAITING")}>Mettre à jour</button>
      </div>
    );

  if (dismissed) return null;

  if (installEvent)
    return (
      <div style={bar} role="dialog" aria-label="Installer l'application">
        <span style={{ flex: 1 }}>Installer l'application BFC sur votre appareil</span>
        <button style={btn} onClick={install}>Installer</button>
        <button style={ghost} onClick={dismiss} aria-label="Fermer">×</button>
      </div>
    );

  if (isIOS)
    return (
      <div style={bar} role="dialog" aria-label="Installer l'application">
        <span style={{ flex: 1 }}>
          Pour installer BFC : touchez <b>Partager</b> puis <b>« Sur l'écran d'accueil »</b>.
        </span>
        <button style={ghost} onClick={dismiss} aria-label="Fermer">×</button>
      </div>
    );

  return null;
}
