"use client";

// "Pony, erklär's mir": Knopf im Feedback-Banner nach einer falschen
// Antwort. Claude erklaert die Uebung noch einmal anders, in Leichter
// Sprache und nur mit dem Wissen aus der Lektion. Erscheint nur, wenn die
// KI-Hilfe eingerichtet ist (ANTHROPIC_API_KEY auf dem Server).
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { kiAnfrage, ohneMarkdown, useKiAktiv } from "@/lib/ki/client";

export type KiErklaerung = {
  exerciseId: string;
  /** Was Amelie geantwortet hat (ExerciseResult.given). */
  given?: string;
  /** true = sie probiert die Uebung gleich nochmal (Loesung nicht verraten). */
  nochmal: boolean;
};

export function PonyErklaert({ exerciseId, given, nochmal }: KiErklaerung) {
  const aktiv = useKiAktiv();
  const [gefragt, setGefragt] = useState(false);
  const [text, setText] = useState("");
  const abbruch = useRef<AbortController | null>(null);

  // Banner weg ("Weiter") -> laufende Anfrage abbrechen, das spart Tokens.
  useEffect(() => () => abbruch.current?.abort(), []);

  if (!aktiv) return null;

  async function fragen() {
    const ctrl = new AbortController();
    abbruch.current = ctrl;
    setGefragt(true);
    try {
      await kiAnfrage(
        "/api/ki/erklaeren",
        { exerciseId, given: given?.slice(0, 300), nochmal },
        setText,
        ctrl.signal,
      );
    } catch {
      // abgebrochen - der Banner ist schon weg
    }
  }

  if (!gefragt) {
    return (
      <Button variant="secondary" full onClick={fragen}>
        <span aria-hidden>🐴</span> Pony, erklär’s mir
      </Button>
    );
  }

  const sauber = ohneMarkdown(text);
  return (
    <div
      aria-live="polite"
      className="max-h-[30vh] overflow-y-auto overscroll-contain rounded-2xl border-2 border-primary bg-white p-3 text-base whitespace-pre-line text-ink"
    >
      {sauber || <span className="animate-pulse text-ink/60">Das Pony denkt nach …</span>}
    </div>
  );
}
