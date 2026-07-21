// Datenzugriff fuer die App (Browser-Client, RLS-beschraenkt).
// Enthaelt zusaetzlich reine Helfer (Queue, Gruppierung, Datum) - die werden
// in lib/data.test.ts ohne Netzwerk getestet.
import { supabaseBrowser } from "@/lib/supabase";
import type {
  ExerciseRow,
  LessonRow,
  PathLessonRow,
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
  lessons: PathLessonRow[]
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
  // Nur die Spalten holen, die der Lernpfad wirklich anzeigt. Vorher lud
  // select("*") auch alle Einfuehrungstexte mit (97 Lektionen a ~600
  // Zeichen) – auf der Startseite, wo sie niemand braucht.
  // `sort` und `icon` sind Pflicht: ohne sort sortiert groupLessonsByTopic
  // nach undefined, ohne icon fehlen die Emojis auf den Karten.
  const [topicsRes, lessonsRes] = await Promise.all([
    supabase.from("topics").select("id, slug, title, icon, sort, published"),
    supabase.from("lessons").select("id, topic_id, slug, title, sort, published"),
  ]);
  if (topicsRes.error) throw topicsRes.error;
  if (lessonsRes.error) throw lessonsRes.error;
  // RLS liefert ohnehin nur published-Zeilen; Sortierung/Gruppierung hier.
  return groupLessonsByTopic(
    (topicsRes.data ?? []) as TopicRow[],
    (lessonsRes.data ?? []) as PathLessonRow[]
  );
}

/** Eine Lektion mit ihren Uebungen (sortiert). null wenn nicht gefunden. */
export async function fetchLesson(
  slug: string
): Promise<{ lesson: LessonRow; exercises: ExerciseRow[] } | null> {
  const supabase = supabaseBrowser();
  // Lektion UND Uebungen in einer einzigen Abfrage holen. Vorher waren das
  // zwei Abfragen nacheinander – auf dem Handy im Mobilfunk kostet jeder
  // zusaetzliche Roundtrip spuerbar Zeit, bis die erste Aufgabe erscheint.
  const res = await supabase
    .from("lessons")
    .select("*, exercises(*)")
    .eq("slug", slug)
    .order("sort", { referencedTable: "exercises", ascending: true })
    .maybeSingle();
  if (res.error) throw res.error;
  if (!res.data) return null;

  const { exercises, ...lesson } = res.data as LessonRow & {
    exercises: ExerciseRow[] | null;
  };
  return {
    lesson: lesson as LessonRow,
    exercises: (exercises ?? []) as ExerciseRow[],
  };
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

/** Datum (YYYY-MM-DD, Europe/Berlin) eines UTC-Zeitstempels. */
export function berlinDateOf(ts: string): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(
    new Date(ts)
  );
}

/**
 * Anzahl VERSCHIEDENER Lektionen, die heute (Europe/Berlin) abgeschlossen
 * wurden. Grundlage fuer die Ponyweide: 3 Pferdeaepfel, jede neue Lektion
 * macht einen weg. (progress.completed_at wird beim Abschluss aktualisiert.)
 */
export async function fetchLessonsToday(
  deviceId: string,
  day: string
): Promise<number> {
  const supabase = supabaseBrowser();
  const res = await supabase
    .from("progress")
    .select("lesson_id, completed_at")
    .eq("device_id", deviceId);
  if (res.error) throw res.error;
  const ids = new Set<string>();
  for (const row of (res.data ?? []) as {
    lesson_id: string;
    completed_at: string | null;
  }[]) {
    if (row.completed_at && berlinDateOf(row.completed_at) === day) {
      ids.add(row.lesson_id);
    }
  }
  return ids.size;
}

/** Futter (Karotte/Heu), das Amelie dem Pony heute gegeben hat. */
export async function fetchFeeds(
  deviceId: string,
  day: string
): Promise<("karotte" | "heu" | "apfel")[]> {
  const supabase = supabaseBrowser();
  const res = await supabase
    .from("meadow_feeds")
    .select("item")
    .eq("device_id", deviceId)
    .eq("day", day);
  if (res.error) throw res.error;
  return ((res.data ?? []) as { item: "karotte" | "heu" | "apfel" }[]).map((r) => r.item);
}

