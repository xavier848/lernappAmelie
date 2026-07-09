"use client";

// Feedback-Banner unten im Lektions-Player (Spec §4.2):
// Grün „Richtig! 🎉" / sanftes Orange „Fast! Schau nochmal." – NIE rot.
// Rutscht von unten herein (Framer), respektiert prefers-reduced-motion.
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "./Button";
import { cn } from "@/lib/cn";

export type FeedbackBannerProps = {
  state: "correct" | "wrong";
  explanation?: string;
  onContinue: () => void;
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
}: FeedbackBannerProps) {
  const reducedMotion = useReducedMotion();
  const c = STATES[state];

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
          "mx-auto w-full max-w-md rounded-t-3xl border-t-4 px-4 pt-4 pb-6",
          c.wrap
        )}
      >
        <p className={cn("text-xl font-extrabold", c.text)}>
          {c.emoji} {c.title}
        </p>
        {explanation && <p className="mt-2 text-base text-ink">{explanation}</p>}
        <div className="mt-4">
          <Button variant={c.variant} size="lg" full onClick={onContinue}>
            Weiter
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
