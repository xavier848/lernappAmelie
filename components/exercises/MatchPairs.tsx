"use client";

// Übungstyp 3: match_pairs – Paare zuordnen (Spec §5.3). Tap-only.
// Standard: zwei Spalten. Links antippen (türkis) → rechts antippen.
//   Richtig: Paar verblasst (opacity-30, deaktiviert).
//   Falsch: beide Karten schütteln kurz (Framer), Fehlversuch zählt intern.
//   correct = alle Paare gefunden UND 0 Fehlversuche.
// memory: true → Raster (grid-cols-3) verdeckter Karten mit ?-Rückseite.
//   2 offen ohne Match → nach 1,2 s wieder zudecken. Fehlversuche zählen NICHT:
//   correct = fertig gespielt (alle Paare gefunden).
// Den Aufgaben-Prompt (+ TTS) zeigt der Lektions-Player an, nicht die Komponente.
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { MatchPairsData } from "@/lib/content-schema";
import type { ExerciseComponentProps } from "./types";
import { seedFromData, shuffleSeeded } from "./shuffle";
import { useCheck, useReportReady } from "./useCheck";
import { cn } from "@/lib/cn";

type MatchPairsProps = ExerciseComponentProps<MatchPairsData> & {
  /** Optionaler stabiler Seed (z. B. exercise-id). Default: aus den Daten abgeleitet. */
  seed?: string | number;
};

type PairSide = MatchPairsData["pairs"][number]["left"];

const SHAKE_KEYFRAMES = { x: [0, -8, 8, -6, 6, 0] };
const SHAKE_TRANSITION = { duration: 0.4 };
/** Zeit in ms, bis zwei offene Memory-Karten ohne Match wieder zugedeckt werden. */
export const MEMORY_HIDE_DELAY_MS = 1200;

function sideLabel(side: PairSide): string {
  return side.text ?? "Bild";
}

function SideContent({ side }: { side: PairSide }) {
  return (
    <>
      {side.image && (
        <img
          src={side.image}
          alt={side.text ? "" : sideLabel(side)}
          className="h-10 w-10 rounded-lg object-contain"
        />
      )}
      {side.text && <span>{side.text}</span>}
    </>
  );
}

/** Nur-Emoji-Texte (z. B. 🐶) duerfen auf Memory-Karten groesser erscheinen. */
const EMOJI_ONLY = /^[\p{Extended_Pictographic}\p{Emoji_Component}\s]+$/u;

function memoryFaceTextClass(side: PairSide): string {
  return side.text && EMOJI_ONLY.test(side.text) ? "text-2xl" : "text-sm";
}

export function MatchPairs(props: MatchPairsProps) {
  return props.data.memory ? <MemoryBoard {...props} /> : <ColumnsBoard {...props} />;
}

/* ------------------------------ Standard-Modus ------------------------------ */

