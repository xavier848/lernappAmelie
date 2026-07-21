"use client";

// Übungstyp 7: number_input – Kopfrechnen mit eingetippter Antwort.
// Die Antwort wird über einen GROSSEN eigenen Ziffernblock eingegeben
// (Tap-only, keine iOS-Tastatur – große Ziele wegen Dyspraxie, und die
// Tastatur würde das Layout verschieben). Kein Raten wie bei Multiple
// Choice: Amelie muss wirklich rechnen.
// Ab dem zweiten Anlauf (attempt >= 1) erscheint der Schritt-für-Schritt-
// Tipp aus data.hint („💡 Rechne Schritt für Schritt: …").
// Den Aufgaben-Prompt (+ TTS) zeigt der Lektions-Player an, nicht die Komponente.
import { useState } from "react";
import type { NumberInputData } from "@/lib/content-schema";
import type { ExerciseComponentProps } from "./types";
import { useCheck, useReportReady } from "./useCheck";
import { cn } from "@/lib/cn";

/** Mehr Stellen braucht keine Kopfrechen-Aufgabe. */
const MAX_DIGITS = 5;

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

export function NumberInput({
  data,
  onResult,
  checkRequested,
  onReadyChange,
  attempt = 0,
}: ExerciseComponentProps<NumberInputData>) {
  const [value, setValue] = useState("");
  const [checked, setChecked] = useState(false);

  const ready = value.length > 0;
  useReportReady(ready, onReadyChange);

  const isCorrect = Number(value) === data.answer;

  useCheck(checkRequested, () => {
    setChecked(true);
    onResult({
      correct: isCorrect,
      // Falsche Eingabe fuer Mamas Statistik festhalten.
      given: isCorrect ? undefined : value,
    });
  });

  const tapDigit = (digit: string) => {
    if (checked) return;
    setValue((prev) => {
      if (prev.length >= MAX_DIGITS) return prev;
      // Keine fuehrenden Nullen wie "007".
      if (prev === "0") return digit;
      return prev + digit;
    });
  };

  const tapBackspace = () => {
    if (checked) return;
    setValue((prev) => prev.slice(0, -1));
  };

  const keyClasses =
    "flex min-h-14 cursor-pointer items-center justify-center rounded-2xl border-2 border-b-4 border-locked bg-white text-2xl font-bold text-ink select-none active:translate-y-1 active:border-b-2 disabled:cursor-default";

  return (
    <div className="flex flex-col gap-4">
      {/* Tipp ab dem zweiten Anlauf: Schritt fuer Schritt vorrechnen. */}
      {attempt >= 1 && data.hint && (
        <div className="rounded-2xl border-2 border-primary bg-primary-light p-3">
          <p className="text-sm font-bold text-primary-dark">
            <span aria-hidden>💡</span> Tipp:
          </p>
          <p className="mt-1 text-base leading-relaxed whitespace-pre-line text-ink">
            {data.hint}
          </p>
        </div>
      )}

      {/* Anzeige der eingetippten Antwort */}
      <div
        aria-label={value ? `Deine Antwort: ${value}` : "Noch keine Antwort eingegeben"}
        className={cn(
          "flex min-h-16 items-center justify-center rounded-2xl border-2 text-3xl font-extrabold tracking-wider",
          checked
            ? isCorrect
              ? "border-success bg-success-light text-success-dark"
              : "border-warning bg-warning-light text-warning-dark"
            : value
              ? "border-primary bg-primary-light text-ink"
              : "border-locked bg-white text-ink/30",
        )}
      >
        {value || "?"}
      </div>

      {/* Grosser Ziffernblock: 1-9, unten leeren / 0 / loeschen */}
      <div aria-label="Ziffernblock" className="grid grid-cols-3 gap-2">
        {KEYS.map((key) => (
          <button
            key={key}
            type="button"
            disabled={checked}
            onClick={() => tapDigit(key)}
            className={keyClasses}
          >
            {key}
          </button>
        ))}
        <button
          type="button"
          aria-label="Alles löschen"
          disabled={checked || value.length === 0}
          onClick={() => setValue("")}
          className={cn(keyClasses, "text-base text-ink/60 disabled:opacity-40")}
        >
          leeren
        </button>
        <button
          type="button"
          disabled={checked}
          onClick={() => tapDigit("0")}
          className={keyClasses}
        >
          0
        </button>
        <button
          type="button"
          aria-label="Letzte Ziffer löschen"
          disabled={checked || value.length === 0}
          onClick={tapBackspace}
          className={cn(keyClasses, "disabled:opacity-40")}
        >
          <span aria-hidden>⌫</span>
        </button>
      </div>
    </div>
  );
}
