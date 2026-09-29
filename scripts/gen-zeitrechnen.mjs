// Generiert die Lektionen "Uhrzeit & Zeit rechnen" (Mamas Wunsch im Chat vom
// 11.07.: krumme Uhrzeiten, Stufen 1-5 von "Start + Dauer" bis "rueckwaerts").
// Alle Uhrzeiten, Tipps und Erklaerungen werden hier BERECHNET - die
// Antworten stimmen garantiert. Neu erzeugen mit:
//   node scripts/gen-zeitrechnen.mjs
// Uhrzeiten stehen als HHMM-Zahl (8:39 -> 839), passend zu number_input mit
// format "uhrzeit" (siehe lib/uhrzeit.ts).
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TOPIC = "zeit-rechnen";
const OUT_DIR = path.join(ROOT, "content", "lessons", TOPIC);

// ---------- Uhrzeit-Arithmetik ----------
const stundeVon = (t) => Math.floor(t / 100);
const minuteVon = (t) => t % 100;
const inMinuten = (t) => stundeVon(t) * 60 + minuteVon(t);
const ausMinuten = (m) => {
  if (m < 0 || m >= 24 * 60) throw new Error(`Uhrzeit ausserhalb des Tages: ${m}`);
  return Math.floor(m / 60) * 100 + (m % 60);
};
const plus = (t, min) => ausMinuten(inMinuten(t) + min);
const minus = (t, min) => ausMinuten(inMinuten(t) - min);
const uhr = (t) => `${stundeVon(t)}:${String(minuteVon(t)).padStart(2, "0")} Uhr`;
const stunden = (h) => (h === 1 ? "1 Stunde" : `${h} Stunden`);
const dauer = (min) => {
  if (min < 60) return `${min} Minuten`;
  const rest = min % 60;
  return rest === 0
    ? stunden(min / 60)
    : `${stunden(Math.floor(min / 60))} und ${rest} Minuten`;
};
const summe = (teile) => teile.reduce((a, b) => a + b, 0);

function pruefeUhrzeit(t) {
  if (!Number.isInteger(t) || minuteVon(t) > 59 || t > 2359 || t < 0) {
    throw new Error(`Keine gueltige Uhrzeit: ${t}`);
  }
}

// ---------- Rechenwege (Tipp = ohne Ergebnis, Erklaerung = mit) ----------

/** Vorwaerts: start + minuten. Liefert Tipp-Zeilen (letzte endet auf "?"). */
function vorwaertsTipp(start, min) {
  const zeilen = [];
  let jetzt = start;
  let rest = min;
  if (rest >= 60) {
    const h = Math.floor(rest / 60);
    rest %= 60;
    if (rest === 0) {
      zeilen.push(`${min} Minuten sind ${stunden(h)}.`);
      zeilen.push(`${uhr(start)} + ${stunden(h)} = ?`);
      return zeilen;
    }
    zeilen.push(`${min} Minuten sind ${stunden(h)} und ${rest} Minuten.`);
    const danach = plus(jetzt, h * 60);
    zeilen.push(`${uhr(jetzt)} + ${stunden(h)} = ${uhr(danach)}`);
    jetzt = danach;
  }
  const bisVoll = 60 - minuteVon(jetzt);
  if (rest > bisVoll) {
    const voll = plus(jetzt, bisVoll);
    zeilen.push(`Bis zur vollen Stunde: ${uhr(jetzt)} → ${uhr(voll)} sind ${bisVoll} Minuten.`);
    zeilen.push(`${rest} − ${bisVoll} = ${rest - bisVoll} Minuten bleiben übrig.`);
    zeilen.push(`${uhr(voll)} + ${rest - bisVoll} Minuten = ?`);
  } else if (rest === bisVoll) {
    zeilen.push(`Rechne die Minuten: ${minuteVon(jetzt)} + ${rest} = 60.`);
    zeilen.push("60 Minuten sind genau eine neue Stunde. Wie spät ist es dann?");
  } else {
    zeilen.push(`Die Stunde bleibt gleich. Rechne nur die Minuten: ${minuteVon(jetzt)} + ${rest} = ?`);
  }
  return zeilen;
}

/** Rueckwaerts: ende − minuten. */
function rueckwaertsTipp(ende, min) {
  const zeilen = [];
  let jetzt = ende;
  let rest = min;
  if (rest >= 60) {
    const h = Math.floor(rest / 60);
    rest %= 60;
    if (rest === 0) {
      zeilen.push(`${min} Minuten sind ${stunden(h)}.`);
      zeilen.push(`${uhr(ende)} − ${stunden(h)} = ?`);
      return zeilen;
    }
    zeilen.push(`${min} Minuten sind ${stunden(h)} und ${rest} Minuten.`);
    const davor = minus(jetzt, h * 60);
    zeilen.push(`${uhr(jetzt)} − ${stunden(h)} = ${uhr(davor)}`);
    jetzt = davor;
  }
  const seitVoll = minuteVon(jetzt);
  if (rest <= seitVoll) {
    zeilen.push(`Die Stunde bleibt gleich. Rechne nur die Minuten: ${seitVoll} − ${rest} = ?`);
    return zeilen;
  }
  if (seitVoll > 0) {
    const voll = minus(jetzt, seitVoll);
    zeilen.push(`Zurück bis zur vollen Stunde: ${uhr(jetzt)} → ${uhr(voll)} sind ${seitVoll} Minuten.`);
    zeilen.push(`${rest} − ${seitVoll} = ${rest - seitVoll} Minuten musst du noch zurück.`);
    jetzt = voll;
    rest -= seitVoll;
  }
  const stundeDavor = minus(jetzt, 60);
  zeilen.push(`Eine Stunde zurück ist ${uhr(stundeDavor)}.`);
  zeilen.push(`Die Minuten nach ${stundeVon(stundeDavor)} Uhr: 60 − ${rest} = ?`);
  return zeilen;
}

