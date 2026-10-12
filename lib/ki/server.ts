// Claude-Anbindung fuer die KI-Hilfen. NUR in API-Routen importieren:
// der API-Schluessel (ANTHROPIC_API_KEY) darf nie in den Browser.
//
// Kosten-Bremsen:
// - Tageslimit ueber alle Anfragen (KI_TAGESLIMIT, Standard 150), gezaehlt
//   in der Tabelle ki_nutzung. Ohne Service-Key zaehlt die laufende
//   Server-Instanz im Speicher mit (schwaecher, aber besser als nichts).
// - Hoechstens 12 Anfragen pro Minute und Instanz (faengt Endlosschleifen ab).
// - Kleine max_tokens, effort "low", Prompt-Caching fuer die Lektion.
import Anthropic from "@anthropic-ai/sdk";
import { supabaseService } from "@/lib/supabase";
import type { SystemBlock } from "./prompts";
import { ABLEHNUNG_TEXT, FEHLER_TEXT, LIMIT_TEXT, ZU_SCHNELL_TEXT } from "./texte";

export type KiArt = "erklaeren" | "pony";

/** Modell fuer beide Hilfen; per Umgebungsvariable KI_MODELL austauschbar. */
export const KI_MODELL = process.env.KI_MODELL || "claude-opus-5-5";

/** Modelle, die den serverseitigen Ersatz bei Ablehnung (fallbacks) kennen. */
const MIT_FALLBACK = new Set([
  "claude-opus-5-5",
  "claude-opus-5",
  "claude-fable-5-1",
  "claude-sonnet-5-5",
]);

const TAGESLIMIT = Number(process.env.KI_TAGESLIMIT) || 150;
const PRO_MINUTE = 12;

/** True, wenn ein API-Schluessel hinterlegt ist. */
export function kiAktiv(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let client: Anthropic | null = null;
function anthropic(): Anthropic {
  // Vercel bricht die Funktion nach maxDuration (60 s) ab; ein Wiederholversuch reicht.
  client ??= new Anthropic({ timeout: 50_000, maxRetries: 1 });
  return client;
}

// ---------------------------------------------------------------------------
// Limits
// ---------------------------------------------------------------------------

let speicher = { tag: "", anzahl: 0 };
const letzteMinute: number[] = [];

function utcTag(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Anfragen heute laut ki_nutzung; null, wenn die Tabelle nicht erreichbar ist. */
async function anzahlHeuteInDb(): Promise<number | null> {
  try {
    const { count, error } = await supabaseService()
      .from("ki_nutzung")
      .select("id", { count: "exact", head: true })
      .gte("created_at", `${utcTag()}T00:00:00Z`);
    return error ? null : (count ?? 0);
  } catch {
    return null; // kein Service-Key -> nur der Zaehler im Speicher
  }
}

/**
 * Prueft die Limits und zaehlt die Anfrage. Gibt einen Grund zurueck, wenn
 * die Anfrage abgelehnt werden muss, sonst null.
 */
export async function limitPruefen(): Promise<string | null> {
  const jetzt = Date.now();
  while (letzteMinute.length > 0 && jetzt - letzteMinute[0] > 60_000) {
    letzteMinute.shift();
  }
  if (letzteMinute.length >= PRO_MINUTE) {
    return ZU_SCHNELL_TEXT;
  }
  if (speicher.tag !== utcTag()) speicher = { tag: utcTag(), anzahl: 0 };
  const inDb = await anzahlHeuteInDb();
  if (Math.max(inDb ?? 0, speicher.anzahl) >= TAGESLIMIT) return LIMIT_TEXT;
  letzteMinute.push(jetzt);
  speicher.anzahl += 1;
  return null;
}

async function nutzungSpeichern(
  art: KiArt,
  lessonSlug: string,
  message: Anthropic.Beta.BetaMessage | null,
): Promise<void> {
  try {
    const usage = message?.usage;
    await supabaseService()
      .from("ki_nutzung")
      .insert({
        art,
        lesson_slug: lessonSlug,
        model: message?.model ?? KI_MODELL,
        input_tokens: usage?.input_tokens ?? 0,
        output_tokens: usage?.output_tokens ?? 0,
        cache_read_tokens: usage?.cache_read_input_tokens ?? 0,
        cache_write_tokens: usage?.cache_creation_input_tokens ?? 0,
        ok: message !== null && message.stop_reason !== "refusal",
      });
  } catch {
    // Protokoll ist Komfort - die Antwort an Amelie ist wichtiger.
  }
}

// ---------------------------------------------------------------------------
// Anfrage an Claude, Antwort als Text-Stream an den Browser
// ---------------------------------------------------------------------------

/**
 * Schickt die Anfrage an Claude und streamt nur den Antwort-Text (ohne
 * Denk-Bloecke) als text/plain an den Browser. Fehler kommen als
 * freundlicher Satz im Stream an, damit Amelie nie eine leere Blase sieht.
 */
export function kiStreamAntwort(p: {
  art: KiArt;
  lessonSlug: string;
  system: SystemBlock[];
  messages: Anthropic.Beta.BetaMessageParam[];
  maxTokens: number;
}): Response {
  const fallback = MIT_FALLBACK.has(KI_MODELL);
  const stream = anthropic().beta.messages.stream({
    model: KI_MODELL,
    // Denken zaehlt bei max_tokens mit; bei effort "low" bleibt es kurz.
    max_tokens: p.maxTokens,
    output_config: { effort: "low" },
    system: p.system,
    messages: p.messages,
    // Lehnt das Modell faelschlich ab, springt serverseitig ein anderes ein.
    ...(fallback
      ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const }
      : {}),
  });

  const encoder = new TextEncoder();
  // true, sobald der Stream zu ist - auch wenn der Browser abgebrochen hat.
  let geschlossen = false;
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      const senden = (text: string) => {
        if (geschlossen) return;
        try {
          controller.enqueue(encoder.encode(text));
        } catch {
          geschlossen = true;
        }
      };
      const schliessen = () => {
        if (geschlossen) return;
        geschlossen = true;
        try {
          controller.close();
        } catch {
          // schon zu
        }
      };
      stream.on("text", (delta) => senden(delta));
      stream
        .finalMessage()
        .then(async (message) => {
          if (message.stop_reason === "refusal") senden(`\n\n${ABLEHNUNG_TEXT}`);
          await nutzungSpeichern(p.art, p.lessonSlug, message);
          schliessen();
        })
        .catch(async (error: unknown) => {
          if (error instanceof Anthropic.APIUserAbortError) {
            schliessen();
            return;
          }
          if (error instanceof Anthropic.AuthenticationError) {
            console.error("KI: API-Schluessel ungueltig (ANTHROPIC_API_KEY pruefen).");
          } else if (error instanceof Anthropic.RateLimitError) {
            console.error("KI: Rate-Limit von Anthropic erreicht.");
          } else if (error instanceof Anthropic.APIError) {
            console.error(`KI: API-Fehler ${error.status}:`, error.message);
          } else {
            console.error("KI: unerwarteter Fehler:", error);
          }
          senden(FEHLER_TEXT);
          await nutzungSpeichern(p.art, p.lessonSlug, null);
          schliessen();
        });
    },
    cancel() {
      // Amelie hat das Fenster zugemacht - Anfrage abbrechen spart Tokens.
      geschlossen = true;
      stream.abort();
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}

/** Einfache Text-Antwort (z. B. Limit erreicht) im selben Format wie der Stream. */
export function kiTextAntwort(text: string, status = 200): Response {
  return new Response(text, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
