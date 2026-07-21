import { describe, expect, it } from "vitest";
import { groupTopicsByCategory, CATEGORIES } from "./categories";
import type { TopicWithLessons } from "@/lib/types";

function topic(slug: string): TopicWithLessons {
  return { id: slug, slug, title: slug, icon: "📘", sort: 0, published: true, lessons: [] } as unknown as TopicWithLessons;
}

describe("groupTopicsByCategory", () => {
  it("ordnet Themen ihren Bereichen zu und lässt leere weg", () => {
    const groups = groupTopicsByCategory([topic("badezimmer"), topic("englisch")]);
    expect(groups.map((g) => g.slug)).toEqual(["putzen-wohnen", "sprachen"]);
    expect(groups[0].topics.map((t) => t.slug)).toEqual(["badezimmer"]);
  });

  it("unbekannte Themen landen in 'Weitere Themen'", () => {
    const groups = groupTopicsByCategory([topic("badezimmer"), topic("neues-thema")]);
    const rest = groups.find((g) => g.slug === "sonstiges");
    expect(rest?.topics.map((t) => t.slug)).toEqual(["neues-thema"]);
  });

  it("jedes echte Thema ist genau einem Bereich zugeordnet (keine Dopplung)", () => {
    const seen = new Set<string>();
    for (const cat of CATEGORIES) {
      for (const slug of cat.topicSlugs) {
        expect(seen.has(slug)).toBe(false);
        seen.add(slug);
      }
    }
  });
});
