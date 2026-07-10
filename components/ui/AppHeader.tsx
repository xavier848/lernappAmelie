// Sticky-Header (Spec §4.1): Streak-Flamme 🔥 + Zahl, XP-Stand ⚡ und
// Level-Chip. Bekommt die Werte fertig als Props, rechnet nur das Level aus.
// Im Mama-Pruef-Modus zeigt ein Banner darueber, wessen Bereich aktiv ist.
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { levelForXp } from "@/lib/scoring";
import { getProfile } from "@/lib/device";

export function AppHeader({ streak, xp }: { streak: number; xp: number }) {
  const { level } = levelForXp(xp);
  const [isMama, setIsMama] = useState(false);

  useEffect(() => {
    setIsMama(getProfile() === "mama");
  }, []);

  // Solides Weiß statt backdrop-blur: Blur verursacht auf Handys
  // sichtbares Ruckeln beim Scrollen unter dem Sticky-Header.
  return (
    <header className="sticky top-0 z-40 border-b border-locked bg-white">
      {isMama && (
        <Link
          href="/amelie"
          className="flex items-center justify-center gap-2 bg-warning-light py-1.5 text-sm font-bold text-warning-dark"
        >
          📝 Prüf-Modus (Mama) · zu Amelie wechseln
        </Link>
      )}
      <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3 px-4 py-2">
        <span
          aria-label={`${streak} Tage Serie`}
          className="flex min-h-12 items-center gap-1 text-lg font-bold text-ink"
        >
          <span aria-hidden>🔥</span>
          {streak}
        </span>
        <span
          aria-label={`${xp} Punkte`}
          className="flex min-h-12 items-center gap-1 text-lg font-bold text-ink"
        >
          <span aria-hidden>⚡</span>
          {xp}
        </span>
        <span className="rounded-full bg-primary px-4 py-1.5 text-sm font-bold text-white">
          Level {level}
        </span>
      </div>
    </header>
  );
}
