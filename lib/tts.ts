// Vorlesen per Web Speech API (Spec §2.6): jeder Aufgaben-Prompt hat einen
// 🔊-Button. Wenn der Browser kein TTS kann, passiert einfach nichts –
// der Button wird dann gar nicht erst angezeigt (ttsAvailable).

/** True, wenn der Browser Sprachausgabe unterstuetzt. */
export function ttsAvailable(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/**
 * Liest den Text vor. Bricht eine laufende Ausgabe vorher ab.
 * Etwas langsamer als normal (rate 0.95), Standard-Sprache Deutsch.
 * No-op, wenn Sprachausgabe nicht verfuegbar ist.
 */
export function speak(text: string, lang: string = "de-DE"): void {
  if (!ttsAvailable()) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}
