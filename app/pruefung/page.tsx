"use client";

// Prüfungs-Simulation + Bereitschafts-Check /pruefung.
// - Übersicht: pro Bereich, wie "prüfungsbereit" Amelie laut bisherigen
//   Antworten ist (lib/exam.computeReadiness).
// - Probe-Prüfung: ~20 gemischte Übungen aus allen Bereichen, einmal durch
//   (ExamPlayer). Am Ende Prozent-Ergebnis + aktualisierte Bereitschaft.
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Mascot } from "@/components/ui/Mascot";
import { ExamPlayer, type ExamResult } from "@/components/player/ExamPlayer";
import {
  berlinToday,
  bumpDailyActivity,
  fetchAttemptStatsWithLessons,
  fetchExercisesForLessons,
  fetchPath,
} from "@/lib/data";
import { getDeviceId } from "@/lib/device";
import { groupTopicsByCategory } from "@/lib/categories";
import {
  computeReadiness,
  pickExamLessonIds,
  type CategoryReadiness,
  type Verdict,
} from "@/lib/exam";
import type { TopicWithLessons } from "@/lib/types";

const EXAM_COUNT = 20;

const VERDICT_UI: Record<Verdict, { label: string; chip: string; bar: string }> = {
  bereit: { label: "Bereit ✅", chip: "bg-success-light text-success-dark", bar: "bg-success" },
  fast: { label: "Fast bereit", chip: "bg-primary-light text-primary-dark", bar: "bg-primary" },
  ueben: { label: "Üben lohnt sich", chip: "bg-warning-light text-warning-dark", bar: "bg-warning" },
  wenig: { label: "Noch wenig Daten", chip: "bg-locked text-ink/60", bar: "bg-locked" },
};

type ExamRow = { id: string; type: string; data: unknown };

type Phase =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "overview"; readiness: CategoryReadiness[]; topics: TopicWithLessons[] }
  | { kind: "exam"; exercises: ExamRow[] }
  | { kind: "result"; correct: number; total: number; readiness: CategoryReadiness[] };

function lessonToTopicMap(topics: TopicWithLessons[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const t of topics) for (const l of t.lessons) map.set(l.id, t.slug);
  return map;
}

async function loadOverview(): Promise<{
  readiness: CategoryReadiness[];
  topics: TopicWithLessons[];
}> {
  const deviceId = getDeviceId();
  const [attempts, topics] = await Promise.all([
    fetchAttemptStatsWithLessons(deviceId),
    fetchPath(),
  ]);
  const readiness = computeReadiness({
    attemptStats: attempts.stats,
    exerciseToLesson: attempts.exerciseToLesson,
    lessonToTopic: lessonToTopicMap(topics),
  });
  return { readiness, topics };
}

