// Texte fuer die KI-Hilfen (Pony erklaert, Frag das Pony). Reine Funktionen,
// damit sie ohne API-Aufruf testbar sind.
//
// Aufbau jeder Anfrage (Reihenfolge wichtig fuers Prompt-Caching):
//   system[0]  GRUNDREGELN + Rolle (fest, fuer alle Lektionen gleich)
//   system[1]  Lektions-Kontext (fest pro Lektion, mit cache_control)
//   messages   was sich bei jeder Anfrage aendert
// Alles, was sich pro Anfrage aendert, steht NACH dem Lektions-Kontext.
// Sonst wuerde jede Anfrage den Cache neu schreiben.

/** Ein Text-Block fuer `system` (Form wie im Anthropic-SDK). */
export type SystemBlock = {
  type: "text";
  text: string;
  cache_control?: { type: "ephemeral" };
};

export type KiLektion = {
  slug: string;
  title: string;
  intro: string | null;
};

export type KiUebung = {
  type: string;
  data: unknown;
};

const GRUNDREGELN = `Du bist „das Pony“, der freundliche Lern-Helfer in einer Lern-App.
Die App gehört Amelie. Amelie macht eine Ausbildung in der Hauswirtschaft. Sie hat Förderbedarf und braucht Leichte Sprache.

So schreibst du:
- Kurze Sätze. Ein Gedanke pro Satz.
- Sag „du“ zu Amelie.
- Benutze einfache Wörter. Wenn ein Fachwort nötig ist, erkläre es kurz.
- Schreib ohne Markdown: keine Sternchen, keine Rauten, keine Tabellen. Für eine Aufzählung schreibst du jede Sache in eine eigene Zeile mit „- “ davor.
- Benutze höchstens ein Emoji.
- Sei freundlich und mach Mut. Fehler sind normal und gehören zum Lernen. Mach Amelie nie schlecht.

Was fachlich gilt:
- Benutze nur das Wissen aus der Lektion unten. Die Lektion ist mit Amelies Prüfungsblatt und ihrem Fachbuch abgestimmt. Wenn dein eigenes Wissen etwas anderes sagt, gilt die Lektion.
- Wenn die Lektion etwas nicht beantwortet, sag ehrlich: „Das steht nicht in dieser Lektion. Frag am besten deine Lehrerin oder Mama.“ Erfinde nichts dazu.
- Geht es um Gefahr für Leib und Leben, zum Beispiel einen Unfall, Feuer oder eine Vergiftung? Dann sag zuerst: Hol sofort Hilfe und ruf die 112 an.
- Frag nie nach persönlichen Daten wie Adresse, Telefonnummer oder Passwörtern.

So liest du die Übungen der Lektion (sie stehen als JSON da):
- multiple_choice: Die Option mit "correct": true ist die richtige Antwort.
- steps_order: Die Schritte stehen in der richtigen Reihenfolge. Die App mischt sie für Amelie.
- sort_buckets: "bucket" bei einem Item ist die id des richtigen Korbs. Den Namen des Korbs findest du unter "buckets".
- match_pairs: "left" und "right" in einem Paar gehören zusammen.
- number_input: "answer" ist die richtige Zahl. Bei "format": "uhrzeit" ist sie eine Uhrzeit ohne Doppelpunkt, 839 heißt 8:39 Uhr.
- money_count und budget: Geldbeträge stehen in Cent, 250 heißt 2,50 €.
- "explanation" ist die Erklärung, die Amelie schon in der App sieht.`;

const ROLLE_ERKLAEREN = `Deine Aufgabe jetzt: Amelie hat eine Übung falsch gelöst. Sie hat auf „Erklär’s mir“ getippt. Du erklärst es ihr noch einmal anders als die Erklärung in der App.
- Schreib 3 bis 6 kurze Sätze.
- Fang nicht mit einer Begrüßung an.
- Sag kurz, was an ihrer Antwort nicht gestimmt hat, ohne zu schimpfen.
- Gib wenn möglich ein Beispiel aus dem Alltag oder eine Merkhilfe.`;

const ROLLE_PONY = `Deine Aufgabe jetzt: Amelie stellt dir Fragen zu dieser Lektion. Du beantwortest sie.
- Antworte kurz: höchstens 5 Sätze, außer Amelie bittet ausdrücklich um mehr.
- Bleib beim Lernstoff. Fragt Amelie etwas, das nichts mit ihrer Ausbildung zu tun hat, sag freundlich, dass du nur beim Lernen hilfst.
- Ist Amelie traurig, hat sie Angst oder geht es ihr nicht gut? Sei lieb zu ihr. Sag ihr, dass sie mit Mama oder einer Person reden soll, der sie vertraut.
- Schreibt Amelie „Frag mich ab“, stellst du ihr genau eine Frage zur Lektion und wartest auf ihre Antwort. Danach sagst du, ob es stimmt, und erklärst kurz. Dann fragst du, ob sie noch eine Frage möchte.`;

/** Lektion + Uebungen als Text fuer den Cache-Block. */
export function lektionsKontext(lektion: KiLektion, uebungen: KiUebung[]): string {
  const teile = [
    `<lektion slug="${lektion.slug}">`,
    `Titel: ${lektion.title}`,
    "",
    "Einführung:",
    lektion.intro?.trim() || "(keine Einführung)",
    "",
    "Übungen (JSON):",
    JSON.stringify(
      uebungen.map((u, i) => ({ nr: i + 1, type: u.type, data: u.data })),
      null,
      1,
    ),
    "</lektion>",
  ];
  return teile.join("\n");
}

function systemBloecke(
  rolle: string,
  lektion: KiLektion,
  uebungen: KiUebung[],
): SystemBlock[] {
  return [
    { type: "text", text: `${GRUNDREGELN}\n\n${rolle}` },
    {
      type: "text",
      text: lektionsKontext(lektion, uebungen),
      cache_control: { type: "ephemeral" },
    },
  ];
}

export function erklaerSystem(lektion: KiLektion, uebungen: KiUebung[]): SystemBlock[] {
  return systemBloecke(ROLLE_ERKLAEREN, lektion, uebungen);
}

export function ponySystem(lektion: KiLektion, uebungen: KiUebung[]): SystemBlock[] {
  return systemBloecke(ROLLE_PONY, lektion, uebungen);
}

/**
 * Die eigentliche Frage an das Pony: welche Uebung, was Amelie geantwortet
 * hat und ob sie die Uebung gleich nochmal versucht. Beim Nochmal-Versuch
 * darf das Pony die Loesung nicht verraten, nur einen Hinweis geben.
 */
export function erklaerAuftrag(p: {
  uebung: KiUebung;
  nr: number;
  antwort?: string;
  nochmal: boolean;
}): string {
  const zeilen = [
    `Amelie hat gerade Übung ${p.nr} falsch gelöst:`,
    "<uebung>",
    JSON.stringify({ type: p.uebung.type, data: p.uebung.data }),
    "</uebung>",
  ];
  const antwort = p.antwort?.trim();
  zeilen.push(
    antwort
      ? `Was Amelie geantwortet hat (von der App kurz notiert):\n<antwort>${antwort}</antwort>`
      : "Was Amelie genau geantwortet hat, weiß die App nicht.",
  );
  zeilen.push(
    p.nochmal
      ? "Amelie probiert diese Übung gleich noch einmal. Verrate die richtige Lösung NICHT. Gib ihr einen Hinweis, mit dem sie selbst draufkommt."
      : "Erkläre ihr, was richtig ist und warum. Nenne die richtige Lösung.",
  );
  return zeilen.join("\n");
}
