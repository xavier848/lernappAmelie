"use client";

// Ergebnis-Screen nach einer Lektion (Spec §4.3): Konfetti, Maskottchen lobt,
// verdiente XP gross, Sterne erscheinen nacheinander, „Weiter lernen" fuehrt
// zurueck zum Lernpfad. Animationen rein dekorativ (prefers-reduced-motion).
// Der Ueben-Modus nutzt denselben Screen ohne Sterne (stars weglassen) und
// mit eigenem Lob-Text + Button-Beschriftung.
import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { playFinish } from "@/lib/sound";
import { Button } from "@/components/ui/Button";
import { Confetti } from "@/components/ui/Confetti";
import { Mascot } from "@/components/ui/Mascot";

export type ResultScreenProps = {
  xp: number;
  /** Sterne der Lektion; weglassen = keine Sterne anzeigen (Ueben-Modus). */
  stars?: 1 | 2 | 3;
  /** Lob-Text des Maskottchens. */
  message?: string;
  /** Beschriftung des Weiter-Buttons. */
  buttonLabel?: string;
  onContinue: () => void;
};

export function ResultScreen({
  xp,
  stars,
  message = "Super gemacht, Amelie!",
  buttonLabel = "Weiter lernen",
  onContinue,
}: ResultScreenProps) {
  // Kleiner Jubel beim Erscheinen des Ergebnis-Screens.
  useEffect(() => {
    playFinish();
  }, []);

  const reducedMotion = useReducedMotion();

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 px-4 py-10">
      <Confetti />

      <Mascot mood="cheer" message={message} />

      {stars !== undefined && (
        <div
          role="img"
          aria-label={`${stars} von 3 Sternen`}
          className="flex items-center justify-center gap-3"
        >
          {[1, 2, 3].map((n) => (
            <motion.span
              key={n}
              aria-hidden
              className={
                n <= stars ? "text-5xl" : "text-5xl opacity-25 grayscale"
              }
              initial={reducedMotion ? false : { scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                delay: reducedMotion ? 0 : 0.4 + n * 0.35,
                type: "spring",
                stiffness: 260,
                damping: 14,
              }}
            >
              ⭐
            </motion.span>
          ))}
        </div>
      )}

      <div className="text-center">
        <p className="text-5xl font-extrabold text-primary">+{xp} XP</p>
        <p className="mt-2 text-base font-semibold text-ink">
          Das hast du dir verdient!
        </p>
      </div>

      <div className="w-full pt-2">
        <Button size="lg" full onClick={onContinue}>
          {buttonLabel}
        </Button>
      </div>
    </div>
  );
}
