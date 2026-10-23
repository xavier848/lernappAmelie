// Zerlegt eine Pony-Antwort in Absaetze und Aufzaehlungen, damit sie in der
// App lesbar aussieht (echte Aufzaehlungspunkte statt "- " am Zeilenanfang).
// Reine Funktion: funktioniert auch mit halb angekommenem Text (Stream).
import { ohneMarkdown } from "./client";

export type KiBlock =
  | { art: "absatz"; text: string }
  | { art: "liste"; nummeriert: boolean; punkte: string[] };

const PUNKT = /^\s*[-•–]\s+(.*)$/;
const NUMMER = /^\s*\d+[.)]\s+(.*)$/;

export function kiBloecke(roh: string): KiBlock[] {
  const bloecke: KiBlock[] = [];
  for (const absatz of ohneMarkdown(roh).split(/\n\s*\n/)) {
    let text: string[] = [];
    const textFertig = () => {
      if (text.length) bloecke.push({ art: "absatz", text: text.join("\n") });
      text = [];
    };
    for (const zeile of absatz.split("\n")) {
      const punkt = PUNKT.exec(zeile);
      const nummer = punkt ? null : NUMMER.exec(zeile);
      if (!punkt && !nummer) {
        if (zeile.trim()) text.push(zeile.trim());
        continue;
      }
      textFertig();
      const nummeriert = Boolean(nummer);
      const inhalt = (punkt ?? nummer)![1].trim();
      const letzter = bloecke[bloecke.length - 1];
      if (letzter?.art === "liste" && letzter.nummeriert === nummeriert) letzter.punkte.push(inhalt);
      else bloecke.push({ art: "liste", nummeriert, punkte: [inhalt] });
    }
    textFertig();
  }
  return bloecke;
}