/** Dauer von start bis ende (in Minuten). */
function dauerTipp(start, ende) {
  if (stundeVon(start) === stundeVon(ende)) {
    return [`Die Stunde bleibt gleich. Rechne nur die Minuten: ${minuteVon(ende)} − ${minuteVon(start)} = ?`];
  }
  const teile = [];
  const zeilen = [];
  const bisVoll = 60 - minuteVon(start);
  const voll = plus(start, bisVoll);
  zeilen.push(`Vom Start bis zur vollen Stunde: ${uhr(start)} → ${uhr(voll)} sind ${bisVoll} Minuten.`);
  teile.push(bisVoll);
  const volleStundeVorEnde = stundeVon(ende) * 100;
  const ganze = stundeVon(ende) - stundeVon(voll);
  if (ganze > 0) {
    zeilen.push(`${uhr(voll)} → ${uhr(volleStundeVorEnde)} sind ${ganze * 60} Minuten.`);
    teile.push(ganze * 60);
  }
  if (minuteVon(ende) > 0) {
    zeilen.push(`${uhr(volleStundeVorEnde)} → ${uhr(ende)} sind ${minuteVon(ende)} Minuten.`);
    teile.push(minuteVon(ende));
  }
  zeilen.push(`Zähle zusammen: ${teile.join(" + ")} = ?`);
  return zeilen;
}

function vorwaertsErklaerung(start, min, ergebnis) {
  if (min >= 60) {
    const h = Math.floor(min / 60);
    const rest = min % 60;
    if (rest === 0) {
      return `${min} Minuten sind genau ${stunden(h)}. ${uhr(start)} + ${stunden(h)} = ${uhr(ergebnis)}.`;
    }
    const zwischen = plus(start, h * 60);
    return `${min} Minuten sind ${dauer(min)}. ${uhr(start)} + ${stunden(h)} = ${uhr(zwischen)}. Dann noch ${rest} Minuten dazu: ${uhr(ergebnis)}.`;
  }
  const bisVoll = 60 - minuteVon(start);
  if (min > bisVoll) {
    return `${uhr(start)} + ${min} Minuten = ${uhr(ergebnis)}. Brücke: erst ${bisVoll} Minuten bis ${uhr(plus(start, bisVoll))}, dann noch ${min - bisVoll} Minuten.`;
  }
  if (min === bisVoll) {
    return `${uhr(start)} + ${min} Minuten = ${uhr(ergebnis)}. ${minuteVon(start)} + ${min} = 60 Minuten, das ist genau die volle Stunde.`;
  }
  return `${uhr(start)} + ${min} Minuten = ${uhr(ergebnis)}. Die Stunde bleibt gleich, du rechnest nur die Minuten dazu.`;
}

function rueckwaertsErklaerung(ende, min, ergebnis) {
  if (min >= 60) {
    const h = Math.floor(min / 60);
    const rest = min % 60;
    if (rest === 0) {
      return `${min} Minuten sind genau ${stunden(h)}. ${uhr(ende)} − ${stunden(h)} = ${uhr(ergebnis)}.`;
    }
    const zwischen = minus(ende, h * 60);
    return `${min} Minuten sind ${dauer(min)}. ${uhr(ende)} − ${stunden(h)} = ${uhr(zwischen)}. Dann noch ${rest} Minuten zurück: ${uhr(ergebnis)}.`;
  }
  const seitVoll = minuteVon(ende);
  if (min <= seitVoll) {
    return `${uhr(ende)} − ${min} Minuten = ${uhr(ergebnis)}. Die Stunde bleibt gleich, du ziehst nur die Minuten ab.`;
  }
  if (seitVoll === 0) {
    return `${uhr(ende)} − ${min} Minuten = ${uhr(ergebnis)}. Geh eine Stunde zurück auf ${uhr(minus(ende, 60))}. Dann 60 − ${min} = ${60 - min} Minuten nach ${stundeVon(ergebnis)} Uhr.`;
  }
  return `${uhr(ende)} − ${min} Minuten = ${uhr(ergebnis)}. Brücke rückwärts: erst ${seitVoll} Minuten zurück bis ${uhr(minus(ende, seitVoll))}, dann noch ${min - seitVoll} Minuten.`;
}

// ---------- Uebungs-Bausteine ----------

/**
 * Vorwaerts rechnen. abschnitte = Minuten der einzelnen Teile (Arbeit, Pause …).
 * prompt bekommt nichts vom Ergebnis zu sehen.
 */
function vorwaerts({ prompt, start, abschnitte }) {
  pruefeUhrzeit(start);
  const min = summe(abschnitte);
  const antwort = plus(start, min);
  const tipp = vorwaertsTipp(start, min);
  let erklaerung = vorwaertsErklaerung(start, min, antwort);
  if (abschnitte.length > 1) {
    tipp.unshift(`Zähle erst alle Minuten zusammen: ${abschnitte.join(" + ")} = ${min} Minuten.`);
    erklaerung = `Alle Minuten zusammen: ${abschnitte.join(" + ")} = ${min} Minuten. ${erklaerung}`;
  }
  return uhrzeitAufgabe(prompt, antwort, tipp, erklaerung);
}

function rueckwaerts({ prompt, ende, abschnitte, erklaerungVorne }) {
  pruefeUhrzeit(ende);
  const min = summe(abschnitte);
  const antwort = minus(ende, min);
  const tipp = rueckwaertsTipp(ende, min);
  let erklaerung = rueckwaertsErklaerung(ende, min, antwort);
  if (abschnitte.length > 1) {
    tipp.unshift(`Zähle erst alle Minuten zusammen: ${abschnitte.join(" + ")} = ${min} Minuten.`);
    erklaerung = `Alle Minuten zusammen: ${abschnitte.join(" + ")} = ${min} Minuten. ${erklaerung}`;
  }
  if (erklaerungVorne) erklaerung = `${erklaerungVorne} ${erklaerung}`;
  return uhrzeitAufgabe(prompt, antwort, tipp, erklaerung);
}

function uhrzeitAufgabe(prompt, antwort, tipp, erklaerung) {
  pruefeUhrzeit(antwort);
  return {
    type: "number_input",
    data: {
      prompt,
      answer: antwort,
      format: "uhrzeit",
      hint: tipp.join("\n"),
      explanation: erklaerung,
    },
  };
}

