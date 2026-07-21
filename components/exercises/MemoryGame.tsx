"use client";

// Übungstyp 8: memory_game – Gedächtnistraining. Zwei Modi:
// - "reihenfolge": Merkphase zeigt die Items IN Reihenfolge (mit 1./2./3.).
//   Danach werden sie gemischt und müssen in der gemerkten Reihenfolge
//   angetippt werden (reverse: true = rückwärts). Fehltipps wackeln orange
//   und zählen als Fehler; richtig = 0 Fehler.
// - "fehlt" (Kim-Spiel): Merkphase zeigt alle Items. Danach fehlt EINES
//   (zufällig gewählt) – aus 3 Optionen (fehlendes + 2 distractors) die
//   richtige antippen; Auswertung beim Prüfen wie Multiple Choice.
// WICHTIG (Dyspraxie): KEIN Zeitdruck – die Merkphase endet erst, wenn
// Amelie selbst „Ich hab's mir gemerkt" tippt.
// Den Aufgaben-Prompt (+ TTS) zeigt der Lektions-Player an, nicht die Komponente.
import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { MemoryGameData } from "@/lib/content-schema";
import type { ExerciseComponentProps } from "./types";
import { shuffleSeeded } from "./shuffle";
import { useCheck, useReportReady } from "./useCheck";
import { cn } from "@/lib/cn";

const SHAKE_KEYFRAMES = { x: [0, -8, 8, -6, 6, 0] };
const SHAKE_TRANSITION = { duration: 0.4 };

/** Nur-Emoji-Items (z. B. 🍎) duerfen groesser dargestellt werden. */
const EMOJI_ONLY = /^[\p{Extended_Pictographic}\p{Emoji_Component}\s]+$/u;

function itemTextClass(text: string): string {
  return EMOJI_ONLY.test(text) ? "text-3xl" : "text-lg font-bold";
}

export function MemoryGame(props: ExerciseComponentProps<MemoryGameData>) {
  return props.data.mode === "reihenfolge" ? (
    <SequenceGame {...props} />
  ) : (
    <MissingGame {...props} />
  );
}

/** Merkphase-Rahmen: Items gross + „Ich hab's mir gemerkt"-Knopf. */
function MemorizePanel({
  items,
  ordered,
  note,
  onDone,
}: {
  items: { text: string }[];
  ordered: boolean;
  note: string;
  onDone: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border-2 border-primary bg-primary-light p-4">
        <div className="flex flex-wrap items-end justify-center gap-3">
          {items.map((item, index) => (
            <span key={index} className="flex flex-col items-center gap-1">
              <span className={itemTextClass(item.text)}>{item.text}</span>
              {ordered && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                  {index + 1}
                </span>
              )}
            </span>
          ))}
        </div>
      </div>
      <p className="text-center text-sm text-ink/70">{note}</p>
      <button
        type="button"
        onClick={onDone}
        className="flex min-h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-b-4 border-primary-dark bg-primary px-5 font-bold text-white select-none active:translate-y-1 active:border-b-0"
      >
        Ich hab&apos;s mir gemerkt <span aria-hidden>▶</span>
      </button>
    </div>
  );
}

/* --------------------------- Modus: reihenfolge --------------------------- */

