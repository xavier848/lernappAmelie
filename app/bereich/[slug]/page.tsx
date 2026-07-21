"use client";

// Bereichs-Seite /bereich/[slug]: zeigt die Themen einer "Uebermappe"
// (z. B. "Putzen & Wohnen") als 2-Spalten-Grid von Themen-Karten.
// Von der Startseite aus verlinkt; jede Karte fuehrt zu /thema/[slug].
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Mascot } from "@/components/ui/Mascot";
import { TopicCard } from "@/components/path/TopicCard";
import { findCategory } from "@/lib/categories";
import { fetchPath, fetchProgress } from "@/lib/data";
import { getDeviceId } from "@/lib/device";
import type { ProgressRow, TopicWithLessons } from "@/lib/types";

type LoadState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; topics: TopicWithLessons[]; progress: ProgressRow[] };

/** Ladezustand: pulsierende Platzhalter-Kacheln. */
function BereichSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 pt-6" aria-label="Lädt…">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-32 animate-pulse rounded-2xl bg-locked" />
      ))}
    </div>
  );
}

export default function BereichPage() {
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

  const category =
    state.status === "ready" ? findCategory(slug, state.topics) : null;

  if (state.status === "ready" && !category) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-4 py-10">
        <Mascot mood="neutral" message="Diesen Bereich gibt es nicht." />
        <Button onClick={() => router.push("/")} size="lg">
          Zur Startseite
        </Button>
      </div>
    );
  }

  const completedLessonIds =
    state.status === "ready"
      ? new Set(state.progress.map((row) => row.lesson_id))
      : new Set<string>();
  const starsByLesson =
    state.status === "ready"
      ? new Map(state.progress.map((row) => [row.lesson_id, row.stars]))
      : new Map<string, number>();

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
          <BereichSkeleton />
        ) : (
          category && (
            <>
              <div className="flex items-center gap-4 pt-4 pb-6">
                <span className="text-5xl" aria-hidden>
                  {category.icon}
                </span>
                <h1 className="text-2xl font-extrabold text-ink">
                  {category.title}
                </h1>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {category.topics.map((topic) => (
                  <TopicCard
                    key={topic.id}
                    topic={topic}
                    completedCount={
                      topic.lessons.filter((lesson) =>
                        completedLessonIds.has(lesson.id)
                      ).length
                    }
                    perfect={
                      topic.lessons.length > 0 &&
                      topic.lessons.every(
                        (lesson) => starsByLesson.get(lesson.id) === 3
                      )
                    }
                  />
                ))}
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
}
