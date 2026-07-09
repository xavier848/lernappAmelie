// Abzeichen laut Spec §9: in Code definiert, aus Fortschritts-Daten berechnet.
// IDs sind stabil und werden in der Datenbank/im Profil referenziert:
// 'erste-lektion', 'topic-<slug>', 'streak-3/7/14/30', 'xp-100/500/1000/2500',
// 'geld-meister', 'kinder-profi'.

export type Badge = {
  id: string;
  title: string;
  description: string;
  emoji: string;
};

// Themen-Slugs laut Spec §8 (muessen zu content/topics.json passen).
const TOPICS: { slug: string; title: string; emoji: string }[] = [
  { slug: "badezimmer", title: "Badezimmer", emoji: "🛁" },
  { slug: "schlafzimmer", title: "Schlafzimmer", emoji: "🛏️" },
  { slug: "wohnzimmer", title: "Wohnzimmer", emoji: "🛋️" },
  { slug: "kueche", title: "Küche", emoji: "🍳" },
  { slug: "ferienwohnung", title: "Ferienwohnung", emoji: "🏡" },
  { slug: "waesche", title: "Wäsche", emoji: "🧺" },
  { slug: "servietten-falten", title: "Servietten falten", emoji: "🍽️" },
  { slug: "handtuecher-falten", title: "Handtücher falten", emoji: "🧻" },
  { slug: "englisch-ferienwohnung", title: "Englisch", emoji: "🇬🇧" },
  { slug: "rechnen-mit-geld", title: "Rechnen mit Geld", emoji: "💶" },
  { slug: "geld-verwalten", title: "Geld verwalten", emoji: "💰" },
  { slug: "motorische-entwicklung", title: "Motorische Entwicklung", emoji: "🤸" },
  { slug: "sprachentwicklung", title: "Sprachentwicklung", emoji: "🗣️" },
  { slug: "spielen-denken", title: "Spielen & Denken", emoji: "🧩" },
  { slug: "gefuehle-erkennen", title: "Gefühle erkennen", emoji: "😊" },
  { slug: "sinne-wahrnehmung", title: "Sinne & Wahrnehmung", emoji: "👂" },
  { slug: "sicherheit-kinder", title: "Sicherheit mit Kindern", emoji: "🚸" },
  { slug: "mit-kindern-sprechen", title: "Mit Kindern sprechen", emoji: "💬" },
  { slug: "was-wird-gefoerdert", title: "Was wird gefördert?", emoji: "🌱" },
  { slug: "alltag-hygiene", title: "Alltag & Hygiene", emoji: "🧼" },
];

// Themen-Gruppen fuer die Sammel-Badges.
const MONEY_TOPIC_SLUGS = ["rechnen-mit-geld", "geld-verwalten"];
const KIDS_TOPIC_SLUGS = [
  "motorische-entwicklung",
  "sprachentwicklung",
  "spielen-denken",
  "gefuehle-erkennen",
  "sinne-wahrnehmung",
  "sicherheit-kinder",
  "mit-kindern-sprechen",
  "was-wird-gefoerdert",
  "alltag-hygiene",
];

const STREAK_STEPS = [3, 7, 14, 30];
const XP_STEPS = [100, 500, 1000, 2500];

export const ALL_BADGES: Badge[] = [
  {
    id: "erste-lektion",
    title: "Erste Lektion",
    description: "Du hast deine erste Lektion geschafft!",
    emoji: "🎉",
  },
  ...TOPICS.map((topic) => ({
    id: `topic-${topic.slug}`,
    title: `${topic.title}-Profi`,
    description: `Du hast alle Lektionen im Thema „${topic.title}" geschafft.`,
    emoji: topic.emoji,
  })),
  ...STREAK_STEPS.map((n) => ({
    id: `streak-${n}`,
    title: `${n} Tage in Folge`,
    description: `Du hast ${n} Tage hintereinander gelernt.`,
    emoji: "🔥",
  })),
  ...XP_STEPS.map((n) => ({
    id: `xp-${n}`,
    title: `${n} XP`,
    description: `Du hast insgesamt ${n} Punkte gesammelt.`,
    emoji: "⚡",
  })),
  {
    id: "geld-meister",
    title: "Geld-Meister",
    description: "Du hast alle Geld-Themen geschafft.",
    emoji: "🏆",
  },
  {
    id: "kinder-profi",
    title: "Kinder-Profi",
    description: "Du hast alle Themen über Kinder geschafft.",
    emoji: "🧒",
  },
];

/**
 * Berechnet die IDs aller erreichten Abzeichen.
 * Reihenfolge entspricht ALL_BADGES.
 */
export function earnedBadges(input: {
  completedLessonSlugs: string[];
  topicsCompleted: string[];
  streak: number;
  totalXp: number;
}): string[] {
  const topicsDone = new Set(input.topicsCompleted);

  const isEarned = (badge: Badge): boolean => {
    if (badge.id === "erste-lektion") {
      return input.completedLessonSlugs.length >= 1;
    }
    if (badge.id === "geld-meister") {
      return MONEY_TOPIC_SLUGS.every((slug) => topicsDone.has(slug));
    }
    if (badge.id === "kinder-profi") {
      return KIDS_TOPIC_SLUGS.every((slug) => topicsDone.has(slug));
    }
    if (badge.id.startsWith("topic-")) {
      return topicsDone.has(badge.id.slice("topic-".length));
    }
    if (badge.id.startsWith("streak-")) {
      return input.streak >= Number(badge.id.slice("streak-".length));
    }
    if (badge.id.startsWith("xp-")) {
      return input.totalXp >= Number(badge.id.slice("xp-".length));
    }
    return false;
  };

  return ALL_BADGES.filter(isEarned).map((badge) => badge.id);
}
