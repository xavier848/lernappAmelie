"use client";

// budget – Monats-Challenge (Spec §5.6). Betraege IMMER in Cent.
// Kopf: Einnahme + „Noch übrig" (tuerkis ≥ 0, orange < 0).
// Zeilen: Icon, Label, Betrag, −/+ Stepper in 10-€-Schritten (min 0).
// Kompakt-Layout: Zeilen min-h-12, Stepper 44×44 px (Tap-Ziel-Minimum),
// damit 7 Kategorien plus Kopf ohne Scrollen auf einen iPhone-Screen passen.
// fixe Kategorien sind ausgegraut ohne Stepper.
// Nach dem Pruefen: einfaches Balken-Diagramm + ✔️/⚠️-Text.

import { useEffect, useRef, useState } from "react";
import type { BudgetData } from "@/lib/content-schema";
import { formatEuro } from "@/lib/money";
import { cn } from "@/lib/cn";
import type { ExerciseComponentProps } from "./types";
import {
  BUDGET_STEP_CENTS,
  budgetTotals,
  budgetVerdict,
  canAfford,
  initialBudgetAmounts,
  type BudgetVerdict,
} from "./budget-math";

const VERDICT_TEXT: Record<BudgetVerdict, string> = {
  ok: "✔️ Super! Dein Plan passt zu deinem Geld.",
  "over-budget": "⚠️ Du gibst mehr aus, als du hast. Versuch es nochmal.",
  "savings-missed":
    "⚠️ Du bleibst im Budget. Aber dein Spar-Ziel ist noch nicht erreicht.",
};

export function Budget({
  data,
  onResult,
  checkRequested,
  onReadyChange,
}: ExerciseComponentProps<BudgetData>) {
  const [amounts, setAmounts] = useState(() =>
    initialBudgetAmounts(data.categories),
  );
  const [checked, setChecked] = useState(false);

  const { total, remaining } = budgetTotals(amounts, data.income);

  // ready = mindestens eine nicht-fixe Kategorie > 0.
  const ready = data.categories.some(
    (category) => category.fixed === undefined && (amounts[category.id] ?? 0) > 0,
  );

  useEffect(() => {
    onReadyChange(ready);
  }, [ready, onReadyChange]);

  const lastCheckRef = useRef(checkRequested);
  useEffect(() => {
    if (checkRequested === lastCheckRef.current) return;
    lastCheckRef.current = checkRequested;
    setChecked(true);
    onResult({
      correct: canAfford(
        { income: data.income, savingsGoal: data.savingsGoal },
        amounts,
      ),
    });
  }, [checkRequested, amounts, data.income, data.savingsGoal, onResult]);

  function changeAmount(categoryId: string, delta: number) {
    setChecked(false);
    setAmounts((current) => ({
      ...current,
      [categoryId]: Math.max(0, (current[categoryId] ?? 0) + delta),
    }));
  }

  const verdict = budgetVerdict(
    { income: data.income, savingsGoal: data.savingsGoal },
    amounts,
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Kopf: EINE kompakte Card – Einnahmen, Spar-Ziel, Noch uebrig */}
      <div className="flex flex-col gap-0.5 rounded-2xl bg-primary-light p-3">
        <p className="text-sm">
          Einnahmen: <strong>{formatEuro(data.income)}</strong>
        </p>
        {data.savingsGoal !== undefined && (
          <p className="text-sm">
            Spar-Ziel: <strong>{formatEuro(data.savingsGoal)}</strong>
          </p>
        )}
        <p
          data-testid="budget-remaining"
          className={cn(
            "text-xl font-extrabold",
            remaining >= 0 ? "text-primary-dark" : "text-warning-dark",
          )}
        >
          Noch übrig: {formatEuro(remaining)}
        </p>
      </div>

      {/* Kategorien-Zeilen, kompakt – 7 Zeilen passen mit Kopf auf einen Screen */}
      <ul className="flex flex-col gap-2">
        {data.categories.map((category) => {
          const amount = amounts[category.id] ?? 0;
          const isFixed = category.fixed !== undefined;
          return (
            <li
              key={category.id}
              className={cn(
                "flex min-h-12 items-center gap-2 rounded-2xl border-2 border-locked bg-white px-2.5 py-0.5",
                isFixed && "opacity-60",
              )}
            >
              {category.icon && (
                <span aria-hidden="true" className="text-xl">
                  {category.icon}
                </span>
              )}
              <span className="flex-1 text-sm font-semibold">
                {category.label}
                {isFixed && (
                  <span className="block text-xs font-normal text-ink/60">
                    fester Betrag
                  </span>
                )}
              </span>
              <span className="min-w-16 text-right text-sm font-bold">
                {formatEuro(amount)}
              </span>
              {!isFixed && (
                <span className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => changeAmount(category.id, -BUDGET_STEP_CENTS)}
                    disabled={amount === 0}
                    aria-label={`Weniger für ${category.label}`}
                    className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl border-2 border-b-4 border-locked bg-white text-xl font-bold text-ink active:translate-y-1 active:border-b-2 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    −
                  </button>
                  <button
                    type="button"
                    onClick={() => changeAmount(category.id, BUDGET_STEP_CENTS)}
                    aria-label={`Mehr für ${category.label}`}
                    className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl border-b-4 border-primary-dark bg-primary text-xl font-bold text-white active:translate-y-1 active:border-b-0"
                  >
                    +
                  </button>
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {/* Ergebnis nach dem Pruefen: Text + einfache Balken */}
      {checked && (
        <div className="flex flex-col gap-2 rounded-2xl border-2 border-locked bg-white p-3">
          <p data-testid="budget-result" className="text-base font-bold">
            {VERDICT_TEXT[verdict]}
          </p>
          <div data-testid="budget-bars" className="flex flex-col gap-2">
            {data.categories.map((category) => {
              const amount = amounts[category.id] ?? 0;
              const percent = Math.max(
                0,
                Math.min(100, Math.round((amount / data.income) * 100)),
              );
              return (
                <div key={category.id} className="flex items-center gap-2">
                  <span className="w-24 shrink-0 truncate text-sm font-semibold">
                    {category.label}
                  </span>
                  <span className="h-4 flex-1 overflow-hidden rounded-full bg-locked">
                    <span
                      className={cn(
                        "block h-full rounded-full",
                        verdict === "over-budget" ? "bg-warning" : "bg-primary",
                      )}
                      style={{ width: `${percent}%` }}
                    />
                  </span>
                  <span className="w-16 shrink-0 text-right text-sm">
                    {formatEuro(amount)}
                  </span>
                </div>
              );
            })}
            <p className="text-sm text-ink/70">
              Ausgegeben: <strong>{formatEuro(total)}</strong> von{" "}
              <strong>{formatEuro(data.income)}</strong>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
