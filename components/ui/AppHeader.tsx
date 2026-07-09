// Sticky-Header (Spec §4.1): Streak-Flamme 🔥 + Zahl, XP-Stand ⚡ und
// Level-Chip. Bekommt die Werte fertig als Props, rechnet nur das Level aus.
import { levelForXp } from "@/lib/scoring";

export function AppHeader({ streak, xp }: { streak: number; xp: number }) {
  const { level } = levelForXp(xp);

  // Solides Weiß statt backdrop-blur: Blur verursacht auf Handys
  // sichtbares Ruckeln beim Scrollen unter dem Sticky-Header.
  return (
    <header className="sticky top-0 z-40 border-b border-locked bg-white">
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
