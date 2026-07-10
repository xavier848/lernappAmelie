// GET /api/push/send?slot=mittags|nachmittags|abends
// Wird vom Vercel-Cron aufgerufen und schickt allen angemeldeten Geraeten
// eine Erinnerung. Kann auch manuell mit ?secret=... zum Testen ausgeloest
// werden. Tote Abos (410/404) werden entfernt.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

export const runtime = "nodejs";

const MESSAGES: Record<string, { title: string; body: string }[]> = {
  mittags: [
    { title: "Zeit zum Lernen! 🐴", body: "Amelie, magst du eine kleine Übung machen?" },
    { title: "Kurze Lern-Pause? 📚", body: "Eine Aufgabe geht immer. Los geht's!" },
  ],
  nachmittags: [
    { title: "Weiter so! ⭐", body: "Ein paar Minuten üben hält dein Feuer am Brennen. 🔥" },
    { title: "Nachmittags-Übung 🧽", body: "Amelie, was klappt heute schon richtig gut?" },
  ],
  abends: [
    { title: "Noch schnell üben? 🌙", body: "Halte deine Tage-Serie am Leben, Amelie!" },
    { title: "Guten Abend! 💚", body: "Eine letzte Übung, dann hast du heute wieder was geschafft." },
  ],
};

function pickMessage(slot: string): { title: string; body: string } {
  const list = MESSAGES[slot] ?? MESSAGES.mittags;
  // Ohne Zufalls-API (im Build gesperrt): nach Wochentag rotieren.
  const day = new Date().getUTCDay();
  return list[day % list.length];
}

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // kein Secret gesetzt -> offen (Vercel-Cron ok)
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
    return NextResponse.json(
      { error: "Push-Konfiguration fehlt." },
      { status: 503 }
    );
  }

  webpush.setVapidDetails(
    "mailto:xavier@xavierhaas.com",
    publicKey,
    privateKey
  );

  const slot = req.nextUrl.searchParams.get("slot") ?? "mittags";
  const message = pickMessage(slot);
  const payload = JSON.stringify({ ...message, url: "/" });

  const supabase = createClient(url, anon, { auth: { persistSession: false } });
  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  let removed = 0;
  await Promise.all(
    (subs ?? []).map(async (s) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          },
          payload
        );
        sent += 1;
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          // Abo ist tot -> entfernen.
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("endpoint", s.endpoint);
          removed += 1;
        }
      }
    })
  );

  return NextResponse.json({ ok: true, slot, sent, removed });
}
