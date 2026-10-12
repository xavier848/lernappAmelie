// GET /api/ki/status – Ist die KI-Hilfe eingerichtet? Der Browser blendet
// die Pony-Knoepfe nur ein, wenn ein API-Schluessel hinterlegt ist.
import { NextResponse } from "next/server";
import { kiAktiv } from "@/lib/ki/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { aktiv: kiAktiv() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
