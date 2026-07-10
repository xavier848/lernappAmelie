// POST /api/push/subscribe – speichert ein Push-Abo (Geraet meldet sich an).
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.json({ error: "Supabase fehlt." }, { status: 503 });
  }

  let body: {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
    profile?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Daten." }, { status: 400 });
  }

  if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    return NextResponse.json(
      { error: "Abo unvollständig." },
      { status: 400 }
    );
  }

  const supabase = createClient(url, anon, {
    auth: { persistSession: false },
  });
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      profile: body.profile ?? "amelie",
    },
    { onConflict: "endpoint" }
  );
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
