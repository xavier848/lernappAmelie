"use client";

// iOS Safari stellt beim Navigieren die Scroll-Position der VORHERIGEN
// Seite wieder her - auf einer frisch ladenden, kuerzeren Seite landet man
// dann mitten im Leeren (Xaviers Screenshots vom 2026-07-10). Dreifache
// Absicherung: Browser-Scroll-Restauration abschalten und bei jedem
// Routenwechsel hart nach oben springen.
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ScrollReset() {
  const pathname = usePathname();

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
