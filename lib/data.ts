// Datenzugriff fuer die App (Browser-Client, RLS-beschraenkt).
// Enthaelt zusaetzlich reine Helfer (Queue, Gruppierung, Datum) - die werden
// in lib/data.test.ts ohne Netzwerk getestet.
import { supabaseBrowser } from "@/lib/supabase";
import type {
  ExerciseRow,
  LessonRow,
  ProgressRow,
  TopicRow,
  TopicWithLessons,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Reine Helfer
// ---------------------------------------------------------------------------

/** localStorage-Schluessel fuer gepufferte Schreibvorgaenge (Offline-Queue). */
export const PENDING_WRITES_KEY = "lernapp-pending-writes";

export type PendingWrite =
  | {
      kind: "lessonResult";
      payload: { deviceId: string; lessonId: string; stars: number; xp: number };
    }
  | {
      kind: "dailyActivity";
      payload: { deviceId: string; xp: number; day: string };
    };

/** Liest die Offline-Queue. Kaputtes JSON oder fehlender Eintrag -> []. */
export function readPending(): PendingWrite[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(PENDING_WRITES_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PendingWrite[]) : [];
  } catch {
    return [];
  }
}

/** Haengt einen Schreibvorgang an die Offline-Queue an. */
export function enqueuePending(write: PendingWrite): void {
  if (typeof localStorage === "undefined") return;
  try {
    const queue = readPending();
    queue.push(write);
    localStorage.setItem(PENDING_WRITES_KEY, JSON.stringify(queue));
  } catch {
    // Speicher voll o. ae. - dann geht dieser eine Eintrag verloren, App laeuft weiter.
  }
}

/** Leert die Offline-Queue. */
export function clearPending(): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(PENDING_WRITES_KEY);
  } catch {
    // ignorieren
  }
}

/** Heutiges Datum (YYYY-MM-DD) in der Zeitzone Europe/Berlin. */
export function berlinToday(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(
    new Date()
  );
}

/**
 * Aggregiert Uebungs-Versuche zu einer Map exerciseId -> {correct, wrong}.
 * Pure Funktion - Basis fuer den Ueben-Modus (lib/practice.ts).
 */
export function aggregateAttemptStats(
  attempts: readonly { exercise_id: string; correct: boolean }[]
): Map<string, { correct: number; wrong: number }> {
  const stats = new Map<string, { correct: number; wrong: number }>();
  for (const attempt of attempts) {
    const entry = stats.get(attempt.exercise_id) ?? { correct: 0, wrong: 0 };
    if (attempt.correct) entry.correct += 1;
    else entry.wrong += 1;
    stats.set(attempt.exercise_id, entry);
  }
  return stats;
}

/**
 * Gruppiert Lektionen unter ihre Themen und sortiert beides nach `sort`.
 * Pure Funktion - veraendert die Eingaben nicht.
 */
export function groupLessonsByTopic(
  topics: TopicRow[],
  lessons: LessonRow[]
): TopicWithLessons[] {
  const sortedTopics = [...topics].sort((a, b) => a.sort - b.sort);
  const sortedLessons = [...lessons].sort((a, b) => a.sort - b.sort);
  return sortedTopics.map((topic) => ({
    ...topic,
    lessons: sortedLessons.filter((lesson) => lesson.topic_id === topic.id),
  }));
}

// ---------------------------------------------------------------------------
// Lese-Funktionen
// ---------------------------------------------------------------------------

/** Lernpfad: alle publizierten Themen mit ihren publizierten Lektionen, sortiert. */
export async function fetchPath(): Promise<TopicWithLessons[]> {
  const supabase = supabaseBrowser();
  const [topicsRes, lessonsRes] = await Promise.all([
    supabase.from("topics").select("*"),
    supabase.from("lessons").select("*"),
  ]);
  if (topicsRes.error) throw topicsRes.error;
  if (lessonsRes.error) throw lessonsRes.error;
  // RLS liefert ohnehin nur published-Zeilen; Sortierung/Gruppierung hier.
  return groupLessonsByTopic(
    (topicsRes.data ?? []) as TopicRow[],
    (lessonsRes.data ?? []) as LessonRow[]
  );
}

