// Tests fuer die puren Helfer des Seed-Skripts (scripts/seed.ts).
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  parseEnvFile,
  formatIssuePath,
  formatZodError,
  findLessonFiles,
  loadAndValidate,
  buildSummary,
  buildErrorReport,
  topicsFileSchema,
} from "./seed";

// ---------------------------------------------------------------------------
// Fixture-Helfer: temporaeres Content-Verzeichnis bauen
// ---------------------------------------------------------------------------

let fixtureDir: string;

beforeEach(() => {
  fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), "seed-fixture-"));
});

afterEach(() => {
  fs.rmSync(fixtureDir, { recursive: true, force: true });
});

function writeJson(relPath: string, data: unknown): void {
  const full = path.join(fixtureDir, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, JSON.stringify(data, null, 2));
}

function writeRaw(relPath: string, content: string): void {
  const full = path.join(fixtureDir, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}

const validTopics = [
  { slug: "putzen", title: "Putzen", icon: "🧽", sort: 10 },
  { slug: "geld", title: "Geld", icon: "💶", sort: 20 },
];

function validLesson(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    topic_slug: "putzen",
    slug: "putzen-1",
    title: "Putzen lernen",
    sort: 1,
    exercises: [
      {
        type: "multiple_choice",
        data: {
          prompt: "Womit putzt du den Spiegel?",
          options: [{ text: "Glasreiniger", correct: true }, { text: "Shampoo" }],
        },
      },
      {
        type: "steps_order",
        data: {
          prompt: "Bringe die Schritte in die richtige Reihenfolge.",
          steps: [{ text: "Putzmittel holen." }, { text: "Putzen." }],
        },
      },
    ],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// parseEnvFile
// ---------------------------------------------------------------------------

describe("parseEnvFile", () => {
  it("liest KEY=VALUE-Zeilen", () => {
    const env = parseEnvFile("A=1\nNEXT_PUBLIC_SUPABASE_URL=https://x.supabase.co\n");
    expect(env).toEqual({ A: "1", NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co" });
  });

  it("ignoriert Kommentare und leere Zeilen", () => {
    const env = parseEnvFile("# Kommentar\n\nA=1\n  # noch einer\nB=2");
    expect(env).toEqual({ A: "1", B: "2" });
  });

  it("entfernt umschliessende Anfuehrungszeichen", () => {
    const env = parseEnvFile(`A="hallo welt"\nB='x'\n`);
    expect(env).toEqual({ A: "hallo welt", B: "x" });
  });

  it("behaelt = im Wert (z. B. Base64-Keys)", () => {
    const env = parseEnvFile("KEY=abc==def");
    expect(env.KEY).toBe("abc==def");
  });

  it("ignoriert Zeilen ohne =", () => {
    expect(parseEnvFile("nur text\n=leerer key\nA=1")).toEqual({ A: "1" });
  });
});

// ---------------------------------------------------------------------------
// formatIssuePath / formatZodError
// ---------------------------------------------------------------------------

describe("formatIssuePath", () => {
  it("verbindet Strings mit Punkt und Zahlen mit Klammern", () => {
    expect(formatIssuePath(["exercises", 0, "data", "options"])).toBe("exercises[0].data.options");
  });

  it("leerer Pfad wird (root)", () => {
    expect(formatIssuePath([])).toBe("(root)");
  });
});

describe("formatZodError", () => {
  it("listet jede Issue mit Pfad und Message", () => {
    const parsed = topicsFileSchema.safeParse([{ slug: "", title: "T", icon: "x", sort: 1.5 }]);
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    const text = formatZodError(parsed.error);
    expect(text).toContain("[0].slug: slug fehlt.");
    expect(text).toContain("[0].sort: sort muss eine ganze Zahl sein.");
    for (const line of text.split("\n")) {
      expect(line).toMatch(/^ {2}- /);
    }
  });
});

// ---------------------------------------------------------------------------
// findLessonFiles
// ---------------------------------------------------------------------------

describe("findLessonFiles", () => {
  it("findet .json rekursiv und sortiert, ignoriert andere Dateien", () => {
    writeJson("lessons/b-thema/lektion-2.json", {});
    writeJson("lessons/a-thema/lektion-1.json", {});
    writeJson("lessons/a-thema/tief/lektion-0.json", {});
    writeRaw("lessons/a-thema/notizen.txt", "kein json");
    const files = findLessonFiles(path.join(fixtureDir, "lessons")).map((f) =>
      path.relative(path.join(fixtureDir, "lessons"), f),
    );
    expect(files).toEqual([
      path.join("a-thema", "lektion-1.json"),
      path.join("a-thema", "tief", "lektion-0.json"),
      path.join("b-thema", "lektion-2.json"),
    ]);
  });
});

// ---------------------------------------------------------------------------
// loadAndValidate
// ---------------------------------------------------------------------------

describe("loadAndValidate", () => {
  it("gueltiges Verzeichnis: zaehlt Themen, Lektionen, Uebungen und Typen", () => {
    writeJson("topics.json", validTopics);
    writeJson("lessons/putzen/putzen-1.json", validLesson());
    writeJson(
      "lessons/geld/geld-1.json",
      validLesson({
        topic_slug: "geld",
        slug: "geld-1",
        exercises: [
          {
            type: "money_count",
            data: { prompt: "Lege 2,80 €.", mode: "assemble", target: 280 },
          },
        ],
      }),
    );

    const result = loadAndValidate(fixtureDir);
    expect(result.errors).toEqual([]);
    expect(result.topics).toHaveLength(2);
    expect(result.lessons).toHaveLength(2);
    expect(result.exerciseCount).toBe(3);
    expect(result.typeCounts).toEqual({ multiple_choice: 1, steps_order: 1, money_count: 1 });
  });

  it("sammelt Zod-Fehler je Datei statt beim ersten abzubrechen", () => {
    writeJson("topics.json", validTopics);
    // Fehler 1: multiple_choice ohne correct-Option
    writeJson(
      "lessons/putzen/kaputt-1.json",
      validLesson({
        slug: "kaputt-1",
        exercises: [
          {
            type: "multiple_choice",
            data: { prompt: "Frage?", options: [{ text: "A" }, { text: "B" }] },
          },
        ],
      }),
    );
    // Fehler 2: money_count change mit given <= price
    writeJson(
      "lessons/putzen/kaputt-2.json",
      validLesson({
        slug: "kaputt-2",
        exercises: [
          {
            type: "money_count",
            data: { prompt: "Rueckgeld?", mode: "change", price: 500, given: 500 },
          },
        ],
      }),
    );
    writeJson("lessons/putzen/ok.json", validLesson({ slug: "ok-1" }));

    const result = loadAndValidate(fixtureDir);
    expect(result.errors).toHaveLength(2);
    expect(result.errors.map((e) => e.file).sort()).toEqual([
      path.join("lessons", "putzen", "kaputt-1.json"),
      path.join("lessons", "putzen", "kaputt-2.json"),
    ]);
    expect(result.errors[0].message).toContain("Genau eine Option muss correct: true haben.");
    expect(result.lessons).toHaveLength(1);
    expect(result.lessons[0].lesson.slug).toBe("ok-1");
  });

  it("meldet kaputtes JSON mit Dateiname", () => {
    writeJson("topics.json", validTopics);
    writeRaw("lessons/putzen/kaputt.json", "{ nicht json !!!");
    const result = loadAndValidate(fixtureDir);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].file).toBe(path.join("lessons", "putzen", "kaputt.json"));
    expect(result.errors[0].message).toContain("JSON kaputt");
  });

  it("meldet doppelte Lektions-slugs mit beiden Dateien", () => {
    writeJson("topics.json", validTopics);
    writeJson("lessons/putzen/a.json", validLesson({ slug: "doppelt" }));
    writeJson("lessons/putzen/b.json", validLesson({ slug: "doppelt" }));
    const result = loadAndValidate(fixtureDir);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain('"doppelt" doppelt');
    expect(result.errors[0].message).toContain(path.join("lessons", "putzen", "a.json"));
    expect(result.lessons).toHaveLength(1);
  });

  it("meldet unbekannten topic_slug", () => {
    writeJson("topics.json", validTopics);
    writeJson("lessons/x/x-1.json", validLesson({ slug: "x-1", topic_slug: "gibt-es-nicht" }));
    const result = loadAndValidate(fixtureDir);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain('topic_slug "gibt-es-nicht"');
    expect(result.lessons).toHaveLength(0);
  });

  it("meldet doppelte Topic-slugs in topics.json", () => {
    writeJson("topics.json", [...validTopics, { slug: "putzen", title: "Nochmal", icon: "x", sort: 99 }]);
    writeJson("lessons/putzen/putzen-1.json", validLesson());
    const result = loadAndValidate(fixtureDir);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].file).toBe("topics.json");
    expect(result.errors[0].message).toContain('slug doppelt: "putzen"');
  });

  it("meldet fehlende topics.json und fehlendes lessons/", () => {
    const result = loadAndValidate(fixtureDir);
    expect(result.errors.map((e) => e.file)).toEqual(["topics.json", "lessons/"]);
  });
});

// ---------------------------------------------------------------------------
// buildSummary / buildErrorReport
// ---------------------------------------------------------------------------

describe("buildSummary", () => {
  it("baut die OK-Zeile mit Typ-Verteilung in fester Reihenfolge", () => {
    writeJson("topics.json", validTopics);
    writeJson("lessons/putzen/putzen-1.json", validLesson());
    const result = loadAndValidate(fixtureDir);
    expect(buildSummary(result)).toBe(
      "OK: 2 Themen, 1 Lektionen, 2 Uebungen (steps_order: 1, multiple_choice: 1)",
    );
  });
});

describe("buildErrorReport", () => {
  it("gruppiert Fehler pro Datei", () => {
    const report = buildErrorReport([
      { file: "a.json", message: "  - Fehler 1" },
      { file: "a.json", message: "  - Fehler 2" },
      { file: "b.json", message: "  - Fehler 3" },
    ]);
    expect(report).toContain("Fehler in 2 Datei(en):");
    expect(report).toContain("✗ a.json\n  - Fehler 1\n  - Fehler 2");
    expect(report).toContain("✗ b.json\n  - Fehler 3");
  });
});
