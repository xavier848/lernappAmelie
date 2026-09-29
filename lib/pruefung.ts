// Pruefungs-Training (Mama + Xavier, 2026-09-29).
//
// Amelie schreibt in der Schule Tests. Mama schickt die Blaetter, und der
// komplette Stoff darauf soll in der App geuebt werden - auf einer "extra
// Pruefungsplattform", die sie IMMER benutzen kann.
//
// Regel: Ein Thema, dessen Slug mit "pruefung-" beginnt, ist Pruefungsstoff.
// Solche Themen
//  - erscheinen nicht in den Bereichen und nicht in "Für dich heute",
//    sondern nur auf der eigenen Seite /pruefungstraining;
//  - sind vom Lernfluss (lib/lernfluss.ts) komplett ausgenommen: nie
//    gesperrt, keine Themen-Pause, und sie zaehlen auch nicht fuer die
//    Wiederholungspflicht der normalen Lektionen;
//  - sind in beliebiger Reihenfolge spielbar (keine 🔒-Kette).
// Ist die Pruefung vorbei, reicht es, das Thema im Admin-Bereich auf
// "nicht veroeffentlicht" zu stellen - dann verschwindet die Kachel.
// Eine neue Pruefung braucht keinen Code: neues Thema "pruefung-..." anlegen.

export const PRUEFUNG_PREFIX = "pruefung-";

/** Ist dieses Thema Pruefungsstoff (und damit vom Lernfluss ausgenommen)? */
export function istPruefungsThema(topicSlug: string | null | undefined): boolean {
  return typeof topicSlug === "string" && topicSlug.startsWith(PRUEFUNG_PREFIX);
}

/** Teilt Themen in normale Themen und Pruefungs-Themen (Reihenfolge bleibt). */
export function trennePruefungsThemen<T extends { slug: string }>(
  topics: readonly T[],
): { normal: T[]; pruefung: T[] } {
  const normal: T[] = [];
  const pruefung: T[] = [];
  for (const topic of topics) {
    if (istPruefungsThema(topic.slug)) pruefung.push(topic);
    else normal.push(topic);
  }
  return { normal, pruefung };
}

export type TestUebung = {
  id: string;
  lessonId: string;
  type: string;
  data: unknown;
};

export type UebungsStand = {
  correct: number;
  wrong: number;
  /** War die letzte Antwort richtig? Fehlt, wenn unbekannt. */
  lastCorrect?: boolean;
};

export type VersuchsStatistik = Map<string, UebungsStand>;

/** Standard-Laenge eines Probe-Tests im Pruefungs-Training. */
export const TEST_ANZAHL = 20;

/**
 * Baut die Statistik aus Einzel-Versuchen. `versuche` muss NEUESTE ZUERST
 * sortiert sein (so liefert sie fetchAttemptsForExercises): Der erste
 * Versuch je Uebung ist dann ihre letzte Antwort.
 */
export function baueVersuchsStatistik(
  versuche: readonly { exercise_id: string; correct: boolean }[],
): VersuchsStatistik {
  const stats: VersuchsStatistik = new Map();
  for (const v of versuche) {
    const eintrag = stats.get(v.exercise_id);
    if (eintrag) {
      if (v.correct) eintrag.correct += 1;
      else eintrag.wrong += 1;
    } else {
      stats.set(v.exercise_id, {
        correct: v.correct ? 1 : 0,
        wrong: v.correct ? 0 : 1,
        lastCorrect: v.correct,
      });
    }
  }
  return stats;
}

/** Sitzt diese Uebung? = die letzte Antwort war richtig. */
export function istSicher(stats: VersuchsStatistik, exerciseId: string): boolean {
  const entry = stats.get(exerciseId);
  if (!entry || entry.correct + entry.wrong === 0) return false;
  if (entry.lastCorrect !== undefined) return entry.lastCorrect;
  return entry.wrong === 0;
}

/**
 * Wie dringend sollte diese Uebung in den naechsten Test? Hoeher = eher.
 * Noch nie beantwortet = 3 (alles muss einmal drankommen), zuletzt falsch =
 * 2 + Fehlerquote, frueher mal falsch = 1 + Fehlerquote, immer richtig = 0.
 */
export function testPrioritaet(stats: VersuchsStatistik, exerciseId: string): number {
  const entry = stats.get(exerciseId);
  if (!entry || entry.correct + entry.wrong === 0) return 3;
  if (entry.wrong === 0) return 0;
  const quote = entry.wrong / (entry.correct + entry.wrong);
  return istSicher(stats, exerciseId) ? 1 + quote : 2 + quote;
}

/**
 * Stellt einen Probe-Test zusammen: `anzahl` Uebungen, verteilt ueber alle
 * Lektionen (Round-Robin), innerhalb jeder Lektion zuerst das, was noch nie
 * oder zuletzt oft falsch beantwortet wurde. So kommt ueber mehrere Tests
 * hinweg der ganze Stoff dran. Das Ergebnis ist gemischt, damit nicht alle
 * Fragen einer Lektion hintereinander stehen. `rand` ist fuer Tests injizierbar.
 */
export function waehleTestUebungen(
  uebungen: readonly TestUebung[],
  stats: VersuchsStatistik,
  anzahl: number,
  rand: () => number = Math.random,
): TestUebung[] {
  if (anzahl <= 0 || uebungen.length === 0) return [];

  // Zufallswert je Uebung einmal ziehen, damit die Sortierung stabil bleibt.
  const zufall = new Map<string, number>();
  for (const u of uebungen) zufall.set(u.id, rand());

  const proLektion = new Map<string, TestUebung[]>();
  for (const u of uebungen) {
    const liste = proLektion.get(u.lessonId);
    if (liste) liste.push(u);
    else proLektion.set(u.lessonId, [u]);
  }
  const gruppen = mische([...proLektion.values()], rand).map((liste) =>
    [...liste].sort(
      (a, b) =>
        testPrioritaet(stats, b.id) - testPrioritaet(stats, a.id) ||
        (zufall.get(a.id) ?? 0) - (zufall.get(b.id) ?? 0),
    ),
  );

  const gewaehlt: TestUebung[] = [];
  for (let runde = 0; gewaehlt.length < anzahl; runde++) {
    let nochWasDa = false;
    for (const gruppe of gruppen) {
      if (gewaehlt.length >= anzahl) break;
      const naechste = gruppe[runde];
      if (naechste) {
        gewaehlt.push(naechste);
        nochWasDa = true;
      }
    }
    if (!nochWasDa) break;
  }
  return mische(gewaehlt, rand);
}

/** Fisher-Yates (Kopie, veraendert die Eingabe nicht). */
function mische<T>(items: readonly T[], rand: () => number): T[] {
  const kopie = [...items];
  for (let i = kopie.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [kopie[i], kopie[j]] = [kopie[j], kopie[i]];
  }
  return kopie;
}
