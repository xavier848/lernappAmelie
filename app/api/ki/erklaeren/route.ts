// POST /api/ki/erklaeren – "Pony, erklaer's mir": erklaert eine falsch
// geloeste Uebung in Leichter Sprache. Antwort: text/plain als Stream.
import { erklaerenSchema } from "@/lib/ki/schemas";
import { erklaerAuftrag, erklaerSystem } from "@/lib/ki/prompts";
import { ladeLektionZuUebung } from "@/lib/ki/lektion";
import { FEHLER_TEXT } from "@/lib/ki/texte";
import { kiAktiv, kiStreamAntwort, kiTextAntwort, limitPruefen } from "@/lib/ki/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  if (!kiAktiv()) return kiTextAntwort("Die KI-Hilfe ist nicht eingerichtet.", 503);

  const parsed = erklaerenSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return kiTextAntwort("Ungültige Anfrage.", 400);
  const { exerciseId, given, nochmal } = parsed.data;

  let geladen;
  try {
    geladen = await ladeLektionZuUebung(exerciseId);
  } catch (error) {
    console.error("KI: Lektion konnte nicht geladen werden:", error);
    return kiTextAntwort(FEHLER_TEXT, 502);
  }
  if (!geladen) return kiTextAntwort("Diese Übung kenne ich nicht.", 404);

  const grund = await limitPruefen();
  if (grund) return kiTextAntwort(grund, 429);

  return kiStreamAntwort({
    art: "erklaeren",
    lessonSlug: geladen.lektion.slug,
    system: erklaerSystem(geladen.lektion, geladen.uebungen),
    messages: [
      {
        role: "user",
        content: erklaerAuftrag({
          uebung: geladen.uebungen[geladen.index],
          nr: geladen.index + 1,
          antwort: given,
          nochmal,
        }),
      },
    ],
    maxTokens: 3000,
  });
}
