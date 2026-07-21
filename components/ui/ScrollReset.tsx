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
    // Seit dem App-Shell-Umbau scrollt nicht das Fenster, sondern <main>
    // (#app-scroll) - dessen Position bleibt sonst beim Seitenwechsel stehen.
    document.getElementById("app-scroll")?.scrollTo(0, 0);
  }, [pathname]);

  // iOS-Gummiband abschalten: Am oberen/unteren Rand das Weiterziehen
  // (Overscroll) unterbinden. overscroll-behavior allein reicht auf iOS
  // nicht - deshalb touchmove am Rand blockieren (Xaviers Wunsch: "nicht
  // runterziehen"). Normales Scrollen bleibt unberuehrt.
  useEffect(() => {
    let startY = 0;

    const scrollerOf = (node: EventTarget | null): HTMLElement | null => {
      let el = node instanceof Node ? (node as HTMLElement | null) : null;
      while (el && el !== document.body) {
        if (el.nodeType === 1) {
          const oy = getComputedStyle(el).overflowY;
          if (
            (oy === "auto" || oy === "scroll") &&
            el.scrollHeight > el.clientHeight
          ) {
            return el;
          }
        }
        el = el.parentElement;
      }
      return document.getElementById("app-scroll");
    };

    const onStart = (e: TouchEvent) => {
      startY = e.touches[0]?.clientY ?? 0;
    };

    const onMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const scroller = scrollerOf(e.target);
      if (!scroller) return;
      const dy = e.touches[0].clientY - startY;
      const atTop = scroller.scrollTop <= 0;
      const atBottom =
        scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 1;
      // Am oberen Rand nach unten ziehen ODER am unteren Rand nach oben
      // ziehen = Overscroll → verhindern. (Bei nicht-scrollbarem Inhalt sind
      // beide true, dann ist jedes Ziehen Overscroll.)
      if ((atTop && dy > 0) || (atBottom && dy < 0)) {
        e.preventDefault();
      }
    };

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: false });
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
    };
  }, []);

  return null;
}
