// Ablauf des Vokabeltrainers (Mama, 2026-11-27): reine Funktionen, getestet
// in vokabeltrainer.test.ts.
//
// Runde 1: alle Karten in zufaelliger Reihenfolge. Jede Karte bekommt
// "gewusst" oder "nicht gewusst". Die naechste Runde fragt nur noch die
// Karten ab, die nicht gewusst waren - so lange, bis alle sitzen.

export type Richtung = "fremd-deutsch" | "deutsch-fremd";

export type Phase = "karte" | "rundenende" | "fertig";

export type Training = {
  /** Laufende Runde, ab 1. */
  runde: number;
  /** Karten dieser Runde als Indizes in den Stapel, in Spiel-Reihenfolge. */
  reihe: number[];
  /** Position der aktuellen Karte in `reihe`. */
  pos: number;
  /** Karten dieser Runde, die nicht gewusst waren. */
  nochmal: number[];
  /** Wie viele Karten in dieser Runde gewusst waren. */
  gewusstInRunde: number;
  /** Gewusst in Runde 1 - fuer das Lob am Ende. Null, solange Runde 1 laeuft. */
  gewusstBeimErstenMal: number | null;
  phase: Phase;
};

/** Mischt eine Kopie (Fisher-Yates). `zufall` liefert Zahlen in [0, 1). */
export function mische<T>(liste: readonly T[], zufall: () => number = Math.random): T[] {
  const kopie = [...liste];
  for (let i = kopie.length - 1; i > 0; i--) {
    const j = Math.floor(zufall() * (i + 1));
    [kopie[i], kopie[j]] = [kopie[j], kopie[i]];
  }
  return kopie;
}

/** Startet ein Training ueber `anzahl` Karten. */
export function starteTraining(anzahl: number, zufall: () => number = Math.random): Training {
  const alle = Array.from({ length: Math.max(0, anzahl) }, (_, i) => i);
  return {
    runde: 1,
    reihe: mische(alle, zufall),
    pos: 0,
    nochmal: [],
    gewusstInRunde: 0,
    gewusstBeimErstenMal: null,
    phase: alle.length > 0 ? "karte" : "fertig",
  };
}

/** Die Karte, die gerade dran ist (Index in den Stapel), oder null. */
export function aktuelleKarte(training: Training): number | null {
  if (training.phase !== "karte") return null;
  return training.reihe[training.pos] ?? null;
}

/** Amelie hat entschieden: gewusst oder nicht gewusst. */
export function beantworte(training: Training, gewusst: boolean): Training {
  const karte = aktuelleKarte(training);
  if (karte === null) return training;

  const nochmal = gewusst ? training.nochmal : [...training.nochmal, karte];
  const gewusstInRunde = training.gewusstInRunde + (gewusst ? 1 : 0);
  const pos = training.pos + 1;
  const rundeVorbei = pos >= training.reihe.length;

  return {
    ...training,
    pos,
    nochmal,
    gewusstInRunde,
    gewusstBeimErstenMal:
      rundeVorbei && training.runde === 1 ? gewusstInRunde : training.gewusstBeimErstenMal,
    phase: rundeVorbei ? (nochmal.length > 0 ? "rundenende" : "fertig") : "karte",
  };
}

/** Naechste Runde: nur die Karten, die nicht gewusst waren, neu gemischt. */
export function naechsteRunde(training: Training, zufall: () => number = Math.random): Training {
  if (training.phase !== "rundenende") return training;
  return {
    ...training,
    runde: training.runde + 1,
    reihe: mische(training.nochmal, zufall),
    pos: 0,
    nochmal: [],
    gewusstInRunde: 0,
    phase: "karte",
  };
}

/** Andere Richtung als die gegebene. */
export function andereRichtung(richtung: Richtung): Richtung {
  return richtung === "fremd-deutsch" ? "deutsch-fremd" : "fremd-deutsch";
}

/** Merkt sich die zuletzt gewaehlte Richtung (nur auf diesem Geraet). */
export const RICHTUNG_KEY = "lernapp-vokabel-richtung";

export function ladeRichtung(): Richtung {
  try {
    const wert = window.localStorage.getItem(RICHTUNG_KEY);
    return wert === "deutsch-fremd" ? "deutsch-fremd" : "fremd-deutsch";
  } catch {
    return "fremd-deutsch";
  }
}

export function speichereRichtung(richtung: Richtung): void {
  try {
    window.localStorage.setItem(RICHTUNG_KEY, richtung);
  } catch {
    // Ohne Speicher gilt einfach wieder die Standard-Richtung.
  }
}
