import { describe, it, expect } from "vitest";
import { erklaerenSchema, MAX_FRAGE_ZEICHEN, MAX_VERLAUF, ponySchema } from "./schemas";

const id = "6f1c2a7e-3b4d-4e5f-8a9b-0c1d2e3f4a5b";

describe("erklaerenSchema", () => {
  it("nimmt eine Uebungs-ID und setzt nochmal=false als Standard", () => {
    expect(erklaerenSchema.parse({ exerciseId: id })).toEqual({ exerciseId: id, nochmal: false });
  });

  it("lehnt fremde IDs und zu lange Antworten ab", () => {
    expect(erklaerenSchema.safeParse({ exerciseId: "abc" }).success).toBe(false);
    expect(erklaerenSchema.safeParse({ exerciseId: id, given: "x".repeat(301) }).success).toBe(false);
  });
});

describe("ponySchema", () => {
  const frage = (content: string) => ({ role: "user" as const, content });
  const antwort = (content: string) => ({ role: "assistant" as const, content });

  it("akzeptiert einen abwechselnden Verlauf, der mit einer Frage endet", () => {
    const ok = ponySchema.safeParse({
      lessonSlug: "hygiene-haende",
      messages: [frage("Was ist das?"), antwort("Das ist ..."), frage("Und warum?")],
    });
    expect(ok.success).toBe(true);
  });

  it("lehnt kaputte Verlaeufe ab", () => {
    const schlecht = [
      [antwort("Hallo"), frage("Hi")],
      [frage("a"), antwort("b")],
      [frage("a"), frage("b")],
      [frage("   ")],
      [frage("x".repeat(MAX_FRAGE_ZEICHEN + 1))],
      [],
    ];
    for (const messages of schlecht) {
      expect(ponySchema.safeParse({ lessonSlug: "hygiene-haende", messages }).success).toBe(false);
    }
  });

  it("begrenzt die Laenge des Verlaufs", () => {
    const lang = Array.from({ length: MAX_VERLAUF + 1 }, (_, i) =>
      i % 2 === 0 ? frage(`Frage ${i}`) : antwort(`Antwort ${i}`),
    );
    expect(ponySchema.safeParse({ lessonSlug: "x", messages: lang }).success).toBe(false);
  });

  it("nimmt nur echte Slugs", () => {
    for (const lessonSlug of ["", "../geheim", "Hygiene Haende", "a".repeat(121)]) {
      expect(ponySchema.safeParse({ lessonSlug, messages: [frage("Hi")] }).success).toBe(false);
    }
  });
});
