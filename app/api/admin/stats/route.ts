// GET /api/admin/stats – Dashboard-Daten fuer den Admin-Bereich.
// Liefert Zahlen (Lektionen, Streak, XP), den Themen-Baum inkl. unpublizierter
// Inhalte, schwierige Uebungen und die letzten Abschluesse.
import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseService } from "@/lib/supabase";
import { computeStreak } from "@/lib/streak";
import { berlinToday } from "@/lib/data";

export const runtime = "nodejs";

export type AdminStatsLesson = {
  id: string;
  slug: string;
  title: string;
  sort: number;
  published: boolean;
  stars: number | null;
};

export type AdminStatsTopic = {
  id: string;
  slug: string;
  title: string;
  icon: string;
  sort: number;
  published: boolean;
  lessons: AdminStatsLesson[];
};

export type AdminStatsDifficult = {
  exerciseId: string;
  prompt: string;
  lessonTitle: string;
  attempts: number;
  wrong: number;
  failRate: number;
};

export type AdminStatsRecent = {
  lessonId: string;
  lessonTitle: string;
  stars: number;
  xp: number;
  completedAt: string;
};

export type AdminStats = {
  totals: {
    lessons: number;
    lessonsPublished: number;
    lessonsCompleted: number;
    xp: number;
    streak: number;
  };
  topics: AdminStatsTopic[];
  difficult: AdminStatsDifficult[];
  recent: AdminStatsRecent[];
};

type TopicRowLite = {
  id: string;
  slug: string;
  title: string;
  icon: string;
  sort: number;
  published: boolean;
};

type LessonRowLite = {
  id: string;
  topic_id: string;
  slug: string;
  title: string;
  sort: number;
  published: boolean;
};

type ProgressRowLite = {
  lesson_id: string;
  stars: number;
  xp: number;
  completed_at: string;
};

type AttemptRowLite = { exercise_id: string; correct: boolean };

// Statistiken sind reine Lesezugriffe: mit Service-Key sieht man auch
// unpublizierte Inhalte, ohne reicht der Anon-Key (RLS erlaubt das Lesen
// von Fortschritt/Aktivität; unpublizierte Lektionen fehlen dann im Baum).
function getReadClient(): SupabaseClient | null {
  try {
    return supabaseService();
  } catch {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) return null;
    return createClient(url, anonKey, { auth: { persistSession: false } });
  }
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }
  const supabase = getReadClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase-Konfiguration fehlt (URL/Anon-Key)." },
      { status: 503 }
    );
  }

  const [topicsRes, lessonsRes, progressRes, activityRes, attemptsRes] =
    await Promise.all([
      supabase.from("topics").select("id, slug, title, icon, sort, published"),
      supabase
        .from("lessons")
        .select("id, topic_id, slug, title, sort, published"),
      supabase.from("progress").select("lesson_id, stars, xp, completed_at"),
      supabase.from("daily_activity").select("day, xp"),
      supabase.from("exercise_attempts").select("exercise_id, correct"),
    ]);

  const firstError =
    topicsRes.error ??
    lessonsRes.error ??
    progressRes.error ??
    activityRes.error ??
    attemptsRes.error;
  if (firstError) {
    return NextResponse.json(
      { error: `Datenbank-Fehler: ${firstError.message}` },
      { status: 500 }
    );
  }

  const topics = (topicsRes.data ?? []) as TopicRowLite[];
  const lessons = (lessonsRes.data ?? []) as LessonRowLite[];
  const progress = (progressRes.data ?? []) as ProgressRowLite[];
  const activity = (activityRes.data ?? []) as { day: string; xp: number }[];
  const attempts = (attemptsRes.data ?? []) as AttemptRowLite[];

  // Bestes Sterne-Ergebnis je Lektion (progress ist pro Geraet unique,
  // theoretisch mehrere Geraete -> max nehmen).
  const starsByLesson = new Map<string, number>();
  for (const p of progress) {
    const prev = starsByLesson.get(p.lesson_id) ?? 0;
    if (p.stars > prev) starsByLesson.set(p.lesson_id, p.stars);
  }

  const lessonById = new Map(lessons.map((l) => [l.id, l]));

  // Themen-Baum, beides nach sort sortiert.
  const topicsTree: AdminStatsTopic[] = [...topics]
    .sort((a, b) => a.sort - b.sort)
    .map((topic) => ({
      ...topic,
      lessons: lessons
        .filter((lesson) => lesson.topic_id === topic.id)
        .sort((a, b) => a.sort - b.sort)
        .map((lesson) => ({
          id: lesson.id,
          slug: lesson.slug,
          title: lesson.title,
          sort: lesson.sort,
          published: lesson.published,
          stars: starsByLesson.get(lesson.id) ?? null,
        })),
    }));

  // Streak + XP aus daily_activity.
  const streak = computeStreak(
    activity.map((a) => a.day),
    berlinToday()
  );
  const totalXp = activity.reduce((sum, a) => sum + a.xp, 0);

  // Schwierige Uebungen: Fehlerquote >= 40 % bei >= 3 Versuchen (in JS aggregiert).
  const byExercise = new Map<string, { total: number; wrong: number }>();
  for (const attempt of attempts) {
    const entry = byExercise.get(attempt.exercise_id) ?? { total: 0, wrong: 0 };
    entry.total += 1;
    if (!attempt.correct) entry.wrong += 1;
    byExercise.set(attempt.exercise_id, entry);
  }
  const difficultIds = [...byExercise.entries()]
    .filter(([, s]) => s.total >= 3 && s.wrong / s.total >= 0.4)
    .map(([id]) => id);

  let difficult: AdminStatsDifficult[] = [];
  if (difficultIds.length > 0) {
    const exercisesRes = await supabase
      .from("exercises")
      .select("id, lesson_id, data")
      .in("id", difficultIds);
    if (exercisesRes.error) {
      return NextResponse.json(
        { error: `Datenbank-Fehler: ${exercisesRes.error.message}` },
        { status: 500 }
      );
    }
    const exercises = (exercisesRes.data ?? []) as {
      id: string;
      lesson_id: string;
      data: { prompt?: string } | null;
    }[];
    difficult = exercises
      .map((exercise) => {
        const stats = byExercise.get(exercise.id) ?? { total: 0, wrong: 0 };
        return {
          exerciseId: exercise.id,
          prompt: exercise.data?.prompt ?? "(ohne Aufgabentext)",
          lessonTitle:
            lessonById.get(exercise.lesson_id)?.title ?? "(unbekannte Lektion)",
          attempts: stats.total,
          wrong: stats.wrong,
          failRate: stats.total > 0 ? stats.wrong / stats.total : 0,
        };
      })
      .sort((a, b) => b.failRate - a.failRate);
  }

  // Letzte Abschluesse (neueste zuerst, max. 10).
  const recent: AdminStatsRecent[] = [...progress]
    .sort((a, b) => b.completed_at.localeCompare(a.completed_at))
    .slice(0, 10)
    .map((p) => ({
      lessonId: p.lesson_id,
      lessonTitle: lessonById.get(p.lesson_id)?.title ?? "(unbekannte Lektion)",
      stars: p.stars,
      xp: p.xp,
      completedAt: p.completed_at,
    }));

  const stats: AdminStats = {
    totals: {
      lessons: lessons.length,
      lessonsPublished: lessons.filter((l) => l.published).length,
      lessonsCompleted: starsByLesson.size,
      xp: totalXp,
      streak,
    },
    topics: topicsTree,
    difficult,
    recent,
  };

  return NextResponse.json(stats);
}