/** Ein Stueck Futter aufs Feld legen (nach einer Lektion, wenn Weide sauber). */
export async function addFeed(
  deviceId: string,
  day: string,
  item: "karotte" | "heu" | "apfel"
): Promise<void> {
  const supabase = supabaseBrowser();
  const res = await supabase
    .from("meadow_feeds")
    .insert({ device_id: deviceId, day, item });
  if (res.error) throw res.error;
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

/** Uebungen anhand ihrer IDs laden (fuer die faellige Wiederholung). */
export async function fetchExercisesByIds(
  ids: string[]
): Promise<ExerciseRow[]> {
  if (ids.length === 0) return [];
  const supabase = supabaseBrowser();
  const res = await supabase.from("exercises").select("*").in("id", ids);
  if (res.error) throw res.error;
  return (res.data ?? []) as ExerciseRow[];
}

/** Alle Einzel-Versuche eines Geraets (mit Datum) - Basis fuer Spaced Repetition. */
export async function fetchAttemptsRaw(
  deviceId: string
): Promise<{ exercise_id: string; correct: boolean; created_at: string }[]> {
  const supabase = supabaseBrowser();
  const res = await supabase
    .from("exercise_attempts")
    .select("exercise_id, correct, created_at")
    .eq("device_id", deviceId);
  if (res.error) throw res.error;
  return (res.data ?? []) as {
    exercise_id: string;
    correct: boolean;
    created_at: string;
  }[];
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
  /** Einzel-Versuche mit Datum (Basis fuer die faellige Wiederholung). */
  attempts: { exercise_id: string; correct: boolean; created_at: string }[];
}> {
  const supabase = supabaseBrowser();
  // ACHTUNG, hier lag ein Ausfall in der Zukunft: Frueher wurden erst alle
  // Versuche geladen und dann die zugehoerigen Uebungen ueber eine Liste
  // ALLER Uebungs-IDs in der URL nachgeschlagen. Diese URL waechst mit jeder
  // geuebten Aufgabe (Amelie: 474 IDs ~ 17,6 KB) – ab rund 675 IDs lehnt der
  // Server sie mit HTTP 400 ab. Weil die Abfrage im Promise.all der
  // Startseite haengt, waeren Startseite, Pruefung, Wiederholen UND Mamas
  // Statistik gleichzeitig im Fehler-Screen gelandet.
  // Der Embed holt beides in einer Abfrage – ganz ohne Riesen-URL.
  // WICHTIG: Die Supabase-API liefert hoechstens 1000 Zeilen. Amelie hat
  // bereits mehr Versuche. Ohne Sortierung waeren das WILLKUERLICHE 1000 –
  // Statistik und faellige Wiederholung haetten also mit einer zufaelligen
  // Teilmenge gerechnet. Mit der Sortierung sind es die NEUESTEN 1000, und
  // genau die sind fuer beides massgeblich.
  // (Sauberer waere langfristig eine Aggregation in der Datenbank, damit
  // nicht bei jedem App-Start ~190 KB Rohdaten aufs Handy wandern.)
  const res = await supabase
    .from("exercise_attempts")
    .select("exercise_id, correct, created_at, exercises(lesson_id)")
    .eq("device_id", deviceId)
    .order("created_at", { ascending: false })
    .limit(1000);
  if (res.error) throw res.error;

  const rows = (res.data ?? []) as {
    exercise_id: string;
    correct: boolean;
    created_at: string;
    // Je nach Beziehung liefert PostgREST ein Objekt oder ein Array; bei
    // unveroeffentlichten Lektionen kann der Embed null sein.
    exercises: { lesson_id: string } | { lesson_id: string }[] | null;
  }[];

  // created_at kommt mit, damit die Startseite die faellige Wiederholung aus
  // denselben Zeilen berechnen kann und nicht dieselbe Tabelle ein zweites
  // Mal abfragen muss.
  const attempts = rows.map((r) => ({
    exercise_id: r.exercise_id,
    correct: r.correct,
    created_at: r.created_at,
  }));

  const stats = aggregateAttemptStats(attempts);

  const exerciseToLesson = new Map<string, string>();
  for (const row of rows) {
    const ex = Array.isArray(row.exercises) ? row.exercises[0] : row.exercises;
    if (ex?.lesson_id) exerciseToLesson.set(row.exercise_id, ex.lesson_id);
  }

  return { stats, exerciseToLesson, attempts };
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
  /** Was angeklickt wurde (v. a. bei falschen Antworten, fuer die Statistik). */
  given?: string;
}): Promise<void> {
  try {
    const supabase = supabaseBrowser();
    await supabase.from("exercise_attempts").insert({
      device_id: p.deviceId,
      exercise_id: p.exerciseId,
      correct: p.correct,
      given: p.given ?? null,
    });
  } catch {
    // bewusst ignorieren - Statistik ist nicht kritisch
  }
}

