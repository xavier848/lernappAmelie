// Pure Budget-Logik fuer die budget-Uebung (separat testbar, keine React-Abhaengigkeit).
// Alle Betraege IMMER als Integer in Cent (Spec §5 budget, Global Constraints).

/** Ein Stepper-Schritt = 10 € = 1000 Cent. */
export const BUDGET_STEP_CENTS = 1000;

/** Kategorie-id, die fuer das Sparziel zaehlt. */
export const SAVINGS_CATEGORY_ID = "sparen";

export type BudgetCategory = {
  id: string;
  label: string;
  icon?: string;
  /** Fest vorbelegter Betrag in Cent – Kategorie ist dann nicht aenderbar. */
  fixed?: number;
};

/** Geplante Betraege je Kategorie-id, in Cent. */
export type BudgetAmounts = Record<string, number>;

/** Start-Belegung: fixe Kategorien mit ihrem Betrag, alle anderen mit 0. */
export function initialBudgetAmounts(
  categories: readonly BudgetCategory[],
): BudgetAmounts {
  const amounts: BudgetAmounts = {};
  for (const category of categories) {
    amounts[category.id] = category.fixed ?? 0;
  }
  return amounts;
}

/** Summe aller geplanten Ausgaben + was von der Einnahme uebrig bleibt (kann negativ sein). */
export function budgetTotals(
  amounts: BudgetAmounts,
  income: number,
): { total: number; remaining: number } {
  const total = Object.values(amounts).reduce((sum, cents) => sum + cents, 0);
  return { total, remaining: income - total };
}

/**
 * Ergebnis der Pruefung:
 * - "over-budget": mehr ausgegeben als eingenommen
 * - "savings-missed": im Budget, aber Sparziel nicht erreicht
 * - "ok": im Budget und (falls gesetzt) Sparziel erreicht
 */
export type BudgetVerdict = "ok" | "over-budget" | "savings-missed";

export function budgetVerdict(
  plan: { income: number; savingsGoal?: number },
  amounts: BudgetAmounts,
): BudgetVerdict {
  const { total } = budgetTotals(amounts, plan.income);
  if (total > plan.income) return "over-budget";
  if (
    plan.savingsGoal !== undefined &&
    (amounts[SAVINGS_CATEGORY_ID] ?? 0) < plan.savingsGoal
  ) {
    return "savings-missed";
  }
  return "ok";
}

/** correct = Gesamt ≤ income UND (savingsGoal ? Kategorie 'sparen' ≥ savingsGoal : true). */
export function canAfford(
  plan: { income: number; savingsGoal?: number },
  amounts: BudgetAmounts,
): boolean {
  return budgetVerdict(plan, amounts) === "ok";
}
