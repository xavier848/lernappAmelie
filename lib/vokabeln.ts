// Vokabeltrainer mit Karteikarten (Mama, 2026-11-27).
//
// Die Vokabeln liegen als Stapel in content/vokabeln/<thema>.json. Ein Stapel
// gehoert zu einer Lektion des Themas und hat 4 bis 25 Karten. Jede Karte hat
// ein Wort in der Fremdsprache und ein deutsches Wort, dazu optional einen
// kurzen Hinweis (zum Beispiel das britische Wort). fremdAuch/deutschAuch
// sind weitere richtige Antworten fuer den Modus "Schreiben" (z. B. "cutlery"
// zu "utensils"); auf der Karte stehen sie nicht. Die Daten gehen mit der
// App aus - in der Datenbank steht nichts davon, und der Trainer schreibt
// auch nichts hinein.
import { z } from "zod";
import englischSchule from "@/content/vokabeln/englisch-schule.json";

const weitereAntworten = z.array(z.string().min(1)).min(1).optional();

const karteSchema = z.object({
  fremd: z.string().min(1),
  deutsch: z.string().min(1),
  hinweis: z.string().min(1).optional(),
  fremdAuch: weitereAntworten,
  deutschAuch: weitereAntworten,
});

const stapelSchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
    titel: z.string().min(1),
    icon: z.string().min(1),
    karten: z.array(karteSchema).min(4).max(25),
  })
  .superRefine((stapel, ctx) => {
    // Beide Richtungen muessen eindeutig sein: Sonst gaebe es bei
    // Deutsch -> Englisch zwei richtige Antworten auf dieselbe Karte.
    for (const seite of ["fremd", "deutsch"] as const) {
      const gesehen = new Set<string>();
      for (const karte of stapel.karten) {
        const wort = karte[seite].toLowerCase();
        if (gesehen.has(wort)) {
          ctx.addIssue({
            code: "custom",
            message: `Stapel ${stapel.slug}: "${karte[seite]}" steht doppelt (${seite}).`,
          });
        }
        gesehen.add(wort);
      }
    }
  });

export const sammlungSchema = z
  .object({
    thema: z.string().min(1),
    titel: z.string().min(1),
    sprache: z.string().min(2),
    spracheName: z.string().min(1),
    stapel: z.array(stapelSchema).min(1),
  })
  .superRefine((sammlung, ctx) => {
    const slugs = new Set<string>();
    for (const stapel of sammlung.stapel) {
      if (slugs.has(stapel.slug)) {
        ctx.addIssue({ code: "custom", message: `Stapel-Slug doppelt: ${stapel.slug}` });
      }
      slugs.add(stapel.slug);
    }
  });

export type Karte = z.infer<typeof karteSchema>;
export type Stapel = z.infer<typeof stapelSchema>;
export type Sammlung = z.infer<typeof sammlungSchema>;

/** Alle Vokabel-Sammlungen der App (eine pro Thema). */
export const SAMMLUNGEN: Sammlung[] = [sammlungSchema.parse(englischSchule)];

/** Die Vokabel-Sammlung zu einem Thema, falls es eine gibt. */
export function sammlungFuerThema(
  topicSlug: string | null | undefined,
): Sammlung | undefined {
  return SAMMLUNGEN.find((s) => s.thema === topicSlug);
}

/** Ein Stapel aus einer Sammlung, falls es ihn gibt. */
export function findeStapel(
  thema: string,
  stapelSlug: string,
): { sammlung: Sammlung; stapel: Stapel } | undefined {
  const sammlung = sammlungFuerThema(thema);
  const stapel = sammlung?.stapel.find((s) => s.slug === stapelSlug);
  return sammlung && stapel ? { sammlung, stapel } : undefined;
}
