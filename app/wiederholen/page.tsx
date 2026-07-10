"use client";

// Wiederholen-Menü (Xaviers Wunsch vom 2026-07-10): ein Ort, an dem Amelie
// gezielt die Sachen nochmal üben kann, die ihr schwergefallen sind.
// Oben: „Gemischt üben" (schlaue Mischung, /ueben). Darunter: Lektionen mit
// den meisten Fehlern zuletzt – direkt antippbar.
import { useEffect, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/ui/AppHeader";
import { Card } from "@/components/ui/Card";
import { Mascot } from "@/components/ui/Mascot";
import { Button } from "@/components/ui/Button";
import {
  berlinToday,
  fetchAttemptStatsWithLessons,
  fetchDailyActivity,
  fetchPath,
} from "@/lib/data";
import { getDeviceId } from "@/lib/device";
import { computeStreak } from "@/lib/streak";
import type { TopicWithLessons } from "@/lib/types";

type WeakLesson = {
  slug: string;
  title: string;
  topicIcon: string;
  topicTitle: string;
  wrong: number;
};

type LoadState =
  | { status: "loading" }
  | { status: "error" }
  | {
      status: "ready";
      weakLessons: WeakLesson[];
      streak: number;
      xp: number;
    };

/** Fehler pro Lektion aus den Übungs-Versuchen aggregieren (pure). */
export function weakLessonsFrom(
  topics: TopicWithLessons[],
  stats: Map<string, { correct: number; wrong: number }>,
  exerciseToLesson: Map<string, string>
): WeakLesson[] {
  const wrongByLesson = new Map<string, number>();
  for (const [exerciseId, stat] of stats) {
    if (stat.wrong === 0) continue;
    const lessonId = exerciseToLesson.get(exerciseId);
    if (!lessonId) continue;
    wrongByLesson.set(lessonId, (wrongByLesson.get(lessonId) ?? 0) + stat.wrong);
  }

  const result: WeakLesson[] = [];
  for (const topic of topics) {
    for (const lesson of topic.lessons) {
      const wrong = wrongByLesson.get(lesson.id);
      if (!wrong) continue;
      result.push({
        slug: lesson.slug,
        title: lesson.title,
        topicIcon: topic.icon,
        topicTitle: topic.title,
        wrong,
      });
    }
  }
  return result.sort((a, b) => b.wrong - a.wrong).slice(0, 8);
}

async function loadData(): Promise<{
  weakLessons: WeakLesson[];
  streak: number;
  xp: number;
}> {
  const deviceId = getDeviceId();
  const [topics, attempts, activity] = await Promise.all([
    fetchPath(),
    fetchAttemptStatsWithLessons(deviceId),
    fetchDailyActivity(deviceId),
  ]);
  return {
    weakLessons: weakLessonsFrom(
      topics,
      attempts.stats,
      attempts.exerciseToLesson
    ),
    streak: computeStreak(
      activity.map((row) => row.day),
      berlinToday()
    ),
    xp: activity.reduce((sum, row) => sum + row.xp, 0),
  };
}

export default function WiederholenPage() {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await loadData();
        if (!cancelled) setState({ status: "ready", ...data });
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
      <div className="flex min-h-svh flex-col">
        <AppHeader streak={0} xp={0} />
        <div className="flex flex-col gap-4 px-4 py-8" aria-label="Lädt…">
          <div className="h-20 animate-pulse rounded-2xl bg-locked" />
          <div className="h-16 animate-pulse rounded-2xl bg-locked" />
          <div className="h-16 animate-pulse rounded-2xl bg-locked" />
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-4 py-10">
        <Mascot
          mood="neutral"
          message="Gerade klappt es nicht. Versuch es später nochmal."
        />
        <Button
          size="lg"
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

  return (
    <div className="flex min-h-svh flex-col">
      <AppHeader streak={state.streak} xp={state.xp} />

      <div className="flex flex-col gap-6 px-4 py-6">
        <Link
          href="/"
          className="flex min-h-12 w-fit items-center gap-2 rounded-2xl font-bold text-primary-dark"
        >
          ← Zurück
        </Link>

        <h1 className="text-2xl font-extrabold text-ink">Nochmal üben 💪</h1>

        <Link
          href="/ueben"
          className="flex min-h-16 w-full items-center gap-3 rounded-2xl border-2 border-b-4 border-primary bg-primary-light p-4 transition-transform select-none active:translate-y-1 active:border-b-2"
        >
          <span aria-hidden className="text-3xl">
            🔁
          </span>
          <span className="flex-1">
            <span className="block text-lg font-bold text-ink">
              Gemischt üben
            </span>
            <span className="block text-sm text-ink/70">
              Eine schlaue Mischung aus allem, was du schon kennst.
            </span>
          </span>
          <span aria-hidden className="text-primary-dark">
            ▶
          </span>
        </Link>

        {state.weakLessons.length > 0 ? (
          <section aria-label="Das üben wir nochmal">
            <h2 className="mb-3 text-lg font-extrabold text-ink">
              Das ist dir zuletzt schwergefallen
            </h2>
            <div className="flex flex-col gap-2.5">
              {state.weakLessons.map((lesson) => (
                <Link
                  key={lesson.slug}
                  href={`/lektion/${lesson.slug}`}
                  className="flex min-h-16 w-full items-center gap-3 rounded-2xl border-2 border-b-4 border-warning bg-warning-light p-3 transition-transform select-none active:translate-y-1 active:border-b-2"
                >
                  <span aria-hidden className="text-2xl">
                    {lesson.topicIcon}
                  </span>
                  <span className="flex-1">
                    <span className="block font-bold text-ink">
                      {lesson.title}
                    </span>
                    <span className="block text-sm text-ink/70">
                      {lesson.topicTitle} ·{" "}
                      {lesson.wrong === 1
                        ? "1 Fehler zuletzt"
                        : `${lesson.wrong} Fehler zuletzt`}
                    </span>
                  </span>
                  <span aria-hidden className="text-warning-dark">
                    ▶
                  </span>
                </Link>
              ))}
            </div>
            <p className="mt-3 text-sm text-ink/60">
              Fehler sind zum Lernen da. Jede Runde macht dich besser! 💚
            </p>
          </section>
        ) : (
          <Card className="flex flex-col items-center gap-4 py-8 text-center">
            <Mascot
              mood="happy"
              size={110}
              message="Nichts zu wiederholen. Stark!"
            />
            <p className="text-sm text-ink/70">
              Wenn dir mal etwas schwerfällt, findest du es hier wieder.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