function ColumnsBoard({
  data,
  onResult,
  checkRequested,
  onReadyChange,
  seed,
}: MatchPairsProps) {
  // Ohne expliziten seed (nur Tests setzen einen) wird pro Aufruf neu
  // gemischt, damit Wiederholungen nicht immer gleich aussehen.
  const [mountSeed] = useState(() => `mount-${Math.random()}`);
  const baseSeed = seed ?? mountSeed;

  // Beide Spalten getrennt und deterministisch mischen,
  // damit die Paare nicht schon nebeneinander liegen.
  const leftItems = useMemo(
    () =>
      shuffleSeeded(
        data.pairs.map((pair, index) => ({ side: pair.left, pair: index })),
        seedFromData(baseSeed, "links"),
      ),
    [data, baseSeed],
  );
  const rightItems = useMemo(
    () =>
      shuffleSeeded(
        data.pairs.map((pair, index) => ({ side: pair.right, pair: index })),
        seedFromData(baseSeed, "rechts"),
      ),
    [data, baseSeed],
  );

  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [matched, setMatched] = useState<number[]>([]);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [shaking, setShaking] = useState<{ left: number; right: number } | null>(null);
  const shakeTimeout = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (shakeTimeout.current !== null) window.clearTimeout(shakeTimeout.current);
    },
    [],
  );

  const allMatched = matched.length === data.pairs.length;
  useReportReady(allMatched, onReadyChange);

  useCheck(checkRequested, () => {
    onResult({ correct: allMatched && failedAttempts === 0 });
  });

  const tapLeft = (pair: number) => {
    if (matched.includes(pair)) return;
    setSelectedLeft((prev) => (prev === pair ? null : pair));
  };

  const tapRight = (pair: number) => {
    if (matched.includes(pair) || selectedLeft === null) return;
    if (selectedLeft === pair) {
      setMatched((prev) => [...prev, pair]);
    } else {
      setFailedAttempts((count) => count + 1);
      setShaking({ left: selectedLeft, right: pair });
      if (shakeTimeout.current !== null) window.clearTimeout(shakeTimeout.current);
      shakeTimeout.current = window.setTimeout(() => setShaking(null), 450);
    }
    setSelectedLeft(null);
  };

  const itemClasses = (options: {
    isMatched: boolean;
    isSelected: boolean;
  }): string =>
    cn(
      "flex min-h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-b-4 p-2 text-center text-base font-semibold text-ink transition-transform select-none",
      "active:translate-y-1 active:border-b-2",
      options.isSelected
        ? "border-primary bg-primary-light"
        : "border-locked bg-white",
      options.isMatched &&
        "cursor-default opacity-30 active:translate-y-0 active:border-b-4",
    );

  return (
    <div className="grid grid-cols-2 gap-2.5">
      <div aria-label="Linke Spalte" className="flex flex-col gap-2.5">
        {leftItems.map((item) => {
          const isMatched = matched.includes(item.pair);
          const isSelected = selectedLeft === item.pair;
          return (
            <motion.button
              key={item.pair}
              type="button"
              data-testid="left-item"
              disabled={isMatched}
              aria-pressed={isSelected}
              aria-label={sideLabel(item.side)}
              onClick={() => tapLeft(item.pair)}
              animate={shaking?.left === item.pair ? SHAKE_KEYFRAMES : { x: 0 }}
              transition={SHAKE_TRANSITION}
              className={itemClasses({ isMatched, isSelected })}
            >
              <SideContent side={item.side} />
            </motion.button>
          );
        })}
      </div>
      <div aria-label="Rechte Spalte" className="flex flex-col gap-2.5">
        {rightItems.map((item) => {
          const isMatched = matched.includes(item.pair);
          return (
            <motion.button
              key={item.pair}
              type="button"
              data-testid="right-item"
              disabled={isMatched}
              aria-label={sideLabel(item.side)}
              onClick={() => tapRight(item.pair)}
              animate={shaking?.right === item.pair ? SHAKE_KEYFRAMES : { x: 0 }}
              transition={SHAKE_TRANSITION}
              className={itemClasses({ isMatched, isSelected: false })}
            >
              <SideContent side={item.side} />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------- Memory-Modus ------------------------------- */

type MemoryCard = { key: string; pair: number; side: PairSide };

function MemoryBoard({
  data,
  onResult,
  checkRequested,
  onReadyChange,
  seed,
}: MatchPairsProps) {
  // Ohne expliziten seed (nur Tests setzen einen) wird pro Aufruf neu
  // gemischt, damit Wiederholungen nicht immer gleich aussehen.
  const [mountSeed] = useState(() => `mount-${Math.random()}`);
  const cards = useMemo(() => {
    const all: MemoryCard[] = data.pairs.flatMap((pair, index) => [
      { key: `l${index}`, pair: index, side: pair.left },
      { key: `r${index}`, pair: index, side: pair.right },
    ]);
    return shuffleSeeded(all, seed ?? mountSeed);
  }, [data, seed, mountSeed]);

  const [open, setOpen] = useState<string[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  // Solange zwei falsche Karten offen sind, sind weitere Taps gesperrt.
  const [locked, setLocked] = useState(false);
  const hideTimeout = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (hideTimeout.current !== null) window.clearTimeout(hideTimeout.current);
    },
    [],
  );

  const done = matched.length === data.pairs.length;
  useReportReady(done, onReadyChange);

  // Memory: Fehlversuche zählen nicht – fertig gespielt = richtig.
  useCheck(checkRequested, () => {
    onResult({ correct: done });
  });

  const tapCard = (card: MemoryCard) => {
    if (locked || matched.includes(card.pair) || open.includes(card.key)) return;
    if (open.length >= 2) return;

    const nextOpen = [...open, card.key];
    setOpen(nextOpen);
    if (nextOpen.length < 2) return;

    const [first] = nextOpen;
    const firstCard = cards.find((c) => c.key === first);
    if (firstCard && firstCard.pair === card.pair) {
      setMatched((prev) => [...prev, card.pair]);
      setOpen([]);
    } else {
      setLocked(true);
      hideTimeout.current = window.setTimeout(() => {
        setOpen([]);
        setLocked(false);
      }, MEMORY_HIDE_DELAY_MS);
    }
  };

  return (
    <div aria-label="Memory-Karten" className="grid grid-cols-3 gap-2">
      {cards.map((card, index) => {
        const isMatched = matched.includes(card.pair);
        const isFaceUp = isMatched || open.includes(card.key);
        return (
          <motion.button
            key={card.key}
            type="button"
            data-testid="memory-card"
            disabled={isMatched}
            aria-label={
              isFaceUp ? sideLabel(card.side) : `Karte ${index + 1}, verdeckt`
            }
            onClick={() => tapCard(card)}
            animate={{ rotateY: isFaceUp ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="relative aspect-square min-h-14 cursor-pointer rounded-2xl select-none [transform-style:preserve-3d]"
          >
            {/* Rückseite (verdeckt): ? */}
            <span
              aria-hidden
              className="absolute inset-0 flex items-center justify-center rounded-2xl border-2 border-b-4 border-primary-dark bg-primary text-2xl font-extrabold text-white [backface-visibility:hidden]"
            >
              ?
            </span>
            {/* Vorderseite (aufgedeckt) */}
            <span
              aria-hidden
              className={cn(
                "absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-2xl border-2 p-1 text-center font-semibold text-ink [backface-visibility:hidden] [transform:rotateY(180deg)]",
                memoryFaceTextClass(card.side),
                isMatched
                  ? "border-success bg-success-light"
                  : "border-primary bg-white",
              )}
            >
              <SideContent side={card.side} />
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
