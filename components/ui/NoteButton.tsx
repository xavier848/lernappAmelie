"use client";

// Notiz-Knopf fuer den Mama-Pruef-Modus: bei jeder Uebung kann Mama melden,
// wenn etwas falsch ist. Die Notiz landet in der feedback-Tabelle mit Angabe,
// welche Lektion/Uebung gemeint war. Im Amelie-Profil wird nichts angezeigt.
import { useEffect, useState } from "react";
import { getProfile } from "@/lib/device";
import { submitFeedback } from "@/lib/data";
import { Button } from "./Button";
import { cn } from "@/lib/cn";

type Status = "idle" | "open" | "saving" | "saved" | "error";

export function NoteButton({
  lessonSlug,
  exerciseIndex,
  exercisePrompt,
}: {
  lessonSlug?: string;
  exerciseIndex?: number;
  exercisePrompt?: string;
}) {
  const [isMama, setIsMama] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [text, setText] = useState("");

  useEffect(() => {
    setIsMama(getProfile() === "mama");
  }, []);

  // Beim Wechsel der Uebung zuruecksetzen.
  useEffect(() => {
    setStatus("idle");
    setText("");
  }, [lessonSlug, exerciseIndex]);

  if (!isMama) return null;

  async function save() {
    if (!text.trim()) return;
    setStatus("saving");
    try {
      await submitFeedback({
        profile: "mama",
        lessonSlug,
        exerciseIndex,
        exercisePrompt,
        note: text.trim(),
      });
      setStatus("saved");
      setText("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setStatus(status === "open" ? "idle" : "open")}
        aria-label="Notiz zu dieser Aufgabe schreiben"
        className={cn(
          "flex min-h-12 items-center gap-2 rounded-2xl border-2 border-b-4 px-4 text-sm font-bold select-none",
          "active:translate-y-0.5 active:border-b-2",
          status === "saved"
            ? "border-success bg-success-light text-success-dark"
            : "border-warning bg-warning-light text-warning-dark"
        )}
      >
        {status === "saved" ? "✅ Notiz gespeichert" : "📝 Notiz"}
      </button>

      {status !== "idle" && status !== "saved" && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Notiz schreiben"
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 px-4 pb-4"
          onClick={() => setStatus("idle")}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-lg font-extrabold text-ink">
              📝 Was ist bei dieser Aufgabe falsch?
            </p>
            {exercisePrompt && (
              <p className="mt-1 text-sm text-ink/60">
                Aufgabe: {exercisePrompt}
              </p>
            )}
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoFocus
              rows={4}
              placeholder="Zum Beispiel: Die richtige Antwort stimmt nicht, weil …"
              className="mt-3 w-full rounded-2xl border-2 border-locked p-3 text-base text-ink outline-none focus:border-primary"
            />
            {status === "error" && (
              <p className="mt-2 text-sm font-semibold text-warning-dark">
                Konnte nicht gespeichert werden. Versuch es nochmal.
              </p>
            )}
            <div className="mt-4 flex flex-col gap-2.5">
              <Button
                variant="warning"
                size="lg"
                full
                disabled={!text.trim() || status === "saving"}
                onClick={save}
              >
                {status === "saving" ? "Wird gespeichert …" : "Notiz speichern"}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                full
                onClick={() => setStatus("idle")}
              >
                Abbrechen
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
