"use client";

// Registriert den Service Worker fuer ALLE Besuche.
//
// Vorher passierte das nur in lib/push.ts, also ausschliesslich wenn jemand
// die Erinnerungen einschaltete. Ohne Service Worker gibt es keinen
// Zwischenspeicher – Amelies Handy hat darum bei jedem Oeffnen die komplette
// App neu geladen. Die Registrierung laeuft absichtlich erst nach dem Laden
// der Seite, damit sie das erste Anzeigen nicht ausbremst.
import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    let cancelled = false;
    const register = () => {
      if (cancelled) return;
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        // Kein Grund die App zu stoeren – sie funktioniert auch ohne Cache.
        console.warn("Service Worker nicht registriert:", error);
      });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
    return () => {
      cancelled = true;
      window.removeEventListener("load", register);
    };
  }, []);

  return null;
}
