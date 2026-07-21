// Generiert die Gedaechtnistraining-Lektionen (Typ memory_game)
// deterministisch. Modi: "reihenfolge" (Sequenz merken & antippen,
// optional rueckwaerts) und "fehlt" (Kim-Spiel: was fehlt?).
// Neu ausfuehren mit: node scripts/gen-gedaechtnis.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "content", "lessons", "gedaechtnis");

function makeRng(seedText) {
  let seed = 0;
  for (const ch of seedText) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}
const pick = (rng, min, max) => min + Math.floor(rng() * (max - min + 1));

/** n verschiedene Elemente aus einem Pool ziehen. */
function drawUnique(rng, pool, n) {
  const rest = [...pool];
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(rest.splice(Math.floor(rng() * rest.length), 1)[0]);
  }
  return out;
}

// Pools: Alltag/Haushalt (passt zur Hauswirtschaftsschule), gut unterscheidbar.
const BILDER = ["🍎", "🍞", "🥛", "🧀", "🥚", "🍌", "🥕", "🍓", "☕", "🍽️", "🥄", "🧽", "🧺", "🧦", "👕", "🪥", "🔑", "🕯️", "🌻", "⚽", "📖", "✂️", "🧴", "🍋"];
const FARBEN = ["🔴", "🟠", "🟡", "🟢", "🔵", "🟣", "🟤", "⚫"];
const EINKAUF = ["🍞 Brot", "🥛 Milch", "🥚 Eier", "🧈 Butter", "🧀 Käse", "🍎 Äpfel", "🍝 Nudeln", "🍚 Reis", "🍅 Tomaten", "🧂 Salz", "🌾 Mehl", "🍬 Zucker", "🥔 Kartoffeln", "🧅 Zwiebeln"];
const ZIFFERN = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

/** Sequenz merken (reihenfolge). */
function sequenz(rng, { pool, count, reverse = false, wasEs }) {
  const items = drawUnique(rng, pool, count).map((text) => ({ text }));
  const folge = items.map((i) => i.text).join("  ");
  return {
    type: "memory_game",
    data: {
      prompt: reverse
        ? `Merke dir ${wasEs} – und tippe sie danach RÜCKWÄRTS an!`
        : `Merke dir ${wasEs} in der richtigen Reihenfolge.`,
      mode: "reihenfolge",
      items,
      ...(reverse ? { reverse: true } : {}),
      explanation: reverse
        ? `Die gezeigte Reihenfolge war: ${folge}. Rückwärts heißt: die letzte zuerst.`
        : `Die richtige Reihenfolge war: ${folge}.`,
    },
  };
}

/** Kim-Spiel (fehlt): Items + 2 Distraktoren aus demselben Pool. */
function kim(rng, { pool, count, wasEs }) {
  const gezogen = drawUnique(rng, pool, count + 2);
  const items = gezogen.slice(0, count).map((text) => ({ text }));
  const distractors = gezogen.slice(count).map((text) => ({ text }));
  return {
    type: "memory_game",
    data: {
      prompt: `Schau dir ${wasEs} gut an. Gleich fehlt eines davon!`,
      mode: "fehlt",
      items,
      distractors,
      explanation: "Vergleiche im Kopf: Was war vorher da und ist jetzt weg?",
    },
  };
}

/** 8 echte Merk-Uebungen je Lektion (Xavier: KEIN Memory-Paare-Abschluss). */
function buildLesson({ slug, title, sort, gen }) {
  const rng = makeRng(slug);
  const seen = new Set();
  const exercises = [];
  for (let i = 0; i < 8; i++) {
    for (let attempt = 0; attempt < 100; attempt++) {
      const ex = gen(rng);
      const key = ex.data.items.map((it) => it.text).join("|");
      if (!seen.has(key)) {
        seen.add(key);
        exercises.push(ex);
        break;
      }
    }
  }
  if (exercises.length !== 8) throw new Error(`Zu wenige Varianten fuer ${slug}`);
  return { topic_slug: "gedaechtnis", slug, title, sort, exercises };
}

