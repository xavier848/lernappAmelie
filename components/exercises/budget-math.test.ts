import { describe, it, expect } from "vitest";
import {
  BUDGET_STEP_CENTS,
  SAVINGS_CATEGORY_ID,
  budgetTotals,
  budgetVerdict,
  canAfford,
  initialBudgetAmounts,
} from "./budget-math";

describe("initialBudgetAmounts", () => {
  it("belegt fixe Kategorien vor und setzt alle anderen auf 0", () => {
    const amounts = initialBudgetAmounts([
      { id: "miete", label: "Miete", fixed: 30000 },
      { id: "sparen", label: "Sparen" },
      { id: "freizeit", label: "Freizeit" },
    ]);
    expect(amounts).toEqual({ miete: 30000, sparen: 0, freizeit: 0 });
  });
});

describe("budgetTotals", () => {
  it("summiert alle Kategorien und rechnet den Rest aus", () => {
    const { total, remaining } = budgetTotals(
      { miete: 30000, sparen: 10000, freizeit: 5000 },
      95000,
    );
    expect(total).toBe(45000);
    expect(remaining).toBe(50000);
  });

  it("liefert negatives remaining bei Ueberziehung", () => {
    const { total, remaining } = budgetTotals(
      { miete: 80000, freizeit: 20000 },
      95000,
    );
    expect(total).toBe(100000);
    expect(remaining).toBe(-5000);
  });

  it("kommt mit leeren Betraegen klar", () => {
    expect(budgetTotals({}, 95000)).toEqual({ total: 0, remaining: 95000 });
  });
});

describe("budgetVerdict / canAfford", () => {
  const plan = { income: 95000, savingsGoal: 10000 };

  it("ok, wenn im Budget und Sparziel erreicht", () => {
    const amounts = { miete: 30000, [SAVINGS_CATEGORY_ID]: 10000, freizeit: 5000 };
    expect(budgetVerdict(plan, amounts)).toBe("ok");
    expect(canAfford(plan, amounts)).toBe(true);
  });

  it("over-budget, wenn Gesamt > Einnahme", () => {
    const amounts = { miete: 80000, [SAVINGS_CATEGORY_ID]: 10000, freizeit: 10000 };
    expect(budgetVerdict(plan, amounts)).toBe("over-budget");
    expect(canAfford(plan, amounts)).toBe(false);
  });

  it("savings-missed, wenn im Budget aber Sparziel verfehlt", () => {
    const amounts = { miete: 30000, [SAVINGS_CATEGORY_ID]: 5000, freizeit: 5000 };
    expect(budgetVerdict(plan, amounts)).toBe("savings-missed");
    expect(canAfford(plan, amounts)).toBe(false);
  });

  it("savings-missed auch, wenn gar keine sparen-Kategorie existiert", () => {
    expect(budgetVerdict(plan, { miete: 30000 })).toBe("savings-missed");
  });

  it("ohne savingsGoal reicht: Gesamt <= Einnahme", () => {
    const noGoal = { income: 95000 };
    expect(canAfford(noGoal, { freizeit: 95000 })).toBe(true);
    expect(canAfford(noGoal, { freizeit: 95001 })).toBe(false);
  });

  it("Grenzfall: Gesamt exakt gleich Einnahme ist ok", () => {
    expect(
      canAfford(plan, { miete: 85000, [SAVINGS_CATEGORY_ID]: 10000 }),
    ).toBe(true);
  });
});

describe("Konstanten", () => {
  it("Stepper-Schritt ist 10 Euro in Cent", () => {
    expect(BUDGET_STEP_CENTS).toBe(1000);
  });
});
