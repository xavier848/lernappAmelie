"use client";

// Themen-Seite /thema/[slug]: alle Lektionen eines Themas als grosse
// Zeilen-Karten. Innerhalb des Themas sind Lektionen linear freigeschaltet
// (pathStates wie frueher im Lernpfad): ✓ fertig (nochmal ueben),
// ▶ aktuelle Lektion, 🔒 gesperrt (nicht tappbar).
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Mascot } from "@/components/ui/Mascot";
import { pathStates, type LessonPathState } from "@/components/path/path-states";
import { fetchPath, fetchProgress } from "@/lib/data";
import { getDeviceId } from "@/lib/device";
import type { LessonRow, ProgressRow, TopicWithLessons } from "@/lib/types";

type LoadState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; topics: TopicWithLessons[]; progress: ProgressRow[] };

/** Ladezustand: pulsierende Platzhalter-Zeilen. */
function TopicSkeleton() {
  return (
    <div className="flex flex-col gap-3 pt-6" aria-label="Lädt…">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-16 animate-pulse rounded-2xl bg-locked" />
      ))}
    </div>
  );
}

/** Sterne-Anzeige (1-3) fuer abgeschlossene Lektionen. */
function Stars({ stars }: { stars?: number }) {
  const count = Math.min(Math.max(stars ?? 1, 1), 3);
  return (
    <span className="text-sm" aria-label={`${count} von 3 Sternen`}>
      {"⭐".repeat(count)}
    </span>
  );
}

/** Eine Lektions-Zeile: ganze Karte tappbar (ausser gesperrt). */
function LessonRowCard({
  lesson,
  state,
}: {
  lesson: LessonRow;
  state: LessonPathState;
}) {
  if (state.state === "locked") {
    return (
      <div
        aria-label={`${lesson.title} – noch gesperrt`}
        className="flex min-h-16 w-full items-center gap-3 rounded-2xl border-2 border-locked bg-white p-3 opacity-60"
      >
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-locked text-xl"
          aria-hidden
        >
          🔒
        </span>
        <span className="flex-1 font-bold text-ink/50">{lesson.title}</span>
      </div>
    );
  }

  if (state.state === "completed") {
    return (
      <Link
        href={`/lektion/${lesson.slug}`}
        aria-label={`${lesson.title} – geschafft, nochmal üben`}
        className="flex min-h-16 w-full items-center gap-3 rounded-2xl border-2 border-b-4 border-locked bg-white p-3 select-none active:translate-y-0.5 active:border-b-2"
      >
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-extrabold text-white"
          aria-hidden
        >
          ✓
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="font-bold text-ink">{lesson.title}</span>
          <Stars stars={state.stars} />
        </span>
        <span className="shrink-0 text-sm font-bold text-primary-dark">
          Nochmal üben <span aria-hidden>▶</span>
        </span>
      </Link>
    );
  }

  // current
  return (
    <Link
      href={`/lektion/${lesson.slug}`}
      aria-label={`${lesson.title} – jetzt lernen`}
      className="flex min-h-16 w-full items-center gap-3 rounded-2xl border-2 border-b-4 border-primary bg-primary-light p-3 select-none active:translate-y-0.5 active:border-b-2"
    >
      <span
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-xl text-white"
        aria-hidden
      >
        ▶
      </span>
      <span className="flex-1 font-bold text-ink">{lesson.title}</span>
      <span className="shrink-0 text-sm font-bold text-primary-dark">
        Jetzt lernen
      </span>
    </Link>
  );
}

export default function ThemaPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params?.slug)
    ? (params.slug[0] ?? "")
    : (params?.slug ?? "");

  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const deviceId = getDeviceId();
        const [topics, progress] = await Promise.all([
          fetchPath(),
          fetchProgress(deviceId),
        ]);
        if (!cancelled) setState({ status: "ready", topics, progress });
      } catch {
        if (!cancelled) setState({ status: "error" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

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

  const topic =
    state.status === "ready"
      ? state.topics.find((candidate) => candidate.slug === slug)
      : undefined;

  if (state.status === "ready" && !topic) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-4 py-10">
        <Mascot mood="neutral" message="Dieses Thema gibt es nicht." />
        <Button onClick={() => router.push("/")} size="lg">
          Zur Startseite
        </Button>
      </div>
    );
  }

  const states =
    state.status === "ready" && topic
      ? pathStates([topic], state.progress)
      : new Map<string, LessonPathState>();
  const lessons = topic ? [...topic.lessons].sort((a, b) => a.sort - b.sort) : [];

  return (
    <div className="flex min-h-svh flex-col">
      <div className="mx-auto w-full max-w-md px-4 pt-4 pb-10">
        <Link
          href="/"
          className="flex min-h-12 w-fit items-center gap-2 rounded-2xl pr-4 text-base font-bold text-primary-dark"
        >
          <span aria-hidden>←</span> Zurück
        </Link>

        {state.status === "loading" ? (
          <TopicSkeleton />
        ) : (
          topic && (
            <>
              <div className="flex items-center gap-4 pt-4 pb-6">
                <span className="text-5xl" aria-hidden>
                  {topic.icon}
                </span>
                <h1 className="text-2xl font-extrabold text-ink">
                  {topic.title}
                </h1>
              </div>

              {lessons.length === 0 ? (
                <p className="text-sm text-ink/60">
                  Hier kommen bald neue Lektionen.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {lessons.map((lesson) => (
                    <LessonRowCard
                      key={lesson.id}
                      lesson={lesson}
                      state={
                        states.get(lesson.id) ?? { state: "locked" as const }
                      }
                    />
                  ))}
                </div>
              )}
            </>
          )
        )}
      </div>
    </div>
  );
}
