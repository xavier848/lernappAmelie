"use client";

// Startseite (Spec §4.1): Sticky-Header (Streak, XP, Level),
// Maskottchen-Begruessung und der Lernpfad mit allen Themen.
// Laedt Pfad + Fortschritt + Lerntage und reicht gepufferte
// Offline-Schreibvorgaenge nach (flushPendingWrites).
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/ui/AppHeader";
import { Mascot } from "@/components/ui/Mascot";
import { Button } from "@/components/ui/Button";
import { LearningPath } from "@/components/path/LearningPath";
import {
  berlinToday,
  fetchDailyActivity,
  fetchPath,
  fetchProgress,
  flushPendingWrites,
} from "@/lib/data";
import { getDeviceId } from "@/lib/device";
import { computeStreak } from "@/lib/streak";
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

/** Laedt alle Daten fuer die Startseite (und reicht Offline-Writes nach). */
async function loadStartData(): Promise<{
  topics: TopicWithLessons[];
  progress: ProgressRow[];
  activity: { day: string; xp: number }[];
}> {
  await flushPendingWrites();
  const deviceId = getDeviceId();
  const [topics, progress, activity] = await Promise.all([
    fetchPath(),
    fetchProgress(deviceId),
    fetchDailyActivity(deviceId),
  ]);
  return { topics, progress, activity };
}

/** Ladezustand: einfache pulsierende Kreise als Platzhalter fuer den Pfad. */
function PathSkeleton() {
  return (
    <div
      className="flex flex-col items-center gap-6 px-4 py-10"
      aria-label="Lädt…"
    >
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={`h-[72px] w-[72px] animate-pulse rounded-full bg-locked ${
            i % 2 === 0 ? "mr-16" : "ml-16"
          }`}
        />
      ))}
    </div>
  );
}

export default function StartPage() {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await loadStartData();
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
        <PathSkeleton />
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

  // XP-Quelle: daily_activity (zaehlt auch Ueben-Runden und Wiederholungen).
  const totalXp = state.activity.reduce((sum, row) => sum + row.xp, 0);
  const streak = computeStreak(state.activity.map((row) => row.day), berlinToday());

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader streak={streak} xp={totalXp} />

      <div className="px-4 pt-6 pb-8">
        <Mascot mood="happy" message="Hallo Amelie! Schön, dass du da bist." />

        {/* Ueben-Modus: erst sichtbar, wenn mind. 1 Lektion abgeschlossen ist. */}
        {state.progress.length > 0 && (
          <div className="pt-6">
            <Button
              variant="secondary"
              size="lg"
              full
              onClick={() => router.push("/ueben")}
            >
              <span aria-hidden>🔁</span>
              <span className="flex flex-col items-start text-left leading-tight">
                <span>Üben</span>
                <span className="text-sm font-semibold opacity-70">
                  Gelerntes wiederholen
                </span>
              </span>
            </Button>
          </div>
        )}
      </div>

      <LearningPath topics={state.topics} progress={state.progress} />

      <footer className="mt-auto flex flex-col items-center gap-1 px-4 pt-4 pb-10">
        <Link
          href="/profil"
          className="flex min-h-12 items-center gap-2 rounded-2xl px-4 text-base font-bold text-primary-dark"
        >
          Mein Profil 🏅
        </Link>
        <Link
          href="/credits"
          className="flex min-h-12 items-center px-4 text-sm text-ink/60"
        >
          Danke &amp; Lizenzen
        </Link>
      </footer>
    </div>
  );
}
