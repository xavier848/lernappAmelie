"use client";

// Startseite: statt eines langen Lernpfads gibt es jetzt
// - "Für dich heute": max. 3 Tages-Vorschlaege (lib/suggestions.ts),
// - den Ueben-Button,
// - "Alle Themen" als 2-Spalten-Grid (Details unter /thema/[slug]).
// Laedt Pfad + Fortschritt + Lerntage + Versuchs-Statistik und reicht
// gepufferte Offline-Schreibvorgaenge nach (flushPendingWrites).
import { useEffect, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/ui/AppHeader";
import { Mascot } from "@/components/ui/Mascot";
import { MamaStatsLink } from "@/components/ui/MamaStatsLink";
import { Button } from "@/components/ui/Button";
import {
  berlinDateOf,
  berlinToday,
  fetchAttemptStatsWithLessons,
  fetchDailyActivity,
  fetchFeeds,
  fetchPath,
  fetchProgress,
  flushPendingWrites,
} from "@/lib/data";
import { buildDueList } from "@/lib/spaced";
import { getDeviceId } from "@/lib/device";
import { computeStreak } from "@/lib/streak";
import {
  buildSuggestions,
  type Suggestion,
  type SuggestionKind,
} from "@/lib/suggestions";
import type { ProgressRow, TopicWithLessons } from "@/lib/types";
import { groupTopicsByCategory } from "@/lib/categories";
import { CategoryCard } from "@/components/path/CategoryCard";
import { PonyMeadow } from "@/components/ui/PonyMeadow";

type StartData = {
  topics: TopicWithLessons[];
  progress: ProgressRow[];
  activity: { day: string; xp: number }[];
  attemptStats: Map<string, { correct: number; wrong: number }>;
  exerciseToLesson: Map<string, string>;
  feeds: ("karotte" | "heu" | "apfel")[];
  dueCount: number;
};

type LoadState =
  | { status: "loading" }
  | { status: "error" }
  | ({ status: "ready" } & StartData);

/** Laedt alle Daten fuer die Startseite (und reicht Offline-Writes nach). */
async function loadStartData(): Promise<StartData> {
  // Nachreichen gepufferter Schreibvorgaenge NICHT abwarten: supabase-js
  // kennt kein Zeitlimit, bei wackligem Funk haengt die Startseite sonst im
  // Ladezustand, bevor ueberhaupt eine Leseabfrage gestartet wurde. Das
  // Nachreichen laeuft nebenher (siehe useEffect weiter unten).
  const deviceId = getDeviceId();
  const [topics, progress, activity, attempts, feeds] = await Promise.all([
    fetchPath(),
    fetchProgress(deviceId),
    fetchDailyActivity(deviceId),
    fetchAttemptStatsWithLessons(deviceId),
    fetchFeeds(deviceId, berlinToday()),
  ]);
  return {
    topics,
    progress,
    activity,
    attemptStats: attempts.stats,
    exerciseToLesson: attempts.exerciseToLesson,
    feeds,
    // Aus denselben Zeilen berechnet – frueher war das eine zweite,
    // inhaltlich identische Abfrage derselben Tabelle.
    dueCount: buildDueList(attempts.attempts, berlinToday()).length,
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
// label = KURZE Zeile auf der Karte (der lange Grund machte die Startseite
// zu voll); der volle Grund bleibt im aria-label fuer Screenreader.
const KIND_STYLES: Record<
  SuggestionKind,
  { emoji: string; label: string; card: string }
> = {
  wiederholen: {
    emoji: "🔁",
    label: "Nochmal üben",
    card: "border-warning bg-warning-light",
  },
  neues: {
    emoji: "✨",
    label: "Etwas Neues",
    card: "border-primary bg-primary-light",
  },
  weitermachen: {
    emoji: "🎯",
    label: "Weitermachen",
    card: "border-locked bg-white",
  },
};

/** Eine kompakte Vorschlags-Karte: ganze Flaeche tappbar, fuehrt zur Lektion. */
function SuggestionCard({ suggestion }: { suggestion: Suggestion }) {
  const style = KIND_STYLES[suggestion.kind];
  return (
    <Link
      href={`/lektion/${suggestion.lessonSlug}`}
      aria-label={`${suggestion.lessonTitle} – ${suggestion.grund}`}
      className={`flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 border-b-4 p-2.5 select-none active:translate-y-0.5 active:border-b-2 ${style.card}`}
    >
      <span className="text-2xl" aria-hidden>
        {suggestion.topicIcon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col text-left">
        <span className="truncate font-bold text-ink">
          {suggestion.lessonTitle}
        </span>
        <span className="text-sm text-ink/70">
          <span aria-hidden>{style.emoji} </span>
          {style.label}
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
      href="/wiederholen"
      aria-label="Üben – Wiederholen und gemischt üben"
      className="flex min-h-24 w-full items-center justify-center gap-3 rounded-2xl border-b-4 border-primary-dark bg-primary p-4 select-none active:translate-y-1 active:border-b-0"
    >
      <span className="text-4xl" aria-hidden>
        🔁
      </span>
      <span className="flex flex-col text-left text-white">
        <span className="text-lg font-bold">Üben</span>
        <span className="text-sm font-semibold opacity-90">
          Wiederholen &amp; gemischt üben
        </span>
      </span>
    </Link>
  );
}


export default function StartPage() {
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

  // Offline gepufferte Ergebnisse nebenher nachreichen – ohne das Anzeigen
  // der Startseite aufzuhalten. Wurde wirklich etwas nachgereicht, einmal neu
  // laden, damit XP, Streak und Pferdeaepfel den frischen Stand zeigen.
  useEffect(() => {
    let cancelled = false;
    flushPendingWrites()
      .then((nachgereicht) => {
        if (nachgereicht && !cancelled) setReloadKey((k) => k + 1);
      })
      .catch(() => {
        // Bleibt in der Warteschlange, naechster Start versucht es erneut.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <AppHeader streak={0} xp={0} />
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <StartSkeleton />
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 px-4 py-10">
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

  // Tagesgruss: merkt, ob heute schon geuebt wurde.
  const learnedToday = state.activity.some((row) => row.day === berlinToday());
  const greeting = learnedToday
    ? "Stark! Du hast heute schon geübt. 💪"
    : streak > 0
      ? `Hallo Amelie! Dein ${streak}-Tage-Feuer wartet. 🔥`
      : "Hallo Amelie! Schön, dass du da bist.";

  // Ponyweide: jede Nacht liegen 3 Pferdeäpfel. Jede HEUTE abgeschlossene
  // (verschiedene) Lektion räumt einen weg → apples = 3 − heutige Lektionen.
  const today = berlinToday();
  const lessonsToday = new Set(
    state.progress
      .filter((row) => row.completed_at && berlinDateOf(row.completed_at) === today)
      .map((row) => row.lesson_id)
  ).size;
  const meadowApples = Math.max(0, 3 - lessonsToday);

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

  // App-Shell: Kopfleiste liegt AUSSERHALB des Scroll-Bereichs und kann
  // deshalb nie mitscrollen oder vom iOS-Gummiband verschoben werden.
  // Nur der Bereich darunter scrollt.
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader streak={streak} xp={totalXp} />

      <div className="flex flex-1 flex-col overflow-y-auto overscroll-contain">
      <div className="mx-auto w-full max-w-md px-4 pt-6 pb-8">
        {/* Ponyweide: Pony schlendert über die Wiese, Pferdeäpfel je nach
            "wie lange nicht geübt" - sauber machen = eine Lektion machen. */}
        <PonyMeadow
          message={greeting}
          apples={meadowApples}
          feeds={state.feeds}
        />

        {/* Nur im Mama-Modus: Link zu Amelies Fortschritts-Statistik. */}
        <MamaStatsLink />

        {/* Fuer dich heute: GENAU EIN Vorschlag (die wichtigste Lektion),
            darunter eine schlanke Ueben-Zeile. Bewusst einfach gehalten -
            vier grosse Kaesten uebereinander waren zu voll. */}
        <section aria-label="Für dich heute" className="pt-6">
          <h2 className="mb-2 text-lg font-extrabold text-ink">
            Für dich heute <span aria-hidden>✨</span>
          </h2>
          {suggestions.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              <SuggestionCard suggestion={suggestions[0]} />
              {state.progress.length > 0 && (
                <Link
                  href="/wiederholen"
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-primary bg-white px-3 text-base font-bold text-primary-dark select-none active:translate-y-0.5"
                >
                  <span aria-hidden>🔁</span> Üben &amp; Fehler wiederholen
                </Link>
              )}
            </div>
          ) : (
            <BigPracticeCard />
          )}
        </section>

        {/* Wiederholen & Pruefen: Spaced Repetition + Probe-Pruefung. Erst
            sichtbar, wenn Amelie schon mindestens eine Lektion gemacht hat. */}
        {state.progress.length > 0 && (
          <section aria-label="Wiederholen und Prüfen" className="pt-8">
            <h2 className="mb-3 text-lg font-extrabold text-ink">
              Wiederholen &amp; Prüfen
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/faellig"
                className="flex min-h-24 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-b-4 border-locked bg-white p-3 text-center select-none active:translate-y-0.5 active:border-b-2"
              >
                <span className="text-3xl" aria-hidden>
                  🧠
                </span>
                <span className="text-sm font-bold text-ink">Wiederholen</span>
                <span className="text-xs font-semibold text-ink/60">
                  {state.dueCount > 0
                    ? `${state.dueCount} ${state.dueCount === 1 ? "Übung" : "Übungen"} dran`
                    : "nichts fällig 👍"}
                </span>
              </Link>
              <Link
                href="/pruefung"
                className="flex min-h-24 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-b-4 border-locked bg-white p-3 text-center select-none active:translate-y-0.5 active:border-b-2"
              >
                <span className="text-3xl" aria-hidden>
                  📝
                </span>
                <span className="text-sm font-bold text-ink">Probe-Prüfung</span>
                <span className="text-xs font-semibold text-ink/60">
                  Teste dich
                </span>
              </Link>
            </div>
          </section>
        )}

        {/* Bereiche ("Uebermappen"): buendeln die vielen Themen in wenige
            grosse Gruppen. Antippen fuehrt zu /bereich/[slug] mit den Themen. */}
        <section aria-label="Bereiche" className="pt-8">
          <h2 className="mb-3 text-lg font-extrabold text-ink">Bereiche</h2>
          {state.topics.length === 0 ? (
            <p className="text-sm text-ink/60">
              Hier kommen bald neue Themen.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {groupTopicsByCategory(state.topics).map((category) => (
                <CategoryCard
                  key={category.slug}
                  category={category}
                  completedLessonIds={completedLessonIds}
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
    </div>
  );
}
