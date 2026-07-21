// Generiert die Kopfrechnen-Lektionen (Typ number_input) deterministisch.
// Arithmetik wird hier im Skript berechnet -> Antworten/Tipps stimmen
// garantiert. Bei Bedarf Varianten erhoehen und neu ausfuehren:
//   node scripts/gen-kopfrechnen.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "content", "lessons", "kopfrechnen");

// Kleiner deterministischer Zufallsgenerator (LCG) je Lektion.
function makeRng(seedText) {
  let seed = 0;
  for (const ch of seedText) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}
const pick = (rng, min, max) => min + Math.floor(rng() * (max - min + 1));

/** Additions-Aufgabe: start + addends, Tipp = Zwischenschritte. */
function plusExercise(rng, { startMin, startMax, addMin, addMax, count }) {
  const nums = [pick(rng, startMin, startMax)];
  for (let i = 1; i < count; i++) nums.push(pick(rng, addMin, addMax));
  const expr = nums.join(" + ");
  const answer = nums.reduce((a, b) => a + b, 0);
  const steps = [];
  let running = nums[0];
  for (let i = 1; i < nums.length; i++) {
    const next = running + nums[i];
    steps.push(`${running} + ${nums[i]} = ${i === nums.length - 1 ? "?" : next}`);
    running = next;
  }
  return {
    expr,
    answer,
    hint: `Rechne Schritt für Schritt:\n${steps.join("\n")}`,
    explanation: `${expr} = ${answer}. Schritt für Schritt geht es am leichtesten.`,
  };
}

/** Subtraktions-Aufgabe: start - Abzuege (Ergebnis nie negativ). */
function minusExercise(rng, { startMin, startMax, subMin, subMax, count }) {
  const start = pick(rng, startMin, startMax);
  const subs = [];
  let running = start;
  for (let i = 0; i < count; i++) {
    const sub = Math.min(pick(rng, subMin, subMax), Math.max(running - 1, 1));
    subs.push(sub);
    running -= sub;
  }
  const expr = `${start} - ${subs.join(" - ")}`;
  const answer = start - subs.reduce((a, b) => a + b, 0);
  const steps = [];
  running = start;
  for (let i = 0; i < subs.length; i++) {
    const next = running - subs[i];
    steps.push(`${running} - ${subs[i]} = ${i === subs.length - 1 ? "?" : next}`);
    running = next;
  }
  return {
    expr,
    answer,
    hint: `Rechne Schritt für Schritt:\n${steps.join("\n")}`,
    explanation: `${expr} = ${answer}. Ziehe eine Zahl nach der anderen ab.`,
  };
}

/** Mal-Aufgabe: a × b. Tipp zerlegt den zweiten Faktor (b = b-1 + 1)
 *  bzw. bei grossem ersten Faktor die Zehner (12 × 4 = 10×4 + 2×4). */
function malExercise(rng, { aMin, aMax, bMin, bMax }) {
  const a = pick(rng, aMin, aMax);
  const b = pick(rng, bMin, bMax);
  const answer = a * b;
  const expr = `${a} × ${b}`;
  let hint;
  if (a > 10) {
    const zehner = Math.floor(a / 10) * 10;
    const rest = a - zehner;
    hint = `Zerlege die Zahl:\n${a} × ${b} = ${zehner} × ${b} + ${rest} × ${b}\n${zehner} × ${b} = ${zehner * b}\n${rest} × ${b} = ${rest * b}\n${zehner * b} + ${rest * b} = ?`;
  } else {
    hint = `Denk an die Mal-Reihe:\n${a} × ${b - 1} = ${a * (b - 1)}\n${a * (b - 1)} + ${a} = ?`;
  }
  return {
    expr,
    answer,
    hint,
    explanation: `${expr} = ${answer}. Zerlegen macht Mal-Aufgaben leichter.`,
  };
}

function numberInput(ex) {
  return {
    type: "number_input",
    data: {
      prompt: `Rechne im Kopf: ${ex.expr} = ?`,
      answer: ex.answer,
      hint: ex.hint,
      explanation: ex.explanation,
    },
  };
}

/** MC-Variante mit ENG beieinander liegenden Optionen (kein Schaetzen). */
function closeChoice(rng, ex) {
  const offsets = rng() < 0.5 ? [-1, 1] : [-2, 1];
  const options = [
    { text: String(ex.answer), correct: true },
    ...offsets.map((off) => ({ text: String(ex.answer + off) })),
  ].sort(() => rng() - 0.5);
  return {
    type: "multiple_choice",
    data: {
      prompt: `Ganz genau rechnen – die Antworten liegen nah beieinander: ${ex.expr} = ?`,
      options,
      explanation: ex.explanation,
    },
  };
}

/** 10 Uebungen je Lektion: 8x eintippen + 2x enge Auswahl. Keine Doppel-Aufgaben. */
function buildLesson({ slug, title, sort, gen }) {
  const rng = makeRng(slug);
  const seen = new Set();
  const draw = () => {
    for (let i = 0; i < 200; i++) {
      const ex = gen(rng);
      if (!seen.has(ex.expr)) {
        seen.add(ex.expr);
        return ex;
      }
    }
    throw new Error(`Zu wenige Varianten fuer ${slug}`);
  };
  const exercises = [];
  for (let i = 0; i < 10; i++) {
    const ex = draw();
    exercises.push(i === 4 || i === 8 ? closeChoice(rng, ex) : numberInput(ex));
  }
  return { topic_slug: "kopfrechnen", slug, title, sort, exercises };
}

