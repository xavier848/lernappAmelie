// Uebermappen ("Bereiche"): buendeln die vielen Themen in wenige grosse
// Gruppen, damit die Startseite uebersichtlich bleibt. Rein strukturell
// (im Code definiert). Themen ohne Zuordnung landen in "Sonstiges", damit
// nie ein Thema verschwindet, wenn spaeter neue dazukommen.
import type { TopicWithLessons } from "@/lib/types";

export type Category = {
  slug: string;
  title: string;
  icon: string;
  topicSlugs: string[];
};

export const CATEGORIES: Category[] = [
  {
    slug: "putzen-wohnen",
    title: "Putzen & Wohnen",
    icon: "🧽",
    topicSlugs: [
      "badezimmer",
      "schlafzimmer",
      "wohnzimmer",
      "kueche",
      "ferienwohnung",
      "waesche",
      "textilkunde",
      "naehen",
      "servietten",
      "handtuecher",
    ],
  },
  {
    slug: "kueche-essen",
    title: "Küche & Essen",
    icon: "🍳",
    topicSlugs: [
      "ernaehrung",
      "kochen",
      "lebensmittelkunde",
      "kuechentechnik",
      "servieren-tisch",
      "hygiene",
    ],
  },
  {
    slug: "geld-einkaufen",
    title: "Geld & Einkaufen",
    icon: "💶",
    topicSlugs: ["geld-verwalten", "warenwirtschaft"],
  },
  {
    slug: "mathe",
    title: "Mathe",
    icon: "🧮",
    topicSlugs: ["kopfrechnen", "geld-rechnen", "mengen-masse"],
  },
  {
    slug: "gedaechtnis",
    title: "Gedächtnistraining",
    icon: "🧠",
    topicSlugs: ["gedaechtnis"],
  },
  {
    slug: "menschen-kinder",
    title: "Menschen & Kinder",
    icon: "🧒",
    topicSlugs: [
      "kinder-motorik",
      "kinder-sprache",
      "kinder-spielen",
      "kinder-gefuehle",
      "kinder-sinne",
      "kinder-sicherheit",
      "kinder-sprechen",
      "kinder-foerdern",
      "kinder-alltag",
      "betreuung",
      "wahrnehmung",
      "beobachten",
      "konflikte",
    ],
  },
  {
    slug: "arbeit-sicherheit",
    title: "Arbeit & Sicherheit",
    icon: "🦺",
    topicSlugs: [
      "arbeitssicherheit",
      "abfall-nachhaltigkeit",
      "arbeitsorganisation",
    ],
  },
  {
    slug: "sprachen",
    title: "Sprachen",
    icon: "🗣️",
    topicSlugs: ["englisch", "niederlaendisch", "oesterreichisch"],
  },
];

const SONSTIGES: Category = {
  slug: "sonstiges",
  title: "Weitere Themen",
  icon: "📦",
  topicSlugs: [],
};

export type CategoryWithTopics = Category & { topics: TopicWithLessons[] };

/**
 * Ordnet die geladenen Themen ihren Bereichen zu (Reihenfolge wie in
 * CATEGORIES). Nicht zugeordnete Themen kommen ans Ende in "Weitere Themen".
 * Leere Bereiche werden weggelassen.
 */
export function groupTopicsByCategory(
  topics: TopicWithLessons[]
): CategoryWithTopics[] {
  const bySlug = new Map(topics.map((t) => [t.slug, t]));
  const used = new Set<string>();

  const result: CategoryWithTopics[] = [];
  for (const cat of CATEGORIES) {
    const catTopics = cat.topicSlugs
      .map((s) => bySlug.get(s))
      .filter((t): t is TopicWithLessons => Boolean(t));
    catTopics.forEach((t) => used.add(t.slug));
    if (catTopics.length > 0) {
      result.push({ ...cat, topics: catTopics });
    }
  }

  const rest = topics.filter((t) => !used.has(t.slug));
  if (rest.length > 0) {
    result.push({ ...SONSTIGES, topics: rest });
  }
  return result;
}

/** Findet die Kategorie zu einem Slug (inkl. zugeordneter Themen). */
export function findCategory(
  slug: string,
  topics: TopicWithLessons[]
): CategoryWithTopics | null {
  return groupTopicsByCategory(topics).find((c) => c.slug === slug) ?? null;
}
