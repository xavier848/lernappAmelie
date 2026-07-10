"use client";

// Profil-Seite (Spec §4.4): Level-Karte mit XP-Balken,
// Streak-Kalender (aktueller Monat) und Abzeichen-Galerie.
import { useEffect, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/ui/AppHeader";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Mascot } from "@/components/ui/Mascot";
import { Button } from "@/components/ui/Button";
import { StreakCalendar } from "@/components/profile/StreakCalendar";
import { BadgeGrid } from "@/components/profile/BadgeGrid";
import {
  berlinToday,
  fetchDailyActivity,
  fetchPath,
  fetchProgress,
  resetDeviceData,
} from "@/lib/data";
import { getDeviceId } from "@/lib/device";
import { computeStreak } from "@/lib/streak";
import { levelForXp } from "@/lib/scoring";
import { earnedBadges } from "@/lib/badges";
import type { ProgressRow, TopicWithLessons } from "@/lib/types";

type LoadState =
  | { status: "loading" }
  | { status: "error" }
  | {
      status: "ready";
      topics: TopicWithLessons[];
      progress: ProgressRow[];
      activity: { day: string; xp: number }[];
    };

/** Laedt alle Daten fuer die Profil-Seite. */
async function loadProfileData(): Promise<{
  topics: TopicWithLessons[];
  progress: ProgressRow[];
  activity: { day: string; xp: number }[];
}> {
  const topics = await fetchPath();
  const deviceId = getDeviceId();
  const [progress, activity] = await Promise.all([
    fetchProgress(deviceId),
    fetchDailyActivity(deviceId),
  ]);
  return { topics, progress, activity };
}

export default function ProfilPage() {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [showReset, setShowReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await loadProfileData();
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
          <div className="h-28 animate-pulse rounded-2xl bg-locked" />
          <div className="h-64 animate-pulse rounded-2xl bg-locked" />
          <div className="h-40 animate-pulse rounded-2xl bg-locked" />
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
          onClick={() => {
            setState({ status: "loading" });
            setReloadKey((key) => key + 1);
          }}
          size="lg"
        >
          Nochmal versuchen
        </Button>
      </div>
    );
  }

  // XP-Quelle: daily_activity (zaehlt auch Ueben-Runden und Wiederholungen).
  const totalXp = state.activity.reduce((sum, row) => sum + row.xp, 0);
  const streak = computeStreak(state.activity.map((row) => row.day), berlinToday());
  const { level, currentXp, nextLevelXp } = levelForXp(totalXp);

  // Abzeichen-Grundlage: abgeschlossene Lektionen + komplett geschaffte Themen.
  const completedLessonIds = new Set(state.progress.map((p) => p.lesson_id));
  const completedLessonSlugs = state.topics.flatMap((topic) =>
    topic.lessons
      .filter((lesson) => completedLessonIds.has(lesson.id))
      .map((lesson) => lesson.slug)
  );
  const topicsCompleted = state.topics
    .filter(
      (topic) =>
        topic.lessons.length > 0 &&
        topic.lessons.every((lesson) => completedLessonIds.has(lesson.id))
    )
    .map((topic) => topic.slug);

  const earnedIds = earnedBadges({
    completedLessonSlugs,
    topicsCompleted,
    streak,
    totalXp,
  });

  return (
    <div className="flex min-h-svh flex-col">
      <AppHeader streak={streak} xp={totalXp} />

      <div className="flex flex-col gap-6 px-4 py-6">
        <Link
          href="/"
          className="flex min-h-12 w-fit items-center gap-2 rounded-2xl font-bold text-primary-dark"
        >
          ← Zurück zum Lernpfad
        </Link>

        <h1 className="text-2xl font-extrabold text-ink">Mein Profil</h1>

        <Card>
          <p className="text-3xl font-extrabold text-ink">Level {level}</p>
          <div className="mt-3">
            <ProgressBar value={currentXp} max={nextLevelXp} />
          </div>
          <p className="mt-2 text-sm text-ink/80">
            {currentXp} von {nextLevelXp} Punkten bis Level {level + 1}.
          </p>
        </Card>

        <section aria-label="Meine Lerntage">
          <h2 className="mb-3 text-lg font-extrabold text-ink">
            Meine Lerntage 🔥
          </h2>
          <Card>
            <StreakCalendar activityDays={state.activity.map((row) => row.day)} />
          </Card>
        </section>

        <section aria-label="Meine Abzeichen">
          <h2 className="mb-3 text-lg font-extrabold text-ink">
            Meine Abzeichen 🏅
          </h2>
          <BadgeGrid earnedIds={earnedIds} />
        </section>

        {/* Kompletter Neustart - bewusst dezent ganz unten (Xavier, 2026-07-10). */}
        <section aria-label="Neustart" className="pt-4 pb-2">
          <button
            type="button"
            onClick={() => setShowReset(true)}
            className="mx-auto flex min-h-12 cursor-pointer items-center gap-2 rounded-2xl px-4 text-sm font-semibold text-ink/50 select-none"
          >
            🗑️ Alles auf null setzen
          </button>
        </section>
      </div>

      {showReset && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Wirklich alles löschen?"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-6"
        >
          <Card className="w-full max-w-sm p-5">
            <p className="text-lg font-extrabold text-ink">
              Wirklich alles löschen? 🗑️
            </p>
            <p className="mt-2 text-base text-ink">
              Dein ganzer Fortschritt, deine Punkte, dein Streak und deine
              Abzeichen werden gelöscht. Das kann man nicht rückgängig machen.
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              <Button size="lg" full onClick={() => setShowReset(false)}>
                Nein, alles behalten
              </Button>
              <Button
                variant="warning"
                size="lg"
                full
                disabled={resetting}
                onClick={async () => {
                  setResetting(true);
                  try {
                    await resetDeviceData(getDeviceId());
                    window.location.href = "/";
                  } catch {
                    setResetting(false);
                  }
                }}
              >
                {resetting ? "Wird gelöscht …" : "Ja, alles löschen"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
