"use client";

// Vokabeltrainer, Modus "Schreiben" (Xavier, 2026-11-27): Oben steht das
// Wort, Amelie tippt die Uebersetzung ein, die App prueft
// (lib/vokabelpruefung.ts). Bei einem kleinen Tippfehler zeigt sie "Fast!"
// mit der richtigen Schreibweise, und Amelie entscheidet selbst, ob es
// zaehlt - wie bei den Karteikarten. "Weiß nicht" zeigt die Loesung.
//
// Das Eingabefeld bleibt von Karte zu Karte dasselbe Element (die Seite
// gibt keinen key). So bleibt am Handy die Tastatur offen: Enter prueft,
// nochmal Enter geht weiter. Die Knoepfe nehmen dem Feld den Fokus nicht
// weg (onMouseDown), damit die Tastatur nicht bei jedem Tippen zuklappt.
import { useRef, useState, type FormEvent, type MouseEvent } from "react";
import { Button } from "@/components/ui/Button";
import { TTSButton } from "@/components/ui/TTSButton";
import { cn } from "@/lib/cn";
import { pruefeAntwort } from "@/lib/vokabelpruefung";
import type { KartenSeite } from "./Karteikarte";

/** Die gesuchte Seite: Text der Karte plus weitere richtige Antworten. */
export type Loesung = KartenSeite & { auch?: readonly string[] };

type Ergebnis =
  | { art: "richtig"; treffer: string; hauptform: boolean }
  | { art: "fast"; treffer: string }
  | { art: "falsch" }
  | { art: "weissNicht" };

/** Knoepfe sollen dem Eingabefeld den Fokus nicht nehmen. */
function fokusBehalten(e: MouseEvent) {
  e.preventDefault();
}

