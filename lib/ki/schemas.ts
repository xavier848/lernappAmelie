// Eingaben der KI-Routen. Alles, was vom Browser kommt, ist ungeprueft:
// Laengen und Anzahl sind begrenzt, damit niemand die Routen als
// kostenlosen Chatbot mit riesigen Texten missbraucht.
import { z } from "zod";

/** Hoechstlaenge einer Chat-Nachricht von Amelie (Zeichen). */
export const MAX_FRAGE_ZEICHEN = 400;
/** Hoechstlaenge einer Pony-Antwort im mitgeschickten Verlauf (Zeichen). */
export const MAX_ANTWORT_ZEICHEN = 2500;
/** So viele Nachrichten (Amelie + Pony) schickt der Chat hoechstens mit. */
export const MAX_VERLAUF = 16;

export const erklaerenSchema = z.object({
  exerciseId: z.uuid(),
  /** Was Amelie geantwortet hat (ExerciseResult.given), optional. */
  given: z.string().max(300).optional(),
  /** true = sie probiert die Uebung gleich nochmal (Loesung nicht verraten). */
  nochmal: z.boolean().default(false),
});

export type ErklaerenAnfrage = z.infer<typeof erklaerenSchema>;

const nachrichtSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1),
});

export const ponySchema = z
  .object({
    lessonSlug: z
      .string()
      .min(1)
      .max(120)
      .regex(/^[a-z0-9-]+$/, "Ungültiger Lektions-Slug."),
    messages: z.array(nachrichtSchema).min(1).max(MAX_VERLAUF),
  })
  .superRefine((value, ctx) => {
    const msgs = value.messages;
    // zod prueft hier weiter, auch wenn .min(1) schon angeschlagen hat.
    if (msgs.length === 0) return;
    if (msgs[0].role !== "user" || msgs[msgs.length - 1].role !== "user") {
      ctx.addIssue({
        code: "custom",
        message: "Der Verlauf muss mit einer Frage anfangen und enden.",
        path: ["messages"],
      });
    }
    msgs.forEach((m, i) => {
      if (i > 0 && msgs[i - 1].role === m.role) {
        ctx.addIssue({
          code: "custom",
          message: "Fragen und Antworten muessen sich abwechseln.",
          path: ["messages", i],
        });
      }
      // Amelies Fragen sind kurz; Pony-Antworten duerfen laenger sein.
      const max = m.role === "user" ? MAX_FRAGE_ZEICHEN : MAX_ANTWORT_ZEICHEN;
      if (m.content.length > max) {
        ctx.addIssue({
          code: "custom",
          message: `Nachricht ${i + 1} ist zu lang.`,
          path: ["messages", i, "content"],
        });
      }
    });
  });

export type PonyAnfrage = z.infer<typeof ponySchema>;