/** Eine Lektion mit ihren Uebungen (sortiert). null wenn nicht gefunden. */
export async function fetchLesson(
  slug: string
): Promise<{ lesson: LessonRow; exercises: ExerciseRow[] } | null> {
  const supabase = supabaseBrowser();
  const lessonRes = await supabase
    .from("lessons")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (lessonRes.error) throw lessonRes.error;
  if (!lessonRes.data) return null;
  const lesson = lessonRes.data as LessonRow;

  const exercisesRes = await supabase
    .from("exercises")
    .select("*")
    .eq("lesson_id", lesson.id)
    .order("sort", { ascending: true });
  if (exercisesRes.error) throw exercisesRes.error;

  return { lesson, exercises: (exercisesRes.data ?? []) as ExerciseRow[] };
}

/** Aller Fortschritt eines Geraets. */
export async function fetchProgress(deviceId: string): Promise<ProgressRow[]> {
  const supabase = supabaseBrowser();
  const res = await supabase
    .from("progress")
    .select("*")
    .eq("device_id", deviceId);
  if (res.error) throw res.error;
  return (res.data ?? []) as ProgressRow[];
}

/** Alle Tage (YYYY-MM-DD) mit Lern-Aktivitaet eines Geraets (Streak-Basis). */
export async function fetchActivityDays(deviceId: string): Promise<string[]> {
  const supabase = supabaseBrowser();
  const res = await supabase
    .from("daily_activity")
    .select("day")
    .eq("device_id", deviceId);
  if (res.error) throw res.error;
  return ((res.data ?? []) as { day: string }[]).map((row) => row.day);
}

/**
 * Tages-Aktivitaet mit XP - Quelle der Wahrheit fuer Streak UND Gesamt-XP
 * (zaehlt auch Ueben-Runden und Lektions-Wiederholungen, nicht nur die
 * Bestleistung pro Lektion).
 */
export async function fetchDailyActivity(
  deviceId: string,
): Promise<{ day: string; xp: number }[]> {
  const supabase = supabaseBrowser();
  const res = await supabase
    .from("daily_activity")
    .select("day, xp")
    .eq("device_id", deviceId);
  if (res.error) throw res.error;
  return (res.data ?? []) as { day: string; xp: number }[];
}

/**
 * Alle (publizierten) Uebungen der angegebenen Lektionen - Basis fuer den
 * Ueben-Modus. RLS liefert ohnehin nur publizierte Inhalte.
 */
export async function fetchExercisesForLessons(
  lessonIds: string[]
): Promise<ExerciseRow[]> {
  if (lessonIds.length === 0) return [];
  const supabase = supabaseBrowser();
  const res = await supabase
    .from("exercises")
    .select("*")
    .in("lesson_id", lessonIds);
  if (res.error) throw res.error;
  return (res.data ?? []) as ExerciseRow[];
}

/**
 * Versuchs-Statistik eines Geraets, aggregiert zu
 * Map exerciseId -> {correct, wrong} (fuer die Ueben-Auswahl).
 */
export async function fetchAttemptStats(
  deviceId: string
): Promise<Map<string, { correct: number; wrong: number }>> {
  const supabase = supabaseBrowser();
  const res = await supabase
    .from("exercise_attempts")
    .select("exercise_id, correct")
    .eq("device_id", deviceId);
  if (res.error) throw res.error;
  return aggregateAttemptStats(
    (res.data ?? []) as { exercise_id: string; correct: boolean }[]
  );
}

/**
 * Wie fetchAttemptStats, liefert aber zusaetzlich die Zuordnung
 * exerciseId -> lessonId (zweiter Query ueber die exercise-ids).
 * Basis fuer die Tages-Vorschlaege (lib/suggestions.ts).
 */
export async function fetchAttemptStatsWithLessons(deviceId: string): Promise<{
  stats: Map<string, { correct: number; wrong: number }>;
  exerciseToLesson: Map<string, string>;
}> {
  const supabase = supabaseBrowser();
  const attemptsRes = await supabase
    .from("exercise_attempts")
    .select("exercise_id, correct")
    .eq("device_id", deviceId);
  if (attemptsRes.error) throw attemptsRes.error;
  const attempts = (attemptsRes.data ?? []) as {
    exercise_id: string;
    correct: boolean;
  }[];
  const stats = aggregateAttemptStats(attempts);

  const exerciseToLesson = new Map<string, string>();
  const exerciseIds = [...stats.keys()];
  if (exerciseIds.length > 0) {
    const exercisesRes = await supabase
      .from("exercises")
      .select("id, lesson_id")
      .in("id", exerciseIds);
    if (exercisesRes.error) throw exercisesRes.error;
    for (const row of (exercisesRes.data ?? []) as {
      id: string;
      lesson_id: string;
    }[]) {
      exerciseToLesson.set(row.id, row.lesson_id);
    }
  }

  return { stats, exerciseToLesson };
}