/** Dauer zwischen zwei Uhrzeiten, Antwort in Minuten. */
function wieLange({ prompt, start, ende }) {
  pruefeUhrzeit(start);
  pruefeUhrzeit(ende);
  const min = inMinuten(ende) - inMinuten(start);
  if (min <= 0) throw new Error(`Ende vor Start: ${start} ${ende}`);
  const bruecke = stundeVon(start) === stundeVon(ende)
    ? "Die Stunde bleibt gleich, du ziehst nur die Minuten ab."
    : `Nicht einfach die Zahlen abziehen! Rechne erst bis zur vollen Stunde (${60 - minuteVon(start)} Minuten), dann weiter bis zum Ende.`;
  return {
    type: "number_input",
    data: {
      prompt,
      answer: min,
      hint: dauerTipp(start, ende).join("\n"),
      explanation: `Von ${uhr(start)} bis ${uhr(ende)} sind es ${min} Minuten${min >= 60 ? ` (${dauer(min)})` : ""}. ${bruecke}`,
    },
  };
}

/** Minuten-Aufgabe ohne Uhrzeit (z. B. Minuten zusammenzaehlen). */
function minutenAufgabe({ prompt, answer, hint, explanation }) {
  return { type: "number_input", data: { prompt, answer, hint, explanation } };
}

/**
 * Auswahl mit ENG beieinander liegenden Uhrzeiten (kein Schaetzen).
 * falsch = typische Fehler (z. B. Stunde vergessen, Pause vergessen).
 */
function engeAuswahl({ prompt, richtig, falsch, explanation }) {
  pruefeUhrzeit(richtig);
  falsch.forEach(pruefeUhrzeit);
  if (new Set([richtig, ...falsch]).size !== falsch.length + 1) {
    throw new Error(`Doppelte Option in: ${prompt}`);
  }
  return {
    type: "multiple_choice",
    data: {
      prompt,
      options: [
        { text: uhr(richtig), correct: true },
        ...falsch.map((t) => ({ text: uhr(t) })),
      ],
      explanation,
    },
  };
}

const auswahl = (prompt, richtig, falsche, explanation) => ({
  type: "multiple_choice",
  data: {
    prompt,
    options: [{ text: richtig, correct: true }, ...falsche.map((text) => ({ text }))],
    explanation,
  },
});

const reihenfolge = (prompt, steps, explanation) => ({
  type: "steps_order",
  data: { prompt, steps: steps.map((text) => ({ text })), explanation },
});

// ---------- Die Lektionen ----------

