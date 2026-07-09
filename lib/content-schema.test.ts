import { describe, expect, it } from "vitest";
import { exerciseSchema, lessonSchema } from "./content-schema";

// Gueltige Beispiel-Uebungen je Typ (werden auch fuer die Lektions-Tests genutzt)

const validStepsOrder = {
  type: "steps_order",
  data: {
    prompt: "Bringe die Schritte in die richtige Reihenfolge.",
    steps: [
      { text: "Putzmaterial holen." },
      { text: "Reiniger auftragen." },
      { text: "Nachwischen." },
    ],
  },
};

const validMultipleChoice = {
  type: "multiple_choice",
  data: {
    prompt: "Was machst du, waehrend der Reiniger einwirkt?",
    options: [
      { text: "Spiegel putzen", correct: true },
      { text: "Warten und nichts tun" },
    ],
    explanation: "Einwirkzeit klug nutzen: In der Zeit den Spiegel putzen.",
  },
};

const validMatchPairs = {
  type: "match_pairs",
  data: {
    prompt: "Finde die Paare.",
    pairs: [
      { left: { text: "Guten Tag" }, right: { text: "Hello" } },
      { left: { text: "Danke" }, right: { text: "Thank you" } },
    ],
    memory: true,
  },
};

const validSortBuckets = {
  type: "sort_buckets",
  data: {
    prompt: "Sortiere die Waesche.",
    buckets: [
      { id: "w30", label: "30 Grad" },
      { id: "w60", label: "60 Grad", icon: "🔥" },
    ],
    items: [
      { text: "Bluse", bucket: "w30" },
      { text: "Handtuch", bucket: "w60" },
    ],
  },
};

const validMoneyRecognize = {
  type: "money_count",
  data: {
    prompt: "Welche Muenze ist das?",
    mode: "recognize",
    moneyImage: "coin-200",
    options: [
      { text: "2 Euro", correct: true },
      { text: "1 Euro" },
      { text: "50 Cent" },
    ],
  },
};

const validMoneyAssemble = {
  type: "money_count",
  data: {
    prompt: "Lege 3,50 Euro.",
    mode: "assemble",
    target: 350,
  },
};

const validMoneyChange = {
  type: "money_count",
  data: {
    prompt: "Wie viel Rueckgeld bekommst du?",
    mode: "change",
    price: 270,
    given: 500,
  },
};

const validBudget = {
  type: "budget",
  data: {
    prompt: "Plane deinen Monat.",
    income: 95000,
    categories: [
      { id: "sparen", label: "Sparen", icon: "🐷" },
      { id: "lebensmittel", label: "Lebensmittel" },
      { id: "freizeit", label: "Freizeit" },
    ],
    savingsGoal: 10000,
  },
};

describe("exerciseSchema: steps_order", () => {
  it("akzeptiert eine gueltige Uebung", () => {
    expect(exerciseSchema.safeParse(validStepsOrder).success).toBe(true);
  });

  it("akzeptiert mode: words", () => {
    const ex = {
      ...validStepsOrder,
      data: { ...validStepsOrder.data, mode: "words" },
    };
    expect(exerciseSchema.safeParse(ex).success).toBe(true);
  });

  it("lehnt weniger als 2 Schritte ab", () => {
    const ex = {
      ...validStepsOrder,
      data: { ...validStepsOrder.data, steps: [{ text: "Nur ein Schritt." }] },
    };
    expect(exerciseSchema.safeParse(ex).success).toBe(false);
  });

  it("lehnt unbekannten mode ab", () => {
    const ex = {
      ...validStepsOrder,
      data: { ...validStepsOrder.data, mode: "drag" },
    };
    expect(exerciseSchema.safeParse(ex).success).toBe(false);
  });
});

describe("exerciseSchema: multiple_choice", () => {
  it("akzeptiert eine gueltige Uebung", () => {
    expect(exerciseSchema.safeParse(validMultipleChoice).success).toBe(true);
  });

  it("lehnt zwei korrekte Optionen ab", () => {
    const ex = {
      ...validMultipleChoice,
      data: {
        ...validMultipleChoice.data,
        options: [
          { text: "A", correct: true },
          { text: "B", correct: true },
        ],
      },
    };
    expect(exerciseSchema.safeParse(ex).success).toBe(false);
  });

  it("lehnt null korrekte Optionen ab", () => {
    const ex = {
      ...validMultipleChoice,
      data: {
        ...validMultipleChoice.data,
        options: [{ text: "A" }, { text: "B" }],
      },
    };
    expect(exerciseSchema.safeParse(ex).success).toBe(false);
  });

  it("lehnt mehr als 4 Optionen ab", () => {
    const ex = {
      ...validMultipleChoice,
      data: {
        ...validMultipleChoice.data,
        options: [
          { text: "A", correct: true },
          { text: "B" },
          { text: "C" },
          { text: "D" },
          { text: "E" },
        ],
      },
    };
    expect(exerciseSchema.safeParse(ex).success).toBe(false);
  });
});

