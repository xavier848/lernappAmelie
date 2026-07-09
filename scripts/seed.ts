// Seed-Skript: liest content/topics.json + content/lessons/**/*.json,
// validiert alles mit lessonSchema und schreibt idempotent nach Supabase.
//
// Aufrufe (mit npx tsx):
//   npx tsx scripts/seed.ts --check          nur validieren (keine env noetig)
//   npx tsx scripts/seed.ts                  validieren + in die DB seeden
//   npx tsx scripts/seed.ts --dir <pfad>     anderes Content-Verzeichnis nutzen
//
// Idempotent: topics/lessons werden per slug ge-upsertet, exercises je Lektion
// geloescht und neu eingefuegt (sort = Array-Index). Mehrfach ausfuehrbar.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { z, type ZodError } from "zod";
import { lessonSchema, type LessonInput } from "../lib/content-schema";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(SCRIPT_DIR, "..");

const EXERCISE_TYPES = [
  "steps_order",
  "multiple_choice",
  "match_pairs",
  "sort_buckets",
  "money_count",
  "budget",
] as const;

// ---------------------------------------------------------------------------
// Topics-Schema (content/topics.json)
// ---------------------------------------------------------------------------

export const topicsFileSchema = z
  .array(
    z.object({
      slug: z.string().min(1, "slug fehlt."),
      title: z.string().min(1, "title fehlt."),
      icon: z.string().min(1, "icon fehlt."),
      sort: z.number().int("sort muss eine ganze Zahl sein."),
    }),
  )
  .min(1, "topics.json braucht mindestens ein Thema.");

export type TopicEntry = z.infer<typeof topicsFileSchema>[number];

// ---------------------------------------------------------------------------
// Pure Helfer (getestet in scripts/seed.test.ts)
// ---------------------------------------------------------------------------

/** Mini-Dotenv-Parser (keine Dependency): KEY=VALUE je Zeile, # = Kommentar. */
export function parseEnvFile(content: string): Record<string, string> {
  const env: Record<string, string> = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim().replace(/^export\s+/, "");
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
      (value.startsWith("'") && value.endsWith("'") && value.length >= 2)
    ) {
      value = value.slice(1, -1);
    }
    if (key) env[key] = value;
  }
  return env;
}

/** Zod-Pfad huebsch machen: ["exercises", 0, "data", "options"] → "exercises[0].data.options" */
export function formatIssuePath(segments: PropertyKey[]): string {
  let out = "";
  for (const seg of segments) {
    if (typeof seg === "number") out += `[${seg}]`;
    else out += out ? `.${String(seg)}` : String(seg);
  }
  return out || "(root)";
}

/** Alle Issues eines ZodError als eingerueckte Liste. */
export function formatZodError(error: ZodError): string {
  return error.issues
    .map((issue) => `  - ${formatIssuePath(issue.path)}: ${issue.message}`)
    .join("\n");
}

/** Alle .json-Dateien unter dir rekursiv finden (sortiert, stabile Reihenfolge). */
export function findLessonFiles(dir: string): string[] {
  const files: string[] = [];
  const walk = (current: string) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith(".json")) files.push(full);
    }
  };
  walk(dir);
  return files;
}

export type ContentError = { file: string; message: string };

export type LoadResult = {
  topics: TopicEntry[];
  lessons: { file: string; lesson: LessonInput }[];
  errors: ContentError[];
  exerciseCount: number;
  typeCounts: Record<string, number>;
};

/**
 * Liest + validiert das komplette Content-Verzeichnis.
 * Sammelt ALLE Fehler (bricht nicht beim ersten ab).
 */
