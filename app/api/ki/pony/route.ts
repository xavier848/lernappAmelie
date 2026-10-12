// POST /api/ki/pony – "Frag das Pony": Amelie stellt Fragen zur Lektion.
// Der Verlauf kommt vom Browser (nur Text, ohne Denk-Bloecke), die Lektion
// laedt der Server selbst. Antwort: text/plain als Stream.
import { ponySchema } from "@/lib/ki/schemas";
import { ponySystem } from "@/lib/ki/prompts";
import { ladeLektion } from "@/lib/ki/lektion";
import { FEHLER_TEXT } from "@/lib/ki/texte";
import { kiAktiv, kiStreamAntwort, kiTextAntwort, limitPruefen } from "@/lib/ki/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  if (!kiAktiv()) return kiTextAntwort("Die KI-Hilfe ist nicht eingerichtet.", 503);

  const parsed = ponySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return kiTextAntwort("Ungültige Anfrage.", 400);
  const { lessonSlug, messages } = parsed.data;

  let geladen;
  try {
    geladen = await ladeLektion(lessonSlug);
  } catch (error) {
    console.error("KI: Lektion konnte nicht geladen werden:", error);
    return kiTextAntwort(FEHLER_TEXT, 502);
  }
  if (!geladen) return kiTextAntwort("Diese Lektion kenne ich nicht.", 404);

  const grund = await limitPruefen();
  if (grund) return kiTextAntwort(grund, 429);

  return kiStreamAntwort({
    art: "pony",
    lessonSlug,
    system: ponySystem(geladen.lektion, geladen.uebungen),
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    maxTokens: 3000,
  });
}
