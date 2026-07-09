// POST /api/admin/login – Passwort pruefen, Session-Cookie setzen.
import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  SESSION_DURATION_MS,
  createToken,
} from "@/lib/admin-auth";

export const runtime = "nodejs";

/** Timing-sicherer String-Vergleich (ueber SHA-256, damit Laengen gleich sind). */
function safeEqual(a: string, b: string): boolean {
  const hashA = createHash("sha256").update(a).digest();
  const hashB = createHash("sha256").update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

export async function POST(req: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD ist nicht konfiguriert (.env.local)." },
      { status: 503 }
    );
  }

  let password = "";
  try {
    const body: unknown = await req.json();
    if (
      typeof body === "object" &&
      body !== null &&
      typeof (body as { password?: unknown }).password === "string"
    ) {
      password = (body as { password: string }).password;
    }
  } catch {
    return NextResponse.json(
      { error: "Ungueltige Anfrage. Bitte JSON mit { password } senden." },
      { status: 400 }
    );
  }

  if (!password || !safeEqual(password, adminPassword)) {
    return NextResponse.json(
      { error: "Das Passwort ist falsch." },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, createToken(adminPassword, Date.now()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });
  return res;
}
