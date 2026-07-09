"use client";

// Ueben-Modus /ueben: waehlt 8 Uebungen aus abgeschlossenen Lektionen
// (schwierige Uebungen bevorzugt, lib/practice.ts) und spielt sie im
// LessonPlayer im practice-Modus ab: 5 XP pro Uebung, keine Sterne,
// kein Lektions-Ergebnis, aber Streak zaehlt. Leerzustand, wenn noch
// keine Lektion abgeschlossen ist.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Mascot } from "@/components/ui/Mascot";
import { LessonPlayer } from "@/components/player/LessonPlayer";
import {
  fetchAttemptStats,
  fetchExercisesForLessons,
  fetchProgress,
} from "@/lib/data";
import { getDeviceId } from "@/lib/device";
import {
  selectPracticeExercises,
  type PracticeExercise,
} from "@/lib/practice";

type LoadState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "empty" }
  | { status: "ready"; exercises: PracticeExercise[] };

export default function UebenPage() {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const deviceId = getDeviceId();
        const progress = await fetchProgress(deviceId);
        const completedLessonIds = progress.map((row) => row.lesson_id);
        if (completedLessonIds.length === 0) {
          if (!cancelled) setState({ status: "empty" });
          return;
        }

        const [exerciseRows, attemptStats] = await Promise.all([
          fetchExercisesForLessons(completedLessonIds),
          fetchAttemptStats(deviceId),
        ]);
        const selection = selectPracticeExercises({
          exercises: exerciseRows.map((row) => ({
            id: row.id,
            lessonId: row.lesson_id,
            type: row.type,
            data: row.data,
          })),
          completedLessonIds,
          attemptStats,
        });

        if (cancelled) return;
        if (selection.length === 0) setState({ status: "empty" });
        else setState({ status: "ready", exercises: selection });
      } catch {
        if (!cancelled) setState({ status: "error" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  if (state.status === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <p className="animate-pulse text-lg font-semibold text-ink/60">
          Einen Moment bitte …
        </p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4">
        <Mascot
          mood="neutral"
          message="Gerade klappt es nicht. Versuch es später nochmal."
        />
        <Button
          size="lg"
          full
          onClick={() => {
            setState({ status: "loading" });
            setReloadKey((key) => key + 1);
          }}
        >
          Nochmal versuchen
        </Button>
      </div>
    );
  }

  if (state.status === "empty") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4">
        <Mascot
          mood="neutral"
          message="Schließe zuerst eine Lektion ab. Dann kannst du hier üben."
        />
        <Button size="lg" full onClick={() => router.push("/")}>
          Zur Startseite
        </Button>
      </div>
    );
  }

  return <LessonPlayer mode="practice" exercisesOverride={state.exercises} />;
}
