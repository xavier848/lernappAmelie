"use client";

// Übungstyp 1: steps_order – Schritte in die richtige Reihenfolge tippen (Spec §5.1).
// Unten: Pool gemischter Karten. Oben: nummerierte Antwortslots.
// Karte antippen → nächster freier Slot. Slot antippen → Karte zurück in den Pool.
// Tap-only: alles über onClick, kein Drag & Drop.
// Den Aufgaben-Prompt (+ TTS) zeigt der Lektions-Player an, nicht die Komponente.
import { useMemo, useState } from "react";
import type { StepsOrderData } from "@/lib/content-schema";
import type { ExerciseComponentProps } from "./types";
import { shuffleSeeded } from "./shuffle";
import { useCheck, useReportReady } from "./useCheck";
import { cn } from "@/lib/cn";

type StepsOrderProps = ExerciseComponentProps<StepsOrderData> & {
  /** Optionaler stabiler Seed (z. B. exercise-id). Default: aus den Daten abgeleitet. */
  seed?: string | number;
};

type SlotState = "neutral" | "correct" | "wrong";

const SLOT_STATE_CLASSES: Record<SlotState, string> = {
  neutral: "border-primary bg-primary-light",
  correct: "border-success bg-success-light",
  wrong: "border-warning bg-warning-light",
};

export function StepsOrder({
  data,
  onResult,
  checkRequested,
  onReadyChange,
  seed,
}: StepsOrderProps) {
  const isWords = data.mode === "words";
  const total = data.steps.length;

  // Karten mit stabiler id (= korrekte Position), gemischt.
  // Ohne expliziten seed (nur Tests setzen einen) wird pro Aufruf neu
  // gemischt, damit Wiederholungen nicht immer gleich aussehen.
  // Der Shuffle liefert NIE die Lösungs-Reihenfolge, wenn vermeidbar.
  const [mountSeed] = useState(() => `mount-${Math.random()}`);
  const cards = useMemo(() => {
    const indexed = data.steps.map((step, index) => ({ ...step, id: index }));
    return shuffleSeeded(indexed, seed ?? mountSeed);
  }, [data, seed, mountSeed]);

  // placed[slot] = Karten-id, in Antipp-Reihenfolge gefüllt.
  const [placed, setPlaced] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);

  const ready = placed.length === total;
  useReportReady(ready, onReadyChange);

  useCheck(checkRequested, () => {
    const correct =
      placed.length === total && placed.every((id, slot) => id === slot);
    setChecked(true);
    onResult({ correct });
  });

  const placeCard = (id: number) => {
    if (checked) return;
    setPlaced((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const removeFromSlot = (slot: number) => {
    if (checked) return;
    setPlaced((prev) => prev.filter((_, index) => index !== slot));
  };

  const cardById = new Map(cards.map((card) => [card.id, card]));
  const pool = cards.filter((card) => !placed.includes(card.id));

  const slotState = (slot: number): SlotState => {
    if (!checked) return "neutral";
    return placed[slot] === slot ? "correct" : "wrong";
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Antwort-Bereich (oben) */}
      {isWords ? (
        <div
          aria-label="Deine Antwort"
          className="flex min-h-16 flex-wrap items-start gap-3 rounded-2xl border-2 border-dashed border-locked p-3"
        >
          {placed.map((id, slot) => {
            const card = cardById.get(id);
            if (!card) return null;
            return (
              <button
                key={id}
                type="button"
                data-testid="slot-card"
                disabled={checked}
                onClick={() => removeFromSlot(slot)}
                aria-label={`${card.text}. Antippen zum Entfernen.`}
                className={cn(
                  "inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-2xl border-2 px-4 text-lg font-semibold text-ink select-none",
                  SLOT_STATE_CLASSES[slotState(slot)],
                )}
              >
                {card.text}
              </button>
            );
          })}
        </div>
      ) : (
        <ol aria-label="Deine Reihenfolge" className="flex flex-col gap-3">
          {Array.from({ length: total }, (_, slot) => {
            const id = placed[slot];
            const card = id === undefined ? undefined : cardById.get(id);
            return (
              <li key={slot}>
                {card ? (
                  <button
                    type="button"
                    data-testid="slot-card"
                    disabled={checked}
                    onClick={() => removeFromSlot(slot)}
                    aria-label={`Schritt ${slot + 1}: ${card.text}. Antippen zum Entfernen.`}
                    className={cn(
                      "flex min-h-16 w-full cursor-pointer items-center gap-3 rounded-2xl border-2 p-3 text-left select-none",
                      SLOT_STATE_CLASSES[slotState(slot)],
                    )}
                  >
                    <SlotNumber value={slot + 1} filled />
                    {card.image && (
                      <img
                        src={card.image}
                        alt=""
                        className="h-12 w-12 rounded-lg object-contain"
                      />
                    )}
                    <span className="text-lg font-semibold text-ink">
                      {card.text}
                    </span>
                  </button>
                ) : (
                  <div
                    data-testid="empty-slot"
                    className="flex min-h-16 w-full items-center gap-3 rounded-2xl border-2 border-dashed border-locked p-3"
                  >
                    <SlotNumber value={slot + 1} />
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {/* Karten-Pool (unten) */}
      <div
        aria-label="Karten zum Antippen"
        className={cn(
          "gap-3",
          isWords ? "flex flex-wrap" : "flex flex-col",
        )}
      >
        {pool.map((card) => (
          <button
            key={card.id}
            type="button"
            data-testid="pool-card"
            disabled={checked}
            onClick={() => placeCard(card.id)}
            className={cn(
              "cursor-pointer items-center rounded-2xl border-2 border-b-4 border-locked bg-white text-ink transition-transform select-none",
              "active:translate-y-1 active:border-b-2",
              isWords
                ? "inline-flex min-h-12 gap-2 px-4 text-lg font-semibold"
                : "flex min-h-16 w-full gap-3 p-3 text-left text-lg font-semibold",
            )}
          >
            {!isWords && card.image && (
              <img
                src={card.image}
                alt=""
                className="h-12 w-12 rounded-lg object-contain"
              />
            )}
            {card.text}
          </button>
        ))}
      </div>
    </div>
  );
}

function SlotNumber({ value, filled = false }: { value: number; filled?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base font-bold",
        filled ? "bg-primary text-white" : "bg-locked text-ink",
      )}
    >
      {value}
    </span>
  );
}
