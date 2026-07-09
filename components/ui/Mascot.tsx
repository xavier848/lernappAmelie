"use client";

// Maskottchen (Pony mit Buch, Spec §3): begrüßt, lobt und tröstet.
// mood steuert eine leichte, rein dekorative Animation.
// message erscheint als Sprechblase (Card mit Pfeil) in Leichter Sprache.
import Image from "next/image";
import { motion, useReducedMotion, type TargetAndTransition } from "framer-motion";
import { Card } from "./Card";

export type MascotProps = {
  mood?: "happy" | "cheer" | "neutral";
  message?: string;
  size?: number;
};

const MOOD_ANIMATION: Record<
  "neutral" | "happy" | "cheer",
  TargetAndTransition | undefined
> = {
  neutral: undefined,
  happy: { rotate: [0, -3, 3, -2, 0] },
  cheer: { y: [0, -12, 0], rotate: [0, -4, 4, 0] },
};

export function Mascot({ mood = "neutral", message, size = 140 }: MascotProps) {
  const reducedMotion = useReducedMotion();
  const animate = reducedMotion ? undefined : MOOD_ANIMATION[mood];

  return (
    <div className="flex flex-col items-center">
      {message && (
        <div className="relative mb-4 max-w-xs">
          <Card className="px-4 py-3 text-center">
            <p className="text-base font-semibold text-ink">{message}</p>
          </Card>
          <span
            aria-hidden
            className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-r-2 border-b-2 border-locked bg-white"
          />
        </div>
      )}
      <motion.div
        animate={animate}
        transition={{
          duration: mood === "cheer" ? 0.9 : 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Image
          src="/mascot.png"
          alt="Maskottchen: Pony mit Buch"
          // Originalbild ist 554x816 – Seitenverhältnis beibehalten.
          width={size}
          height={Math.round((size * 816) / 554)}
          priority
        />
      </motion.div>
    </div>
  );
}