const LESSONS = [
  { slug: "kopfrechnen-plus-leicht-1", title: "Plus: leicht I", sort: 1,
    gen: (rng) => plusExercise(rng, { startMin: 11, startMax: 29, addMin: 1, addMax: 9, count: 3 }) },
  { slug: "kopfrechnen-plus-leicht-2", title: "Plus: leicht II", sort: 2,
    gen: (rng) => plusExercise(rng, { startMin: 12, startMax: 39, addMin: 2, addMax: 9, count: 3 }) },
  { slug: "kopfrechnen-plus-mittel-1", title: "Plus: mittel I", sort: 3,
    gen: (rng) => plusExercise(rng, { startMin: 23, startMax: 59, addMin: 3, addMax: 9, count: 4 }) },
  { slug: "kopfrechnen-plus-mittel-2", title: "Plus: mittel II", sort: 4,
    gen: (rng) => plusExercise(rng, { startMin: 34, startMax: 69, addMin: 4, addMax: 12, count: 4 }) },
  { slug: "kopfrechnen-minus-leicht", title: "Minus: leicht", sort: 5,
    gen: (rng) => minusExercise(rng, { startMin: 20, startMax: 50, subMin: 2, subMax: 9, count: 1 }) },
  { slug: "kopfrechnen-minus-mittel", title: "Minus: mittel", sort: 6,
    gen: (rng) => minusExercise(rng, { startMin: 40, startMax: 90, subMin: 3, subMax: 12, count: 2 }) },
  { slug: "kopfrechnen-plus-schwer", title: "Plus: schwer", sort: 7,
    gen: (rng) => plusExercise(rng, { startMin: 105, startMax: 260, addMin: 12, addMax: 45, count: 3 }) },
  { slug: "kopfrechnen-gemischt", title: "Gemischt: Plus und Minus", sort: 8,
    gen: (rng) =>
      rng() < 0.5
        ? plusExercise(rng, { startMin: 28, startMax: 75, addMin: 4, addMax: 15, count: 3 })
        : minusExercise(rng, { startMin: 45, startMax: 95, subMin: 4, subMax: 15, count: 2 }) },
  { slug: "kopfrechnen-plus-leicht-3", title: "Plus: leicht III", sort: 9,
    gen: (rng) => plusExercise(rng, { startMin: 15, startMax: 45, addMin: 2, addMax: 8, count: 3 }) },
  { slug: "kopfrechnen-minus-leicht-2", title: "Minus: leicht II", sort: 10,
    gen: (rng) => minusExercise(rng, { startMin: 25, startMax: 60, subMin: 3, subMax: 9, count: 1 }) },
  { slug: "kopfrechnen-plus-mittel-3", title: "Plus: mittel III", sort: 11,
    gen: (rng) => plusExercise(rng, { startMin: 45, startMax: 85, addMin: 5, addMax: 14, count: 4 }) },
  { slug: "kopfrechnen-minus-schwer", title: "Minus: schwer", sort: 12,
    gen: (rng) => minusExercise(rng, { startMin: 130, startMax: 320, subMin: 15, subMax: 48, count: 2 }) },
  { slug: "kopfrechnen-plus-schwer-2", title: "Plus: schwer II", sort: 13,
    gen: (rng) => plusExercise(rng, { startMin: 140, startMax: 380, addMin: 16, addMax: 55, count: 3 }) },
  { slug: "kopfrechnen-mal-klein", title: "Mal: das kleine Einmaleins", sort: 14,
    gen: (rng) => malExercise(rng, { aMin: 3, aMax: 9, bMin: 3, bMax: 9 }) },
  { slug: "kopfrechnen-mal-gross", title: "Mal: größere Zahlen", sort: 15,
    gen: (rng) => malExercise(rng, { aMin: 11, aMax: 25, bMin: 3, bMax: 6 }) },
  { slug: "kopfrechnen-training", title: "Training: bunt gemischt", sort: 16,
    gen: (rng) => {
      const wurf = rng();
      if (wurf < 0.35)
        return plusExercise(rng, { startMin: 35, startMax: 120, addMin: 5, addMax: 18, count: 3 });
      if (wurf < 0.7)
        return minusExercise(rng, { startMin: 60, startMax: 140, subMin: 6, subMax: 19, count: 2 });
      return malExercise(rng, { aMin: 4, aMax: 12, bMin: 3, bMax: 8 });
    } },
];

mkdirSync(OUT_DIR, { recursive: true });
for (const spec of LESSONS) {
  const lesson = buildLesson(spec);
  // Selbst-Check: Antworten stimmen mit dem Ausdruck ueberein.
  for (const ex of lesson.exercises) {
    const m = ex.data.prompt.match(/(\d+(?:\s*[+\-×]\s*\d+)+)/);
    const computed = Function(
      `"use strict";return (${m[1].replaceAll("×", "*")})`,
    )();
    const expected =
      ex.type === "number_input"
        ? ex.data.answer
        : Number(ex.data.options.find((o) => o.correct).text);
    if (computed !== expected)
      throw new Error(`Rechenfehler in ${lesson.slug}: ${m[1]} = ${computed}, nicht ${expected}`);
  }
  writeFileSync(
    path.join(OUT_DIR, `${lesson.slug}.json`),
    JSON.stringify(lesson, null, 2) + "\n",
  );
  console.log(`✓ ${lesson.slug} (${lesson.exercises.length} Uebungen)`);
}
console.log("Fertig. Alle Antworten rechnerisch verifiziert.");
