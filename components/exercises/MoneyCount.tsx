"use client";

// money_count – Geld-Uebungen in 3 Modi (Spec §5.5). Betraege IMMER in Cent.
// recognize: wie MultipleChoice mit grosser MoneySvg ueber den Optionen.
// assemble/change: Ziel-Info oben, „Hand" mit gelegtem Geld (Antippen entfernt),
// Live-Summe gross, unten Palette aller Nennwerte als MoneySvg-Buttons.

import { useEffect, useRef, useState } from "react";
import type { MoneyCountData } from "@/lib/content-schema";
import { formatEuro, sumCents } from "@/lib/money";
import {
  MONEY_VALUES,
  MoneySvg,
  moneyLabel,
  moneyValueFromKey,
} from "@/components/money/MoneySvg";
import { cn } from "@/lib/cn";
import type { ExerciseComponentProps } from "./types";

type RecognizeData = Extract<MoneyCountData, { mode: "recognize" }>;
type AssembleData = Extract<MoneyCountData, { mode: "assemble" | "change" }>;

export function MoneyCount(props: ExerciseComponentProps<MoneyCountData>) {
  if (props.data.mode === "recognize") {
    return (
      <MoneyRecognize {...props} data={props.data} />
    );
  }
  return <MoneyAssemble {...props} data={props.data} />;
}

// ---------------------------------------------------------------------------
// Modus "recognize": Welche Muenze / welcher Schein ist das?
// ---------------------------------------------------------------------------

function MoneyRecognize({
  data,
  onResult,
  checkRequested,
  onReadyChange,
}: ExerciseComponentProps<RecognizeData>) {
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  const moneyValue = moneyValueFromKey(data.moneyImage);

  useEffect(() => {
    onReadyChange(selected !== null);
  }, [selected, onReadyChange]);

  const lastCheckRef = useRef(checkRequested);
  useEffect(() => {
    if (checkRequested === lastCheckRef.current) return;
    lastCheckRef.current = checkRequested;
    setChecked(true);
    onResult({
      correct: selected !== null && data.options[selected]?.correct === true,
    });
  }, [checkRequested, selected, data.options, onResult]);

  return (
    <div className="flex flex-col gap-3">
      {moneyValue !== null && (
        <div className="flex justify-center py-1">
          <MoneySvg value={moneyValue} size={96} />
        </div>
      )}
      <div className="flex flex-col gap-2.5">
        {data.options.map((option, optionIndex) => {
          const isSelected = selected === optionIndex;
          const showCorrect = checked && option.correct === true;
          const showWrong = checked && isSelected && option.correct !== true;
          return (
            <button
              key={optionIndex}
              type="button"
              onClick={() => setSelected(optionIndex)}
              className={cn(
                "flex min-h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-b-4 p-3 text-lg font-bold text-ink",
                "active:translate-y-1 active:border-b-2",
                showCorrect
                  ? "border-success bg-success-light"
                  : showWrong
                    ? "border-warning bg-warning-light"
                    : isSelected
                      ? "border-primary bg-primary-light"
                      : "border-locked bg-white",
              )}
            >
              {option.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modi "assemble" (Betrag legen) und "change" (Rueckgeld legen)
// ---------------------------------------------------------------------------

function MoneyAssemble({
  data,
  onResult,
  checkRequested,
  onReadyChange,
}: ExerciseComponentProps<AssembleData>) {
  // Gelegtes Geld in der „Hand", in Lege-Reihenfolge (Cent-Werte).
  const [laid, setLaid] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);

  const sum = sumCents(laid);
  const target = data.mode === "assemble" ? data.target : data.given - data.price;

  useEffect(() => {
    onReadyChange(sum > 0);
  }, [sum, onReadyChange]);

  const lastCheckRef = useRef(checkRequested);
  useEffect(() => {
    if (checkRequested === lastCheckRef.current) return;
    lastCheckRef.current = checkRequested;
    setChecked(true);
    onResult({ correct: sum === target });
  }, [checkRequested, sum, target, onResult]);

  function addMoney(value: number) {
    setChecked(false);
    setLaid((current) => [...current, value]);
  }

  function removeMoney(laidIndex: number) {
    setChecked(false);
    setLaid((current) => current.filter((_, i) => i !== laidIndex));
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Ziel-Info oben, kompakt */}
      {data.mode === "change" ? (
        <div className="flex flex-col gap-0.5 rounded-2xl bg-primary-light p-3 text-base">
          <p>
            Preis: <strong>{formatEuro(data.price)}</strong>
          </p>
          <p>
            Gegeben: <strong>{formatEuro(data.given)}</strong>
          </p>
          <p className="font-bold">Lege das Rückgeld.</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-primary-light p-3 text-base">
          <p>
            Lege genau: <strong>{formatEuro(data.target)}</strong>
          </p>
        </div>
      )}

      {/* Hand-Bereich: feste Mindesthoehe, damit das Layout nicht springt */}
      <div className="flex min-h-24 flex-wrap items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-locked bg-white p-2">
        {laid.length === 0 ? (
          <p className="text-base text-ink/60">
            Tippe unten auf Geld, um es hierher zu legen.
          </p>
        ) : (
          laid.map((value, laidIndex) => (
            <button
              key={`${value}-${laidIndex}`}
              type="button"
              onClick={() => removeMoney(laidIndex)}
              aria-label={`${moneyLabel(value)} entfernen`}
              className="flex min-h-12 min-w-12 cursor-pointer items-center justify-center rounded-xl p-1 active:translate-y-1"
            >
              <MoneySvg value={value} size={44} />
            </button>
          ))
        )}
      </div>

      {/* Live-Summe gross */}
      <p
        data-testid="money-sum"
        className={cn(
          "text-center text-2xl font-extrabold",
          checked
            ? sum === target
              ? "text-success-dark"
              : "text-warning-dark"
            : "text-ink",
        )}
      >
        {formatEuro(sum)}
      </p>

      {/* Palette aller Nennwerte unten – 12 Werte in 3 Reihen à 4 */}
      <div className="grid grid-cols-4 items-center gap-2">
        {MONEY_VALUES.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => addMoney(value)}
            aria-label={`${moneyLabel(value)} legen`}
            className="flex min-h-14 cursor-pointer items-center justify-center rounded-2xl border-2 border-b-4 border-locked bg-white p-1 active:translate-y-1 active:border-b-2"
          >
            {/* Scheine sind ×1,7 breiter als size – kleiner rendern, damit sie in die Zelle passen. */}
            <MoneySvg value={value} size={value >= 500 ? 38 : 46} />
          </button>
        ))}
      </div>
    </div>
  );
}
