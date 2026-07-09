"use client";

// Startseite: statt eines langen Lernpfads gibt es jetzt
// - "Für dich heute": max. 3 Tages-Vorschlaege (lib/suggestions.ts),
// - den Ueben-Button,
// - "Alle Themen" als 2-Spalten-Grid (Details unter /thema/[slug]).
// Laedt Pfad + Fortschritt + Lerntage + Versuchs-Statistik und reicht
// gepufferte Offline-Schreibvorgaenge nach (flushPendingWrites).
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/ui/AppHeader";
import { Mascot } from "@/components/ui/Mascot";
import { Button } from "@/components/ui/Button";
import {
  berlinToday,
  fetchAttemptStatsWithLessons,
  fetchDailyActivity,
  fetchPath,
  fetchProgress,
  flushPendingWrites,
} from "@/lib/data";
import { getDeviceId } from "@/lib/device";
import { computeStreak } from "@/lib/streak";
import {
  buildSuggestions,
  type Suggestion,
  type SuggestionKind,
} from "@/lib/suggestions";
import type { ProgressRow, TopicWithLessons } from "@/lib/types";

type StartData = {
  topics: TopicWithLessons[];
  progress: ProgressRow[];
  activity: { day: string; xp: number }[];
  attemptStats: Map<string, { correct: number; wrong: number }>;
  exerciseToLesson: Map<string, string>;
};

type LoadState =
  | { status: "loading" }
  | { status: "error" }
  | ({ status: "ready" } & StartData);

/** Laedt alle Daten fuer die Startseite (und reicht Offline-Writes nach). */
async function loadStartData(): Promise<StartData> {
  await flushPendingWrites();
  const deviceId = getDeviceId();
  const [topics, progress, activity, attempts] = await Promise.all([
    fetchPath(),
    fetchProgress(deviceId),
    fetchDailyActivity(deviceId),
    fetchAttemptStatsWithLessons(deviceId),
  ]);
  return {
    topics,
    progress,
    activity,
    attemptStats: attempts.stats,
    exerciseToLesson: attempts.exerciseToLesson,
  };
}

/** Ladezustand: pulsierende Platzhalter fuer Karten und Themen-Grid. */
function StartSkeleton() {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-6" aria-label="Lädt…">
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl bg-locked" />
        ))}
      </div>
      <div className="mt-8 grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-locked" />
        ))}
      </div>
    </div>
  );
}

// Akzent je Vorschlags-Art: freundlich, nie alarmierend (kein Rot).
const KIND_STYLES: Record<
  SuggestionKind,
  { emoji: string; card: string }
> = {
  wiederholen: { emoji: "🔁", card: "border-warning bg-warning-light" },
  neues: { emoji: "✨", card: "border-primary bg-primary-light" },
  weitermachen: { emoji: "🎯", card: "border-locked bg-white" },
};

