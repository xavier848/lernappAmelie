// DB-Row-Typen fuer die Supabase-Tabellen (Spec Abschnitt 6).

export type ExerciseType =
  | "steps_order"
  | "multiple_choice"
  | "match_pairs"
  | "sort_buckets"
  | "money_count"
  | "budget";

export type TopicRow = {
  id: string;
  slug: string;
  title: string;
  icon: string;
  sort: number;
  published: boolean;
};

export type LessonRow = {
  id: string;
  topic_id: string;
  slug: string;
  title: string;
  sort: number;
  published: boolean;
  created_at: string;
  /** Optionaler Einführungs-Text (Leichte Sprache), vor der ersten Übung. */
  intro: string | null;
};

export type ExerciseRow = {
  id: string;
  lesson_id: string;
  sort: number;
  type: ExerciseType;
  data: unknown;
};

export type ProgressRow = {
  id: string;
  device_id: string;
  lesson_id: string;
  stars: number;
  xp: number;
  completed_at: string;
};

/**
 * Lektion im Lernpfad. Bewusst OHNE `intro` und `created_at`: Der Lernpfad
 * laedt alle ~312 Lektionen auf einmal, und die Einfuehrungstexte machen
 * zusammen ein Vielfaches der uebrigen Daten aus. Gebraucht wird der Text
 * erst in der Lektion selbst (fetchLesson).
 */
export type PathLessonRow = Omit<LessonRow, "intro" | "created_at">;

export type TopicWithLessons = TopicRow & { lessons: PathLessonRow[] };
