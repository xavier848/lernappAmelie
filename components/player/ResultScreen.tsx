"use client";

// Ergebnis-Screen nach einer Lektion (Spec §4.3): Konfetti, Maskottchen lobt,
// verdiente XP gross, Sterne erscheinen nacheinander, „Weiter lernen" fuehrt
// zurueck zum Lernpfad. Animationen rein dekorativ (prefers-reduced-motion).
// Der Ueben-Modus nutzt denselben Screen ohne Sterne (stars weglassen) und
// mit eigenem Lob-Text + Button-Beschriftung.
import { useEffect } from "react";
import { SafeImage } from "@/components/ui/SafeImage";
import { motion, useReducedMotion } from "framer-motion";
import { playFinish } from "@/lib/sound";
import { Button } from "@/components/ui/Button";
import { Confetti } from "@/components/ui/Confetti";
import { Mascot } from "@/components/ui/Mascot";

export type ResultScreenProps = {
  xp: number;
  /** Neues Level, wenn diese Runde ein Level-Aufstieg war (sonst null/weg). */
  levelUp?: number | null;
  /** Sterne der Lektion; weglassen = keine Sterne anzeigen (Ueben-Modus). */
  stars?: 1 | 2 | 3;
  /** Lob-Text des Maskottchens. */
  message?: string;
  /** Beschriftung des Weiter-Buttons. */
  buttonLabel?: string;
  /** Ponyweide ist sauber → Amelie darf das Pony fuettern. */
  canFeed?: boolean;
  /** Bereits gewaehltes Futter (zeigt Bestaetigung statt Auswahl). */
  fedItem?: "karotte" | "heu" | "apfel" | null;
  /** Wird mit der Futter-Wahl aufgerufen. */
  onFeed?: (item: "karotte" | "heu" | "apfel") => void;
  onContinue: () => void;
};

export function ResultScreen({
  xp,
  levelUp = null,
  stars,
  message = "Super gemacht, Amelie!",
  buttonLabel = "Weiter lernen",
  canFeed = false,
  fedItem = null,
  onFeed,
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

      <div className="flex flex-col items-center text-center">
        <p className="text-5xl font-extrabold text-primary">+{xp} XP</p>
        <p className="mt-2 text-base font-semibold text-ink">
          Das hast du dir verdient!
        </p>
        {levelUp !== null && (
          <motion.p
            initial={reducedMotion ? false : { scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: reducedMotion ? 0 : 0.5, type: "spring" }}
            className="mt-4 rounded-full bg-primary px-5 py-2 text-lg font-extrabold text-white"
          >
            Level {levelUp} erreicht! 🎉
          </motion.p>
        )}
      </div>

      {/* Ponyweide sauber → Pony fuettern. Erst Auswahl, dann Bestaetigung. */}
      {canFeed && (
        <div className="w-full">
          {fedItem === null ? (
            <div className="flex flex-col items-center gap-3">
              <p className="text-base font-bold text-ink">
                🥕 Füttere dein Pony!
              </p>
              <div className="grid w-full grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => onFeed?.("karotte")}
                  className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-b-4 border-locked bg-white select-none active:translate-y-0.5 active:border-b-2"
                >
                  <SafeImage
                    src="/karotte.png"
                    alt=""
                    width={44}
                    height={44}
                    fallback="🥕"
                    fallbackClassName="text-4xl"
                  />
                  <span className="text-sm font-bold text-ink">Karotte</span>
                </button>
                <button
                  type="button"
                  onClick={() => onFeed?.("heu")}
                  className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-b-4 border-locked bg-white select-none active:translate-y-0.5 active:border-b-2"
                >
                  <SafeImage
                    src="/heu.png"
                    alt=""
                    width={44}
                    height={44}
                    fallback="🌾"
                    fallbackClassName="text-4xl"
                  />
                  <span className="text-sm font-bold text-ink">Heu</span>
                </button>
                <button
                  type="button"
                  onClick={() => onFeed?.("apfel")}
                  className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-b-4 border-locked bg-white select-none active:translate-y-0.5 active:border-b-2"
                >
                  <span className="text-4xl" aria-hidden>
                    🍎
                  </span>
                  <span className="text-sm font-bold text-ink">Apfel</span>
                </button>
              </div>
            </div>
          ) : (
            <motion.p
              initial={reducedMotion ? false : { scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 14 }}
              className="text-center text-base font-bold text-primary-dark"
            >
              Dein Pony freut sich über{" "}
              {fedItem === "karotte"
                ? "die Karotte 🥕"
                : fedItem === "heu"
                  ? "das Heu 🌾"
                  : "den Apfel 🍎"}
              !
            </motion.p>
          )}
        </div>
      )}

      <div className="w-full pt-2">
        <Button size="lg" full onClick={onContinue}>
          {buttonLabel}
        </Button>
      </div>
    </div>
  );
}
