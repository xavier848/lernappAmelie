"use client";

// Übungstyp 2: multiple_choice – Quiz mit genau einer richtigen Antwort (Spec §5.2).
// Große Antwortkarten (Text und/oder Bild), volle Breite, min. 56 px hoch
// (kompakt, damit 4 Optionen ohne Scrollen auf einen iPhone-Screen passen).
// Vorne ein Auswahl-Kreis wie bei einem Formular: leer = noch nicht gewählt,
// gefüllt = gewählt. Nach dem Prüfen: richtige Karte grün mit Haken,
// gewählte falsche Karte orange mit Kreuz (nie rot) - nicht nur über Farbe.
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
    const correct = selected !== null && data.options[selected]?.correct === true;
    onResult({
      correct,
      // Bei falscher Antwort merken, was angeklickt wurde (fuer Mamas Statistik).
      given:
        !correct && selected !== null
          ? data.options[selected]?.text
          : undefined,
    });
  });

  return (
    <div aria-label="Antworten" className="flex flex-col gap-2.5">
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
              "flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-2xl border-2 border-b-4 p-3 text-left text-lg font-semibold text-ink transition-transform select-none",
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
            <Auswahlkreis
              zustand={
                showCorrect ? "richtig" : showWrong ? "falsch" : isSelected ? "gewaehlt" : "leer"
              }
            />
            {option.image && (
              <img
                src={option.image}
                alt=""
                className="h-12 w-12 rounded-lg object-contain"
              />
            )}
            <span>{option.text}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Kreis vor jeder Antwort: zeigt Auswahl und Ergebnis auch ohne Farbe. */
function Auswahlkreis({ zustand }: { zustand: "leer" | "gewaehlt" | "richtig" | "falsch" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-full border-2",
        zustand === "leer" && "border-locked bg-white",
        zustand === "gewaehlt" && "border-primary bg-primary",
        zustand === "richtig" && "border-success bg-success",
        zustand === "falsch" && "border-warning bg-warning",
      )}
    >
      {zustand === "gewaehlt" && <span className="size-2.5 rounded-full bg-white" />}
      {zustand === "richtig" && (
        <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3.5 8.5l3 3 6-7" />
        </svg>
      )}
      {zustand === "falsch" && (
        <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round">
          <path d="M4 4l8 8M12 4l-8 8" />
        </svg>
      )}
    </span>
  );
}