describe("exerciseSchema: match_pairs", () => {
  it("akzeptiert eine gueltige Uebung", () => {
    expect(exerciseSchema.safeParse(validMatchPairs).success).toBe(true);
  });

  it("akzeptiert Bild-Seiten ohne Text", () => {
    const ex = {
      ...validMatchPairs,
      data: {
        ...validMatchPairs.data,
        pairs: [
          { left: { image: "/bilder/hund.png" }, right: { text: "Hund" } },
          { left: { image: "/bilder/katze.png" }, right: { text: "Katze" } },
        ],
      },
    };
    expect(exerciseSchema.safeParse(ex).success).toBe(true);
  });

  it("lehnt eine Seite ohne text und ohne image ab", () => {
    const ex = {
      ...validMatchPairs,
      data: {
        ...validMatchPairs.data,
        pairs: [
          { left: {}, right: { text: "Hund" } },
          { left: { text: "Katze" }, right: { text: "cat" } },
        ],
      },
    };
    expect(exerciseSchema.safeParse(ex).success).toBe(false);
  });

  it("lehnt mehr als 6 Paare ab", () => {
    const pair = { left: { text: "a" }, right: { text: "b" } };
    const ex = {
      ...validMatchPairs,
      data: { ...validMatchPairs.data, pairs: Array(7).fill(pair) },
    };
    expect(exerciseSchema.safeParse(ex).success).toBe(false);
  });
});

describe("exerciseSchema: sort_buckets", () => {
  it("akzeptiert eine gueltige Uebung", () => {
    expect(exerciseSchema.safeParse(validSortBuckets).success).toBe(true);
  });

  it("lehnt Items mit unbekanntem bucket ab", () => {
    const ex = {
      ...validSortBuckets,
      data: {
        ...validSortBuckets.data,
        items: [
          { text: "Bluse", bucket: "w30" },
          { text: "Jeans", bucket: "w90" },
        ],
      },
    };
    expect(exerciseSchema.safeParse(ex).success).toBe(false);
  });

  it("lehnt nur einen Korb ab", () => {
    const ex = {
      ...validSortBuckets,
      data: {
        ...validSortBuckets.data,
        buckets: [{ id: "w30", label: "30 Grad" }],
      },
    };
    expect(exerciseSchema.safeParse(ex).success).toBe(false);
  });

  it("lehnt 4 Koerbe ab", () => {
    const ex = {
      ...validSortBuckets,
      data: {
        ...validSortBuckets.data,
        buckets: [
          { id: "a", label: "A" },
          { id: "b", label: "B" },
          { id: "c", label: "C" },
          { id: "d", label: "D" },
        ],
      },
    };
    expect(exerciseSchema.safeParse(ex).success).toBe(false);
  });
});

describe("exerciseSchema: money_count", () => {
  it("akzeptiert recognize", () => {
    expect(exerciseSchema.safeParse(validMoneyRecognize).success).toBe(true);
  });

  it("recognize braucht moneyImage", () => {
    const data = { ...validMoneyRecognize.data } as Record<string, unknown>;
    delete data.moneyImage;
    expect(
      exerciseSchema.safeParse({ type: "money_count", data }).success,
    ).toBe(false);
  });

  it("recognize braucht genau eine korrekte Option", () => {
    const ex = {
      ...validMoneyRecognize,
      data: {
        ...validMoneyRecognize.data,
        options: [{ text: "2 Euro" }, { text: "1 Euro" }],
      },
    };
    expect(exerciseSchema.safeParse(ex).success).toBe(false);
  });

  it("akzeptiert assemble", () => {
    expect(exerciseSchema.safeParse(validMoneyAssemble).success).toBe(true);
  });

  it("assemble lehnt target 0 ab", () => {
    const ex = {
      ...validMoneyAssemble,
      data: { ...validMoneyAssemble.data, target: 0 },
    };
    expect(exerciseSchema.safeParse(ex).success).toBe(false);
  });

  it("assemble lehnt Nicht-Integer-Cents ab (3.5 statt 350)", () => {
    const ex = {
      ...validMoneyAssemble,
      data: { ...validMoneyAssemble.data, target: 3.5 },
    };
    expect(exerciseSchema.safeParse(ex).success).toBe(false);
  });

  it("akzeptiert change", () => {
    expect(exerciseSchema.safeParse(validMoneyChange).success).toBe(true);
  });

  it("change lehnt given == price ab", () => {
    const ex = {
      ...validMoneyChange,
      data: { ...validMoneyChange.data, given: 270 },
    };
    expect(exerciseSchema.safeParse(ex).success).toBe(false);
  });

  it("change lehnt given < price ab", () => {
    const ex = {
      ...validMoneyChange,
      data: { ...validMoneyChange.data, given: 200 },
    };
    expect(exerciseSchema.safeParse(ex).success).toBe(false);
  });

  it("lehnt unbekannten mode ab", () => {
    const ex = {
      type: "money_count",
      data: { prompt: "Test", mode: "pay", target: 100 },
    };
    expect(exerciseSchema.safeParse(ex).success).toBe(false);
  });
});

