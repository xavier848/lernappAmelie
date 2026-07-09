"use client";

// Der Lernpfad (Spec §4.1): Themen-Abschnitte mit Trenner-Header
// (grosses Icon + Titel + duenne Linie), darunter die Lektions-Knoten
// als vertikale Kette, leicht versetzt (Duolingo-Schlangenlinie).
import type { ProgressRow, TopicWithLessons } from "@/lib/types";
import { pathStates } from "./path-states";
import { LessonNode } from "./LessonNode";

/** Versatz der Knoten: abwechselnd nach links und rechts (Schlangenlinie). */
function snakeOffset(index: number): string {
  return index % 2 === 0 ? "mr-16" : "ml-16";
}

export function LearningPath({
  topics,
  progress,
}: {
  topics: TopicWithLessons[];
  progress: ProgressRow[];
}) {
  const states = pathStates(topics, progress);

  return (
    <div className="flex flex-col gap-10 px-4 pb-8">
      {topics.map((topic) => (
        <section key={topic.id} aria-label={topic.title}>
          <div className="mb-6 flex items-center gap-3">
            <span className="text-4xl" aria-hidden>
              {topic.icon}
            </span>
            <h2 className="text-lg font-extrabold text-ink">{topic.title}</h2>
            <span className="h-0.5 flex-1 rounded-full bg-locked" aria-hidden />
          </div>

          {topic.lessons.length === 0 ? (
            <p className="text-center text-sm text-ink/60">
              Hier kommen bald neue Lektionen.
            </p>
          ) : (
            <div className="flex flex-col items-center gap-6">
              {topic.lessons.map((lesson, index) => {
                const nodeState = states.get(lesson.id) ?? {
                  state: "locked" as const,
                };
                return (
                  <div key={lesson.id} className={snakeOffset(index)}>
                    <LessonNode
                      lesson={lesson}
                      state={nodeState.state}
                      stars={nodeState.stars}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