export function Schreibkarte({
  kartenSchluessel,
  frage,
  loesung,
  hinweis,
  onEntscheidung,
}: {
  /** Wechselt mit jeder Karte - dann beginnt die Eingabe von vorn. */
  kartenSchluessel: string;
  frage: KartenSeite;
  loesung: Loesung;
  hinweis?: string;
  onEntscheidung: (gewusst: boolean) => void;
}) {
  const feld = useRef<HTMLInputElement>(null);
  const [eingabe, setEingabe] = useState("");
  const [ergebnis, setErgebnis] = useState<Ergebnis | null>(null);
  // Neue Karte: Eingabe leeren (Zustand waehrend des Renderns anpassen).
  const [fuerKarte, setFuerKarte] = useState(kartenSchluessel);
  if (fuerKarte !== kartenSchluessel) {
    setFuerKarte(kartenSchluessel);
    setEingabe("");
    setErgebnis(null);
  }

  function pruefen() {
    if (ergebnis || !eingabe.trim()) return;
    setErgebnis(pruefeAntwort(eingabe, loesung.text, loesung.auch, loesung.lang));
  }

  function weissNicht() {
    if (!ergebnis) setErgebnis({ art: "weissNicht" });
  }

  function weiter(zaehlt: boolean) {
    // Fokus noch waehrend des Tippens setzen: So geht am Handy die Tastatur
    // fuer die naechste Karte gleich wieder auf.
    feld.current?.focus();
    onEntscheidung(zaehlt);
  }

  function absenden(e: FormEvent) {
    e.preventDefault();
    if (!ergebnis) pruefen();
    else weiter(ergebnis.art === "richtig");
  }

  const getippt = eingabe.trim();
  const gruen = ergebnis?.art === "richtig";
  const orange = ergebnis?.art === "fast" || ergebnis?.art === "falsch";
  const blau = ergebnis?.art === "weissNicht";

  let titel = "";
  let gezeigt = loesung.text;
  let ueberLoesung: string | null = null;
  const unterLoesung: string[] = [];
  if (ergebnis?.art === "richtig") {
    titel = "✓ Richtig!";
    if (!ergebnis.hauptform) ueberLoesung = "Stimmt auch! Auf dem Blatt steht:";
  } else if (ergebnis?.art === "fast") {
    titel = "Fast! So schreibt man es:";
    gezeigt = ergebnis.treffer;
    unterLoesung.push(`Du hast geschrieben: ${getippt}`);
    if (ergebnis.treffer !== loesung.text) unterLoesung.push(`Auf dem Blatt steht: ${loesung.text}`);
  } else if (ergebnis?.art === "falsch") {
    titel = "Nicht ganz. Richtig ist:";
    unterLoesung.push(`Du hast geschrieben: ${getippt}`);
  } else if (ergebnis?.art === "weissNicht") {
    titel = "Das ist die Lösung:";
  }

  return (
    <form onSubmit={absenden} noValidate className="flex flex-col gap-3">
      <div className="flex min-h-28 flex-col rounded-3xl border-2 border-b-4 border-locked bg-white p-4">
        <span className="text-xs font-bold tracking-wider text-ink/60 uppercase">
          {frage.sprache}
        </span>
        <span
          lang={frage.lang}
          className="flex flex-1 items-center justify-center py-2 text-center text-3xl font-extrabold break-words text-ink"
        >
          {frage.text}
        </span>
      </div>

      <div className="flex min-h-12 items-center gap-3">
        <TTSButton text={frage.text} lang={frage.lang} />
        <label htmlFor="vokabel-antwort" className="text-sm font-semibold text-ink/70">
          Schreib es auf {loesung.sprache}.
        </label>
      </div>

      <input
        ref={feld}
        id="vokabel-antwort"
        type="text"
        value={eingabe}
        onChange={(e) => {
          if (!ergebnis) setEingabe(e.target.value);
        }}
        lang={loesung.lang}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        placeholder={ergebnis ? undefined : "Hier tippen …"}
        aria-describedby={ergebnis ? "vokabel-rueckmeldung" : undefined}
        className={cn(
          "min-h-14 w-full rounded-2xl border-2 px-4 text-xl font-bold text-ink outline-none placeholder:font-semibold placeholder:text-ink/40",
          !ergebnis && "border-locked bg-white focus:border-primary",
          gruen && "border-success-dark bg-success-light",
          orange && "border-warning-dark bg-warning-light",
          blau && "border-primary bg-primary-light",
        )}
      />

      {ergebnis && (
        <div
          id="vokabel-rueckmeldung"
          role="status"
          className={cn(
            "flex flex-col gap-1 rounded-2xl border-2 p-3",
            gruen && "border-success-dark bg-success-light",
            orange && "border-warning-dark bg-warning-light",
            blau && "border-primary bg-primary-light",
          )}
        >
          <p
            className={cn(
              "text-base font-extrabold",
              gruen && "text-success-dark",
              orange && "text-warning-dark",
              blau && "text-primary-dark",
            )}
          >
            {titel}
          </p>
          {ueberLoesung && <p className="text-sm text-ink/80">{ueberLoesung}</p>}
          <div className="flex items-center gap-3">
            <p lang={loesung.lang} className="flex-1 text-xl font-extrabold break-words text-ink">
              {gezeigt}
            </p>
            <TTSButton text={gezeigt} lang={loesung.lang} />
          </div>
          {unterLoesung.map((zeile) => (
            <p key={zeile} className="text-sm break-words text-ink/80">
              {zeile}
            </p>
          ))}
          {hinweis && <p className="text-sm font-semibold text-primary-dark">{hinweis}</p>}
        </div>
      )}

      {/* Eigene keys je Knopfgruppe: Sonst baut React den angeklickten
          Knopf noch waehrend des Klicks zu "Weiter" (type=submit) um, und der
          Browser schickt das Formular ab - "Weiß nicht" wuerde die Karte
          ueberspringen. */}
      {!ergebnis ? (
        <div key="vor-dem-pruefen" className="grid grid-cols-2 gap-3">
          <Button variant="secondary" size="lg" onMouseDown={fokusBehalten} onClick={weissNicht}>
            Weiß nicht
          </Button>
          <Button type="submit" size="lg" onMouseDown={fokusBehalten} disabled={!getippt}>
            Prüfen
          </Button>
        </div>
      ) : (
        <div key="nach-dem-pruefen" className="flex flex-col gap-2">
          <Button type="submit" size="lg" full onMouseDown={fokusBehalten}>
            Weiter
          </Button>
          {orange && (
            <Button
              variant="secondary"
              full
              onMouseDown={fokusBehalten}
              onClick={() => weiter(true)}
            >
              {ergebnis.art === "fast" ? "Nur vertippt, zählt trotzdem" : "Meine Antwort stimmt auch"}
            </Button>
          )}
        </div>
      )}
    </form>
  );
}