/** Eine Vorschlags-Karte: ganze Flaeche tappbar, fuehrt zur Lektion. */
function SuggestionCard({ suggestion }: { suggestion: Suggestion }) {
  const style = KIND_STYLES[suggestion.kind];
  return (
    <Link
      href={`/lektion/${suggestion.lessonSlug}`}
      aria-label={`${suggestion.lessonTitle} – ${suggestion.grund}`}
      className={`flex min-h-16 w-full items-center gap-3 rounded-2xl border-2 border-b-4 p-3 select-none active:translate-y-0.5 active:border-b-2 ${style.card}`}
    >
      <span className="text-3xl" aria-hidden>
        {suggestion.topicIcon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col text-left">
        <span className="font-bold text-ink">{suggestion.lessonTitle}</span>
        <span className="text-sm text-ink/70">
          <span aria-hidden>{style.emoji} </span>
          {suggestion.grund}
        </span>
      </span>
      <span className="text-xl text-primary-dark" aria-hidden>
        ▶
      </span>
    </Link>
  );
}

/** Grosse Ueben-Karte: erscheint, wenn es keine Vorschlaege gibt. */
function BigPracticeCard() {
  return (
    <Link
      href="/ueben"
      aria-label="Üben – Gelerntes wiederholen"
      className="flex min-h-24 w-full items-center justify-center gap-3 rounded-2xl border-b-4 border-primary-dark bg-primary p-4 select-none active:translate-y-1 active:border-b-0"
    >
      <span className="text-4xl" aria-hidden>
        🔁
      </span>
      <span className="flex flex-col text-left text-white">
        <span className="text-lg font-bold">Üben</span>
        <span className="text-sm font-semibold opacity-90">
          Gelerntes wiederholen
        </span>
      </span>
    </Link>
  );
}

/** Themen-Karte im Grid: Icon, Titel, Fortschritt, Mini-Balken, ✓-Badge. */
function TopicCard({
  topic,
  completedCount,
}: {
  topic: TopicWithLessons;
  completedCount: number;
}) {
  const total = topic.lessons.length;
  const finished = total > 0 && completedCount >= total;
  const percent = total > 0 ? (completedCount / total) * 100 : 0;

  return (
    <Link
      href={`/thema/${topic.slug}`}
      aria-label={`${topic.title} – ${completedCount} von ${total} Lektionen geschafft`}
      className="relative flex min-h-32 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-b-4 border-locked bg-white p-3 text-center select-none active:translate-y-0.5 active:border-b-2"
    >
      {finished && (
        <span
          className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-sm font-bold text-white"
          aria-hidden
        >
          ✓
        </span>
      )}
      <span className="text-4xl" aria-hidden>
        {topic.icon}
      </span>
      <span className="text-sm leading-tight font-bold text-ink">
        {topic.title}
      </span>
      <span className="text-xs font-semibold text-ink/60">
        {completedCount}/{total}
      </span>
      <span
        className="h-2 w-full overflow-hidden rounded-full bg-locked"
        aria-hidden
      >
        <span
          className="block h-full rounded-full bg-primary"
          style={{ width: `${percent}%` }}
        />
      </span>
    </Link>
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
      <div className="flex min-h-svh flex-col">
        <AppHeader streak={0} xp={0} />
        <StartSkeleton />
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

  const completedLessonIds = new Set(
    state.progress.map((row) => row.lesson_id)
  );
  const suggestions = buildSuggestions({
    topics: state.topics,
    progress: state.progress,
    attemptStats: state.attemptStats,
    exerciseToLesson: state.exerciseToLesson,
    todaySeed: berlinToday(),
  });

  return (
    <div className="flex min-h-svh flex-col">
      <AppHeader streak={streak} xp={totalXp} />

      <div className="mx-auto w-full max-w-md px-4 pt-6 pb-8">
        <Mascot
          mood="happy"
          size={100}
          message="Hallo Amelie! Schön, dass du da bist."
        />

        {/* Tages-Vorschlaege: max. 3 Karten. Ohne Vorschlaege (alles fertig,
            keine Fehler) gibt es stattdessen die grosse Ueben-Karte. */}
        <section aria-label="Für dich heute" className="pt-6">
          <h2 className="mb-3 text-lg font-extrabold text-ink">
            Für dich heute <span aria-hidden>✨</span>
          </h2>
          {suggestions.length > 0 ? (
            <div className="flex flex-col gap-3">
              {suggestions.map((suggestion) => (
                <SuggestionCard
                  key={suggestion.lessonSlug}
                  suggestion={suggestion}
                />
              ))}
            </div>
          ) : (
            <BigPracticeCard />
          )}
        </section>

        {/* Ueben-Modus: erst sichtbar, wenn mind. 1 Lektion abgeschlossen ist.
            Entfaellt, wenn oben schon die grosse Ueben-Karte steht. */}
        {state.progress.length > 0 && suggestions.length > 0 && (
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

        {/* Alle Themen als Grid - jedes Thema ist frei waehlbar. */}
        <section aria-label="Alle Themen" className="pt-8">
          <h2 className="mb-3 text-lg font-extrabold text-ink">Alle Themen</h2>
          {state.topics.length === 0 ? (
            <p className="text-sm text-ink/60">
              Hier kommen bald neue Themen.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {state.topics.map((topic) => (
                <TopicCard
                  key={topic.id}
                  topic={topic}
                  completedCount={
                    topic.lessons.filter((lesson) =>
                      completedLessonIds.has(lesson.id)
                    ).length
                  }
                />
              ))}
            </div>
          )}
        </section>
      </div>

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
