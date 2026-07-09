// POST /api/admin/lesson-import – Lektion als JSON validieren und speichern.
// Ablauf: Zod-Validierung -> Thema per slug finden -> Lektion nach slug
// upserten (vorhandene Uebungen loeschen) -> Uebungen einfuegen (sort = index).
import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseService } from "@/lib/supabase";
import { lessonSchema } from "@/lib/content-schema";

export const runtime = "nodejs";

function getService(): SupabaseClient | null {
  try {
    return supabaseService();
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Das ist kein gueltiges JSON. Bitte pruefen." },
      { status: 400 }
    );
  }

  const parsed = lessonSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map(
      (issue) =>
        `${issue.path.length > 0 ? issue.path.join(".") : "lektion"}: ${issue.message}`
    );
    return NextResponse.json(
      { error: "Die Lektion ist nicht gueltig.", issues },
      { status: 400 }
    );
  }
  const lesson = parsed.data;

  // Erst NACH der Validierung wird die Datenbank gebraucht:
  // so gibt es Zod-Feedback auch, wenn der Service-Key (noch) fehlt.
  const supabase = getService();
  if (!supabase) {
    return NextResponse.json(
      {
        error:
          "Service-Key fehlt. Bitte SUPABASE_SERVICE_ROLE_KEY in .env.local eintragen.",
      },
      { status: 503 }
    );
  }

  // Thema per slug finden.
  const topicRes = await supabase
    .from("topics")
    .select("id")
    .eq("slug", lesson.topic_slug)
    .maybeSingle();
  if (topicRes.error) {
    return NextResponse.json(
      { error: `Datenbank-Fehler: ${topicRes.error.message}` },
      { status: 500 }
    );
  }
  if (!topicRes.data) {
    return NextResponse.json(
      {
        error: `Das Thema '${lesson.topic_slug}' gibt es nicht. Bitte topic_slug pruefen.`,
      },
      { status: 404 }
    );
  }
  const topicId = (topicRes.data as { id: string }).id;

  // Lektion nach slug upserten.
  const existingRes = await supabase
    .from("lessons")
    .select("id")
    .eq("slug", lesson.slug)
    .maybeSingle();
  if (existingRes.error) {
    return NextResponse.json(
      { error: `Datenbank-Fehler: ${existingRes.error.message}` },
      { status: 500 }
    );
  }

  let lessonId: string;
  let createdNew = false;

  if (existingRes.data) {
    lessonId = (existingRes.data as { id: string }).id;
    const updateRes = await supabase
      .from("lessons")
      .update({ topic_id: topicId, title: lesson.title, sort: lesson.sort })
      .eq("id", lessonId);
    if (updateRes.error) {
      return NextResponse.json(
        { error: `Datenbank-Fehler: ${updateRes.error.message}` },
        { status: 500 }
      );
    }
    // Vorhandene Uebungen loeschen (werden gleich neu eingefuegt).
    const deleteRes = await supabase
      .from("exercises")
      .delete()
      .eq("lesson_id", lessonId);
    if (deleteRes.error) {
      return NextResponse.json(
        { error: `Datenbank-Fehler: ${deleteRes.error.message}` },
        { status: 500 }
      );
    }
  } else {
    const insertRes = await supabase
      .from("lessons")
      .insert({
        topic_id: topicId,
        slug: lesson.slug,
        title: lesson.title,
        sort: lesson.sort,
      })
      .select("id")
      .single();
    if (insertRes.error || !insertRes.data) {
      return NextResponse.json(
        {
          error: `Datenbank-Fehler: ${insertRes.error?.message ?? "Lektion konnte nicht angelegt werden."}`,
        },
        { status: 500 }
      );
    }
    lessonId = (insertRes.data as { id: string }).id;
    createdNew = true;
  }

  // Uebungen einfuegen, sort = Position im Array.
  const exerciseRows = lesson.exercises.map((exercise, index) => ({
    lesson_id: lessonId,
    sort: index,
    type: exercise.type,
    data: exercise.data,
  }));
  const exercisesRes = await supabase.from("exercises").insert(exerciseRows);
  if (exercisesRes.error) {
    // Cleanup: eine frisch angelegte Lektion nicht halb gespeichert stehen lassen.
    if (createdNew) {
      await supabase.from("lessons").delete().eq("id", lessonId);
    }
    return NextResponse.json(
      {
        error: `Uebungen konnten nicht gespeichert werden: ${exercisesRes.error.message}`,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, lessonId });
}