// ---------------------------------------------------------------------------
// Schreib-Funktionen (mit Offline-Queue-Fallback)
// ---------------------------------------------------------------------------

/**
 * Kern von saveLessonResult (wirft bei Fehler).
 * Upsert auf unique(device_id, lesson_id) als select + insert/update,
 * damit das beste Ergebnis erhalten bleibt (stars = max(alt, neu)).
 */
async function writeLessonResult(p: {
  deviceId: string;
  lessonId: string;
  stars: number;
  xp: number;
}): Promise<void> {
  const supabase = supabaseBrowser();
  const existingRes = await supabase
    .from("progress")
    .select("*")
    .eq("device_id", p.deviceId)
    .eq("lesson_id", p.lessonId)
    .maybeSingle();
  if (existingRes.error) throw existingRes.error;
  const existing = existingRes.data as ProgressRow | null;

  if (!existing) {
    const insertRes = await supabase.from("progress").insert({
      device_id: p.deviceId,
      lesson_id: p.lessonId,
      stars: p.stars,
      xp: p.xp,
      completed_at: new Date().toISOString(),
    });
    if (insertRes.error) throw insertRes.error;
    return;
  }

  const updateRes = await supabase
    .from("progress")
    .update({
      stars: Math.max(existing.stars, p.stars),
      xp: Math.max(existing.xp, p.xp),
      completed_at: new Date().toISOString(),
    })
    .eq("id", existing.id);
  if (updateRes.error) throw updateRes.error;
}

/**
 * Speichert das Lektions-Ergebnis (bestes Ergebnis gewinnt).
 * Bei Netzfehler wird der Vorgang in die Offline-Queue gepuffert.
 */
export async function saveLessonResult(p: {
  deviceId: string;
  lessonId: string;
  stars: number;
  xp: number;
}): Promise<void> {
  try {
    await writeLessonResult(p);
  } catch {
    enqueuePending({ kind: "lessonResult", payload: p });
  }
}

/** Kern von bumpDailyActivity fuer einen bestimmten Tag (wirft bei Fehler). */
async function writeDailyActivity(
  deviceId: string,
  xp: number,
  day: string
): Promise<void> {
  const supabase = supabaseBrowser();
  const existingRes = await supabase
    .from("daily_activity")
    .select("xp")
    .eq("device_id", deviceId)
    .eq("day", day)
    .maybeSingle();
  if (existingRes.error) throw existingRes.error;

  if (!existingRes.data) {
    const insertRes = await supabase
      .from("daily_activity")
      .insert({ device_id: deviceId, day, xp });
    if (insertRes.error) throw insertRes.error;
    return;
  }

  const updateRes = await supabase
    .from("daily_activity")
    .update({ xp: (existingRes.data as { xp: number }).xp + xp })
    .eq("device_id", deviceId)
    .eq("day", day);
  if (updateRes.error) throw updateRes.error;
}

/**
 * Addiert XP auf den heutigen Tag (Europe/Berlin) - Streak-Basis.
 * Bei Netzfehler wird der Vorgang (mit dem heutigen Datum) gepuffert.
 */
export async function bumpDailyActivity(
  deviceId: string,
  xp: number
): Promise<void> {
  const day = berlinToday();
  try {
    await writeDailyActivity(deviceId, xp, day);
  } catch {
    enqueuePending({ kind: "dailyActivity", payload: { deviceId, xp, day } });
  }
}

/** Loggt einen Uebungs-Versuch. Fire-and-forget: Fehler werden geschluckt. */
export async function logAttempt(p: {
  deviceId: string;
  exerciseId: string;
  correct: boolean;
}): Promise<void> {
  try {
    const supabase = supabaseBrowser();
    await supabase.from("exercise_attempts").insert({
      device_id: p.deviceId,
      exercise_id: p.exerciseId,
      correct: p.correct,
    });
  } catch {
    // bewusst ignorieren - Statistik ist nicht kritisch
  }
}

/**
 * Reicht gepufferte Schreibvorgaenge nach (beim App-Start aufrufen).
 * Fehlgeschlagene Eintraege landen wieder in der Queue.
 */
export async function flushPendingWrites(): Promise<void> {
  const pending = readPending();
  if (pending.length === 0) return;
  clearPending();
  for (const write of pending) {
    try {
      if (write.kind === "lessonResult") {
        await writeLessonResult(write.payload);
      } else {
        await writeDailyActivity(
          write.payload.deviceId,
          write.payload.xp,
          write.payload.day
        );
      }
    } catch {
      enqueuePending(write);
    }
  }
}
