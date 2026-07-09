"use client";

// Übungstyp 2: multiple_choice – Quiz mit genau einer richtigen Antwort (Spec §5.2).
// Große Antwortkarten (Text und/oder Bild), volle Breite, min. 64 px hoch.
// Auswahl = türkiser Rand. Nach dem Prüfen: richtige Karte grün,
// gewählte falsche Karte orange (nie rot).
// Die Antworten werden pro Aufruf neu gemischt, damit die richtige Antwort
// nicht immer an derselben Stelle steht (Wiederholungen bleiben spannend).
// Den Aufgaben-Prompt (+ TTS) zeigt der Lektions-Player an, nicht die Komponente.
import { useMemo, useState } from "react";
import type { MultipleChoiceData } from "@/lib/content-schema";
import type { ExerciseComponentProps } from "./types";
import { shuffleSeeded } from "./shuffle";
import { useCheck, useReportReady } from "./useCheck";
import { cn } from "@/lib/cn";

type MultipleChoiceProps = ExerciseComponentProps<MultipleChoiceData> & {
  /** Optionaler stabiler Seed (nur für Tests). Default: zufällig pro Aufruf. */
  seed?: string | number;
};

export function MultipleChoice({
  data,
  onResult,
  checkRequested,
  onReadyChange,
  seed,
}: MultipleChoiceProps) {
  const [mountSeed] = useState(() => `mount-${Math.random()}`);
  // Gemischte Optionen; index bleibt der Original-Index für die Auswertung.
  const options = useMemo(
    () =>
      shuffleSeeded(
        data.options.map((option, index) => ({ option, index })),
        seed ?? mountSeed,
      ),
    [data, seed, mountSeed],
  );

  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  useReportReady(selected !== null, onReadyChange);

  useCheck(checkRequested, () => {
    setChecked(true);
    onResult({
      correct: selected !== null && data.options[selected]?.correct === true,
    });
  });

  return (
    <div aria-label="Antworten" className="flex flex-col gap-3">
      {options.map(({ option, index }) => {
        const isSelected = selected === index;
        const showCorrect = checked && option.correct === true;
        const showWrong = checked && isSelected && option.correct !== true;

        return (
          <button
            key={index}
            type="button"
            data-testid="choice-card"
            disabled={checked}
            aria-pressed={isSelected}
            onClick={() => setSelected(index)}
            className={cn(
              "flex min-h-16 w-full cursor-pointer items-center gap-3 rounded-2xl border-2 border-b-4 p-4 text-left text-lg font-semibold text-ink transition-transform select-none",
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
            {option.image && (
              <img
                src={option.image}
                alt=""
                className="h-14 w-14 rounded-lg object-contain"
              />
            )}
            <span>{option.text}</span>
          </button>
        );
      })}
    </div>
  );
}
