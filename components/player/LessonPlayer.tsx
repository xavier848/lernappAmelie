"use client";

// Lektions-Player (Spec §4.2, Plan Task 9): eine Uebung pro Screen.
// Oben X-Button (mit Bestaetigung) + Fortschrittsbalken, Mitte Prompt mit
// Vorlese-Button + Uebungskomponente, unten fixer „Pruefen"-Button.
// Falsche Uebungen wandern ans Ende der Queue (components/player/queue.ts);
// am Ende XP/Sterne berechnen, speichern und den Ergebnis-Screen zeigen.
// Ueben-Modus (mode="practice" + exercisesOverride, Route /ueben): gleiche
// Mechanik inkl. Wiederholungs-Queue und logAttempt, aber 5 XP pro Uebung,
// kein Lektions-Bonus, keine Sterne, kein saveLessonResult - nur
// bumpDailyActivity (Streak zaehlt).
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { exerciseSchema, type ExerciseInput } from "@/lib/content-schema";
import {
  bumpDailyActivity,
  fetchLesson,
  logAttempt,
  saveLessonResult,
} from "@/lib/data";
import { getDeviceId } from "@/lib/device";
import {
  LESSON_BONUS_XP,
  PRACTICE_XP_PER_EXERCISE,
  starsForLesson,
  xpForExercise,
} from "@/lib/scoring";
import { Button } from "@/components/ui/Button";
import { FeedbackBanner } from "@/components/ui/FeedbackBanner";
import { Mascot } from "@/components/ui/Mascot";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { TTSButton } from "@/components/ui/TTSButton";
import { StepsOrder } from "@/components/exercises/StepsOrder";
import { MultipleChoice } from "@/components/exercises/MultipleChoice";
import { MatchPairs } from "@/components/exercises/MatchPairs";
import { SortBuckets } from "@/components/exercises/SortBuckets";
import { MoneyCount } from "@/components/exercises/MoneyCount";
import { Budget } from "@/components/exercises/Budget";
import {
  advanceQueue,
  createQueue,
  currentExerciseIndex,
  retriedExerciseCount,
  type QueueState,
} from "./queue";
import { ResultScreen } from "./ResultScreen";

type PlayableExercise = { id: string; exercise: ExerciseInput };

type Phase = "loading" | "error" | "playing" | "finished";

type Feedback = { correct: boolean; explanation?: string };

/** Rendert die passende Uebungskomponente nach exercise.type. */
function ExerciseView({
  exercise,
  onResult,
  checkRequested,
  onReadyChange,
}: {
  exercise: ExerciseInput;
  onResult: (r: { correct: boolean }) => void;
  checkRequested: number;
  onReadyChange: (ready: boolean) => void;
}) {
  const common = { onResult, checkRequested, onReadyChange };
  switch (exercise.type) {
    case "steps_order":
      return <StepsOrder data={exercise.data} {...common} />;
    case "multiple_choice":
      return <MultipleChoice data={exercise.data} {...common} />;
    case "match_pairs":
      return <MatchPairs data={exercise.data} {...common} />;
    case "sort_buckets":
      return <SortBuckets data={exercise.data} {...common} />;
    case "money_count":
      return <MoneyCount data={exercise.data} {...common} />;
    case "budget":
      return <Budget data={exercise.data} {...common} />;
  }
}

/** Rohe Uebungs-Zeilen (z. B. aus der DB) fuer exercisesOverride. */
export type ExerciseRowLike = { id: string; type: string; data: unknown };

export type LessonPlayerProps = {
  /** Lektions-Slug (Standard-Modus). Im Ueben-Modus nicht noetig. */
  slug?: string;
  /** "practice" = Ueben-Modus (keine Sterne, 5 XP/Uebung, kein Speichern). */
  mode?: "lesson" | "practice";
  /** Uebungen direkt uebergeben statt per slug zu laden (Ueben-Modus). */
  exercisesOverride?: ExerciseRowLike[];
};

