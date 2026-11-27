"use client";

// Zuletzt gewaehlte Richtung des Vokabeltrainers (nur auf diesem Geraet).
// useSyncExternalStore statt useEffect: Der Server kennt kein localStorage
// und rendert die Standard-Richtung, der Browser danach die gespeicherte.
import { useSyncExternalStore } from "react";
import {
  ladeRichtung,
  speichereRichtung,
  type Richtung,
} from "@/lib/vokabeltrainer";

const zuhoerer = new Set<() => void>();
// Fallback, falls localStorage nicht geht (privates Fenster): dann gilt die
// Wahl wenigstens, solange die Seite offen ist.
let imSpeicher: Richtung | null = null;

function abonnieren(melden: () => void): () => void {
  zuhoerer.add(melden);
  window.addEventListener("storage", melden);
  return () => {
    zuhoerer.delete(melden);
    window.removeEventListener("storage", melden);
  };
}

export function useRichtung(): [Richtung, (neu: Richtung) => void] {
  const richtung = useSyncExternalStore<Richtung>(
    abonnieren,
    () => imSpeicher ?? ladeRichtung(),
    () => "fremd-deutsch",
  );
  function setzen(neu: Richtung) {
    imSpeicher = neu;
    speichereRichtung(neu);
    zuhoerer.forEach((melden) => melden());
  }
  return [richtung, setzen];
}

const nichts = () => () => {};

/** true im Browser, false beim Server-Rendern und waehrend der Hydration. */
export function useIstBrowser(): boolean {
  return useSyncExternalStore(nichts, () => true, () => false);
}
