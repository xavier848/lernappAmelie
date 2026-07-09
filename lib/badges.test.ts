import { describe, expect, it } from "vitest";
import { ALL_BADGES, earnedBadges } from "@/lib/badges";

const none = {
  completedLessonSlugs: [] as string[],
  topicsCompleted: [] as string[],
  streak: 0,
  totalXp: 0,
};

describe("ALL_BADGES", () => {
  it("enthaelt alle festen Badge-IDs aus dem Plan", () => {
    const ids = ALL_BADGES.map((b) => b.id);
    for (const id of [
      "erste-lektion",
      "streak-3",
      "streak-7",
      "streak-14",
      "streak-30",
      "xp-100",
      "xp-500",
      "xp-1000",
      "xp-2500",
    ]) {
      expect(ids).toContain(id);
    }
  });

  it("enthaelt Themen-Badges mit dem Muster topic-<slug>", () => {
    const ids = ALL_BADGES.map((b) => b.id);
    expect(ids.some((id) => id.startsWith("topic-"))).toBe(true);
    expect(ids).toContain("topic-badezimmer");
  });

  it("hat keine doppelten IDs und ueberall Titel/Beschreibung/Emoji", () => {
    const ids = ALL_BADGES.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const badge of ALL_BADGES) {
      expect(badge.title.length).toBeGreaterThan(0);
      expect(badge.description.length).toBeGreaterThan(0);
      expect(badge.emoji.length).toBeGreaterThan(0);
    }
  });
});

describe("earnedBadges", () => {
  it("gibt ohne Fortschritt keine Badges", () => {
    expect(earnedBadges(none)).toEqual([]);
  });

  it("vergibt 'erste-lektion' ab der ersten abgeschlossenen Lektion", () => {
    expect(
      earnedBadges({ ...none, completedLessonSlugs: ["badezimmer-putzen-1"] })
    ).toContain("erste-lektion");
  });

  it("vergibt Themen-Badges fuer abgeschlossene Themen", () => {
    const result = earnedBadges({ ...none, topicsCompleted: ["badezimmer"] });
    expect(result).toContain("topic-badezimmer");
    expect(result).not.toContain("topic-kueche");
  });

  it("vergibt Streak-Badges kumulativ bis zur erreichten Stufe", () => {
    const result = earnedBadges({ ...none, streak: 7 });
    expect(result).toContain("streak-3");
    expect(result).toContain("streak-7");
    expect(result).not.toContain("streak-14");
    expect(result).not.toContain("streak-30");
  });

  it("vergibt streak-3 erst ab 3 Tagen", () => {
    expect(earnedBadges({ ...none, streak: 2 })).not.toContain("streak-3");
    expect(earnedBadges({ ...none, streak: 3 })).toContain("streak-3");
  });

  it("vergibt XP-Badges kumulativ bis zur erreichten Stufe", () => {
    const result = earnedBadges({ ...none, totalXp: 500 });
    expect(result).toContain("xp-100");
    expect(result).toContain("xp-500");
    expect(result).not.toContain("xp-1000");
    expect(result).not.toContain("xp-2500");
  });

  it("vergibt xp-2500 ab 2500 XP", () => {
    const result = earnedBadges({ ...none, totalXp: 2500 });
    expect(result).toContain("xp-2500");
  });

  it("kombiniert mehrere Badge-Arten", () => {
    const result = earnedBadges({
      completedLessonSlugs: ["a", "b"],
      topicsCompleted: ["waesche"],
      streak: 14,
      totalXp: 1000,
    });
    expect(result).toContain("erste-lektion");
    expect(result).toContain("topic-waesche");
    expect(result).toContain("streak-14");
    expect(result).toContain("xp-1000");
  });

  it("vergibt 'geld-meister' erst wenn beide Geld-Themen fertig sind", () => {
    expect(
      earnedBadges({ ...none, topicsCompleted: ["rechnen-mit-geld"] })
    ).not.toContain("geld-meister");
    expect(
      earnedBadges({ ...none, topicsCompleted: ["rechnen-mit-geld", "geld-verwalten"] })
    ).toContain("geld-meister");
  });

  it("vergibt 'kinder-profi' erst wenn alle Kinder-Themen fertig sind", () => {
    const kidsTopics = [
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
    expect(
      earnedBadges({ ...none, topicsCompleted: kidsTopics.slice(0, 8) })
    ).not.toContain("kinder-profi");
    expect(earnedBadges({ ...none, topicsCompleted: kidsTopics })).toContain(
      "kinder-profi"
    );
  });

  it("gibt nur IDs zurueck, die in ALL_BADGES definiert sind", () => {
    const allIds = new Set(ALL_BADGES.map((b) => b.id));
    const result = earnedBadges({
      completedLessonSlugs: ["a"],
      topicsCompleted: ["badezimmer", "waesche"],
      streak: 30,
      totalXp: 2500,
    });
    for (const id of result) {
      expect(allIds.has(id)).toBe(true);
    }
  });
});
