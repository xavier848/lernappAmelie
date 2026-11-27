"use client";

// Zuletzt gewaehlte Richtung und zuletzt gewaehlter Modus des
// Vokabeltrainers (nur auf diesem Geraet, localStorage).
// useSyncExternalStore statt useEffect: Der Server kennt kein localStorage
// und rendert die Standard-Werte, der Browser danach die gespeicherten.
import { useSyncExternalStore } from "react";
import {
  istModus,
  istRichtung,
  ladeEinstellung,
  MODUS_KEY,
  RICHTUNG_KEY,
  speichereEinstellung,
  type Modus,
  type Richtung,
} from "@/lib/vokabeltrainer";

const zuhoerer = new Set<() => void>();
// Fallback, falls localStorage nicht geht (privates Fenster): dann gilt die
// Wahl wenigstens, solange die Seite offen ist.
const imSpeicher = new Map<string, string>();

function abonnieren(melden: () => void): () => void {
  zuhoerer.add(melden);
  window.addEventListener("storage", melden);
  return () => {
    zuhoerer.delete(melden);
    window.removeEventListener("storage", melden);
  };
}

function useEinstellung<T extends string>(
  schluessel: string,
  gueltig: (wert: unknown) => wert is T,
  standard: T,
): [T, (neu: T) => void] {
  const wert = useSyncExternalStore<T>(
    abonnieren,
    () => {
      const gespeichert = ladeEinstellung(schluessel, gueltig);
      if (gespeichert) return gespeichert;
      const ersatz = imSpeicher.get(schluessel);
      return gueltig(ersatz) ? ersatz : standard;
    },
    () => standard,
  );
  function setzen(neu: T) {
    imSpeicher.set(schluessel, neu);
    speichereEinstellung(schluessel, neu);
    zuhoerer.forEach((melden) => melden());
  }
  return [wert, setzen];
}

export function useRichtung(): [Richtung, (neu: Richtung) => void] {
  return useEinstellung(RICHTUNG_KEY, istRichtung, "fremd-deutsch");
}

export function useModus(): [Modus, (neu: Modus) => void] {
  return useEinstellung(MODUS_KEY, istModus, "karten");
}

const nichts = () => () => {};

/** true im Browser, false beim Server-Rendern und waehrend der Hydration. */
export function useIstBrowser(): boolean {
  return useSyncExternalStore(nichts, () => true, () => false);
}
