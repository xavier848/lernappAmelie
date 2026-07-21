// Themen-Karte im Grid: Icon, Titel, Fortschritt, Mini-Balken, ✓-Badge.
// Wird auf der Bereichs-Seite (/bereich/[slug]) genutzt.
import Link from "next/link";
import type { TopicWithLessons } from "@/lib/types";

export function TopicCard({
  topic,
  completedCount,
  perfect = false,
}: {
  topic: TopicWithLessons;
  completedCount: number;
  /** true = jede Lektion des Themas mit 3 Sternen geschafft (Gold-Glanz). */
  perfect?: boolean;
}) {
  const total = topic.lessons.length;
  const finished = total > 0 && completedCount >= total;
  const percent = total > 0 ? (completedCount / total) * 100 : 0;

  return (
    <Link
      href={`/thema/${topic.slug}`}
      aria-label={
        perfect
          ? `${topic.title} – alles mit 3 Sternen geschafft!`
          : `${topic.title} – ${completedCount} von ${total} Lektionen geschafft`
      }
      className={
        perfect
          ? "relative flex min-h-32 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-b-4 border-amber-400 bg-amber-50 p-3 text-center select-none active:translate-y-0.5 active:border-b-2"
          : "relative flex min-h-32 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-b-4 border-locked bg-white p-3 text-center select-none active:translate-y-0.5 active:border-b-2"
      }
    >
      {perfect ? (
        <span className="absolute top-2 right-2 text-lg" aria-hidden>
          ⭐
        </span>
      ) : (
        finished && (
          <span
            className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-sm font-bold text-white"
            aria-hidden
          >
            ✓
          </span>
        )
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
