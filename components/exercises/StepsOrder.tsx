"use client";

// Übungstyp 1: steps_order – Schritte in die richtige Reihenfolge tippen (Spec §5.1).
// Design „Nummern-Tap": EINE Liste gemischter Karten (kompakt, passt ohne
// Scrollen auf ein iPhone). Antippen einer Karte vergibt die nächste freie
// Nummer (türkiser Kreis links). Erneutes Antippen entfernt die Nummer,
// alle höheren Nummern rutschen automatisch nach – fehlerfreundlich.
// Variante mode:"words": kompakte Wort-Chips (Wortbank + Antwortzeile).
// Tap-only: alles über onClick, kein Drag & Drop.
// Den Aufgaben-Prompt (+ TTS) zeigt der Lektions-Player an, nicht die Komponente.
import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { StepsOrderData } from "@/lib/content-schema";
import type { ExerciseComponentProps } from "./types";
import { shuffleSeeded } from "./shuffle";
import { useCheck, useReportReady } from "./useCheck";
import { cn } from "@/lib/cn";

type StepsOrderProps = ExerciseComponentProps<StepsOrderData> & {
  /** Optionaler stabiler Seed (z. B. exercise-id). Default: Zufall beim Mount. */
  seed?: string | number;
};

type CardState = "unnumbered" | "numbered" | "correct" | "wrong";

const CARD_STATE_CLASSES: Record<CardState, string> = {
  unnumbered: "border-locked bg-white",
  numbered: "border-primary bg-primary-light",
  correct: "border-success bg-success-light",
  wrong: "border-warning bg-warning-light",
};

