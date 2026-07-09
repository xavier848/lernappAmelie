// Zentrale Geld-Grafik: rendert je nach Cent-Wert eine stilisierte Muenze
// (Kreis) oder einen stilisierten Schein (abgerundetes Rechteck).
// Alle Werte IMMER in Cent (Integer) – siehe lib/money.ts.

import { COINS, CoinSvg } from "./coins";
import { NOTES, NoteSvg } from "./notes";

/** Alle darstellbaren Nennwerte in Cent (Muenzen + Scheine, aufsteigend). */
export const MONEY_VALUES: readonly number[] = [
  1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000,
] as const;

/** Sprech-Text fuer einen Nennwert, z. B. 10 → "10 Cent", 200 → "2 Euro", 500 → "5 Euro Schein". */
export function moneyLabel(value: number): string {
  if (value < 100) return `${value} Cent`;
  const euros = value / 100;
  const isNote = NOTES.some((note) => note.value === value);
  return isNote ? `${euros} Euro Schein` : `${euros} Euro`;
}

/**
 * Wandelt einen `moneyImage`-SVG-Key aus dem Content-JSON in einen Cent-Wert um.
 * Konvention: Der Key enthaelt den Cent-Wert als Zahl, z. B. "200", "coin-200"
 * oder "note-500". Unbekannte Werte → null.
 */
export function moneyValueFromKey(key: string): number | null {
  const match = key.match(/(\d+)/);
  if (!match) return null;
  const value = Number(match[1]);
  return MONEY_VALUES.includes(value) ? value : null;
}

export type MoneySvgProps = {
  /** Wert in Cent: 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000 oder 5000. */
  value: number;
  /** Muenz-Durchmesser bzw. Referenz-Hoehe in px (Scheine werden ×1.7 breiter). */
  size?: number;
};

export function MoneySvg({ value, size = 64 }: MoneySvgProps) {
  const label = moneyLabel(value);
  if (COINS.some((coin) => coin.value === value)) {
    return <CoinSvg value={value} size={size} ariaLabel={label} />;
  }
  if (NOTES.some((note) => note.value === value)) {
    return <NoteSvg value={value} size={size} ariaLabel={label} />;
  }
  return null;
}
