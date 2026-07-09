"use client";

// Abzeichen-Galerie (Spec §4.4 / §9): alle Abzeichen aus lib/badges.ts,
// 2-spaltig. Erreichte Abzeichen farbig, offene grau (grayscale + opacity).
import { ALL_BADGES } from "@/lib/badges";
import { cn } from "@/lib/cn";

export function BadgeGrid({ earnedIds }: { earnedIds: string[] }) {
  const earned = new Set(earnedIds);

  return (
    <ul className="grid grid-cols-2 gap-3">
      {ALL_BADGES.map((badge) => {
        const isEarned = earned.has(badge.id);
        return (
          <li
            key={badge.id}
            aria-label={`${badge.title} – ${
              isEarned ? "erreicht" : "noch offen"
            }`}
            className={cn(
              "flex flex-col items-center gap-1 rounded-2xl border-2 border-locked bg-white p-4 text-center",
              isEarned
                ? "border-primary bg-primary-light"
                : "grayscale opacity-50"
            )}
          >
            <span className="text-3xl" aria-hidden>
              {badge.emoji}
            </span>
            <span className="text-base font-bold text-ink">{badge.title}</span>
            <span className="text-sm text-ink/80">{badge.description}</span>
          </li>
        );
      })}
    </ul>
  );
}