function SequenceGame({
  data,
  onResult,
  checkRequested,
  onReadyChange,
}: ExerciseComponentProps<MemoryGameData>) {
  const [phase, setPhase] = useState<"merken" | "abfrage">("merken");
  // Erwartete Tipp-Reihenfolge: wie gezeigt, bei reverse rueckwaerts.
  const expected = useMemo(
    () => (data.reverse ? [...data.items].reverse() : data.items),
    [data],
  );
  // Buttons gemischt (pro Aufruf neu, nie identisch mit der Anzeige-Reihenfolge).
  const [mountSeed] = useState(() => `mount-${Math.random()}`);
  const shuffled = useMemo(() => {
    for (let attempt = 0; ; attempt++) {
      const mixed = shuffleSeeded(data.items, `${mountSeed}-${attempt}`);
      const sameAsDisplayed = mixed.every(
        (item, i) => item.text === data.items[i].text,
      );
      if (!sameAsDisplayed || attempt > 10) return mixed;
    }
  }, [data, mountSeed]);

  const [tapped, setTapped] = useState<string[]>([]);
  const [errors, setErrors] = useState(0);
  const [shakingText, setShakingText] = useState<string | null>(null);
  const shakeTimeout = useRef<number | null>(null);

  const done = tapped.length === expected.length;
  useReportReady(phase === "abfrage" && done, onReadyChange);

  useCheck(checkRequested, () => {
    onResult({
      correct: done && errors === 0,
      given: errors > 0 ? `${errors} falsche Tipps bei der Reihenfolge` : undefined,
    });
  });

  const tapItem = (text: string) => {
    if (done || tapped.includes(text)) return;
    if (expected[tapped.length].text === text) {
      setTapped((prev) => [...prev, text]);
      return;
    }
    setErrors((count) => count + 1);
    setShakingText(text);
    if (shakeTimeout.current !== null) window.clearTimeout(shakeTimeout.current);
    shakeTimeout.current = window.setTimeout(() => setShakingText(null), 450);
  };

  if (phase === "merken") {
    return (
      <MemorizePanel
        items={data.items}
        ordered
        note={
          data.reverse
            ? "Lass dir Zeit. Gleich tippst du sie RÜCKWÄRTS an – die letzte zuerst!"
            : "Lass dir Zeit. Gleich tippst du sie in dieser Reihenfolge an."
        }
        onDone={() => setPhase("abfrage")}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-center text-sm font-semibold text-ink/70">
        {data.reverse
          ? "Tippe die Reihenfolge RÜCKWÄRTS an – die letzte zuerst."
          : "Tippe alles in der gemerkten Reihenfolge an."}
      </p>
      <div className="grid auto-rows-fr grid-cols-3 gap-2.5">
        {shuffled.map((item) => {
          const position = tapped.indexOf(item.text);
          const isTapped = position !== -1;
          return (
            <motion.button
              key={item.text}
              type="button"
              disabled={isTapped}
              onClick={() => tapItem(item.text)}
              animate={shakingText === item.text ? SHAKE_KEYFRAMES : { x: 0 }}
              transition={SHAKE_TRANSITION}
              aria-label={
                isTapped ? `${item.text} – Position ${position + 1}` : item.text
              }
              className={cn(
                "relative flex min-h-16 cursor-pointer items-center justify-center rounded-2xl border-2 border-b-4 p-2 select-none",
                "active:translate-y-1 active:border-b-2",
                isTapped
                  ? "cursor-default border-primary bg-primary-light"
                  : "border-locked bg-white",
              )}
            >
              <span className={itemTextClass(item.text)}>{item.text}</span>
              {isTapped && (
                <span className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                  {position + 1}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
      {done && (
        <p className="text-center text-sm font-semibold text-success-dark">
          Alles angetippt! Tippe auf Prüfen.
        </p>
      )}
    </div>
  );
}

/* ------------------------------ Modus: fehlt ------------------------------ */

function MissingGame({
  data,
  onResult,
  checkRequested,
  onReadyChange,
}: ExerciseComponentProps<MemoryGameData>) {
  const [phase, setPhase] = useState<"merken" | "abfrage">("merken");
  // Welches Item fehlt, wird pro Aufruf zufaellig gewaehlt (mehr Abwechslung
  // bei Wiederholungen). Optionen: fehlendes Item + die 2 distractors.
  const [missingIndex] = useState(() =>
    Math.floor(Math.random() * data.items.length),
  );
  const missing = data.items[missingIndex];
  const remaining = data.items.filter((_, index) => index !== missingIndex);
  const [mountSeed] = useState(() => `mount-${Math.random()}`);
  const options = useMemo(
    () => shuffleSeeded([missing, ...(data.distractors ?? [])], mountSeed),
    [missing, data, mountSeed],
  );

  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useReportReady(phase === "abfrage" && selected !== null, onReadyChange);

  useCheck(checkRequested, () => {
    setChecked(true);
    const correct = selected === missing.text;
    onResult({ correct, given: correct ? undefined : (selected ?? "") });
  });

  if (phase === "merken") {
    return (
      <MemorizePanel
        items={data.items}
        ordered={false}
        note="Lass dir Zeit. Gleich fehlt eines davon!"
        onDone={() => setPhase("abfrage")}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Uebrige Items - eines fehlt. */}
      <div className="rounded-2xl border-2 border-locked bg-white p-4">
        <div className="flex flex-wrap items-center justify-center gap-3">
          {remaining.map((item) => (
            <span key={item.text} className={itemTextClass(item.text)}>
              {item.text}
            </span>
          ))}
          <span className="text-3xl text-ink/30" aria-hidden>
            ❓
          </span>
        </div>
      </div>
      <p className="text-center text-sm font-semibold text-ink/70">
        Was fehlt? Tippe es an.
      </p>
      <div className="grid auto-rows-fr grid-cols-3 gap-2.5">
        {options.map((option) => {
          const isSelected = selected === option.text;
          const showCorrect = checked && option.text === missing.text;
          const showWrong = checked && isSelected && option.text !== missing.text;
          return (
            <button
              key={option.text}
              type="button"
              disabled={checked}
              aria-pressed={isSelected}
              onClick={() => setSelected(option.text)}
              className={cn(
                "flex min-h-16 cursor-pointer items-center justify-center rounded-2xl border-2 border-b-4 p-2 select-none",
                "active:translate-y-1 active:border-b-2",
                !checked &&
                  (isSelected
                    ? "border-primary bg-primary-light"
                    : "border-locked bg-white"),
                checked && !showCorrect && !showWrong && "border-locked bg-white opacity-60",
                showCorrect && "border-success bg-success-light",
                showWrong && "border-warning bg-warning-light",
              )}
            >
              <span className={itemTextClass(option.text)}>{option.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
