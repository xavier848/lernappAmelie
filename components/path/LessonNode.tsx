"use client";

// Ein Lektions-Knoten im Lernpfad (Spec §4.1): Kreis 72 px.
// - completed: tuerkis, weisses Haekchen, Sterne-Reihe darunter
// - current:   pulsierender tuerkiser Ring (Framer, rein dekorativ) + Label
// - locked:    grau mit Schloss, kein Link
// Navigation nur per Tap (Link/onClick), keine Gesten.
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";
import type { LessonRow } from "@/lib/types";
import type { LessonPathState } from "./path-states";

export type LessonNodeProps = {
  lesson: LessonRow;
  state: LessonPathState["state"];
  stars?: number;
};

const CIRCLE_BASE =
  "flex h-[72px] w-[72px] items-center justify-center rounded-full select-none";

export function LessonNode({ lesson, state, stars }: LessonNodeProps) {
  const reducedMotion = useReducedMotion();

  if (state === "locked") {
    return (
      <div
        className="flex flex-col items-center"
        aria-label={`${lesson.title} – noch gesperrt`}
      >
        <div className={cn(CIRCLE_BASE, "bg-locked text-3xl")} aria-hidden>
          🔒
        </div>
      </div>
    );
  }

  if (state === "completed") {
    return (
      <Link
        href={`/lektion/${lesson.slug}`}
        aria-label={`${lesson.title} – geschafft, nochmal üben`}
        className="flex flex-col items-center"
      >
        <span
          className={cn(
            CIRCLE_BASE,
            "border-b-4 border-primary-dark bg-primary text-3xl font-extrabold text-white",
            "active:translate-y-1 active:border-b-0"
          )}
          aria-hidden
        >
          ✓
        </span>
        <span className="mt-1 text-sm" aria-label={`${stars ?? 1} von 3 Sternen`}>
          {"⭐".repeat(Math.min(Math.max(stars ?? 1, 1), 3))}
        </span>
      </Link>
    );
  }

  // current
  return (
    <Link
      href={`/lektion/${lesson.slug}`}
      aria-label={`${lesson.title} – jetzt lernen`}
      className="flex flex-col items-center"
    >
      <span className="relative inline-flex">
        {/* Groesserer, pulsierender tuerkiser Ring (nur Deko) */}
        <motion.span
          aria-hidden
          className="absolute -inset-2 rounded-full border-4 border-primary"
          animate={
            reducedMotion
              ? undefined
              : { scale: [1, 1.12, 1], opacity: [0.9, 0.4, 0.9] }
          }
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
        <span
          className={cn(
            CIRCLE_BASE,
            "border-b-4 border-primary-dark bg-primary text-2xl text-white",
            "active:translate-y-1 active:border-b-0"
          )}
          aria-hidden
        >
          ▶
        </span>
      </span>
      <span className="mt-3 max-w-40 text-center text-sm font-bold text-primary-dark">
        {lesson.title}
      </span>
    </Link>
  );
}
