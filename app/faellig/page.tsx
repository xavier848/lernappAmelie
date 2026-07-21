"use client";

// Fällige Wiederholung /faellig: Spaced Repetition. Zeigt genau die Übungen,
// die laut lib/spaced.ts heute wieder "dran" sind (nach wachsenden Abständen).
// Spielt sie im Üben-Modus (LessonPlayer practice) ab.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Mascot } from "@/components/ui/Mascot";
import { LessonPlayer } from "@/components/player/LessonPlayer";
import {
  berlinToday,
  fetchAttemptsRaw,
  fetchExercisesByIds,
} from "@/lib/data";
import { getDeviceId } from "@/lib/device";
import { buildDueList } from "@/lib/spaced";
import type { PracticeExercise } from "@/lib/practice";

/** Höchstens so viele fällige Übungen pro Runde (nicht überfordern). */
const MAX_DUE = 12;

type LoadState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "empty" }
  | { status: "ready"; exercises: PracticeExercise[] };

export default function FaelligPage() {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const deviceId = getDeviceId();
        const attempts = await fetchAttemptsRaw(deviceId);
        const due = buildDueList(attempts, berlinToday()).slice(0, MAX_DUE);
        if (due.length === 0) {
          if (!cancelled) setState({ status: "empty" });
          return;
        }
        const rows = await fetchExercisesByIds(due.map((d) => d.exerciseId));
        // Reihenfolge: am meisten überfällig zuerst (wie in `due`).
        const byId = new Map(rows.map((r) => [r.id, r]));
        const exercises: PracticeExercise[] = due
          .map((d) => byId.get(d.exerciseId))
          .filter((r): r is NonNullable<typeof r> => Boolean(r))
          .map((r) => ({
            id: r.id,
            lessonId: r.lesson_id,
            type: r.type,
            data: r.data,
          }));
        if (cancelled) return;
        if (exercises.length === 0) setState({ status: "empty" });
        else setState({ status: "ready", exercises });
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
      <div className="flex h-full items-center justify-center px-4">
        <p className="animate-pulse text-lg font-semibold text-ink/60">
          Einen Moment bitte …
        </p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-8 px-4">
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
      <div className="flex h-full flex-col items-center justify-center gap-8 px-4">
        <Mascot
          mood="happy"
          message="Super – gerade ist nichts zum Wiederholen fällig! Komm später wieder."
        />
        <Button size="lg" full onClick={() => router.push("/")}>
          Zur Startseite
        </Button>
      </div>
    );
  }

  return <LessonPlayer mode="practice" exercisesOverride={state.exercises} />;
}