export function loadAndValidate(contentDir: string): LoadResult {
  const result: LoadResult = {
    topics: [],
    lessons: [],
    errors: [],
    exerciseCount: 0,
    typeCounts: {},
  };
  // 1. topics.json
  const topicsPath = path.join(contentDir, "topics.json");
  if (!fs.existsSync(topicsPath)) {
    result.errors.push({ file: "topics.json", message: `  - Datei nicht gefunden: ${topicsPath}` });
  } else {
    try {
      const parsed = topicsFileSchema.safeParse(JSON.parse(fs.readFileSync(topicsPath, "utf8")));
      if (parsed.success) {
        result.topics = parsed.data;
        const seen = new Set<string>();
        for (const topic of parsed.data) {
          if (seen.has(topic.slug)) {
            result.errors.push({ file: "topics.json", message: `  - slug doppelt: "${topic.slug}"` });
          }
          seen.add(topic.slug);
        }
      } else {
        result.errors.push({ file: "topics.json", message: formatZodError(parsed.error) });
      }
    } catch (err) {
      result.errors.push({ file: "topics.json", message: `  - JSON kaputt: ${(err as Error).message}` });
    }
  }

  // 2. Lektionen rekursiv einlesen und einzeln validieren
  const lessonsDir = path.join(contentDir, "lessons");
  if (!fs.existsSync(lessonsDir)) {
    result.errors.push({ file: "lessons/", message: `  - Verzeichnis nicht gefunden: ${lessonsDir}` });
    return result;
  }

  const topicSlugs = new Set(result.topics.map((t) => t.slug));
  const lessonSlugToFile = new Map<string, string>();

  for (const file of findLessonFiles(lessonsDir)) {
    const relFile = path.join("lessons", path.relative(lessonsDir, file));
    let raw: unknown;
    try {
      raw = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (err) {
      result.errors.push({ file: relFile, message: `  - JSON kaputt: ${(err as Error).message}` });
      continue;
    }

    const parsed = lessonSchema.safeParse(raw);
    if (!parsed.success) {
      result.errors.push({ file: relFile, message: formatZodError(parsed.error) });
      continue;
    }
    const lesson = parsed.data;

    // slug-Eindeutigkeit ueber alle Dateien
    const existingFile = lessonSlugToFile.get(lesson.slug);
    if (existingFile) {
      result.errors.push({
        file: relFile,
        message: `  - Lektions-slug "${lesson.slug}" doppelt (auch in ${existingFile}).`,
      });
      continue;
    }
    lessonSlugToFile.set(lesson.slug, relFile);

    // topic_slug muss in topics.json existieren
    if (result.topics.length > 0 && !topicSlugs.has(lesson.topic_slug)) {
      result.errors.push({
        file: relFile,
        message: `  - topic_slug "${lesson.topic_slug}" gibt es nicht in topics.json.`,
      });
      continue;
    }

    result.lessons.push({ file: relFile, lesson });
    result.exerciseCount += lesson.exercises.length;
    for (const exercise of lesson.exercises) {
      result.typeCounts[exercise.type] = (result.typeCounts[exercise.type] ?? 0) + 1;
    }
  }

  return result;
}

/** "OK: N Themen, M Lektionen, K Uebungen (Typ-Verteilung)" */
export function buildSummary(result: LoadResult): string {
  const distribution = EXERCISE_TYPES.filter((type) => (result.typeCounts[type] ?? 0) > 0)
    .map((type) => `${type}: ${result.typeCounts[type]}`)
    .join(", ");
  return (
    `OK: ${result.topics.length} Themen, ${result.lessons.length} Lektionen, ` +
    `${result.exerciseCount} Uebungen (${distribution || "keine"})`
  );
}

/** Fehler-Uebersicht fuer die Konsole. */
export function buildErrorReport(errors: ContentError[]): string {
  const byFile = new Map<string, string[]>();
  for (const error of errors) {
    const list = byFile.get(error.file) ?? [];
    list.push(error.message);
    byFile.set(error.file, list);
  }
  const blocks = [...byFile.entries()].map(([file, messages]) => `✗ ${file}\n${messages.join("\n")}`);
  return `Fehler in ${byFile.size} Datei(en):\n\n${blocks.join("\n\n")}`;
}

// ---------------------------------------------------------------------------
// Seed (nur ohne --check; Supabase wird dynamisch importiert)
// ---------------------------------------------------------------------------

function loadEnvLocal(): void {
  const envPath = path.join(ROOT_DIR, ".env.local");
  if (!fs.existsSync(envPath)) return;
  const parsed = parseEnvFile(fs.readFileSync(envPath, "utf8"));
  for (const [key, value] of Object.entries(parsed)) {
    if (process.env[key] === undefined || process.env[key] === "") {
      process.env[key] = value;
    }
  }
}

async function runSeed(result: LoadResult): Promise<void> {
  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    const missing = [
      !url ? "NEXT_PUBLIC_SUPABASE_URL" : null,
      !serviceKey ? "SUPABASE_SERVICE_ROLE_KEY" : null,
    ]
      .filter(Boolean)
      .join(" und ");
    console.error(
      `Fehler: ${missing} fehlt (in .env.local eintragen).\n` +
        `Den Service-Role-Key findest du im Supabase-Dashboard unter Project Settings → API.\n` +
        `Tipp: "npx tsx scripts/seed.ts --check" validiert die Inhalte auch OHNE Supabase-Zugang.`,
    );
    process.exit(1);
  }

  // Supabase erst hier importieren – im --check-Modus wird nichts davon geladen.
  const { createClient } = await import("@supabase/supabase-js");
  const db = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. Topics upserten (nach slug; published bleibt bei Updates unangetastet)
  const { error: topicsError } = await db
    .from("topics")
    .upsert(
      result.topics.map((t) => ({ slug: t.slug, title: t.title, icon: t.icon, sort: t.sort })),
      { onConflict: "slug" },
    );
  if (topicsError) {
    console.error(`Fehler beim Upsert der Themen: ${topicsError.message}`);
    process.exit(1);
  }
  console.log(`✓ ${result.topics.length} Themen upserted`);

  // topic_slug → topic_id aufloesen
  const { data: topicRows, error: topicReadError } = await db.from("topics").select("id, slug");
  if (topicReadError || !topicRows) {
    console.error(`Fehler beim Lesen der Themen: ${topicReadError?.message ?? "keine Daten"}`);
    process.exit(1);
  }
  const topicIdBySlug = new Map(topicRows.map((row) => [row.slug as string, row.id as string]));

  // 2. Lektionen upserten + exercises ersetzen (idempotent)
  for (const { file, lesson } of result.lessons) {
    const topicId = topicIdBySlug.get(lesson.topic_slug);
    if (!topicId) {
      console.error(`Fehler: Thema "${lesson.topic_slug}" fehlt in der DB (${file}).`);
      process.exit(1);
    }

    const { data: lessonRow, error: lessonError } = await db
      .from("lessons")
      .upsert(
        { slug: lesson.slug, title: lesson.title, sort: lesson.sort, topic_id: topicId },
        { onConflict: "slug" },
      )
      .select("id")
      .single();
    if (lessonError || !lessonRow) {
      console.error(`Fehler beim Upsert der Lektion "${lesson.slug}": ${lessonError?.message ?? "keine Daten"}`);
      process.exit(1);
    }

    const { error: deleteError } = await db.from("exercises").delete().eq("lesson_id", lessonRow.id);
    if (deleteError) {
      console.error(`Fehler beim Loeschen alter Uebungen von "${lesson.slug}": ${deleteError.message}`);
      process.exit(1);
    }

    const { error: insertError } = await db.from("exercises").insert(
      lesson.exercises.map((exercise, index) => ({
        lesson_id: lessonRow.id,
        sort: index,
        type: exercise.type,
        data: exercise.data,
      })),
    );
    if (insertError) {
      console.error(`Fehler beim Einfuegen der Uebungen von "${lesson.slug}": ${insertError.message}`);
      process.exit(1);
    }

    console.log(`✓ ${lesson.slug} (${lesson.exercises.length} Uebungen)`);
  }

  console.log(`\nFertig. ${buildSummary(result)}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const checkOnly = args.includes("--check");
  const dirIndex = args.indexOf("--dir");
  const contentDir =
    dirIndex !== -1 && args[dirIndex + 1]
      ? path.resolve(args[dirIndex + 1])
      : path.join(ROOT_DIR, "content");

  if (!fs.existsSync(contentDir)) {
    console.error(`Fehler: Content-Verzeichnis nicht gefunden: ${contentDir}`);
    process.exit(1);
  }

  console.log(`Content-Verzeichnis: ${contentDir}`);
  const result = loadAndValidate(contentDir);

  if (result.errors.length > 0) {
    console.error(buildErrorReport(result.errors));
    console.error(
      `\nAbbruch: ${result.lessons.length} Lektion(en) waeren gueltig, aber es gibt Fehler (siehe oben).`,
    );
    process.exit(1);
  }

  if (checkOnly) {
    console.log(buildSummary(result));
    return;
  }

  await runSeed(result);
}

// Nur ausfuehren, wenn direkt gestartet (nicht beim Import durch Vitest).
const isMain =
  typeof process.argv[1] === "string" &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  main().catch((err) => {
    console.error(`Unerwarteter Fehler: ${(err as Error).message}`);
    process.exit(1);
  });
}
