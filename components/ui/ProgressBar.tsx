"use client";

// Fortschrittsbalken für den Lektions-Player (Spec §4.2): türkise Füllung,
// animierte Breite. Rein dekorativ animiert, nie Interaktions-Voraussetzung.
import { motion } from "framer-motion";

export function ProgressBar({ value, max }: { value: number; max: number }) {
  const clamped = Math.min(Math.max(value, 0), Math.max(max, 0));
  const percent = max > 0 ? (clamped / max) * 100 : 0;

  return (
    <div
      role="progressbar"
      aria-label="Fortschritt"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={clamped}
      className="h-4 w-full overflow-hidden rounded-full bg-locked"
    >
      <motion.div
        className="h-full rounded-full bg-primary"
        initial={false}
        animate={{ width: `${percent}%` }}
        transition={{ type: "spring", stiffness: 170, damping: 26 }}
      />
    </div>
  );
}
