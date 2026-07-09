"use client";

// Gemeinsame Hooks für den Player-Vertrag (components/exercises/types.ts):
// - useCheck: feuert den Prüf-Handler genau EINMAL pro Erhöhung von `checkRequested`.
// - useReportReady: meldet dem Player, ob der „Prüfen"-Button aktiv sein darf.
import { useEffect, useRef } from "react";

/**
 * Führt `onCheck` genau einmal aus, wenn der Player `checkRequested` erhöht.
 * Der Wert beim Mount zählt nicht als Prüf-Anforderung.
 */
export function useCheck(checkRequested: number, onCheck: () => void): void {
  const lastHandled = useRef(checkRequested);
  const handler = useRef(onCheck);

  useEffect(() => {
    handler.current = onCheck;
  });

  useEffect(() => {
    if (checkRequested !== lastHandled.current) {
      lastHandled.current = checkRequested;
      handler.current();
    }
  }, [checkRequested]);
}

/** Meldet Änderungen des ready-Zustands an den Player (inkl. Anfangswert). */
export function useReportReady(
  ready: boolean,
  onReadyChange: (ready: boolean) => void,
): void {
  const callback = useRef(onReadyChange);

  useEffect(() => {
    callback.current = onReadyChange;
  });

  useEffect(() => {
    callback.current(ready);
  }, [ready]);
}