const LESSONS = [
  {
    slug: "zeit-rechnen-volle-stunde",
    title: "Über die volle Stunde rechnen",
    sort: 1,
    intro: [
      "Uhrzeiten rechnest du fast wie normale Zahlen. Es gibt nur einen Unterschied: Eine Stunde hat 60 Minuten. Nach 59 Minuten beginnt eine neue Stunde.",
      "Ein Beispiel: Es ist 7:56 Uhr. In 4 Minuten ist es 8:00 Uhr. Das ist die volle Stunde.",
      "Der beste Trick heißt Brücke. Rechne zuerst bis zur vollen Stunde. Dann rechnest du den Rest dazu.",
      "So geht es bei 7:56 Uhr + 43 Minuten: Bis 8:00 Uhr sind es 4 Minuten. 43 − 4 = 39 Minuten bleiben übrig. 8:00 Uhr + 39 Minuten = 8:39 Uhr.",
      "MERKE: 1 Stunde = 60 Minuten. Rechne erst bis zur vollen Stunde, dann den Rest.",
      "So tippst du eine Uhrzeit ein: erst die Stunde, dann die Minuten. Für 8:39 Uhr tippst du 8, 3, 9. Du kannst auch den Doppelpunkt mittippen: 8 : 3 9.",
    ].join("\n\n"),
    exercises: [
      minutenAufgabe({
        prompt: "⏰ Wie viele Minuten hat eine Stunde?",
        answer: 60,
        hint: "Schau auf die Uhr: Der große Zeiger läuft einmal ganz herum. Dabei zählt er alle Minuten.",
        explanation: "Eine Stunde hat 60 Minuten. Nach 59 Minuten beginnt die nächste Stunde.",
      }),
      minutenAufgabe({
        prompt: "🚆 Es ist 7:56 Uhr. Wie viele Minuten sind es noch bis 8:00 Uhr?",
        answer: 4,
        hint: "Eine Stunde hat 60 Minuten.\n60 − 56 = ?",
        explanation: "60 − 56 = 4. Von 7:56 Uhr bis 8:00 Uhr sind es 4 Minuten.",
      }),
      minutenAufgabe({
        prompt: "🐴 Es ist 15:48 Uhr. Wie viele Minuten sind es noch bis 16:00 Uhr?",
        answer: 12,
        hint: "Eine Stunde hat 60 Minuten.\n60 − 48 = ?",
        explanation: "60 − 48 = 12. Von 15:48 Uhr bis 16:00 Uhr sind es 12 Minuten.",
      }),
      minutenAufgabe({
        prompt: "🧺 Es ist 9:37 Uhr. Wie viele Minuten sind es bis zur vollen Stunde?",
        answer: 23,
        hint: "Die volle Stunde ist 10:00 Uhr.\n60 − 37 = ?",
        explanation: "60 − 37 = 23. Von 9:37 Uhr bis 10:00 Uhr sind es 23 Minuten.",
      }),
      auswahl(
        "🤔 Tom rechnet: 7:56 Uhr + 43 Minuten = 7:99 Uhr. Was hat Tom falsch gemacht?",
        "Nach 59 Minuten beginnt eine neue Stunde. 7:99 Uhr gibt es nicht.",
        [
          "Er hätte die Minuten abziehen müssen: 56 − 43 = 13, also 7:13 Uhr.",
          "Nichts. 7:99 Uhr ist richtig, die Uhr zeigt dann 99 Minuten.",
        ],
        "Tom hat die Minuten einfach zusammengezählt: 56 + 43 = 99. Aber eine Stunde hat nur 60 Minuten. Mit der Brücke: 4 Minuten bis 8:00 Uhr, dann noch 39 Minuten. Richtig ist 8:39 Uhr.",
      ),
      reihenfolge(
        "🌉 Bring den Rechenweg für 7:56 Uhr + 43 Minuten in die richtige Reihenfolge.",
        [
          "Bis zur vollen Stunde rechnen: 7:56 Uhr → 8:00 Uhr sind 4 Minuten.",
          "Den Rest ausrechnen: 43 − 4 = 39 Minuten.",
          "Den Rest zur vollen Stunde dazuzählen: 8:00 Uhr + 39 Minuten.",
          "Das Ergebnis aufschreiben: 8:39 Uhr.",
        ],
        "Die Brücke hat immer diese Reihenfolge: erst bis zur vollen Stunde, dann den Rest ausrechnen, dann den Rest dazuzählen.",
      ),
      vorwaerts({
        prompt: "⏰ Es ist 8:50 Uhr. Wie spät ist es in 20 Minuten?",
        start: 850,
        abschnitte: [20],
      }),
      vorwaerts({
        prompt: "⏰ Es ist 11:45 Uhr. Wie spät ist es in 30 Minuten?",
        start: 1145,
        abschnitte: [30],
      }),
      {
        type: "match_pairs",
        data: {
          prompt: "🕐 Was ist gleich lang? Verbinde.",
          pairs: [
            { left: { text: "15 Minuten" }, right: { text: "eine Viertelstunde" } },
            { left: { text: "30 Minuten" }, right: { text: "eine halbe Stunde" } },
            { left: { text: "45 Minuten" }, right: { text: "eine Dreiviertelstunde" } },
            { left: { text: "60 Minuten" }, right: { text: "1 Stunde" } },
            { left: { text: "90 Minuten" }, right: { text: "1 Stunde und 30 Minuten" } },
            { left: { text: "120 Minuten" }, right: { text: "2 Stunden" } },
          ],
          explanation: "Denk immer an 60: Eine Stunde hat 60 Minuten. Die Hälfte davon sind 30 Minuten, ein Viertel sind 15 Minuten.",
        },
      },
      minutenAufgabe({
        prompt: "⏰ 75 Minuten sind 1 Stunde und wie viele Minuten?",
        answer: 15,
        hint: "1 Stunde = 60 Minuten.\n75 − 60 = ?",
        explanation: "75 − 60 = 15. Also sind 75 Minuten 1 Stunde und 15 Minuten.",
      }),
    ],
  },
  {
    slug: "zeit-rechnen-stufe-1",
    title: "Stufe 1: Startzeit und Dauer",
    sort: 2,
    intro: [
      "In dieser Stufe hast du immer eine Startzeit und eine Dauer. Du rechnest aus, wann etwas fertig ist.",
      "Zum Beispiel: Die Pizza kommt um 18:14 Uhr in den Ofen. Sie braucht 27 Minuten. Wann ist sie fertig?",
      "Bleibst du in derselben Stunde, rechnest du nur die Minuten: 14 + 27 = 41. Die Pizza ist um 18:41 Uhr fertig.",
      "Kommst du über die volle Stunde, nimm die Brücke: erst bis zur vollen Stunde, dann den Rest.",
      "MERKE: Startzeit + Dauer = Endzeit.",
    ].join("\n\n"),
    exercises: [
      vorwaerts({ prompt: "🍕 Die Pizza kommt um 18:14 Uhr in den Ofen. Sie braucht 27 Minuten. Wann ist sie fertig?", start: 1814, abschnitte: [27] }),
      vorwaerts({ prompt: "🚆 Abfahrt: 7:56 Uhr. Fahrzeit: 43 Minuten. Wann kommt der Zug an?", start: 756, abschnitte: [43] }),
      vorwaerts({ prompt: "🚆 Abfahrt: 8:43 Uhr. Fahrzeit: 58 Minuten. Wann kommt der Zug an?", start: 843, abschnitte: [58] }),
      vorwaerts({ prompt: "🧁 Der Kuchen kommt um 14:35 Uhr in den Ofen. Er backt 45 Minuten. Wann ist er fertig?", start: 1435, abschnitte: [45] }),
      engeAuswahl({
        prompt: "🧺 Die Waschmaschine startet um 9:47 Uhr. Das Programm dauert 38 Minuten. Wann ist die Wäsche fertig?",
        richtig: plus(947, 38),
        falsch: [1035, 925],
        explanation: vorwaertsErklaerung(947, 38, plus(947, 38)),
      }),
      vorwaerts({ prompt: "🚌 Der Bus fährt um 12:38 Uhr ab. Die Fahrt dauert 29 Minuten. Wann kommst du an?", start: 1238, abschnitte: [29] }),
      vorwaerts({ prompt: "🐴 Um 16:52 Uhr fängst du an, dein Pferd zu putzen. Das dauert 25 Minuten. Wann bist du fertig?", start: 1652, abschnitte: [25] }),
      vorwaerts({ prompt: "🛏️ Du beginnst um 10:41 Uhr mit dem Gästezimmer. Du brauchst 34 Minuten. Wann bist du fertig?", start: 1041, abschnitte: [34] }),
      vorwaerts({ prompt: "🥚 Die Eier kommen um 7:53 Uhr ins kochende Wasser. Sie kochen 9 Minuten. Wann sind sie fertig?", start: 753, abschnitte: [9] }),
      vorwaerts({ prompt: "🍝 Die Nudeln kommen um 12:20 Uhr ins Wasser. Sie kochen 11 Minuten. Wann sind sie fertig?", start: 1220, abschnitte: [11] }),
    ],
  },
  {
    slug: "zeit-rechnen-stufe-2",
    title: "Stufe 2: Zwei Zeitabschnitte",
    sort: 3,
    intro: [
      "Jetzt gibt es zwei Zeitabschnitte hintereinander. Zum Beispiel: Die Nudeln kochen 11 Minuten. Danach stehen sie noch 5 Minuten.",
      "Zähle zuerst beide Zeiten zusammen: 11 + 5 = 16 Minuten. Dann rechnest du von der Startzeit aus weiter.",
      "Du beginnst um 12:46 Uhr. Bis 13:00 Uhr sind es 14 Minuten. 16 − 14 = 2 Minuten bleiben übrig. Du kannst um 13:02 Uhr essen.",
      "MERKE: Erst alle Minuten zusammenzählen, dann zur Startzeit dazurechnen.",
    ].join("\n\n"),
    exercises: [
      minutenAufgabe({
        prompt: "🍝 Die Nudeln kochen 11 Minuten. Danach stehen sie noch 5 Minuten. Wie viele Minuten sind das zusammen?",
        answer: 16,
        hint: "Zähle beide Zeiten zusammen:\n11 + 5 = ?",
        explanation: "11 + 5 = 16 Minuten. Auch das Stehenlassen gehört zur Zeit dazu.",
      }),
      vorwaerts({ prompt: "🍝 Die Nudeln kochen 11 Minuten. Danach stehen sie noch 5 Minuten. Du beginnst um 12:46 Uhr. Wann kannst du essen?", start: 1246, abschnitte: [11, 5] }),
      vorwaerts({ prompt: "🧁 Der Teig ruht 25 Minuten. Danach backt der Kuchen 35 Minuten. Du beginnst um 13:47 Uhr. Wann ist der Kuchen fertig?", start: 1347, abschnitte: [25, 35] }),
      vorwaerts({ prompt: "🧺 Die Wäsche wird 58 Minuten gewaschen. Danach trocknet sie 47 Minuten im Trockner. Du startest um 8:36 Uhr. Wann ist die Wäsche trocken?", start: 836, abschnitte: [58, 47] }),
      vorwaerts({ prompt: "🚆 Du fährst um 7:44 Uhr mit dem Zug los. Die Zugfahrt dauert 23 Minuten. Danach gehst du noch 12 Minuten zu Fuß. Wann bist du da?", start: 744, abschnitte: [23, 12] }),
      engeAuswahl({
        prompt: "🍗 Das Hähnchen brät 35 Minuten. Danach ruht es 10 Minuten. Du beginnst um 11:52 Uhr. Wann kannst du essen?",
        richtig: plus(1152, 45),
        falsch: [1227, 1247],
        explanation: `Alle Minuten zusammen: 35 + 10 = 45 Minuten. ${vorwaertsErklaerung(1152, 45, plus(1152, 45))}`,
      }),
      vorwaerts({ prompt: "🛁 Du putzt zuerst 19 Minuten das Bad. Danach putzt du 26 Minuten die Küche. Du beginnst um 9:18 Uhr. Wann bist du fertig?", start: 918, abschnitte: [19, 26] }),
      vorwaerts({ prompt: "🐴 Du sattelst dein Pferd 14 Minuten lang. Dann reitest du 38 Minuten. Du beginnst um 15:25 Uhr. Wann bist du fertig?", start: 1525, abschnitte: [14, 38] }),
      reihenfolge(
        "🍝 Nudeln: Beginn 12:46 Uhr, 11 Minuten kochen, 5 Minuten stehen. Bring den Rechenweg in die richtige Reihenfolge.",
        [
          "Beide Zeiten zusammenzählen: 11 + 5 = 16 Minuten.",
          "Bis zur vollen Stunde rechnen: 12:46 Uhr → 13:00 Uhr sind 14 Minuten.",
          "Den Rest ausrechnen: 16 − 14 = 2 Minuten.",
          "Den Rest dazuzählen: 13:00 Uhr + 2 Minuten = 13:02 Uhr.",
        ],
        "Bei zwei Abschnitten zählst du zuerst alle Minuten zusammen. Danach kommt die Brücke über die volle Stunde.",
      ),
      vorwaerts({ prompt: "🍳 Das Rührei brät 6 Minuten. Danach toastest du noch 3 Minuten Brot. Du beginnst um 7:30 Uhr. Wann ist das Frühstück fertig?", start: 730, abschnitte: [6, 3] }),
    ],
  },
  {
    slug: "zeit-rechnen-stufe-3",
    title: "Stufe 3: Mit Pause",
    sort: 4,
    intro: [
      "Eine Pause zählt auch zur Zeit! Auch wenn du nichts tust, läuft die Uhr weiter.",
      "Zum Beispiel beim Ausreiten: Du reitest um 15:48 Uhr los. Nach 27 Minuten macht ihr 8 Minuten Pause. Danach reitet ihr noch 34 Minuten.",
      "Zähle alles zusammen: 27 + 8 + 34 = 69 Minuten. 69 Minuten sind 1 Stunde und 9 Minuten.",
      "15:48 Uhr + 1 Stunde = 16:48 Uhr. Dann noch 9 Minuten: Ihr seid um 16:57 Uhr wieder am Stall.",
      "MERKE: Pausen immer mitzählen: Arbeit + Pause + Arbeit.",
    ].join("\n\n"),
    exercises: [
      minutenAufgabe({
        prompt: "🐴 Du reitest 27 Minuten. Dann macht ihr 8 Minuten Pause. Danach reitet ihr noch 34 Minuten. Wie viele Minuten seid ihr insgesamt unterwegs?",
        answer: 69,
        hint: "Zähle alle drei Zeiten zusammen:\n27 + 8 = 35\n35 + 34 = ?",
        explanation: "27 + 8 + 34 = 69 Minuten. Die Pause gehört dazu, denn die Uhr läuft weiter.",
      }),
      vorwaerts({ prompt: "🐴 Du reitest um 15:48 Uhr los. Nach 27 Minuten macht ihr 8 Minuten Pause. Danach reitet ihr noch 34 Minuten. Wann seid ihr wieder am Stall?", start: 1548, abschnitte: [27, 8, 34] }),
      vorwaerts({ prompt: "🐴 Start: 9:37 Uhr. Reiten: 41 Minuten. Pause: 11 Minuten. Reiten: 26 Minuten. Wann seid ihr zurück?", start: 937, abschnitte: [41, 11, 26] }),
      vorwaerts({ prompt: "🧺 Du startest um 10:38 Uhr mit Putzen. Bad: 19 Minuten. Pause: 7 Minuten. Wohnzimmer: 26 Minuten. Wann bist du fertig?", start: 1038, abschnitte: [19, 7, 26] }),
      vorwaerts({ prompt: "🚶 Start: 16:27 Uhr. Laufen: 18 Minuten. Pause: 9 Minuten. Laufen: 24 Minuten. Wann bist du wieder zu Hause?", start: 1627, abschnitte: [18, 9, 24] }),
      auswahl(
        "🤔 Lena rechnet beim Ausreiten nur die Reitzeit: 27 + 34 Minuten. Die 8 Minuten Pause lässt sie weg. Was passiert?",
        "Sie denkt, sie ist um 16:49 Uhr am Stall. Wirklich ist sie erst um 16:57 Uhr da.",
        [
          "Sie ist wirklich schon um 16:49 Uhr am Stall, denn in der Pause reitet sie nicht.",
          "Sie denkt, sie ist um 16:57 Uhr am Stall. Wirklich ist sie schon um 16:49 Uhr da.",
        ],
        "In der Pause läuft die Uhr weiter. Wer die Pause vergisst, rechnet eine zu frühe Uhrzeit aus. 15:48 Uhr + 69 Minuten = 16:57 Uhr. Ohne Pause wären es nur 61 Minuten.",
      ),
      vorwaerts({ prompt: "🏠 Du beginnst um 10:05 Uhr in der Ferienwohnung. Du putzt 48 Minuten. Dann machst du 15 Minuten Pause. Danach beziehst du 22 Minuten lang die Betten. Wann bist du fertig?", start: 1005, abschnitte: [48, 15, 22] }),
      engeAuswahl({
        prompt: "🚶 Start: 14:44 Uhr. Laufen: 26 Minuten. Pause: 12 Minuten. Laufen: 19 Minuten. Wann bist du zurück?",
        richtig: plus(1444, 57),
        falsch: [1529, 1551],
        explanation: `Alle Minuten zusammen: 26 + 12 + 19 = 57 Minuten. ${vorwaertsErklaerung(1444, 57, plus(1444, 57))}`,
      }),
      reihenfolge(
        "🐴 Ausreiten: Start 15:48 Uhr, 27 Minuten reiten, 8 Minuten Pause, 34 Minuten reiten. Bring den Rechenweg in die richtige Reihenfolge.",
        [
          "Alle Zeiten zusammenzählen, auch die Pause: 27 + 8 + 34 = 69 Minuten.",
          "Umrechnen: 69 Minuten sind 1 Stunde und 9 Minuten.",
          "Die volle Stunde dazuzählen: 15:48 Uhr + 1 Stunde = 16:48 Uhr.",
          "Die Minuten dazuzählen: 16:48 Uhr + 9 Minuten = 16:57 Uhr.",
        ],
        "Sind es mehr als 60 Minuten, rechne zuerst in Stunden und Minuten um. Dann zählst du erst die Stunde und danach die Minuten dazu.",
      ),
      vorwaerts({ prompt: "☕ Du arbeitest ab 9:00 Uhr 50 Minuten lang. Dann machst du 10 Minuten Pause. Wie spät ist es nach der Pause?", start: 900, abschnitte: [50, 10] }),
    ],
  },
  {
    slug: "zeit-rechnen-stufe-4",
    title: "Stufe 4: Verspätung und Wartezeit",
    sort: 5,
    intro: [
      "Züge und Busse sind nicht immer pünktlich. Verspätung heißt: Der Zug kommt später als geplant.",
      "Hat der Zug Verspätung, rechnest du plus. Planmäßig 7:52 Uhr + 14 Minuten Verspätung = 8:06 Uhr.",
      "Eine Wartezeit unterwegs zählt wie eine Pause. Du rechnest sie zur Fahrzeit dazu.",
      "Achtung bei dieser Frage: Wann wäre der Zug pünktlich gewesen? Dann nimmst du die Verspätung wieder weg. Du rechnest also minus.",
      "MERKE: Verspätung oder Wartezeit: plus. Pünktliche Zeit gesucht: minus.",
    ].join("\n\n"),
    exercises: [
      vorwaerts({ prompt: "🚌 Der Bus soll um 7:52 Uhr kommen. Er hat 14 Minuten Verspätung. Wann kommt er wirklich?", start: 752, abschnitte: [14] }),
      vorwaerts({ prompt: "🚆 Der Zug fährt um 14:52 Uhr. Er wartet unterwegs 12 Minuten. Die eigentliche Fahrzeit beträgt 39 Minuten. Wann kommt er an?", start: 1452, abschnitte: [12, 39] }),
      auswahl(
        "🚆 Der Zug kommt um 9:17 Uhr an. Er hatte 21 Minuten Verspätung. Wie rechnest du aus, wann er pünktlich gewesen wäre?",
        "9:17 Uhr − 21 Minuten",
        ["9:17 Uhr + 21 Minuten", "21 Minuten − 17 Minuten"],
        "Mit Verspätung kommt der Zug später an. Pünktlich wäre er also früher gewesen. Darum nimmst du die 21 Minuten weg: 9:17 Uhr − 21 Minuten.",
      ),
      rueckwaerts({
        prompt: "🚆 Der Zug kommt um 9:17 Uhr an. Er hatte 21 Minuten Verspätung. Wann wäre er pünktlich angekommen?",
        ende: 917,
        abschnitte: [21],
        erklaerungVorne: "Pünktlich wäre er 21 Minuten früher gewesen.",
      }),
      vorwaerts({ prompt: "🚆 Dein Zug soll um 16:38 Uhr ankommen. Er hat 27 Minuten Verspätung. Wann kommt er an?", start: 1638, abschnitte: [27] }),
      vorwaerts({ prompt: "🚆 Der Zug fährt um 11:46 Uhr ab. Unterwegs wartet er 8 Minuten. Die eigentliche Fahrzeit ist 45 Minuten. Wann kommt er an?", start: 1146, abschnitte: [8, 45] }),
      wieLange({ prompt: "🚌 Der Bus hätte um 13:05 Uhr kommen sollen. Er kommt um 13:22 Uhr. Wie viele Minuten Verspätung hat er?", start: 1305, ende: 1322 }),
      rueckwaerts({
        prompt: "🚆 Der Zug kommt um 18:04 Uhr an. Er hatte 16 Minuten Verspätung. Wann wäre er pünktlich angekommen?",
        ende: 1804,
        abschnitte: [16],
        erklaerungVorne: "Pünktlich wäre er 16 Minuten früher gewesen.",
      }),
      engeAuswahl({
        prompt: "🚆 Der Zug fährt um 6:49 Uhr ab. Er wartet unterwegs 15 Minuten. Die Fahrzeit ist 37 Minuten. Wann kommt er an?",
        richtig: plus(649, 52),
        falsch: [726, 751],
        explanation: `Fahrzeit und Wartezeit zusammen: 37 + 15 = 52 Minuten. ${vorwaertsErklaerung(649, 52, plus(649, 52))}`,
      }),
      vorwaerts({ prompt: "🚌 Der Bus soll um 8:10 Uhr kommen. Er hat 5 Minuten Verspätung. Wann kommt er?", start: 810, abschnitte: [5] }),
    ],
  },
  {
    slug: "zeit-rechnen-stufe-5",
    title: "Stufe 5: Rückwärts rechnen",
    sort: 6,
    intro: [
      "Manchmal kennst du das Ende und suchst den Anfang. Zum Beispiel: Der Zug kommt um 10:18 Uhr an. Er braucht 47 Minuten. Wann ist er abgefahren?",
      "Dann rechnest du rückwärts: Endzeit minus Dauer.",
      "Die Brücke geht auch rückwärts. Geh zuerst zurück bis zur vollen Stunde: 10:18 Uhr → 10:00 Uhr sind 18 Minuten. 47 − 18 = 29 Minuten musst du noch zurück.",
      "Eine Stunde zurück ist 9:00 Uhr. 60 − 29 = 31. Der Zug ist um 9:31 Uhr abgefahren.",
      "MERKE: Endzeit − Dauer = Startzeit. So planst du, wann du spätestens losmusst.",
    ].join("\n\n"),
    exercises: [
      rueckwaerts({ prompt: "🚆 Der Zug kommt um 10:18 Uhr an. Er braucht 47 Minuten. Wann ist er abgefahren?", ende: 1018, abschnitte: [47] }),
      rueckwaerts({ prompt: "🏢 Du musst um 8:15 Uhr bei der Arbeit sein. Der Weg dauert 38 Minuten. Wann musst du spätestens losgehen?", ende: 815, abschnitte: [38] }),
      rueckwaerts({ prompt: "🍖 Das Essen soll um 12:30 Uhr fertig sein. Der Braten braucht 1 Stunde und 25 Minuten. Wann muss er in den Ofen?", ende: 1230, abschnitte: [85] }),
      rueckwaerts({ prompt: "🐴 Die Reitstunde beginnt um 16:10 Uhr. Du brauchst 25 Minuten bis zum Stall. Wann musst du losfahren?", ende: 1610, abschnitte: [25] }),
      reihenfolge(
        "🚆 Der Zug kommt um 10:18 Uhr an und braucht 47 Minuten. Bring den Rechenweg rückwärts in die richtige Reihenfolge.",
        [
          "Zurück bis zur vollen Stunde: 10:18 Uhr → 10:00 Uhr sind 18 Minuten.",
          "Den Rest ausrechnen: 47 − 18 = 29 Minuten.",
          "Noch 29 Minuten zurück: von 10:00 Uhr aus rückwärts rechnen.",
          "Das Ergebnis aufschreiben: 9:31 Uhr.",
        ],
        "Rückwärts geht die Brücke genauso: erst zurück bis zur vollen Stunde, dann den Rest weiter zurück.",
      ),
      rueckwaerts({ prompt: "🧁 Der Kuchen soll um 15:00 Uhr fertig sein. Er backt 55 Minuten. Wann muss er in den Ofen?", ende: 1500, abschnitte: [55] }),
      rueckwaerts({ prompt: "🛏️ Um 16:00 Uhr kommen neue Gäste in die Ferienwohnung. Du brauchst 2 Stunden und 15 Minuten zum Putzen. Wann musst du spätestens anfangen?", ende: 1600, abschnitte: [135] }),
      engeAuswahl({
        prompt: "🚆 Der Zug kommt um 14:06 Uhr an. Die Fahrt dauert 52 Minuten. Wann ist er abgefahren?",
        richtig: minus(1406, 52),
        falsch: [1354, 1324],
        explanation: rueckwaertsErklaerung(1406, 52, minus(1406, 52)),
      }),
      rueckwaerts({ prompt: "🧺 Die Wäsche soll um 11:20 Uhr fertig sein. Das Programm dauert 1 Stunde und 35 Minuten. Wann musst du die Maschine starten?", ende: 1120, abschnitte: [95] }),
      rueckwaerts({ prompt: "🍕 Die Pizza ist um 18:41 Uhr fertig. Sie war 27 Minuten im Ofen. Wann kam sie in den Ofen?", ende: 1841, abschnitte: [27] }),
    ],
  },
  {
    slug: "zeit-rechnen-dauer",
    title: "Andersherum: Wie lange dauert es?",
    sort: 7,
    intro: [
      "Jetzt kennst du den Start und das Ende. Du suchst die Dauer.",
      "Achtung, eine Falle: Du darfst die Uhrzeiten nicht einfach wie Zahlen abziehen. Von 9:45 Uhr bis 10:10 Uhr sind es nicht 65 Minuten!",
      "Nimm wieder die Brücke. Vom Start bis zur vollen Stunde: 9:45 Uhr → 10:00 Uhr sind 15 Minuten. Von der vollen Stunde bis zum Ende: 10:00 Uhr → 10:10 Uhr sind 10 Minuten.",
      "Zähle beides zusammen: 15 + 10 = 25 Minuten.",
      "MERKE: Dauer = Minuten bis zur vollen Stunde + Minuten danach.",
    ].join("\n\n"),
    exercises: [
      wieLange({ prompt: "🚆 Der Zug fährt um 7:56 Uhr ab und kommt um 8:39 Uhr an. Wie viele Minuten dauert die Fahrt?", start: 756, ende: 839 }),
      wieLange({ prompt: "🍕 Die Pizza kommt um 18:14 Uhr in den Ofen. Um 18:41 Uhr ist sie fertig. Wie viele Minuten backt sie?", start: 1814, ende: 1841 }),
      wieLange({ prompt: "🐴 Du reitest um 15:48 Uhr los. Um 16:57 Uhr bist du wieder am Stall. Wie viele Minuten warst du unterwegs?", start: 1548, ende: 1657 }),
      wieLange({ prompt: "🧺 Du putzt von 10:38 Uhr bis 11:30 Uhr. Wie viele Minuten sind das?", start: 1038, ende: 1130 }),
      auswahl(
        "⏰ Wie viele Minuten sind es von 9:45 Uhr bis 10:10 Uhr?",
        "25 Minuten",
        ["65 Minuten", "35 Minuten"],
        "Nicht einfach die Zahlen abziehen (1010 − 945 = 65 stimmt nicht)! Von 9:45 Uhr bis 10:00 Uhr sind es 15 Minuten. Dann noch 10 Minuten bis 10:10 Uhr. 15 + 10 = 25 Minuten.",
      ),
      wieLange({ prompt: "🚌 Die Busfahrt beginnt um 12:38 Uhr. Sie endet um 13:07 Uhr. Wie viele Minuten dauert sie?", start: 1238, ende: 1307 }),
      wieLange({ prompt: "🍝 Du fängst um 12:46 Uhr an zu kochen. Um 13:02 Uhr isst du. Wie viele Minuten hat es gedauert?", start: 1246, ende: 1302 }),
      wieLange({ prompt: "🚶 Du gehst um 16:27 Uhr los. Um 17:18 Uhr bist du wieder zu Hause. Wie viele Minuten warst du weg?", start: 1627, ende: 1718 }),
      wieLange({ prompt: "🧁 Der Kuchen kommt um 14:35 Uhr in den Ofen. Um 15:20 Uhr ist er fertig. Wie viele Minuten backt er?", start: 1435, ende: 1520 }),
      wieLange({ prompt: "⏰ Wie viele Minuten sind es von 8:00 Uhr bis 8:30 Uhr?", start: 800, ende: 830 }),
    ],
  },
  {
    slug: "zeit-rechnen-training",
    title: "Training: Zeit rechnen gemischt",
    sort: 8,
    intro: [
      "Jetzt kommt alles gemischt. Lies jede Aufgabe genau. Frag dich zuerst: Suche ich das Ende, den Anfang oder die Dauer?",
      "Suchst du das Ende, rechnest du plus. Suchst du den Anfang, rechnest du minus. Suchst du die Dauer, rechnest du vom Start bis zum Ende.",
      "MERKE: Pausen und Wartezeiten zählen immer mit. Über die volle Stunde hilft die Brücke.",
    ].join("\n\n"),
    exercises: [
      vorwaerts({ prompt: "🚆 Abfahrt: 13:47 Uhr. Fahrzeit: 36 Minuten. Wann kommt der Zug an?", start: 1347, abschnitte: [36] }),
      vorwaerts({ prompt: "🍲 Die Suppe kocht 24 Minuten. Danach zieht sie noch 8 Minuten. Du beginnst um 17:39 Uhr. Wann kannst du essen?", start: 1739, abschnitte: [24, 8] }),
      vorwaerts({ prompt: "🧹 Du beginnst um 8:52 Uhr. Küche: 23 Minuten. Pause: 6 Minuten. Bad: 17 Minuten. Wann bist du fertig?", start: 852, abschnitte: [23, 6, 17] }),
      rueckwaerts({
        prompt: "🚆 Der Zug kommt um 19:12 Uhr an. Er hatte 18 Minuten Verspätung. Wann wäre er pünktlich gewesen?",
        ende: 1912,
        abschnitte: [18],
        erklaerungVorne: "Pünktlich wäre er 18 Minuten früher gewesen.",
      }),
      rueckwaerts({ prompt: "🏊 Der Schwimmkurs beginnt um 10:05 Uhr. Der Weg dauert 28 Minuten. Wann musst du spätestens los?", ende: 1005, abschnitte: [28] }),
      wieLange({ prompt: "⏰ Wie viele Minuten sind es von 11:48 Uhr bis 12:21 Uhr?", start: 1148, ende: 1221 }),
      engeAuswahl({
        prompt: "🚌 Der Bus fährt um 7:34 Uhr ab. Er wartet unterwegs 6 Minuten. Die Fahrzeit ist 29 Minuten. Wann kommt er an?",
        richtig: plus(734, 35),
        falsch: [819, 759],
        explanation: `Fahrzeit und Wartezeit zusammen: 29 + 6 = 35 Minuten. ${vorwaertsErklaerung(734, 35, plus(734, 35))}`,
      }),
      vorwaerts({ prompt: "🐴 Du startest um 13:26 Uhr. Reiten: 1 Stunde und 5 Minuten. Pause: 14 Minuten. Reiten: 32 Minuten. Wann bist du zurück?", start: 1326, abschnitte: [65, 14, 32] }),
      rueckwaerts({ prompt: "🎉 Das Fest beginnt um 19:00 Uhr. Für das Buffet brauchst du 1 Stunde und 40 Minuten. Wann musst du anfangen?", ende: 1900, abschnitte: [100] }),
      vorwaerts({ prompt: "⏰ Es ist 9:55 Uhr. Wie spät ist es in 10 Minuten?", start: 955, abschnitte: [10] }),
    ],
  },
];

// ---------- Schreiben + Selbst-Check ----------
mkdirSync(OUT_DIR, { recursive: true });
for (const spec of LESSONS) {
  const lesson = {
    topic_slug: TOPIC,
    slug: spec.slug,
    title: spec.title,
    sort: spec.sort,
    intro: spec.intro,
    exercises: spec.exercises,
  };
  for (const ex of lesson.exercises) {
    // Der berechnete Tipp darf das Ergebnis nicht verraten.
    if (ex.type === "number_input" && ex.data.format === "uhrzeit") {
      const loesung = uhr(ex.data.answer).replace(" Uhr", "");
      if (ex.data.hint.includes(loesung)) {
        throw new Error(`Tipp verraet die Loesung in ${spec.slug}: ${ex.data.prompt}`);
      }
      if (!ex.data.hint.trim().endsWith("?")) {
        throw new Error(`Tipp endet nicht mit einer Frage in ${spec.slug}: ${ex.data.prompt}`);
      }
    }
  }
  const file = path.join(OUT_DIR, `${spec.slug}.json`);
  writeFileSync(file, `${JSON.stringify(lesson, null, 2)}\n`);
  console.log(`${spec.slug}: ${lesson.exercises.length} Uebungen`);
}
