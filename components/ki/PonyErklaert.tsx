"use client";

// "Pony, erklär's mir": Knopf im Feedback-Banner nach einer falschen
// Antwort. Claude erklaert die Uebung noch einmal anders, in Leichter
// Sprache und nur mit dem Wissen aus der Lektion. Erscheint nur, wenn die
// KI-Hilfe eingerichtet ist (ANTHROPIC_API_KEY auf dem Server).
//
// Zwei Teile, damit der Banner selbst entscheiden kann, wie er aussieht:
// - PonyErklaerKnopf: der Knopf (unsichtbar ohne KI-Hilfe)
// - PonySprechblase: fragt beim Erscheinen nach und zeigt die Antwort als
//   Sprechblase vom Pony (mit Tipp-Punkten, solange es nachdenkt)
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { kiAnfrage, useKiAktiv } from "@/lib/ki/client";
import { KiText } from "./KiText";
import { PonyDenkt } from "./PonyDenkt";

export type KiErklaerung = {
  exerciseId: string;
  /** Was Amelie geantwortet hat (ExerciseResult.given). */
  given?: string;
  /** true = sie probiert die Uebung gleich nochmal (Loesung nicht verraten). */
  nochmal: boolean;
};

export function PonyErklaerKnopf({ onClick }: { onClick: () => void }) {
  const aktiv = useKiAktiv();
  if (!aktiv) return null;
  return (
    <Button variant="secondary" full onClick={onClick}>
      <span aria-hidden>🐴</span> Pony, erklär’s mir
    </Button>
  );
}

export function PonySprechblase({ exerciseId, given, nochmal }: KiErklaerung) {
  const [text, setText] = useState("");

  // Beim Erscheinen nachfragen; Banner weg ("Weiter") -> Anfrage abbrechen,
  // das spart Tokens.
  useEffect(() => {
    const ctrl = new AbortController();
    kiAnfrage(
      "/api/ki/erklaeren",
      { exerciseId, given: given?.slice(0, 300), nochmal },
      setText,
      ctrl.signal,
    ).catch(() => {
      // abgebrochen - der Banner ist schon weg
    });
    return () => ctrl.abort();
  }, [exerciseId, given, nochmal]);

  // Sprechblase mit Spitze nach oben links - dort steht das Pony.
  return (
    <div
      aria-live="polite"
      className="relative rounded-2xl rounded-tl-md bg-white px-4 py-3 text-ink shadow-sm before:absolute before:-top-2 before:left-5 before:size-4 before:rotate-45 before:rounded-sm before:bg-white"
    >
      {text.trim() ? <KiText text={text} className="relative" /> : <PonyDenkt />}
    </div>
  );
}

/** Knopf und Sprechblase in einem (fuer Stellen ohne eigenen Banner-Kopf). */
export function PonyErklaert(props: KiErklaerung) {
  const [gefragt, setGefragt] = useState(false);
  return gefragt ? (
    <PonySprechblase {...props} />
  ) : (
    <PonyErklaerKnopf onClick={() => setGefragt(true)} />
  );
}
