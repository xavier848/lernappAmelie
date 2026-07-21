"use client";

// Feedback-Banner unten im Lektions-Player (Spec §4.2):
// Grün „Richtig! 🎉" / sanftes Orange „Fast! Schau nochmal." – NIE rot.
// Rutscht von unten herein (Framer), respektiert prefers-reduced-motion.
import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { SafeImage } from "./SafeImage";
import { Button } from "./Button";
import { cn } from "@/lib/cn";
import { playCorrect, playWrong } from "@/lib/sound";

/**
 * Reaktions-Pony neben der Rueckmeldung. Bei falsch trabt das grummelige
 * Pony herein und laesst Pferdeaepfel fallen (Amelie findet das lustig,
 * und Fehler fuehlen sich so nicht wie Strafe an). Bei richtig huepft das
 * froehliche Pony mit Konfetti herein.
 */
function FeedbackPony({
  state,
  reducedMotion,
}: {
  state: "correct" | "wrong";
  reducedMotion: boolean | null;
}) {
  if (state === "correct") {
    return (
      <motion.div
        className="shrink-0"
        initial={reducedMotion ? false : { scale: 0.3, opacity: 0, rotate: -8 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 13 }}
      >
        <SafeImage
          src="/pony-freut.png"
          alt=""
          width={76}
          height={76}
          priority
          fallback="🐴"
          fallbackClassName="text-6xl"
        />
      </motion.div>
    );
  }
  return (
    <div className="relative h-[76px] w-[76px] shrink-0">
      <motion.div
        className="absolute inset-0"
        initial={reducedMotion ? false : { x: -130, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
      >
        <SafeImage
          src="/pony-boese.png"
          alt=""
          width={76}
          height={76}
          priority
          fallback="🐴"
          fallbackClassName="text-6xl"
        />
      </motion.div>
      <motion.div
        className="absolute -right-1 bottom-0"
        initial={reducedMotion ? false : { scale: 0, opacity: 0, y: -6 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ delay: 0.45, type: "spring", stiffness: 300, damping: 15 }}
      >
        <SafeImage
          src="/pferdeaepfel.png"
          alt="Pferdeäpfel"
          width={40}
          height={40}
          fallback="💩"
          fallbackClassName="text-3xl"
        />
      </motion.div>
    </div>
  );
}

export type FeedbackBannerProps = {
  state: "correct" | "wrong";
  explanation?: string;
  onContinue: () => void;
  /** Ueberschreibt den Standard-Titel (z. B. "Fast! Probier es gleich nochmal."). */
  title?: string;
  /** Beschriftung des Weiter-Buttons (Default "Weiter"). */
  continueLabel?: string;
};

const STATES = {
  correct: {
    emoji: "🎉",
    title: "Richtig!",
    wrap: "bg-success-light border-success",
    text: "text-success-dark",
    variant: "success" as const,
  },
  wrong: {
    emoji: "🤔",
    title: "Fast! Schau nochmal.",
    wrap: "bg-warning-light border-warning",
    text: "text-warning-dark",
    variant: "warning" as const,
  },
};

export function FeedbackBanner({
  state,
  explanation,
  onContinue,
  title,
  continueLabel,
}: FeedbackBannerProps) {
  const reducedMotion = useReducedMotion();
  const c = STATES[state];
  const shownTitle = title ?? c.title;

  // Kurzer Feedback-Sound beim Erscheinen des Banners.
  useEffect(() => {
    if (state === "correct") playCorrect();
    else playWrong();
  }, [state]);

  return (
    <motion.div
      role="status"
      initial={reducedMotion ? false : { y: 120, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
      className="fixed inset-x-0 bottom-0 z-50"
    >
      <div
        className={cn(
          "mx-auto w-full max-w-md rounded-t-3xl border-t-4 px-4 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]",
          c.wrap
        )}
      >
        <div className="flex items-start gap-3">
          <FeedbackPony state={state} reducedMotion={reducedMotion} />
          <div className="min-w-0 flex-1">
            <p className={cn("text-xl font-extrabold", c.text)}>
              {c.emoji} {shownTitle}
            </p>
            {explanation && (
              <p className="mt-2 text-base text-ink">{explanation}</p>
            )}
          </div>
        </div>
        <div className="mt-4">
          <Button variant={c.variant} size="lg" full onClick={onContinue}>
            {continueLabel ?? "Weiter"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
