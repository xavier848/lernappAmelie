"use client";

// sort_buckets – Items nacheinander in 2–3 Koerbe sortieren (Spec §5.4).
// Tap-only: Korb antippen sortiert das aktuell gezeigte Item.
// Falsch → Karte wackelt orange, der richtige Korb pulsiert kurz tuerkis,
// der Fehler wird gezaehlt und das naechste Item kommt. correct = 0 Fehler.

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { SortBucketsData } from "@/lib/content-schema";
import { cn } from "@/lib/cn";
import type { ExerciseComponentProps } from "./types";
import { shuffleSeeded } from "./shuffle";

/** Dauer der Falsch-Rueckmeldung (Shake + Korb-Pulsieren), bevor es weitergeht. */
export const SORT_FEEDBACK_MS = 1400;

type SortBucketsProps = ExerciseComponentProps<SortBucketsData> & {
  /** Optionaler stabiler Seed (nur für Tests). Default: zufällig pro Aufruf. */
  seed?: string | number;
};

export function SortBuckets({
  data,
  onResult,
  checkRequested,
  onReadyChange,
  seed,
}: SortBucketsProps) {
  const [index, setIndex] = useState(0);
  const [errors, setErrors] = useState(0);
  // Falsch einsortierte Items (fuer Mamas Statistik): "Item → Korb".
  const wrongTries = useRef<string[]>([]);
  // Waehrend der Falsch-Rueckmeldung: id des richtigen Korbs (pulsiert tuerkis).
  const [wrongFeedbackBucket, setWrongFeedbackBucket] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Items pro Aufruf mischen, damit die Reihenfolge kein Muster verrät
  // (im Content stehen sie oft nach Korb gruppiert). Reihenfolge egal fürs
  // Sortieren, nur die Zuordnung Item→Korb zählt.
  const [mountSeed] = useState(() => `mount-${Math.random()}`);
  const items = useMemo(
    () => shuffleSeeded(data.items, seed ?? mountSeed),
    [data, seed, mountSeed],
  );
  const done = index >= items.length;
  const currentItem = done ? null : items[index];

  // Timeout beim Unmount aufraeumen.
  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  // ready = alle Items sortiert.
  useEffect(() => {
    onReadyChange(done);
  }, [done, onReadyChange]);

  // Pruefen: genau ein onResult pro erhoehtem checkRequested.
  const lastCheckRef = useRef(checkRequested);
  useEffect(() => {
    if (checkRequested === lastCheckRef.current) return;
    lastCheckRef.current = checkRequested;
    onResult({
      correct: errors === 0,
      // Falsche Zuordnungen fuer Mamas Statistik festhalten.
      given:
        errors > 0
          ? wrongTries.current.slice(0, 3).join("; ").slice(0, 200)
          : undefined,
    });
  }, [checkRequested, errors, onResult]);

  function handleBucketTap(bucketId: string) {
    if (!currentItem || wrongFeedbackBucket) return;
    if (bucketId === currentItem.bucket) {
      setIndex((value) => value + 1);
      return;
    }
    // Falsch: Fehler zaehlen, richtigen Korb kurz zeigen, dann weiter.
    const tappedLabel =
      data.buckets.find((b) => b.id === bucketId)?.label ?? bucketId;
    wrongTries.current.push(`„${currentItem.text}" → Korb „${tappedLabel}"`);
    setErrors((value) => value + 1);
    setWrongFeedbackBucket(currentItem.bucket);
    timeoutRef.current = setTimeout(() => {
      setWrongFeedbackBucket(null);
      setIndex((value) => value + 1);
    }, SORT_FEEDBACK_MS);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Korb-Buttons oben, kompakt nebeneinander */}
      <div
        className={cn(
          "grid auto-rows-fr gap-2",
          data.buckets.length === 3 ? "grid-cols-3" : "grid-cols-2",
        )}
      >
        {data.buckets.map((bucket) => {
          const isCorrectHint = wrongFeedbackBucket === bucket.id;
          return (
            <button
              key={bucket.id}
              type="button"
              onClick={() => handleBucketTap(bucket.id)}
              disabled={done || wrongFeedbackBucket !== null}
              className={cn(
                "flex min-h-14 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-2xl border-2 border-b-4 px-1.5 py-1.5 font-bold text-ink transition-colors",
                "active:translate-y-1 active:border-b-2",
                "disabled:cursor-not-allowed",
                isCorrectHint
                  ? "animate-pulse border-primary bg-primary-light"
                  : "border-locked bg-white",
              )}
            >
              {bucket.icon && (
                <span aria-hidden="true" className="text-xl leading-none">
                  {bucket.icon}
                </span>
              )}
              <span className="text-sm leading-tight">{bucket.label}</span>
            </button>
          );
        })}
      </div>

      {/* Aktuelles Item mittig, kompakt – Fortschritt klein darunter */}
      {currentItem ? (
        <div className="flex flex-col items-center gap-1.5">
          <motion.div
            data-testid="sort-item"
            animate={wrongFeedbackBucket ? { x: [0, -10, 10, -8, 8, 0] } : { x: 0 }}
            transition={{ duration: 0.5 }}
            className={cn(
              "flex max-h-28 min-h-14 w-full flex-col items-center justify-center gap-1.5 rounded-2xl border-2 p-3 text-center text-lg font-bold",
              wrongFeedbackBucket
                ? "border-warning bg-warning-light text-warning-dark"
                : "border-primary bg-primary-light text-ink",
            )}
          >
            {currentItem.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentItem.image}
                alt=""
                className="h-12 w-12 rounded-xl object-cover"
              />
            )}
            <span>{currentItem.text}</span>
          </motion.div>
          <p className="text-sm text-ink/70">
            {index + 1} von {items.length}
          </p>
          {wrongFeedbackBucket && (
            <p className="text-sm font-semibold text-warning-dark">
              Fast! Der richtige Korb leuchtet.
            </p>
          )}
        </div>
      ) : (
        <div className="flex min-h-14 items-center justify-center rounded-2xl border-2 border-success bg-success-light p-3 text-center text-lg font-bold text-ink">
          Alles sortiert! Tippe auf Prüfen.
        </div>
      )}
    </div>
  );
}
