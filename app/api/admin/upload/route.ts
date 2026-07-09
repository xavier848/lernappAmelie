// POST /api/admin/upload – Bild in den Supabase-Storage-Bucket 'images'
// hochladen (FormData mit Feld 'file') und die oeffentliche URL zurueckgeben.
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

/** Dateinamen fuer den Storage-Pfad entschaerfen (nur a-z, 0-9, Punkt, Minus). */
function sanitizeName(name: string): string {
  const cleaned = name
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned.length > 0 ? cleaned : "datei";
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

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Ungueltige Anfrage. Bitte eine Datei als FormData senden." },
      { status: 400 }
    );
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: "Keine Datei gefunden. Bitte eine Bild-Datei auswaehlen." },
      { status: 400 }
    );
  }

  const path = `admin/${Date.now()}-${sanitizeName(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const uploadRes = await supabase.storage.from("images").upload(path, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (uploadRes.error) {
    return NextResponse.json(
      { error: `Upload fehlgeschlagen: ${uploadRes.error.message}` },
      { status: 500 }
    );
  }

  const { data } = supabase.storage.from("images").getPublicUrl(path);
  return NextResponse.json({ ok: true, url: data.publicUrl, path });
}
