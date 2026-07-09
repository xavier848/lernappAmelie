// Geld-Helfer: Alle Betraege werden IMMER als Integer in Cent gerechnet.
// Nur fuer die Anzeige wird in Euro umgerechnet (Intl.NumberFormat de-DE EUR).

/** EUR-Stueckelung in Cent, absteigend: Scheine (500 € … 5 €) und Muenzen (2 € … 1 Cent). */
export const EURO_DENOMINATIONS: readonly number[] = [
  50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100, 50, 20, 10, 5, 2, 1,
];

const euroFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

/** Formatiert einen Cent-Betrag als Euro-Text, z. B. 350 → "3,50 €". */
export function formatEuro(cents: number): string {
  return euroFormatter.format(cents / 100);
}

/**
 * Zerlegt einen Cent-Betrag greedy in die wenigsten Muenzen/Scheine.
 * Bei der EUR-Stueckelung liefert greedy immer die minimale Stueckzahl.
 * Beispiel: 280 → [200, 50, 20, 10]. Fuer Betraege ≤ 0 → [].
 */
export function optimalChange(cents: number): number[] {
  if (!Number.isInteger(cents) || cents <= 0) return [];
  const result: number[] = [];
  let remaining = cents;
  for (const denomination of EURO_DENOMINATIONS) {
    while (remaining >= denomination) {
      result.push(denomination);
      remaining -= denomination;
    }
  }
  return result;
}

/** Summiert eine Liste von Cent-Betraegen. */
export function sumCents(items: number[]): number {
  return items.reduce((sum, cents) => sum + cents, 0);
}