const BADGE_BG: Record<CardState, string> = {
  unnumbered: "bg-primary",
  numbered: "bg-primary",
  correct: "bg-success",
  wrong: "bg-warning",
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
  const reducedMotion = useReducedMotion();

  // Karten mit stabiler id (= korrekte Position 0-basiert), gemischt.
  // Ohne expliziten seed (nur Tests setzen einen) wird pro Mount neu
  // gemischt, damit Wiederholungen nicht immer gleich aussehen.
  // Der Shuffle liefert NIE die Lösungs-Reihenfolge, wenn vermeidbar.
  const [mountSeed] = useState(() => `mount-${Math.random()}`);
  const cards = useMemo(() => {
    const indexed = data.steps.map((step, index) => ({ ...step, id: index }));
    return shuffleSeeded(indexed, seed ?? mountSeed);
  }, [data, seed, mountSeed]);

  // order = Karten-ids in Nummern-Reihenfolge (order[0] trägt Nummer 1).
  const [order, setOrder] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);

  const ready = order.length === total;
  useReportReady(ready, onReadyChange);

  useCheck(checkRequested, () => {
    const correct =
      order.length === total && order.every((id, index) => id === index);
    setChecked(true);
    onResult({ correct });
  });

  /** Karte antippen: Nummer vergeben ODER Nummer entfernen (Renummerierung). */
  const toggleCard = (id: number) => {
    if (checked) return;
    setOrder((prev) =>
      prev.includes(id) ? prev.filter((other) => other !== id) : [...prev, id],
    );
  };

  /** Chip in der Antwortzeile antippen → Wort zurück in die Wortbank. */
  const removeAt = (slot: number) => {
    if (checked) return;
    setOrder((prev) => prev.filter((_, index) => index !== slot));
  };

  if (isWords) {
    return (
      <WordsMode
        cards={cards}
        order={order}
        checked={checked}
        onPick={toggleCard}
        onRemove={removeAt}
      />
    );
  }

  /** Zustand einer Karte: vor dem Prüfen neutral, danach richtig/falsch. */
  const cardState = (id: number): CardState => {
    const numbered = order.includes(id);
    if (!checked) return numbered ? "numbered" : "unnumbered";
    return order.indexOf(id) === id ? "correct" : "wrong";
  };

  return (
    <ol
      aria-label="Tippe die Schritte in der richtigen Reihenfolge an"
      className="flex flex-col gap-2"
    >
      {cards.map((card) => {
        const position = order.indexOf(card.id);
        const number = position >= 0 ? position + 1 : null;
        const state = cardState(card.id);
        const wrong = checked && state === "wrong";
        return (
          <li key={card.id}>
            <button
              type="button"
              data-testid="order-card"
              disabled={checked}
              onClick={() => toggleCard(card.id)}
              aria-label={cardLabel(card.text, {
                number,
                checked,
                correctNumber: card.id + 1,
                nextNumber: order.length + 1,
              })}
              className={cn(
                "flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-2xl border-2 px-3 py-2 text-left select-none",
                "transition-transform active:translate-y-0.5",
                CARD_STATE_CLASSES[state],
              )}
            >
              <NumberBadge
                number={number}
                background={BADGE_BG[state]}
                reducedMotion={reducedMotion ?? false}
              />
              {card.image && (
                <img
                  src={card.image}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-lg object-contain"
                />
              )}
              <span className="flex-1 text-base font-semibold text-ink">
                {card.text}
              </span>
              {wrong && (
                <span className="shrink-0 text-sm font-bold text-warning-dark">
                  richtig: {card.id + 1}.
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/** Zugänglicher Karten-Name in Leichter Sprache. */
function cardLabel(
  text: string,
  info: {
    number: number | null;
    checked: boolean;
    correctNumber: number;
    nextNumber: number;
  },
): string {
  if (info.number === null) {
    return `${text}. Antippen für Nummer ${info.nextNumber}.`;
  }
  if (!info.checked) {
    return `Nummer ${info.number}: ${text}. Antippen zum Entfernen.`;
  }
  return info.number === info.correctNumber
    ? `Nummer ${info.number}: ${text}. Richtig.`
    : `Nummer ${info.number}: ${text}. Richtig ist Nummer ${info.correctNumber}.`;
}

/**
 * Nummern-Kreis links auf der Karte.
 * Ohne Nummer: leerer gestrichelter Kreis. Mit Nummer: gefüllter Kreis,
 * sanft eingeblendet (nur transform/opacity; respektiert reduced motion).
 */
function NumberBadge({
  number,
  background,
  reducedMotion,
}: {
  number: number | null;
  background: string;
  reducedMotion: boolean;
}) {
  if (number === null) {
    return (
      <span
        aria-hidden
        data-testid="empty-number"
        className="h-9 w-9 shrink-0 rounded-full border-2 border-dashed border-locked"
      />
    );
  }
  return (
    <motion.span
      // key = Nummer: bei Renummerierung wird sanft neu eingeblendet.
      key={number}
      aria-hidden
      data-testid="number-badge"
      initial={reducedMotion ? false : { scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: reducedMotion ? 0 : 0.18 }}
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-bold text-white",
        background,
      )}
    >
      {number}
    </motion.span>
  );
}

/* ------------------------------ words-Modus ------------------------------ */
// Duolingo-Word-Bank: Antwortzeile oben, Wortbank darunter. Kompakte Chips.

type WordCard = { id: number; text: string; image?: string };

type SlotState = "neutral" | "correct" | "wrong";

const SLOT_STATE_CLASSES: Record<SlotState, string> = {
  neutral: "border-primary bg-primary-light",
  correct: "border-success bg-success-light",
  wrong: "border-warning bg-warning-light",
};

function WordsMode({
  cards,
  order,
  checked,
  onPick,
  onRemove,
}: {
  cards: WordCard[];
  order: number[];
  checked: boolean;
  onPick: (id: number) => void;
  onRemove: (slot: number) => void;
}) {
  const cardById = new Map(cards.map((card) => [card.id, card]));
  const bank = cards.filter((card) => !order.includes(card.id));

  const slotState = (slot: number): SlotState => {
    if (!checked) return "neutral";
    return order[slot] === slot ? "correct" : "wrong";
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Antwortzeile (oben) */}
      <div
        aria-label="Deine Antwort"
        className="flex min-h-16 flex-wrap items-start gap-2 rounded-2xl border-2 border-dashed border-locked p-2"
      >
        {order.map((id, slot) => {
          const card = cardById.get(id);
          if (!card) return null;
          return (
            <button
              key={id}
              type="button"
              data-testid="slot-card"
              disabled={checked}
              onClick={() => onRemove(slot)}
              aria-label={`${card.text}. Antippen zum Entfernen.`}
              className={cn(
                "inline-flex min-h-12 cursor-pointer items-center rounded-2xl border-2 px-3 text-base font-semibold text-ink select-none",
                SLOT_STATE_CLASSES[slotState(slot)],
              )}
            >
              {card.text}
            </button>
          );
        })}
      </div>

      {/* Wortbank (unten) */}
      <div aria-label="Wörter zum Antippen" className="flex flex-wrap gap-2">
        {bank.map((card) => (
          <button
            key={card.id}
            type="button"
            data-testid="pool-card"
            disabled={checked}
            onClick={() => onPick(card.id)}
            className={cn(
              "inline-flex min-h-12 cursor-pointer items-center rounded-2xl border-2 border-b-4 border-locked bg-white px-3 text-base font-semibold text-ink select-none",
              "transition-transform active:translate-y-1 active:border-b-2",
            )}
          >
            {card.text}
          </button>
        ))}
      </div>
    </div>
  );
}
