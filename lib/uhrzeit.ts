// Uhrzeit-Eingabe fuer number_input mit format "uhrzeit" (Mamas Zeit-Rechnen,
// Chat 11.07.). Die Uhrzeit steht als ganze Zahl HHMM im Inhalt
// (8:39 → 839, 15:41 → 1541) - so bleibt answer eine ganze Zahl wie bei
// jeder anderen number_input-Aufgabe, und auch ohne Doppelpunkt
// eingetippt ("839") ist die Antwort eindeutig: die letzten zwei Ziffern
// sind die Minuten. Eine volle Stunde darf man auch ohne Minuten tippen:
// "8" heisst 8:00 Uhr, "20" heisst 20:00 Uhr. Die Anzeige zeigt dann
// "8 Uhr" - Mama (13./14.11.) konnte damit nicht pruefen, weil vorher
// erst Minuten verlangt wurden.

/** "8:39", "08:39" oder "839" → 839; "8" → 800. Keine gueltige Uhrzeit → null. */
export function parseUhrzeit(eingabe: string): number | null {
  const volleStunde = /^(\d{1,2})$/.exec(eingabe);
  if (volleStunde) {
    const stunden = Number(volleStunde[1]);
    return stunden > 23 ? null : stunden * 100;
  }
  const treffer =
    /^(\d{1,2}):(\d{2})$/.exec(eingabe) ?? /^(\d{1,2})(\d{2})$/.exec(eingabe);
  if (!treffer) return null;
  const stunden = Number(treffer[1]);
  const minuten = Number(treffer[2]);
  if (stunden > 23 || minuten > 59) return null;
  return stunden * 100 + minuten;
}

/**
 * Ist die Eingabe fertig getippt ("8:39", "839" oder die volle Stunde "8")?
 * Erst dann darf Amelie pruefen - eine halbe Uhrzeit ("8:" oder "8:3")
 * waere sonst sofort falsch.
 */
export function uhrzeitVollstaendig(eingabe: string): boolean {
  return /^(\d{1,2}:\d{2}|\d{1,4})$/.test(eingabe);
}

/**
 * Darf die Taste an die bisherige Eingabe angehaengt werden?
 * Mit Doppelpunkt hoechstens "23:59" (2 Ziffern davor, 2 danach),
 * ohne Doppelpunkt hoechstens 4 Ziffern ("1541").
 */
export function uhrzeitTasteErlaubt(bisher: string, taste: string): boolean {
  const [vorher, nachher] = bisher.split(":");
  if (taste === ":") {
    return nachher === undefined && vorher.length >= 1 && vorher.length <= 2;
  }
  if (nachher !== undefined) return nachher.length < 2;
  return vorher.length < 4;
}
