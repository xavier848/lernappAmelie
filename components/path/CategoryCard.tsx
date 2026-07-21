// Bereichs-Karte ("Uebermappe") auf der Startseite: grosses Icon, Titel,
// Anzahl Themen und ein Fortschrittsbalken ueber alle Lektionen des Bereichs.
import Link from "next/link";
import type { CategoryWithTopics } from "@/lib/categories";

export function CategoryCard({
  category,
  completedLessonIds,
}: {
  category: CategoryWithTopics;
  completedLessonIds: Set<string>;
}) {
  const allLessons = category.topics.flatMap((t) => t.lessons);
  const total = allLessons.length;
  const done = allLessons.filter((l) => completedLessonIds.has(l.id)).length;
  const percent = total > 0 ? (done / total) * 100 : 0;

  return (
    <Link
      href={`/bereich/${category.slug}`}
      aria-label={`${category.title} – ${category.topics.length} ${category.topics.length === 1 ? "Thema" : "Themen"}, ${done} von ${total} Lektionen geschafft`}
      className="flex min-h-20 w-full items-center gap-4 rounded-2xl border-2 border-b-4 border-locked bg-white p-4 select-none active:translate-y-0.5 active:border-b-2"
    >
      <span className="text-4xl" aria-hidden>
        {category.icon}
      </span>
      <span className="flex-1">
        <span className="block text-lg font-bold text-ink">
          {category.title}
        </span>
        <span className="mt-1 flex items-center gap-2">
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-locked">
            <span
              className="block h-full rounded-full bg-primary"
              style={{ width: `${percent}%` }}
            />
          </span>
          <span className="text-xs font-semibold text-ink/60">
            {done}/{total}
          </span>
        </span>
        <span className="mt-1 block text-xs text-ink/50">
          {category.topics.length}{" "}
          {category.topics.length === 1 ? "Thema" : "Themen"}
        </span>
      </span>
      <span aria-hidden className="text-2xl text-ink/30">
        ›
      </span>
    </Link>
  );
}
