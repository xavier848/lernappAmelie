import { describe, expect, it } from "vitest";
import {
  ADMIN_COOKIE,
  SESSION_DURATION_MS,
  createToken,
  verifyToken,
} from "@/lib/admin-auth";

const SECRET = "super-geheim";
const NOW = 1_750_000_000_000; // fixer Zeitpunkt in ms

describe("admin-auth Token", () => {
  it("Roundtrip: erzeugtes Token ist sofort gueltig", () => {
    const token = createToken(SECRET, NOW);
    expect(verifyToken(token, SECRET, NOW)).toBe(true);
  });

  it("Token hat das Format 'exp.hmachex'", () => {
    const token = createToken(SECRET, NOW);
    const [exp, sig] = token.split(".");
    expect(Number(exp)).toBe(NOW + SESSION_DURATION_MS);
    expect(sig).toMatch(/^[0-9a-f]{64}$/); // SHA-256 hex
  });

  it("ist kurz vor Ablauf noch gueltig", () => {
    const token = createToken(SECRET, NOW);
    expect(verifyToken(token, SECRET, NOW + SESSION_DURATION_MS - 1000)).toBe(
      true
    );
  });

  it("ist nach 30 Tagen abgelaufen", () => {
    const token = createToken(SECRET, NOW);
    expect(verifyToken(token, SECRET, NOW + SESSION_DURATION_MS)).toBe(false);
    expect(verifyToken(token, SECRET, NOW + SESSION_DURATION_MS + 1)).toBe(
      false
    );
  });

  it("falsches Secret wird abgelehnt", () => {
    const token = createToken(SECRET, NOW);
    expect(verifyToken(token, "anderes-passwort", NOW)).toBe(false);
  });

  it("manipulierte Ablaufzeit wird abgelehnt", () => {
    const token = createToken(SECRET, NOW);
    const [, sig] = token.split(".");
    const forged = `${NOW + SESSION_DURATION_MS * 100}.${sig}`;
    expect(verifyToken(forged, SECRET, NOW)).toBe(false);
  });

  it("Muell-Tokens werden abgelehnt", () => {
    expect(verifyToken("", SECRET, NOW)).toBe(false);
    expect(verifyToken("kein-punkt", SECRET, NOW)).toBe(false);
    expect(verifyToken("abc.def", SECRET, NOW)).toBe(false);
    expect(verifyToken(".nur-signatur", SECRET, NOW)).toBe(false);
    expect(verifyToken("123.", SECRET, NOW)).toBe(false);
  });

  it("Cookie-Name ist stabil", () => {
    expect(ADMIN_COOKIE).toBe("admin-session");
  });
});
