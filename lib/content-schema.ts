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

// Multiple-Choice braucht min. 3 Optionen: Bei nur 2 Optionen wuerde der
// „nie identisch mit der Eingabe"-Shuffle die richtige Antwort immer an
// dieselbe Stelle schieben (vorhersehbar) – und 2 Optionen sind zu leicht.
const mcOptionsField = z
  .array(optionSchema)
  .min(3, "Mindestens 3 Antwort-Optionen (bei Multiple-Choice).")
  .max(4, "Hoechstens 4 Antwort-Optionen.");

function exactlyOneCorrect(options: { correct?: boolean }[]): boolean {
  return options.filter((option) => option.correct === true).length === 1;
}

const exactlyOneCorrectRule = {
  message: "Genau eine Option muss correct: true haben.",
  path: ["options"] as string[],
};

// 1. steps_order – Schritte ordnen (korrekte Reihenfolge = Array-Reihenfolge)
// explanation: erklaert die REGEL hinter der Reihenfolge (z. B. "von oben nach
// unten" oder die englische Wortstellung) – nie die Loesung aufzaehlen, denn
// der Banner erscheint auch beim Sofort-Retry (Amelie-Statistik 2026-07-28).
const stepsOrderData = z.object({
  ...baseFields,
  steps: z
    .array(z.object({ text: z.string().min(1), image: imageField }))
    .min(2, "Mindestens 2 Schritte.")
    .max(10, "Hoechstens 10 Schritte."),
  mode: z.enum(["steps", "words"]).optional(),
  explanation: z.string().min(1).optional(),
});

// 2. multiple_choice – Quiz mit genau einer richtigen Antwort
const multipleChoiceData = z
  .object({
    ...baseFields,
    options: mcOptionsField,
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
    explanation: z.string().min(1).optional(),
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
    explanation: z.string().min(1).optional(),
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
// explanation zeigt den Rechenweg – wie bei number_input erst NACH dem
// Sofort-Retry, damit der Betrag nicht verraten wird (siehe LessonPlayer).
const moneyRecognizeData = z
  .object({
    ...baseFields,
    mode: z.literal("recognize"),
    moneyImage: z.string().min(1, "moneyImage (SVG-Key) fehlt."),
    options: optionsField,
    explanation: z.string().min(1).optional(),
  })
  .refine((data) => exactlyOneCorrect(data.options), exactlyOneCorrectRule);

const moneyAssembleData = z.object({
  ...baseFields,
  mode: z.literal("assemble"),
  target: cents.positive("target muss groesser als 0 sein."),
  explanation: z.string().min(1).optional(),
});

const moneyChangeData = z
  .object({
    ...baseFields,
    mode: z.literal("change"),
    price: cents.positive("price muss groesser als 0 sein."),
    given: cents.positive("given muss groesser als 0 sein."),
    explanation: z.string().min(1).optional(),
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

// 7. number_input – Kopfrechnen: Antwort wird eingetippt (nicht geraten).
// hint = Schritt-fuer-Schritt-Tipp, erscheint beim zweiten Versuch.
const numberInputData = z.object({
  ...baseFields,
  answer: z
    .number({ error: "answer muss eine Zahl sein." })
    .int("answer muss eine ganze Zahl sein.")
    .nonnegative("answer darf nicht negativ sein."),
  hint: z.string().min(1).optional(),
  explanation: z.string().min(1).optional(),
});

// 8. memory_game – Gedaechtnistraining in 2 Modi (kein Zeitdruck: die
// Merkphase endet erst, wenn Amelie "Ich hab's mir gemerkt" tippt).
// - "reihenfolge": Items einmal ansehen, dann gemischt in der gezeigten
//   Reihenfolge antippen (Zahlenspanne/Corsi/Simon-Prinzip).
//   reverse: true = rueckwaerts antippen (schwerer, Arbeitsgedaechtnis).
// - "fehlt": alle Items ansehen, eines verschwindet (Kim-Spiel);
//   aus 3 Optionen (fehlendes Item + 2 distractors) das fehlende waehlen.
const memoryGameData = z
  .object({
    ...baseFields,
    mode: z.enum(["reihenfolge", "fehlt"]),
    items: z
      .array(z.object({ text: z.string().min(1) }))
      .min(3, "Mindestens 3 Items.")
      .max(6, "Hoechstens 6 Items."),
    reverse: z.boolean().optional(),
    distractors: z
      .array(z.object({ text: z.string().min(1) }))
      .length(2, "Genau 2 distractors.")
      .optional(),
    explanation: z.string().min(1).optional(),
  })
  .refine(
    (data) =>
      new Set(data.items.map((item) => item.text)).size === data.items.length,
    { message: "items muessen eindeutig sein (sonst ist Antippen mehrdeutig).", path: ["items"] },
  )
  .refine((data) => data.mode !== "fehlt" || data.distractors !== undefined, {
    message: "Modus 'fehlt' braucht distractors (genau 2).",
    path: ["distractors"],
  })
  .refine(
    (data) =>
      !data.distractors ||
      data.distractors.every(
        (d) => !data.items.some((item) => item.text === d.text),
      ),
    { message: "distractors duerfen nicht in items vorkommen.", path: ["distractors"] },
  );

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

/** Eine Uebung: discriminated union ueber `type` mit den 8 Uebungstypen. */
export const exerciseSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("steps_order"), data: stepsOrderData }),
  z.object({ type: z.literal("multiple_choice"), data: multipleChoiceData }),
  z.object({ type: z.literal("match_pairs"), data: matchPairsData }),
  z.object({ type: z.literal("sort_buckets"), data: sortBucketsData }),
  z.object({ type: z.literal("money_count"), data: moneyCountData }),
  z.object({ type: z.literal("budget"), data: budgetData }),
  z.object({ type: z.literal("number_input"), data: numberInputData }),
  z.object({ type: z.literal("memory_game"), data: memoryGameData }),
]);

/** Eine Lektion = ein JSON (Spec §7). */
export const lessonSchema = z.object({
  topic_slug: z.string().min(1, "topic_slug fehlt."),
  slug: z.string().min(1, "slug fehlt."),
  title: z.string().min(1, "title fehlt."),
  // Optionaler Einführungs-Text (Leichte Sprache), der VOR der ersten Übung
  // als eigener Screen angezeigt wird (mit Vorlese-Button). Nur bei abstrakten
  // Themen sinnvoll (Mama-Feedback 2026-07-11).
  intro: z.string().min(1).optional(),
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
export type NumberInputData = z.infer<typeof numberInputData>;
export type MemoryGameData = z.infer<typeof memoryGameData>;