describe("exerciseSchema: budget", () => {
  it("akzeptiert eine gueltige Uebung", () => {
    expect(exerciseSchema.safeParse(validBudget).success).toBe(true);
  });

  it("akzeptiert fixe Kategorien", () => {
    const ex = {
      ...validBudget,
      data: {
        ...validBudget.data,
        categories: [
          { id: "miete", label: "Miete", fixed: 40000 },
          { id: "sparen", label: "Sparen" },
          { id: "freizeit", label: "Freizeit" },
        ],
      },
    };
    expect(exerciseSchema.safeParse(ex).success).toBe(true);
  });

  it("lehnt weniger als 3 Kategorien ab", () => {
    const ex = {
      ...validBudget,
      data: {
        ...validBudget.data,
        categories: [
          { id: "sparen", label: "Sparen" },
          { id: "freizeit", label: "Freizeit" },
        ],
      },
    };
    expect(exerciseSchema.safeParse(ex).success).toBe(false);
  });

  it("lehnt income 0 ab", () => {
    const ex = { ...validBudget, data: { ...validBudget.data, income: 0 } };
    expect(exerciseSchema.safeParse(ex).success).toBe(false);
  });
});

describe("exerciseSchema: allgemein", () => {
  it("lehnt unbekannten Uebungstyp ab", () => {
    const ex = { type: "drag_and_drop", data: { prompt: "Zieh mich." } };
    expect(exerciseSchema.safeParse(ex).success).toBe(false);
  });

  it("lehnt fehlenden prompt ab", () => {
    const ex = {
      type: "steps_order",
      data: { steps: [{ text: "a" }, { text: "b" }] },
    };
    expect(exerciseSchema.safeParse(ex).success).toBe(false);
  });

  it("akzeptiert optionales tts_lang und image", () => {
    const ex = {
      ...validMultipleChoice,
      data: {
        ...validMultipleChoice.data,
        tts_lang: "en-GB",
        image: "/bilder/bad.png",
      },
    };
    expect(exerciseSchema.safeParse(ex).success).toBe(true);
  });
});

describe("lessonSchema", () => {
  const validLesson = {
    topic_slug: "badezimmer",
    slug: "badezimmer-reinigen-1",
    title: "Das Badezimmer putzen",
    sort: 1,
    exercises: [validStepsOrder, validMultipleChoice, validMoneyChange],
  };

  it("akzeptiert eine gueltige Lektion", () => {
    const result = lessonSchema.safeParse(validLesson);
    expect(result.success).toBe(true);
  });

  it("lehnt eine Lektion ohne Uebungen ab", () => {
    expect(
      lessonSchema.safeParse({ ...validLesson, exercises: [] }).success,
    ).toBe(false);
  });

  it("lehnt fehlenden title ab", () => {
    const lesson = { ...validLesson } as Record<string, unknown>;
    delete lesson.title;
    expect(lessonSchema.safeParse(lesson).success).toBe(false);
  });

  it("lehnt nicht-ganzzahliges sort ab", () => {
    expect(lessonSchema.safeParse({ ...validLesson, sort: 1.5 }).success).toBe(
      false,
    );
  });

  it("lehnt eine Lektion mit einer ungueltigen Uebung ab", () => {
    const badExercise = {
      type: "money_count",
      data: { prompt: "Rueckgeld?", mode: "change", price: 500, given: 300 },
    };
    expect(
      lessonSchema.safeParse({ ...validLesson, exercises: [badExercise] })
        .success,
    ).toBe(false);
  });
});
