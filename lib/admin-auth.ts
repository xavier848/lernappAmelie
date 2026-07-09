// Admin-Session ohne Auth-Framework (Spec §4.5):
// HMAC-signiertes Token im HTTP-only-Cookie 'admin-session'.
// Secret = ADMIN_PASSWORD, Gueltigkeit 30 Tage.
//
// Laeuft NUR im Node-Runtime (API-Routes) - node:crypto ist dort verfuegbar.
import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

/** Name des Session-Cookies. */
export const ADMIN_COOKIE = "admin-session";

/** Session-Dauer: 30 Tage in Millisekunden. */
export const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Erzeugt ein Token im Format 'exp.hmachex'.
 * exp = Ablaufzeit in ms seit Epoch (nowMs + 30 Tage).
 */
export function createToken(secret: string, nowMs: number): string {
  const exp = String(nowMs + SESSION_DURATION_MS);
  return `${exp}.${sign(exp, secret)}`;
}

/**
 * Prueft Signatur (timing-safe) und Ablaufzeit eines Tokens.
 * Alles, was nicht exakt passt, ist ungueltig - keine Exceptions.
 */
export function verifyToken(
  token: string,
  secret: string,
  nowMs: number
): boolean {
  const dot = token.indexOf(".");
  if (dot <= 0 || dot === token.length - 1) return false;

  const expPart = token.slice(0, dot);
  const sigPart = token.slice(dot + 1);

  const exp = Number(expPart);
  if (!Number.isFinite(exp)) return false;

  // Vergleich als UTF-8-Bytes der Hex-Strings: timingSafeEqual verlangt
  // gleiche Laenge, deshalb vorher pruefen (Laenge ist kein Geheimnis).
  const expected = Buffer.from(sign(expPart, secret), "utf8");
  const given = Buffer.from(sigPart, "utf8");
  if (given.length !== expected.length) return false;
  if (!timingSafeEqual(given, expected)) return false;

  return exp > nowMs;
}

/**
 * Liest das Cookie 'admin-session' aus dem Request und prueft es
 * gegen ADMIN_PASSWORD. Jede Admin-Route ruft das ZUERST auf.
 */
export function requireAdmin(req: NextRequest): boolean {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) return false;
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return verifyToken(token, secret, Date.now());
}
