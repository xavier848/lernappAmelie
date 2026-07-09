import { z } from "zod";

// Zod-Schema fuer Lektions-Inhalte – die EINE Referenz-Validierung.
// Genutzt vom Seed-Skript, der Admin-Import-Route und der Claude-MCP-Pipeline.
// Format dokumentiert in CONTENT_FORMAT.md (Spec §5 + §7).

/** Geldbetraege sind IMMER Integer in Cent (nie Euro-Kommazahlen). */
const cents = z
  .number({ error: "Betrag muss eine Zahl in Cent sein." })
  .int("Betrag muss ein ganzzahliger Cent-Wert sein (z. B. 350 fuer 3,50 €).");

const imageField = z.string().min(1).optional();

// Gemeinsame Felder aller Uebungs-Daten:
// prompt in Leichter Sprache, optional Bild, optional TTS-Sprache (Default de-DE).
const baseFields = {
  prompt: z.string().min(1, "prompt darf nicht leer sein."),
  image: imageField,
  tts_lang: z.string().min(1).optional(),
};

// Antwort-Optionen fuer Quiz-artige Uebungen: 2–4 Karten, genau eine richtig.
const optionSchema = z.object({
  text: z.string().min(1, "Options-Text darf nicht leer sein."),
  image: imageField,
  correct: z.boolean().optional(),
});

const optionsField = z
  .array(optionSchema)
  .min(2, "Mindestens 2 Antwort-Optionen.")
  .max(4, "Hoechstens 4 Antwort-Optionen.");

function exactlyOneCorrect(options: { correct?: boolean }[]): boolean {
  return options.filter((option) => option.correct === true).length === 1;
}

const exactlyOneCorrectRule = {
  message: "Genau eine Option muss correct: true haben.",
  path: ["options"] as string[],
};

// 1. steps_order – Schritte ordnen (korrekte Reihenfolge = Array-Reihenfolge)
const stepsOrderData = z.object({
  ...baseFields,
  steps: z
    .array(z.object({ text: z.string().min(1), image: imageField }))
    .min(2, "Mindestens 2 Schritte.")
    .max(10, "Hoechstens 10 Schritte."),
  mode: z.enum(["steps", "words"]).optional(),
});

// 2. multiple_choice – Quiz mit genau einer richtigen Antwort
const multipleChoiceData = z
  .object({
    ...baseFields,
    options: optionsField,
    explanation: z.string().min(1).optional(),
  })
  .refine((data) => exactlyOneCorrect(data.options), exactlyOneCorrectRule);

// 3. match_pairs – Paare zuordnen (jede Seite braucht text oder image)
const pairSideSchema = z.object({
  text: z.string().min(1).optional(),
  image: imageField,
});

const matchPairsData = z
  .object({
    ...baseFields,
    pairs: z
      .array(z.object({ left: pairSideSchema, right: pairSideSchema }))
      .min(2, "Mindestens 2 Paare.")
      .max(6, "Hoechstens 6 Paare."),
    memory: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.pairs.every(
        (pair) =>
          (pair.left.text || pair.left.image) &&
          (pair.right.text || pair.right.image),
      ),
    {
      message: "Jede Seite eines Paares braucht text oder image.",
      path: ["pairs"],
    },
  );

// 4. sort_buckets – Items in 2–3 Koerbe sortieren
const sortBucketsData = z
  .object({
    ...baseFields,
    buckets: z
      .array(
        z.object({
          id: z.string().min(1),
          label: z.string().min(1),
          icon: z.string().min(1).optional(),
        }),
      )
      .min(2, "Mindestens 2 Koerbe.")
      .max(3, "Hoechstens 3 Koerbe."),
    items: z
      .array(
        z.object({
          text: z.string().min(1),
          image: imageField,
          bucket: z.string().min(1),
        }),
      )
      .min(2, "Mindestens 2 Items.")
      .max(8, "Hoechstens 8 Items."),
  })
  .refine(
    (data) =>
      data.items.every((item) =>
        data.buckets.some((bucket) => bucket.id === item.bucket),
      ),
    {
      message: "Jedes item.bucket muss auf eine vorhandene Korb-id zeigen.",
      path: ["items"],
    },
  );

// 5. money_count – Geld-Uebungen in 3 Modi (Betraege in Cent!)
const moneyRecognizeData = z
  .object({
    ...baseFields,
    mode: z.literal("recognize"),
    moneyImage: z.string().min(1, "moneyImage (SVG-Key) fehlt."),
    options: optionsField,
  })
  .refine((data) => exactlyOneCorrect(data.options), exactlyOneCorrectRule);

const moneyAssembleData = z.object({
  ...baseFields,
  mode: z.literal("assemble"),
  target: cents.positive("target muss groesser als 0 sein."),
});

const moneyChangeData = z
  .object({
    ...baseFields,
    mode: z.literal("change"),
    price: cents.positive("price muss groesser als 0 sein."),
    given: cents.positive("given muss groesser als 0 sein."),
  })
  .refine((data) => data.given > data.price, {
    message: "given muss groesser als price sein (sonst gibt es kein Rueckgeld).",
    path: ["given"],
  });

const moneyCountData = z.discriminatedUnion("mode", [
  moneyRecognizeData,
  moneyAssembleData,
  moneyChangeData,
]);

// 6. budget – Monats-Challenge
const budgetData = z.object({
  ...baseFields,
  income: cents.positive("income muss groesser als 0 sein."),
  categories: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        icon: z.string().min(1).optional(),
        fixed: cents.nonnegative().optional(),
      }),
    )
    .min(3, "Mindestens 3 Kategorien.")
    .max(8, "Hoechstens 8 Kategorien."),
  savingsGoal: cents.positive().optional(),
});

/** Eine Uebung: discriminated union ueber `type` mit den 6 Uebungstypen. */
export const exerciseSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("steps_order"), data: stepsOrderData }),
  z.object({ type: z.literal("multiple_choice"), data: multipleChoiceData }),
  z.object({ type: z.literal("match_pairs"), data: matchPairsData }),
  z.object({ type: z.literal("sort_buckets"), data: sortBucketsData }),
  z.object({ type: z.literal("money_count"), data: moneyCountData }),
  z.object({ type: z.literal("budget"), data: budgetData }),
]);

/** Eine Lektion = ein JSON (Spec §7). */
export const lessonSchema = z.object({
  topic_slug: z.string().min(1, "topic_slug fehlt."),
  slug: z.string().min(1, "slug fehlt."),
  title: z.string().min(1, "title fehlt."),
  sort: z
    .number()
    .int("sort muss eine ganze Zahl sein.")
    .nonnegative("sort darf nicht negativ sein."),
  exercises: z
    .array(exerciseSchema)
    .min(1, "Eine Lektion braucht mindestens eine Uebung."),
});

export type ExerciseInput = z.infer<typeof exerciseSchema>;
export type LessonInput = z.infer<typeof lessonSchema>;

/** Union der 6 data-Formen (Spec §5). */
export type ExerciseData = ExerciseInput["data"];

// Einzelne data-Typen fuer die Uebungs-Komponenten (Task 7/8):
export type StepsOrderData = z.infer<typeof stepsOrderData>;
export type MultipleChoiceData = z.infer<typeof multipleChoiceData>;
export type MatchPairsData = z.infer<typeof matchPairsData>;
export type SortBucketsData = z.infer<typeof sortBucketsData>;
export type MoneyCountData = z.infer<typeof moneyCountData>;
export type BudgetData = z.infer<typeof budgetData>;