/**
 * Falsche Antworten (mit angeklicktem Wert) zu bestimmten Uebungen — fuer
 * die Detail-Ansicht in Mamas Statistik ("was hat Amelie geklickt?").
 * Liefert Map exerciseId -> Liste der gegebenen (falschen) Antworten.
 */
export async function fetchWrongAnswers(
  deviceId: string,
  exerciseIds: string[]
): Promise<Map<string, string[]>> {
  const result = new Map<string, string[]>();
  if (exerciseIds.length === 0) return result;
  const supabase = supabaseBrowser();
  const res = await supabase
    .from("exercise_attempts")
    .select("exercise_id, given")
    .eq("device_id", deviceId)
    .eq("correct", false)
    .in("exercise_id", exerciseIds);
  if (res.error) throw res.error;
  for (const row of (res.data ?? []) as {
    exercise_id: string;
    given: string | null;
  }[]) {
    if (!row.given) continue;
    const list = result.get(row.exercise_id) ?? [];
    if (!list.includes(row.given)) list.push(row.given);
    result.set(row.exercise_id, list);
  }
  return result;
}

/**
 * Reicht gepufferte Schreibvorgaenge nach (beim App-Start aufrufen).
 * Fehlgeschlagene Eintraege landen wieder in der Queue.
 */
export async function flushPendingWrites(): Promise<boolean> {
  const pending = readPending();
  if (pending.length === 0) return false;
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
  return true;
}

/**
 * Kompletter Neustart (Reset-Button im Profil): loescht Fortschritt,
 * Versuchs-Statistik und Tages-Aktivitaet dieses Geraets in Supabase und
 * raeumt den localStorage auf (inkl. Geraete-ID - beim naechsten Laden
 * beginnt alles bei null).
 */
export async function resetDeviceData(deviceId: string): Promise<void> {
  const supabase = supabaseBrowser();
  const results = await Promise.all([
    supabase.from("exercise_attempts").delete().eq("device_id", deviceId),
    supabase.from("progress").delete().eq("device_id", deviceId),
    supabase.from("daily_activity").delete().eq("device_id", deviceId),
    supabase.from("meadow_feeds").delete().eq("device_id", deviceId),
  ]);
  const firstError = results.find((r) => r.error)?.error;
  if (firstError) throw firstError;
  try {
    localStorage.removeItem(PENDING_WRITES_KEY);
    localStorage.removeItem("lernapp-device-id");
    localStorage.removeItem("lernapp-device-registered");
  } catch {
    // localStorage nicht verfuegbar - macht nichts
  }
}

/**
 * Speichert eine Notiz/Fehlermeldung (v. a. von Mama im Pruef-Modus).
 * Fire-and-forget mit Fehler-Weitergabe, damit die UI eine Bestaetigung
 * zeigen kann.
 */
export async function submitFeedback(f: {
  profile: string;
  lessonSlug?: string;
  exerciseIndex?: number;
  exercisePrompt?: string;
  note: string;
}): Promise<void> {
  const supabase = supabaseBrowser();
  const res = await supabase.from("feedback").insert({
    profile: f.profile,
    lesson_slug: f.lessonSlug ?? null,
    exercise_index: f.exerciseIndex ?? null,
    exercise_prompt: f.exercisePrompt ?? null,
    note: f.note,
  });
  if (res.error) throw res.error;
}