const LESSONS = [
  { slug: "gedaechtnis-zahlen-leicht", title: "Zahlen merken: leicht", sort: 1,
    gen: (rng) => sequenz(rng, { pool: ZIFFERN, count: 3, wasEs: "die 3 Zahlen" }) },
  { slug: "gedaechtnis-zahlen-mittel", title: "Zahlen merken: mittel", sort: 2,
    gen: (rng) => sequenz(rng, { pool: ZIFFERN, count: 4, wasEs: "die 4 Zahlen" }) },
  { slug: "gedaechtnis-zahlen-schwer", title: "Zahlen merken: schwer", sort: 3,
    gen: (rng) => sequenz(rng, { pool: ZIFFERN, count: 5, wasEs: "die 5 Zahlen" }) },
  { slug: "gedaechtnis-zahlen-rueckwaerts", title: "Zahlen rückwärts", sort: 4,
    gen: (rng) => sequenz(rng, { pool: ZIFFERN, count: pick(rng, 3, 4), reverse: true, wasEs: "die Zahlen" }) },
  { slug: "gedaechtnis-bilder-leicht", title: "Bilder merken: leicht", sort: 5,
    gen: (rng) => sequenz(rng, { pool: BILDER, count: 3, wasEs: "die 3 Bilder" }) },
  { slug: "gedaechtnis-bilder-mittel", title: "Bilder merken: mittel", sort: 6,
    gen: (rng) => sequenz(rng, { pool: BILDER, count: 4, wasEs: "die 4 Bilder" }) },
  { slug: "gedaechtnis-bilder-schwer", title: "Bilder merken: schwer", sort: 7,
    gen: (rng) => sequenz(rng, { pool: BILDER, count: 5, wasEs: "die 5 Bilder" }) },
  { slug: "gedaechtnis-farben-folgen", title: "Farben-Folgen", sort: 8,
    gen: (rng) => sequenz(rng, { pool: FARBEN, count: pick(rng, 3, 5), wasEs: "die Farben" }) },
  { slug: "gedaechtnis-was-fehlt-leicht", title: "Was fehlt? Leicht", sort: 9,
    gen: (rng) => kim(rng, { pool: BILDER, count: 4, wasEs: "die 4 Bilder" }) },
  { slug: "gedaechtnis-was-fehlt-mittel", title: "Was fehlt? Mittel", sort: 10,
    gen: (rng) => kim(rng, { pool: BILDER, count: 5, wasEs: "die 5 Bilder" }) },
  { slug: "gedaechtnis-was-fehlt-schwer", title: "Was fehlt? Schwer", sort: 11,
    gen: (rng) => kim(rng, { pool: BILDER, count: 6, wasEs: "die 6 Bilder" }) },
  { slug: "gedaechtnis-einkaufsliste", title: "Einkaufsliste merken", sort: 12,
    gen: (rng) =>
      rng() < 0.6
        ? sequenz(rng, { pool: EINKAUF, count: pick(rng, 3, 4), wasEs: "die Einkaufsliste" })
        : kim(rng, { pool: EINKAUF, count: 4, wasEs: "die Einkaufsliste" }) },
];

mkdirSync(OUT_DIR, { recursive: true });
for (const spec of LESSONS) {
  const lesson = buildLesson(spec);
  // Selbst-Check: Eindeutigkeit + Distraktoren nicht in items.
  for (const ex of lesson.exercises) {
    if (ex.type !== "memory_game") continue;
    const texts = ex.data.items.map((it) => it.text);
    if (new Set(texts).size !== texts.length)
      throw new Error(`Doppelte Items in ${lesson.slug}`);
    for (const d of ex.data.distractors ?? [])
      if (texts.includes(d.text))
        throw new Error(`Distraktor in items bei ${lesson.slug}`);
  }
  writeFileSync(
    path.join(OUT_DIR, `${lesson.slug}.json`),
    JSON.stringify(lesson, null, 2) + "\n",
  );
  console.log(`✓ ${lesson.slug} (${lesson.exercises.length} Uebungen)`);
}
console.log("Fertig. Alle Lektionen strukturell verifiziert.");
