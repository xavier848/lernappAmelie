// Deterministischer Shuffle für Übungskomponenten.
// Gleicher Seed → gleiche Reihenfolge (stabil pro Übung, testbar).
// Das Ergebnis ist NIE identisch mit der Eingabe-Reihenfolge,
// wenn das vermeidbar ist (Lösung darf nicht schon fertig daliegen).

/** FNV-1a-Hash (32 Bit) – macht aus jedem Seed-String eine Zahl. */
function hashString(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Mulberry32 – kleiner, deterministischer Zufallsgenerator. */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function toSeedNumber(seed: string | number): number {
  return hashString(typeof seed === "string" ? seed : String(seed));
}

function fisherYates<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Vergleicht zwei Arrays inhaltlich (nicht per Referenz). */
function sameOrder<T>(a: readonly T[], b: readonly T[]): boolean {
  return (
    a.length === b.length &&
    a.every((item, i) => JSON.stringify(item) === JSON.stringify(b[i]))
  );
}

/**
 * Mischt `items` deterministisch anhand von `seed`.
 * Garantie: Das Ergebnis unterscheidet sich inhaltlich von der Eingabe,
 * außer es geht nicht anders (z. B. 1 Element oder alle Elemente gleich).
 */
export function shuffleSeeded<T>(items: readonly T[], seed: string | number): T[] {
  if (items.length < 2) return [...items];

  const base = toSeedNumber(seed);
  for (let attempt = 0; attempt < 10; attempt++) {
    const result = fisherYates(items, mulberry32(base + attempt));
    if (!sameOrder(result, items)) return result;
  }

  // Extremes Pech mit dem Generator: einfach um 1 rotieren.
  const rotated = [...items.slice(1), items[0]];
  if (!sameOrder(rotated, items)) return rotated;

  // Alle Elemente sind inhaltsgleich – Reihenfolge ist dann egal.
  return [...items];
}

/** Baut einen stabilen Seed-String aus Übungsdaten (z. B. Länge + erster Text). */
export function seedFromData(
  ...parts: Array<string | number | undefined>
): string {
  return parts.filter((part) => part !== undefined).join("|");
}
