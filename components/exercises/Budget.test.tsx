import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { BudgetData } from "@/lib/content-schema";
import { formatEuro } from "@/lib/money";
import { Budget } from "./Budget";

const data: BudgetData = {
  prompt: "Plane deinen Monat.",
  income: 95000,
  categories: [
    { id: "miete", label: "Miete", icon: "🏠", fixed: 30000 },
    { id: "sparen", label: "Sparen", icon: "🐷" },
    { id: "freizeit", label: "Freizeit", icon: "🎉" },
  ],
  savingsGoal: 10000,
};

// formatEuro nutzt geschütztes Leerzeichen vor dem € – Testing Library
// normalisiert Node-Text zu normalen Leerzeichen, der String-Matcher aber nicht.
function euroText(cents: number) {
  return formatEuro(cents).replace(/\s/g, " ");
}

function makeProps(budgetData: BudgetData = data) {
  return {
    data: budgetData,
    onResult: vi.fn(),
    onReadyChange: vi.fn(),
    checkRequested: 0,
  };
}

function clickTimes(name: string, times: number) {
  const button = screen.getByRole("button", { name });
  for (let i = 0; i < times; i++) fireEvent.click(button);
}

describe("Budget", () => {
  it("zeigt Einnahme, Rest (tuerkis) und fixe Kategorie ohne Stepper", () => {
    const props = makeProps();
    render(<Budget {...props} />);

    expect(screen.getByText(euroText(95000))).toBeTruthy();
    const remaining = screen.getByTestId("budget-remaining");
    expect(remaining.textContent).toContain(formatEuro(65000)); // 950 − 300 fest
    expect(remaining.className).toContain("text-primary-dark");

    // Fixe Kategorie: ausgegraut, keine −/+ Buttons.
    expect(screen.queryByRole("button", { name: "Mehr für Miete" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Weniger für Miete" })).toBeNull();
    expect(screen.getByText("fester Betrag")).toBeTruthy();

    // Nicht ready, solange keine nicht-fixe Kategorie > 0 ist.
    expect(props.onReadyChange).toHaveBeenLastCalledWith(false);
  });

  it("Stepper rechnet in 10-Euro-Schritten und geht nicht unter 0", () => {
    const props = makeProps();
    render(<Budget {...props} />);

    const minus = screen.getByRole("button", { name: "Weniger für Sparen" });
    expect((minus as HTMLButtonElement).disabled).toBe(true);

    clickTimes("Mehr für Sparen", 2);
    expect(screen.getByText(euroText(2000))).toBeTruthy();
    expect(props.onReadyChange).toHaveBeenLastCalledWith(true);

    fireEvent.click(minus);
    fireEvent.click(minus);
    expect(props.onReadyChange).toHaveBeenLastCalledWith(false);
    expect((minus as HTMLButtonElement).disabled).toBe(true);
  });

  it("im Budget + Sparziel erreicht → correct: true und ✔️-Ergebnis mit Balken", () => {
    const props = makeProps();
    const { rerender } = render(<Budget {...props} />);

    clickTimes("Mehr für Sparen", 10); // 100 € = Sparziel
    clickTimes("Mehr für Freizeit", 3); // 30 €

    rerender(<Budget {...props} checkRequested={1} />);
    expect(props.onResult).toHaveBeenCalledTimes(1);
    expect(props.onResult).toHaveBeenCalledWith({ correct: true });
    expect(screen.getByTestId("budget-result").textContent).toContain("✔️");
    expect(screen.getByTestId("budget-bars")).toBeTruthy();
  });

  it("mehr ausgegeben als eingenommen → orange Anzeige und correct: false", () => {
    const props = makeProps();
    const { rerender } = render(<Budget {...props} />);

    clickTimes("Mehr für Sparen", 10); // 100 €
    clickTimes("Mehr für Freizeit", 56); // 560 € → gesamt 960 € > 950 €

    const remaining = screen.getByTestId("budget-remaining");
    expect(remaining.className).toContain("text-warning-dark");
    expect(remaining.textContent).toContain(formatEuro(-1000));

    rerender(<Budget {...props} checkRequested={1} />);
    expect(props.onResult).toHaveBeenCalledWith({ correct: false });
    expect(screen.getByTestId("budget-result").textContent).toContain("⚠️");
  });

  it("im Budget, aber Sparziel verfehlt → correct: false mit Spar-Hinweis", () => {
    const props = makeProps();
    const { rerender } = render(<Budget {...props} />);

    clickTimes("Mehr für Sparen", 5); // 50 € < 100 € Ziel

    rerender(<Budget {...props} checkRequested={1} />);
    expect(props.onResult).toHaveBeenCalledWith({ correct: false });
    expect(screen.getByTestId("budget-result").textContent).toContain("Spar-Ziel");
  });

  it("ohne Sparziel reicht: im Budget bleiben", () => {
    const props = makeProps({ ...data, savingsGoal: undefined });
    const { rerender } = render(<Budget {...props} />);

    clickTimes("Mehr für Freizeit", 4);
    rerender(<Budget {...props} checkRequested={1} />);
    expect(props.onResult).toHaveBeenCalledWith({ correct: true });
  });
});
