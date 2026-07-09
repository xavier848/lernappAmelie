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
  fetchActivityDays,
  fetchPath,
  fetchProgress,
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
      activityDays: string[];
    };

/** Laedt alle Daten fuer die Profil-Seite. */
async function loadProfileData(): Promise<{
  topics: TopicWithLessons[];
  progress: ProgressRow[];
  activityDays: string[];
}> {
  const topics = await fetchPath();
  const deviceId = getDeviceId();
  const [progress, activityDays] = await Promise.all([
    fetchProgress(deviceId),
    fetchActivityDays(deviceId),
  ]);
  return { topics, progress, activityDays };
}

export default function ProfilPage() {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

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
      <div className="flex min-h-dvh flex-col">
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
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 py-10">
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

  const totalXp = state.progress.reduce((sum, row) => sum + row.xp, 0);
  const streak = computeStreak(state.activityDays, berlinToday());
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
    <div className="flex min-h-dvh flex-col">
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
            <StreakCalendar activityDays={state.activityDays} />
          </Card>
        </section>

        <section aria-label="Meine Abzeichen">
          <h2 className="mb-3 text-lg font-extrabold text-ink">
            Meine Abzeichen 🏅
          </h2>
          <BadgeGrid earnedIds={earnedIds} />
        </section>
      </div>
    </div>
  );
}
