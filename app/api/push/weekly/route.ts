// GET /api/push/weekly
// Wöchentlicher Rückblick für MAMA: fasst Amelies letzte 7 Tage zusammen
// (an wie vielen Tagen geübt, wie viele Aufgaben, stärkster/schwächster
// Bereich) und schickt ihn als Push nur an Mamas Geräte (profile='mama').
// Wird vom Vercel-Cron (Sonntagabend) aufgerufen; manuell mit ?secret=…
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { computeReadiness } from "@/lib/exam";

export const runtime = "nodejs";

// Feste Geräte-ID von Amelie (siehe lib/device.ts).
const AMELIE_DEVICE_ID = "8ad172de-2bb9-4f6a-8de6-dc720b45b9c0";
const MIN_FOR_BEREICH = 4;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  if (req.nextUrl.searchParams.get("secret") === secret) return true;
  return false;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Nicht erlaubt." }, { status: 401 });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!url || !anon || !publicKey || !privateKey) {
    return NextResponse.json({ error: "Push-Konfiguration fehlt." }, { status: 503 });
  }
  webpush.setVapidDetails("mailto:xavier@xavierhaas.com", publicKey, privateKey);
  const supabase = createClient(url, anon, { auth: { persistSession: false } });

  const sinceIso = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const sinceDay = sinceIso.slice(0, 10);

  // Lerntage der letzten Woche.
  const activityRes = await supabase
    .from("daily_activity")
    .select("day")
    .eq("device_id", AMELIE_DEVICE_ID)
    .gte("day", sinceDay);
  const activeDays = (activityRes.data ?? []).length;

  // Versuche der letzten Woche.
  const attemptsRes = await supabase
    .from("exercise_attempts")
    .select("exercise_id, correct")
    .eq("device_id", AMELIE_DEVICE_ID)
    .gte("created_at", sinceIso);
  const attempts = (attemptsRes.data ?? []) as {
    exercise_id: string;
    correct: boolean;
  }[];

  let title: string;
  let body: string;

  if (attempts.length === 0 && activeDays === 0) {
    title = "Amelies Woche 📊";
    body = "Diese Woche hat Amelie noch nicht geübt. Vielleicht magst du sie ein bisschen motivieren? 💚";
  } else {
    // Stärkster/schwächster Bereich über exercise → lesson → topic → Kategorie.
    const exerciseIds = [...new Set(attempts.map((a) => a.exercise_id))];
    const attemptStats = new Map<string, { correct: number; wrong: number }>();
    for (const a of attempts) {
      const cur = attemptStats.get(a.exercise_id) ?? { correct: 0, wrong: 0 };
      if (a.correct) cur.correct++;
      else cur.wrong++;
      attemptStats.set(a.exercise_id, cur);
    }

    const exerciseToLesson = new Map<string, string>();
    const lessonToTopic = new Map<string, string>();
    if (exerciseIds.length > 0) {
      const exRes = await supabase
        .from("exercises")
        .select("id, lesson_id")
        .in("id", exerciseIds);
      const lessonIds = new Set<string>();
      for (const e of (exRes.data ?? []) as { id: string; lesson_id: string }[]) {
        exerciseToLesson.set(e.id, e.lesson_id);
        lessonIds.add(e.lesson_id);
      }
      if (lessonIds.size > 0) {
        const lessonRes = await supabase
          .from("lessons")
          .select("id, topic_id")
          .in("id", [...lessonIds]);
        const topicIds = new Set<string>();
        const lessonToTopicId = new Map<string, string>();
        for (const l of (lessonRes.data ?? []) as { id: string; topic_id: string }[]) {
          lessonToTopicId.set(l.id, l.topic_id);
          topicIds.add(l.topic_id);
        }
        const topicRes = await supabase
          .from("topics")
          .select("id, slug")
          .in("id", [...topicIds]);
        const topicIdToSlug = new Map<string, string>();
        for (const t of (topicRes.data ?? []) as { id: string; slug: string }[]) {
          topicIdToSlug.set(t.id, t.slug);
        }
        for (const [lessonId, topicId] of lessonToTopicId) {
          const slug = topicIdToSlug.get(topicId);
          if (slug) lessonToTopic.set(lessonId, slug);
        }
      }
    }

    const readiness = computeReadiness({
      attemptStats,
      exerciseToLesson,
      lessonToTopic,
    }).filter((r) => r.total >= MIN_FOR_BEREICH);

    let bereichSatz = "";
    if (readiness.length > 0) {
      const strongest = readiness.reduce((a, b) => (b.ratio > a.ratio ? b : a));
      const weakest = readiness.reduce((a, b) => (b.ratio < a.ratio ? b : a));
      bereichSatz = ` Stark in ${strongest.title}.`;
      if (weakest.slug !== strongest.slug) {
        bereichSatz += ` Üben lohnt sich noch in ${weakest.title}.`;
      }
    }

    title = "Amelies Woche 📊";
    body =
      `An ${activeDays} ${activeDays === 1 ? "Tag" : "Tagen"} geübt, ` +
      `${attempts.length} Aufgaben gemacht.${bereichSatz}`;
  }

  const payload = JSON.stringify({ title, body, url: "/amelie-fortschritt" });

  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("profile", "mama");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  let removed = 0;
  await Promise.all(
    (subs ?? []).map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload
        );
        sent += 1;
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await supabase.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
          removed += 1;
        }
      }
    })
  );

  return NextResponse.json({ ok: true, title, body, sent, removed });
}
