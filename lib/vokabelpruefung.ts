// Prueft eingetippte Vokabeln (Vokabeltrainer, Modus "Schreiben",
// Xavier, 2026-11-27). Reine Funktionen, getestet in vokabelpruefung.test.ts.
//
// Grosszuegig bei allem, was nichts mit dem Wort selbst zu tun hat:
// - Gross- und Kleinschreibung, Satzzeichen, Apostrophe, Bindestriche
// - Artikel (der/die/das/ein..., the/a/an) duerfen fehlen oder anders sein
// - "to" vor englischen und "sich" vor deutschen Verben darf fehlen
// - ae/oe/ue/ss statt ä/ö/ü/ß, Akzente egal (résumé = resume), & = and/und
// Mehrere richtige Antworten: Komma, Schraegstrich oder Strichpunkt im
// Kartentext ("stellen, legen") und die Listen fremdAuch/deutschAuch der
// Karte (z. B. "cutlery" zu "utensils").
// Ein kleiner Tippfehler ergibt "fast": Die App zeigt die richtige
// Schreibweise, Amelie entscheidet selbst, ob es zaehlt.

export type Pruefung =
  | { art: "richtig"; treffer: string; hauptform: boolean }
  | { art: "fast"; treffer: string }
  | { art: "falsch" };

const ARTIKEL = new Set([
  "der",
  "die",
  "das",
  "den",
  "dem",
  "des",
  "ein",
  "eine",
  "einen",
  "einem",
  "einer",
  "eines",
  "the",
  "a",
  "an",
]);

function istEnglisch(sprache: string): boolean {
  return sprache.toLowerCase().startsWith("en");
}

/** Macht Text vergleichbar: klein, ohne Satzzeichen, Umlaute als ae/oe/ue/ss. */
export function normalisiere(text: string, sprache = "de"): string {
  return text
    .normalize("NFC")
    .toLocaleLowerCase("de-DE")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, istEnglisch(sprache) ? " and " : " und ")
    .replace(/['’‘`´]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** Der Kern einer Antwort: normalisiert, ohne Artikel, ohne "to"/"sich" vorne. */
export function kern(text: string, sprache = "de"): string {
  const woerter = normalisiere(text, sprache)
    .split(" ")
    .filter((wort) => wort !== "" && !ARTIKEL.has(wort));
  const vorwort = istEnglisch(sprache) ? "to" : "sich";
  if (woerter.length > 1 && woerter[0] === vorwort) woerter.shift();
  return woerter.join(" ");
}

/** Alle richtigen Antworten einer Kartenseite, die Hauptform zuerst. */
export function richtigeAntworten(
  haupt: string,
  auch: readonly string[] = [],
): { text: string; hauptform: boolean }[] {
  const liste = [{ text: haupt, hauptform: true }];
  const teile = haupt
    .split(/[,;/]/)
    .map((teil) => teil.trim())
    .filter(Boolean);
  if (teile.length > 1) {
    for (const teil of teile) liste.push({ text: teil, hauptform: true });
  }
  for (const text of auch) liste.push({ text, hauptform: false });
  return liste;
}

/** Tippfehler-Abstand: einfuegen, loeschen, ersetzen, zwei Buchstaben vertauschen. */
export function abstand(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const d: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    d.push(Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const kosten = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + kosten);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

/** Wie viele Tippfehler noch "fast richtig" sind - kurze Woerter gar keiner. */
export function erlaubteTippfehler(laenge: number): number {
  if (laenge <= 3) return 0;
  if (laenge <= 9) return 1;
  return 2;
}

/**
 * Prueft eine eingetippte Antwort.
 * @param haupt Text der Karte, z. B. "der Teller" oder "stellen, legen"
 * @param auch weitere richtige Antworten (fremdAuch/deutschAuch)
 * @param sprache Sprache der Antwort, z. B. "de-DE" oder "en-GB"
 */
export function pruefeAntwort(
  eingabe: string,
  haupt: string,
  auch: readonly string[] | undefined,
  sprache: string,
): Pruefung {
  const getippt = kern(eingabe, sprache);
  if (!getippt) return { art: "falsch" };

  const antworten = richtigeAntworten(haupt, auch);
  for (const antwort of antworten) {
    if (kern(antwort.text, sprache) === getippt) {
      return { art: "richtig", treffer: antwort.text, hauptform: antwort.hauptform };
    }
  }

  let bester: { text: string; abstand: number } | null = null;
  for (const antwort of antworten) {
    const ziel = kern(antwort.text, sprache);
    const fehler = abstand(getippt, ziel);
    if (fehler <= erlaubteTippfehler(ziel.length) && (!bester || fehler < bester.abstand)) {
      bester = { text: antwort.text, abstand: fehler };
    }
  }
  return bester ? { art: "fast", treffer: bester.text } : { art: "falsch" };
}
