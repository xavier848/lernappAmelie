// POST /api/admin/toggle-publish – Lektion oder Thema (un)veroeffentlichen.
// Body: { kind: 'lesson' | 'topic', id: string, published: boolean }
import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseService } from "@/lib/supabase";

export const runtime = "nodejs";

function getService(): SupabaseClient | null {
  try {
    return supabaseService();
  } catch {
    return null;
  }
}

type ToggleBody = { kind: "lesson" | "topic"; id: string; published: boolean };

function parseBody(raw: unknown): ToggleBody | null {
  if (typeof raw !== "object" || raw === null) return null;
  const body = raw as Record<string, unknown>;
  if (body.kind !== "lesson" && body.kind !== "topic") return null;
  if (typeof body.id !== "string" || body.id.length === 0) return null;
  if (typeof body.published !== "boolean") return null;
  return { kind: body.kind, id: body.id, published: body.published };
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }
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

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    raw = null;
  }
  const body = parseBody(raw);
  if (!body) {
    return NextResponse.json(
      {
        error:
          "Ungueltige Anfrage. Erwartet: { kind: 'lesson' | 'topic', id, published }.",
      },
      { status: 400 }
    );
  }

  const table = body.kind === "topic" ? "topics" : "lessons";
  const updateRes = await supabase
    .from(table)
    .update({ published: body.published })
    .eq("id", body.id)
    .select("id");
  if (updateRes.error) {
    return NextResponse.json(
      { error: `Datenbank-Fehler: ${updateRes.error.message}` },
      { status: 500 }
    );
  }
  if (!updateRes.data || updateRes.data.length === 0) {
    return NextResponse.json(
      { error: "Eintrag nicht gefunden. Bitte id pruefen." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}
