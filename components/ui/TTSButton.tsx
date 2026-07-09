"use client";

// Vorlese-Button 🔊 an jeder Aufgabe (Spec §2.6).
// Versteckt sich komplett, wenn der Browser kein TTS kann (Spec §11) –
// Prüfung erst nach dem Mount, damit Server- und Client-HTML gleich sind.
import { useEffect, useState } from "react";
import { speak, ttsAvailable } from "@/lib/tts";

export function TTSButton({ text, lang }: { text: string; lang?: string }) {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    setAvailable(ttsAvailable());
  }, []);

  if (!available) return null;

  return (
    <button
      type="button"
      aria-label="Vorlesen"
      onClick={() => speak(text, lang)}
      className="inline-flex min-h-12 min-w-12 cursor-pointer items-center justify-center rounded-2xl border-2 border-b-4 border-locked bg-white text-2xl transition-transform select-none active:translate-y-1 active:border-b-0"
    >
      <span aria-hidden>🔊</span>
    </button>
  );
}
