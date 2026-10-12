// Browser-Seite der KI-Hilfen: Status abfragen und Antworten als Stream lesen.
import { useEffect, useState } from "react";
import { FEHLER_TEXT, OFFLINE_TEXT } from "./texte";

let statusAnfrage: Promise<boolean> | null = null;
// Schon bekannte Antwort - dann erscheinen die Knoepfe ohne Flackern.
let statusBekannt: boolean | null = null;

/** Fragt einmal pro Seitenaufruf, ob die KI-Hilfe eingerichtet ist. */
export function kiStatus(): Promise<boolean> {
  statusAnfrage ??= fetch("/api/ki/status", { cache: "no-store" })
    .then((res) => (res.ok ? res.json() : null))
    .then((json: { aktiv?: boolean } | null) => {
      statusBekannt = Boolean(json?.aktiv);
      return statusBekannt;
    })
    .catch(() => {
      statusAnfrage = null; // offline: beim naechsten Mal neu fragen
      return false;
    });
  return statusAnfrage;
}

/** true, sobald feststeht, dass die KI-Hilfe da ist (vorher false). */
export function useKiAktiv(): boolean {
  const [aktiv, setAktiv] = useState(() => statusBekannt ?? false);
  useEffect(() => {
    let lebt = true;
    void kiStatus().then((a) => {
      if (lebt) setAktiv(a);
    });
    return () => {
      lebt = false;
    };
  }, []);
  return aktiv;
}

/**
 * Schickt die Anfrage und ruft onText mit dem bisher angekommenen Text auf.
 * Die Routen liefern auch Fehler als lesbaren Text (z. B. Tageslimit).
 * `ok` ist false, wenn die Antwort ein Fehler war - der Chat schickt sie
 * dann nicht als Verlauf zurueck.
 */
export async function kiAnfrage(
  url: string,
  body: unknown,
  onText: (bisher: string) => void,
  signal?: AbortSignal,
): Promise<{ text: string; ok: boolean }> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    onText(OFFLINE_TEXT);
    return { text: OFFLINE_TEXT, ok: false };
  }

  if (!res.body) {
    const text = (await res.text()) || OFFLINE_TEXT;
    onText(text);
    return { text, ok: false };
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
      onText(text);
    }
    text += decoder.decode();
  } catch (error) {
    if (signal?.aborted) throw error;
    text = text ? `${text}\n\n${OFFLINE_TEXT}` : OFFLINE_TEXT;
    onText(text);
    return { text, ok: false };
  }
  if (!text) text = OFFLINE_TEXT;
  onText(text);
  // Bricht Claude mitten im Stream ab, haengt der Server FEHLER_TEXT an.
  return { text, ok: res.ok && !text.endsWith(FEHLER_TEXT) };
}

/**
 * Entfernt Markdown-Reste, falls das Modell doch welche schreibt
 * (fett, Ueberschriften). Leichte Sprache soll ruhig aussehen.
 */
export function ohneMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    // *kursiv* - aber nicht "3 * 4" oder "3*4"
    .replace(/(^|[^\w*])\*(?!\s)([^*\n]+?)(?<!\s)\*(?!\w)/gm, "$1$2")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*\*\s+/gm, "- ");
}
