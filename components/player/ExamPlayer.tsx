"use client";

// Prüfungs-Player: spielt eine feste Reihe von Übungen EINMAL durch (kein
// Wiederholen wie im Lektions-Player), zeigt nach jeder Antwort kurz
// richtig/falsch und sammelt die Ergebnisse. Am Ende ruft er onDone auf.
import { useEffect, useState } from "react";
import { exerciseSchema, type ExerciseInput } from "@/lib/content-schema";
import { logAttempt } from "@/lib/data";
import { getDeviceId } from "@/lib/device";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { TTSButton } from "@/components/ui/TTSButton";
import { PromptText } from "@/components/ui/PromptText";
import { speakableText } from "@/lib/speakable";
import { FeedbackBanner } from "@/components/ui/FeedbackBanner";
import { ExerciseView } from "@/components/exercises/ExerciseView";

export type ExamResult = { exerciseId: string; correct: boolean };

type Playable = { id: string; exercise: ExerciseInput };

export function ExamPlayer({
  exercises,
  onQuit,
  onDone,
}: {
  exercises: { id: string; type: string; data: unknown }[];
  onQuit: () => void;
  onDone: (results: ExamResult[]) => void;
}) {
  const [playable] = useState<Playable[]>(() => {
    const out: Playable[] = [];
    for (const row of exercises) {
      try {
        out.push({
          id: row.id,
          exercise: exerciseSchema.parse({ type: row.type, data: row.data }),
        });
      } catch {
        // ungültige Übung überspringen
      }
    }
    return out;
  });

  const [index, setIndex] = useState(0);
  const [checkRequested, setCheckRequested] = useState(0);
  const [ready, setReady] = useState(false);
  const [feedback, setFeedback] = useState<{ correct: boolean; explanation?: string } | null>(null);
  const [results, setResults] = useState<ExamResult[]>([]);

  // Dokument-Scrollen sperren, damit die Kopfzeile fest bleibt (wie im Player).
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prev = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      overscroll: body.style.overscrollBehavior,
    };
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";
    return () => {
      html.style.overflow = prev.htmlOverflow;
      body.style.overflow = prev.bodyOverflow;
      body.style.overscrollBehavior = prev.overscroll;
    };
  }, []);

  if (playable.length === 0) {
    onDone([]);
    return null;
  }

  const current = playable[index];

  function handleResult(r: { correct: boolean; given?: string }) {
    if (feedback || !current) return;
    const explanation =
      "explanation" in current.exercise.data
        ? current.exercise.data.explanation
        : undefined;
    setFeedback({ correct: r.correct, explanation });
    setResults((prev) => [...prev, { exerciseId: current.id, correct: r.correct }]);
    const deviceId = getDeviceId();
    if (deviceId) {
      void logAttempt({
        deviceId,
        exerciseId: current.id,
        correct: r.correct,
        given: r.given,
      });
    }
  }

  function handleContinue() {
    setFeedback(null);
    setReady(false);
    if (index + 1 >= playable.length) {
      onDone(results);
    } else {
      setIndex((i) => i + 1);
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-4 pt-4">
        <button
          type="button"
          aria-label="Prüfung abbrechen"
          onClick={onQuit}
          className="flex min-h-12 min-w-12 cursor-pointer items-center justify-center rounded-2xl text-2xl font-bold text-ink/50 select-none"
        >
          <span aria-hidden>✕</span>
        </button>
        <div className="flex-1">
          <ProgressBar value={index} max={playable.length} />
        </div>
        <span className="text-sm font-bold text-ink/60">
          {index + 1}/{playable.length}
        </span>
      </div>

      <div className="flex items-start gap-3 px-4 pt-6">
        <h1 className="flex-1 text-xl font-bold text-ink">
          <PromptText text={current.exercise.data.prompt} />
        </h1>
        <TTSButton
          text={speakableText(current.exercise)}
          lang={current.exercise.data.tts_lang}
        />
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-6 pb-40">
        <ExerciseView
          key={index}
          exercise={current.exercise}
          onResult={handleResult}
          checkRequested={checkRequested}
          onReadyChange={setReady}
        />
      </div>

      {feedback === null && (
        <div className="fixed inset-x-0 bottom-0 z-40">
          <div className="mx-auto w-full max-w-md bg-white px-4 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <Button
              size="lg"
              full
              disabled={!ready}
              onClick={() => setCheckRequested((n) => n + 1)}
            >
              Prüfen
            </Button>
          </div>
        </div>
      )}

      {feedback !== null && (
        <FeedbackBanner
          state={feedback.correct ? "correct" : "wrong"}
          explanation={feedback.explanation}
          continueLabel={
            index + 1 >= playable.length ? "Ergebnis ansehen" : "Weiter"
          }
          onContinue={handleContinue}
        />
      )}
    </div>
  );
}
