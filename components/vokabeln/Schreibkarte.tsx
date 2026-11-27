"use client";

// Vokabeltrainer, Modus "Schreiben" (Xavier, 2026-11-27): Oben steht das
// Wort, Amelie tippt die Uebersetzung ein, die App prueft
// (lib/vokabelpruefung.ts). Bei einem kleinen Tippfehler zeigt sie "Fast!"
// mit der richtigen Schreibweise, und Amelie entscheidet selbst, ob es
// zaehlt - wie bei den Karteikarten. "Weiß nicht" zeigt die Loesung.
//
// Handy-Tastatur (Xavier und Mama, 27.11. mit Fotos): Die iPhone-Tastatur
// ist hoch, und iOS schiebt die Seite nach oben, bis das Eingabefeld frei
// liegt - dabei rutschte das Wort unter die Statusleiste, je nach Display
// mehr oder weniger. Darum:
// - Alles ueber dem Feld ist kompakt (🔊 in der Wortkarte, die Anleitung
//   steht im Feld).
// - Schreib-Fokus: Bekommt das Feld am Handy den Fokus, meldet die Karte
//   onTippen(true), und die Seite blendet Kopf und Titel aus. Dann steht
//   das Wort ganz oben, Feld und Knoepfe direkt darunter - auf jedem
//   Display ueber der Tastatur.
// - Knoepfe nehmen dem Feld beim Antippen den Fokus nicht (onMouseDown).
//   Sonst kaeme der Kopf mitten im Tippen zurueck, alles rutschte nach
//   unten, und der Finger traefe etwas anderes.
// - Nach dem Pruefen springt der Fokus auf "Weiter": Die Tastatur geht zu,
//   die ganze Rueckmeldung ist zu sehen, Enter geht weiter. "Weiter" setzt
//   den Fokus wieder ins Feld - noch im Tippen, so geht die Tastatur fuer
//   die naechste Karte gleich auf. Das Feld bleibt dabei dasselbe Element
//   (die Seite gibt keinen key).
import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from "react";
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

/** Knoepfe sollen dem Eingabefeld beim Antippen den Fokus nicht nehmen. */
function fokusBehalten(e: MouseEvent) {
  e.preventDefault();
}

/** Finger statt Maus: Dann geht beim Tippen eine Bildschirm-Tastatur auf. */
function istFingerBedienung(): boolean {
  return window.matchMedia?.("(pointer: coarse)").matches === true;
}

export function Schreibkarte({
  kartenSchluessel,
  frage,
  loesung,
  hinweis,
  onEntscheidung,
  onTippen,
}: {
  /** Wechselt mit jeder Karte - dann beginnt die Eingabe von vorn. */
  kartenSchluessel: string;
  frage: KartenSeite;
  loesung: Loesung;
  hinweis?: string;
  onEntscheidung: (gewusst: boolean) => void;
  /** true, solange am Handy ins Feld getippt wird (Tastatur offen). */
  onTippen?: (tippt: boolean) => void;
}) {
  const formular = useRef<HTMLFormElement>(null);
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

  // Beim Verschwinden (Rundenende) gibt es kein blur mehr - also hier
  // melden, dass nicht mehr getippt wird. Ueber eine Ref, damit ein neuer
  // Callback der Seite nicht jedes Mal "fertig getippt" ausloest.
  const tippenMelden = useRef(onTippen);
  useEffect(() => {
    tippenMelden.current = onTippen;
  });
  useEffect(() => () => tippenMelden.current?.(false), []);

  // Nach dem Pruefen: Fokus auf "Weiter" (der einzige Absende-Knopf dann).
  // Am Handy geht dabei die Tastatur zu.
  useEffect(() => {
    if (!ergebnis) return;
    formular.current?.querySelector<HTMLButtonElement>('button[type="submit"]')?.focus();
  }, [ergebnis]);

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
    <form ref={formular} onSubmit={absenden} noValidate className="flex flex-col gap-3">
      <div className="flex items-center gap-2 rounded-3xl border-2 border-b-4 border-locked bg-white py-2 pr-3 pl-4">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-xs font-bold tracking-wider text-ink/60 uppercase">
            {frage.sprache}
          </span>
          <span
            lang={frage.lang}
            className={cn(
              "py-0.5 text-center font-extrabold break-words hyphens-auto text-ink",
              // Lange Woerter etwas kleiner, damit die Karte niedrig bleibt.
              frage.text.length > 18 ? "text-2xl" : "text-3xl",
            )}
          >
            {frage.text}
          </span>
        </div>
        <span onMouseDown={fokusBehalten}>
          <TTSButton text={frage.text} lang={frage.lang} />
        </span>
      </div>

      <label htmlFor="vokabel-antwort" className="sr-only">
        Auf {loesung.sprache} schreiben
      </label>
      <input
        ref={feld}
        id="vokabel-antwort"
        type="text"
        value={eingabe}
        onChange={(e) => {
          if (!ergebnis) setEingabe(e.target.value);
        }}
        onFocus={() => {
          if (istFingerBedienung()) onTippen?.(true);
        }}
        onBlur={() => onTippen?.(false)}
        lang={loesung.lang}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        placeholder={ergebnis ? undefined : `Auf ${loesung.sprache} schreiben …`}
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
          <Button
            variant="secondary"
            size="lg"
            className="whitespace-nowrap"
            onMouseDown={fokusBehalten}
            onClick={weissNicht}
          >
            Weiß nicht
          </Button>
          <Button
            type="submit"
            size="lg"
            className="whitespace-nowrap"
            onMouseDown={fokusBehalten}
            disabled={!getippt}
          >
            Prüfen
          </Button>
        </div>
      ) : (
        <div key="nach-dem-pruefen" className="flex flex-col gap-2">
          <Button type="submit" size="lg" full>
            Weiter
          </Button>
          {orange && (
            <Button variant="secondary" full onClick={() => weiter(true)}>
              {ergebnis.art === "fast" ? "Nur vertippt, zählt trotzdem" : "Meine Antwort stimmt auch"}
            </Button>
          )}
        </div>
      )}
    </form>
  );
}
