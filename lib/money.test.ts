import { describe, expect, it } from "vitest";
import { formatEuro, optimalChange, sumCents } from "./money";

// Referenz: dasselbe Intl-Format wie in der Implementierung gefordert.
// Wichtig: Intl nutzt geschützte Leerzeichen – deshalb nie hart "3,50 €" mit
// normalem Leerzeichen erwarten, sondern gegen das echte Intl-Ergebnis prüfen.
const intlEuro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

describe("formatEuro", () => {
  it("formatiert 350 Cent wie Intl.NumberFormat de-DE EUR", () => {
    expect(formatEuro(350)).toBe(intlEuro.format(3.5));
    expect(formatEuro(350)).toContain("3,50");
    expect(formatEuro(350)).toContain("€");
  });

  it("formatiert 0 Cent", () => {
    expect(formatEuro(0)).toBe(intlEuro.format(0));
    expect(formatEuro(0)).toContain("0,00");
  });

  it("formatiert grosse Betraege mit Tausenderpunkt", () => {
    expect(formatEuro(123456)).toBe(intlEuro.format(1234.56));
    expect(formatEuro(123456)).toContain("1.234,56");
  });

  it("formatiert einzelne Cents", () => {
    expect(formatEuro(5)).toContain("0,05");
  });
});

describe("optimalChange", () => {
  it("280 Cent → [200, 50, 20, 10] (greedy, groesste Stueckelung zuerst)", () => {
    expect(optimalChange(280)).toEqual([200, 50, 20, 10]);
  });

  it("liefert minimale Stueckzahl fuer 280 (4 Stueck)", () => {
    expect(optimalChange(280)).toHaveLength(4);
  });

  it("Rundtrip: Summe des Ergebnisses ist immer die Eingabe", () => {
    const samples = [1, 2, 3, 7, 47, 99, 280, 333, 999, 4999, 50001, 123456];
    for (const cents of samples) {
      expect(sumCents(optimalChange(cents))).toBe(cents);
    }
  });

  it("nutzt Scheine fuer grosse Betraege", () => {
    expect(optimalChange(100000)).toEqual([50000, 50000]);
    expect(optimalChange(50000)).toEqual([50000]);
  });

  it("kleinste Einheit 1 Cent funktioniert", () => {
    expect(optimalChange(1)).toEqual([1]);
    expect(optimalChange(3)).toEqual([2, 1]);
  });

  it("0 oder negative Betraege → leeres Array", () => {
    expect(optimalChange(0)).toEqual([]);
    expect(optimalChange(-5)).toEqual([]);
  });
});

describe("sumCents", () => {
  it("leeres Array → 0", () => {
    expect(sumCents([])).toBe(0);
  });

  it("addiert Cent-Betraege", () => {
    expect(sumCents([200, 50, 20, 10])).toBe(280);
    expect(sumCents([1, 2, 5])).toBe(8);
  });
});