function ReadinessList({ items }: { items: CategoryReadiness[] }) {
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((r) => {
        const ui = VERDICT_UI[r.verdict];
        return (
          <div
            key={r.slug}
            className="flex items-center gap-3 rounded-2xl border-2 border-locked bg-white p-3"
          >
            <span className="text-2xl" aria-hidden>
              {r.icon}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="font-bold text-ink">{r.title}</span>
              <span className="mt-1 h-2 w-full overflow-hidden rounded-full bg-locked">
                <span
                  className={`block h-full rounded-full ${ui.bar}`}
                  style={{ width: `${Math.round(r.ratio * 100)}%` }}
                />
              </span>
            </span>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${ui.chip}`}
            >
              {ui.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function PruefungPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { readiness, topics } = await loadOverview();
        if (!cancelled) setPhase({ kind: "overview", readiness, topics });
      } catch {
        if (!cancelled) setPhase({ kind: "error" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  async function startExam(topics: TopicWithLessons[]) {
    setPhase({ kind: "loading" });
    try {
      const categories = groupTopicsByCategory(topics);
      const lessonIds = pickExamLessonIds(categories, EXAM_COUNT, Math.random);
      const rows = await fetchExercisesForLessons(lessonIds);
      // Je Lektion eine zufällige Übung, breit gemischt.
      const byLesson = new Map<string, ExamRow[]>();
      for (const r of rows) {
        const list = byLesson.get(r.lesson_id) ?? [];
        list.push({ id: r.id, type: r.type, data: r.data });
        byLesson.set(r.lesson_id, list);
      }
      const exercises: ExamRow[] = [];
      for (const id of lessonIds) {
        const list = byLesson.get(id);
        if (list && list.length > 0) {
          exercises.push(list[Math.floor(Math.random() * list.length)]);
        }
        if (exercises.length >= EXAM_COUNT) break;
      }
      if (exercises.length === 0) {
        setPhase({ kind: "error" });
        return;
      }
      setPhase({ kind: "exam", exercises });
    } catch {
      setPhase({ kind: "error" });
    }
  }

  async function finishExam(results: ExamResult[]) {
    const correct = results.filter((r) => r.correct).length;
    const total = results.length;
    // Prüfung zählt als Lern-Aktivität (Streak) - 5 XP je richtiger Antwort.
    try {
      const deviceId = getDeviceId();
      if (deviceId) void bumpDailyActivity(deviceId, correct * 5);
    } catch {
      // egal
    }
    // Bereitschaft mit den frischen Prüfungs-Antworten neu berechnen.
    try {
      const { readiness } = await loadOverview();
      setPhase({ kind: "result", correct, total, readiness });
    } catch {
      setPhase({ kind: "result", correct, total, readiness: [] });
    }
  }

  if (phase.kind === "loading") {
    return (
      <div className="flex h-full items-center justify-center px-4">
        <p className="animate-pulse text-lg font-semibold text-ink/60">
          Einen Moment bitte …
        </p>
      </div>
    );
  }

  if (phase.kind === "error") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-8 px-4">
        <Mascot mood="neutral" message="Gerade klappt es nicht. Versuch es später nochmal." />
        <Button size="lg" onClick={() => setReloadKey((k) => k + 1)}>
          Nochmal versuchen
        </Button>
      </div>
    );
  }

  if (phase.kind === "exam") {
    return (
      <ExamPlayer
        exercises={phase.exercises}
        onQuit={() => setReloadKey((k) => k + 1)}
        onDone={finishExam}
      />
    );
  }

  if (phase.kind === "result") {
    const percent = phase.total > 0 ? Math.round((phase.correct / phase.total) * 100) : 0;
    const message =
      percent >= 80
        ? "Klasse! Du bist gut vorbereitet. 🎉"
        : percent >= 60
          ? "Gut gemacht! Ein bisschen Üben und du bist bereit. 💪"
          : "Guter Anfang! Üben wir die schwachen Bereiche. 🌱";
    return (
      <div className="mx-auto flex h-full w-full max-w-md flex-col overflow-y-auto overscroll-contain px-4 py-6">
        <Mascot mood="cheer" size={90} message={message} />
        <p className="mt-4 text-center text-4xl font-extrabold text-primary">
          {phase.correct} von {phase.total} richtig
        </p>
        <p className="mt-1 text-center text-base font-semibold text-ink/70">
          Das sind {percent}%.
        </p>
        <h2 className="mt-6 mb-3 text-lg font-extrabold text-ink">
          Deine Bereitschaft
        </h2>
        <ReadinessList items={phase.readiness} />
        <div className="mt-6 flex flex-col gap-2.5 pb-4">
          <Button size="lg" full onClick={() => setReloadKey((k) => k + 1)}>
            Neue Probe-Prüfung
          </Button>
          <Button size="lg" full variant="secondary" onClick={() => router.push("/")}>
            Zur Startseite
          </Button>
        </div>
      </div>
    );
  }

  // overview
  const hasData = phase.readiness.some((r) => r.total > 0);
  return (
    <div className="mx-auto flex h-full w-full max-w-md flex-col overflow-y-auto overscroll-contain px-4 py-6">
      <Link
        href="/"
        className="flex min-h-12 w-fit items-center gap-2 rounded-2xl pr-4 text-base font-bold text-primary-dark"
      >
        <span aria-hidden>←</span> Zurück
      </Link>

      <h1 className="mt-2 text-2xl font-extrabold text-ink">Probe-Prüfung 📝</h1>
      <p className="mt-2 text-base text-ink/80">
        {EXAM_COUNT} gemischte Fragen aus allen Bereichen. Ganz ohne Zeitdruck.
        Am Ende siehst du, wo du schon bereit bist.
      </p>

      <Card className="mt-5 flex flex-col items-center gap-3 p-4">
        <Button size="lg" full onClick={() => startExam(phase.topics)}>
          <span aria-hidden>▶</span> Probe-Prüfung starten
        </Button>
      </Card>

      <h2 className="mt-7 mb-3 text-lg font-extrabold text-ink">
        Deine Bereitschaft
      </h2>
      {hasData ? (
        <ReadinessList items={phase.readiness} />
      ) : (
        <p className="text-sm text-ink/60">
          Mach zuerst ein paar Lektionen – dann siehst du hier, wie bereit du in
          jedem Bereich bist.
        </p>
      )}
      <div className="pb-6" />
    </div>
  );
}
