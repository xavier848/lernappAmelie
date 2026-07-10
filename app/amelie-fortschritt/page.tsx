"use client";

// Statistik-Seite fuer Mama: zeigt Amelies Fortschritt — geschaffte
// Lektionen, Staerken/Uebungsbedarf pro Thema und die schwierigsten Uebungen.
// Liest Amelies Daten (feste Geraete-ID) unabhaengig vom aktiven Profil.
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Mascot } from "@/components/ui/Mascot";
import { Button } from "@/components/ui/Button";
import { fetchAmelieStats, type AmelieStats, type TopicStat } from "@/lib/amelie-stats";

type LoadState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; stats: AmelieStats };

function pct(x: number | null): string {
  return x === null ? "–" : `${Math.round(x * 100)} %`;
}

/** Farbige Quote-Leiste: grün ab 80 %, türkis ab 60 %, sonst orange. */
function AccuracyBar({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-sm text-ink/50">noch nichts geübt</span>;
  }
  const percent = Math.round(value * 100);
  const color =
    value >= 0.8 ? "bg-success" : value >= 0.6 ? "bg-primary" : "bg-warning";
  return (
    <span className="flex items-center gap-2">
      <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-locked">
        <span
          className={`block h-full rounded-full ${color}`}
          style={{ width: `${percent}%` }}
        />
      </span>
      <span className="w-12 text-right text-sm font-bold text-ink">
        {percent} %
      </span>
    </span>
  );
}

function TopicRow({ topic }: { topic: TopicStat }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl border-2 border-locked bg-white p-3">
      <div className="flex items-center gap-2">
        <span className="text-2xl" aria-hidden>
          {topic.icon}
        </span>
        <span className="flex-1 font-bold text-ink">{topic.title}</span>
        <span className="text-sm text-ink/60">
          {topic.lessonsDone}/{topic.lessonsTotal} Lektionen
        </span>
      </div>
      <AccuracyBar value={topic.accuracy} />
    </div>
  );
}

export default function AmelieFortschrittPage() {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stats = await fetchAmelieStats();
        if (!cancelled) setState({ status: "ready", stats });
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
      <div className="flex flex-col gap-4 px-4 py-8" aria-label="Lädt…">
        <div className="h-24 animate-pulse rounded-2xl bg-locked" />
        <div className="h-40 animate-pulse rounded-2xl bg-locked" />
        <div className="h-40 animate-pulse rounded-2xl bg-locked" />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-4 py-10">
        <Mascot mood="neutral" message="Gerade klappt es nicht. Versuch es später nochmal." />
        <Button
          size="lg"
          onClick={() => {
            setState({ status: "loading" });
            setReloadKey((k) => k + 1);
          }}
        >
          Nochmal versuchen
        </Button>
      </div>
    );
  }

  const s = state.stats;
  const nichtsGemacht = s.lessonsDone === 0 && s.correct + s.wrong === 0;

  return (
    <div className="flex min-h-svh flex-col gap-6 px-4 py-6">
      <Link
        href="/"
        className="flex min-h-12 w-fit items-center gap-2 rounded-2xl font-bold text-primary-dark"
      >
        ← Zurück
      </Link>

      <h1 className="text-2xl font-extrabold text-ink">Amelies Fortschritt 📊</h1>

      {nichtsGemacht ? (
        <Card className="flex flex-col items-center gap-4 py-8 text-center">
          <Mascot mood="neutral" size={110} message="Noch keine Übungen gemacht." />
          <p className="text-sm text-ink/70">
            Sobald Amelie übt, siehst du hier, was gut klappt und wo sie noch
            Hilfe braucht.
          </p>
        </Card>
      ) : (
        <>
          {/* Ueberblick */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="flex flex-col items-center py-4 text-center">
              <span className="text-2xl font-extrabold text-primary">
                {s.lessonsDone}
              </span>
              <span className="text-xs text-ink/60">
                von {s.lessonsTotal} Lektionen
              </span>
            </Card>
            <Card className="flex flex-col items-center py-4 text-center">
              <span className="text-2xl font-extrabold text-primary">
                {s.totalXp}
              </span>
              <span className="text-xs text-ink/60">Punkte</span>
            </Card>
            <Card className="flex flex-col items-center py-4 text-center">
              <span className="text-2xl font-extrabold text-primary">
                {pct(s.accuracy)}
              </span>
              <span className="text-xs text-ink/60">richtig</span>
            </Card>
          </div>

          {/* Staerken */}
          {s.strengths.length > 0 && (
            <section aria-label="Das kann Amelie gut">
              <h2 className="mb-3 text-lg font-extrabold text-ink">
                💪 Das kann Amelie gut
              </h2>
              <div className="flex flex-col gap-2.5">
                {s.strengths.map((t) => (
                  <TopicRow key={t.slug} topic={t} />
                ))}
              </div>
            </section>
          )}

          {/* Uebungsbedarf */}
          {s.needsPractice.length > 0 && (
            <section aria-label="Hier braucht Amelie noch Übung">
              <h2 className="mb-3 text-lg font-extrabold text-ink">
                📚 Hier hilft noch Üben
              </h2>
              <div className="flex flex-col gap-2.5">
                {s.needsPractice.map((t) => (
                  <TopicRow key={t.slug} topic={t} />
                ))}
              </div>
            </section>
          )}

          {/* Schwierige Uebungen */}
          {s.difficult.length > 0 && (
            <section aria-label="Diese Aufgaben fielen schwer">
              <h2 className="mb-3 text-lg font-extrabold text-ink">
                🔎 Diese Aufgaben fielen schwer
              </h2>
              <div className="flex flex-col gap-2.5">
                {s.difficult.map((d) => (
                  <div
                    key={d.exerciseId}
                    className="flex items-start gap-3 rounded-2xl border-2 border-warning bg-warning-light p-3"
                  >
                    <span className="text-2xl" aria-hidden>
                      {d.topicIcon}
                    </span>
                    <span className="flex-1">
                      <span className="block font-semibold text-ink">
                        {d.prompt}
                      </span>
                      <span className="block text-sm text-ink/70">
                        {d.topicTitle} · {d.lessonTitle} ·{" "}
                        {d.wrong === 1
                          ? "1 Mal falsch"
                          : `${d.wrong} Mal falsch`}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Alle Themen */}
          <section aria-label="Alle Themen">
            <h2 className="mb-3 text-lg font-extrabold text-ink">
              Alle Themen im Überblick
            </h2>
            <div className="flex flex-col gap-2.5">
              {s.topics
                .filter((t) => t.lessonsDone > 0 || t.accuracy !== null)
                .map((t) => (
                  <TopicRow key={t.slug} topic={t} />
                ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
