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

export type TopicWithLessons = TopicRow & { lessons: LessonRow[] };