/** Validiert rohe Uebungs-Zeilen; ungueltige werden uebersprungen. */
function parseExerciseRows(rows: ExerciseRowLike[]): PlayableExercise[] {
  const playable: PlayableExercise[] = [];
  for (const row of rows) {
    try {
      const parsed = exerciseSchema.parse({ type: row.type, data: row.data });
      playable.push({ id: row.id, exercise: parsed });
    } catch (error) {
      console.warn(`Übung ${row.id} übersprungen (ungültige Daten):`, error);
    }
  }
  return playable;
}

export function LessonPlayer({
  slug,
  mode = "lesson",
  exercisesOverride,
}: LessonPlayerProps) {
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("loading");
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [exercises, setExercises] = useState<PlayableExercise[]>([]);
  const [queueState, setQueueState] = useState<QueueState>(() =>
    createQueue([])
  );
  const [checkRequested, setCheckRequested] = useState(0);
  const [ready, setReady] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [showQuitDialog, setShowQuitDialog] = useState(false);
  const [result, setResult] = useState<{ xp: number; stars: 1 | 2 | 3 }>({
    xp: 0,
    stars: 1,
  });

  const load = useCallback(async () => {
    setPhase("loading");
    setFeedback(null);
    setReady(false);
    setCheckRequested(0);
    try {
      // Ueben-Modus: Uebungen kommen fertig geladen von aussen.
      if (exercisesOverride) {
        const playable = parseExerciseRows(exercisesOverride);
        if (playable.length === 0) {
          setPhase("error");
          return;
        }
        setLessonId(null);
        setExercises(playable);
        setQueueState(createQueue(playable));
        setPhase("playing");
        return;
      }

      if (!slug) {
        setPhase("error");
        return;
      }
      const data = await fetchLesson(slug);
      if (!data) {
        setPhase("error");
        return;
      }
      const playable = parseExerciseRows(data.exercises);
      if (playable.length === 0) {
        setPhase("error");
        return;
      }
      setLessonId(data.lesson.id);
      setExercises(playable);
      setQueueState(createQueue(playable));
      setPhase("playing");
    } catch (error) {
      console.warn("Lektion konnte nicht geladen werden:", error);
      setPhase("error");
    }
  }, [slug, exercisesOverride]);

  useEffect(() => {
    void load();
  }, [load]);

  const currentIndex = currentExerciseIndex(queueState);
  const current = currentIndex !== null ? exercises[currentIndex] : null;

  function handleResult(r: { correct: boolean }) {
    if (feedback || !current) return;
    const explanation =
      "explanation" in current.exercise.data
        ? current.exercise.data.explanation
        : undefined;
    setFeedback({ correct: r.correct, explanation });
    // Statistik fire-and-forget – Fehler schluckt lib/data.
    const deviceId = getDeviceId();
    if (deviceId) {
      void logAttempt({
        deviceId,
        exerciseId: current.id,
        correct: r.correct,
      });
    }
  }

  function finishLesson(finalState: QueueState) {
    // Ueben-Modus: 5 XP pro (am Ende immer richtig geloester) Uebung,
    // kein Lektions-Bonus, keine Sterne, kein Lektions-Ergebnis –
    // aber Tages-Aktivitaet zaehlt (Streak!).
    if (mode === "practice") {
      const xp = finalState.total * PRACTICE_XP_PER_EXERCISE;
      setResult({ xp, stars: 1 });
      setPhase("finished");
      try {
        const deviceId = getDeviceId();
        if (deviceId) {
          void bumpDailyActivity(deviceId, xp);
        }
      } catch {
        // bewusst still – Ergebnis-Screen zeigen wir trotzdem
      }
      return;
    }

    const xp =
      finalState.firstTry.reduce(
        (sum, firstTry) => sum + xpForExercise(firstTry),
        0
      ) + LESSON_BONUS_XP;
    const stars = starsForLesson(
      finalState.total,
      retriedExerciseCount(finalState)
    );
    setResult({ xp, stars });
    setPhase("finished");

    // Speichern – bei Netzfehlern uebernimmt die Offline-Queue in lib/data.
    try {
      const deviceId = getDeviceId();
      if (deviceId && lessonId) {
        void saveLessonResult({ deviceId, lessonId, stars, xp });
        void bumpDailyActivity(deviceId, xp);
      }
    } catch {
      // bewusst still – Ergebnis-Screen zeigen wir trotzdem
    }
  }

  function handleContinue() {
    if (!feedback) return;
    const { state: nextState, done } = advanceQueue(
      queueState,
      feedback.correct
    );
    setFeedback(null);
    setReady(false);
    setQueueState(nextState);
    if (done) {
      finishLesson(nextState);
    }
  }

  if (phase === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <p className="animate-pulse text-lg font-semibold text-ink/60">
          Einen Moment bitte …
        </p>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4">
        <Mascot
          mood="neutral"
          message="Gerade klappt es nicht. Versuch es später nochmal."
        />
        <Button size="lg" full onClick={() => void load()}>
          Nochmal versuchen
        </Button>
      </div>
    );
  }

  if (phase === "finished") {
    if (mode === "practice") {
      return (
        <ResultScreen
          xp={result.xp}
          message="Fleißig geübt, Amelie!"
          buttonLabel="Fertig"
          onContinue={() => router.push("/")}
        />
      );
    }
    return (
      <ResultScreen
        xp={result.xp}
        stars={result.stars}
        onContinue={() => router.push("/")}
      />
    );
  }

  if (!current || currentIndex === null) return null;

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Kopf: X-Button + Fortschritt */}
      <div className="flex items-center gap-3 px-4 pt-4">
        <button
          type="button"
          aria-label={mode === "practice" ? "Üben beenden" : "Lektion beenden"}
          onClick={() => setShowQuitDialog(true)}
          className="flex min-h-12 min-w-12 cursor-pointer items-center justify-center rounded-2xl text-2xl font-bold text-ink/50 select-none"
        >
          <span aria-hidden>✕</span>
        </button>
        <div className="flex-1">
          <ProgressBar value={queueState.solvedCount} max={queueState.total} />
        </div>
      </div>

      {/* Prompt + Vorlesen */}
      <div className="flex items-start gap-3 px-4 pt-6">
        <h1 className="flex-1 text-xl font-bold text-ink">
          {current.exercise.data.prompt}
        </h1>
        <TTSButton
          text={current.exercise.data.prompt}
          lang={current.exercise.data.tts_lang}
        />
      </div>

      {/* Uebung – key erzwingt Remount bei Wiederholung derselben Uebung */}
      <div className="flex-1 px-4 pt-6 pb-40">
        <ExerciseView
          key={`${currentIndex}-${queueState.retried[currentIndex]}`}
          exercise={current.exercise}
          onResult={handleResult}
          checkRequested={checkRequested}
          onReadyChange={setReady}
        />
      </div>

      {/* Unten: fixer Pruefen-Button (verdeckt vom FeedbackBanner waehrend Feedback) */}
      {feedback === null && (
        <div className="fixed inset-x-0 bottom-0 z-40">
          <div className="mx-auto w-full max-w-md bg-white/95 px-4 pt-3 pb-6">
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
          onContinue={handleContinue}
        />
      )}

      {/* Bestaetigungs-Overlay fuer den X-Button */}
      {showQuitDialog && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={mode === "practice" ? "Üben beenden?" : "Lektion beenden?"}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-6"
        >
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-lg">
            <p className="text-xl font-bold text-ink">
              Willst du wirklich aufhören?
            </p>
            <p className="mt-2 text-base text-ink">
              {mode === "practice"
                ? "Dein Fortschritt beim Üben geht dann verloren."
                : "Dein Fortschritt in dieser Lektion geht dann verloren."}
            </p>
            <div className="mt-5 flex flex-col gap-3">
              <Button size="lg" full onClick={() => setShowQuitDialog(false)}>
                Weiter lernen
              </Button>
              <Button
                size="lg"
                full
                variant="secondary"
                onClick={() => router.push("/")}
              >
                Beenden
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
