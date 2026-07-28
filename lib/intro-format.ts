// Zerlegt den Einfuehrungs-Text einer Lektion in darstellbare Bloecke.
//
// Hintergrund (Amelie, 2026-07-11): Die Einfuehrung war eine einzige lange
// Textwand - "sieht nicht schoen aus und schlecht leserlich". Mit Dyspraxie
// ist so ein Block kaum zu erfassen. Darum bekommt jeder Gedanke eine eigene
// Karte, Beispielsaetze werden hervorgehoben und die Kernregel steht in einem
// eigenen Merk-Kasten.
//
// Format (neu):
//   Bloecke werden durch eine Leerzeile getrennt.
//   "MERKE: <Satz>"              -> Merk-Kasten
//   "> <fremd> = <deutsch>"      -> Beispielkarte (mit eigenem Vorlese-Knopf)
//   alles andere                 -> normaler Text
//
// Aeltere Einfuehrungen sind reiner Fliesstext ohne Leerzeilen. Die werden
// automatisch in Haeppchen von zwei Saetzen zerlegt, damit auch sie luftig
// aussehen.

import { splitSentences } from "./prompt-format";

export type IntroBlock =
  | { kind: "text"; sentences: string[] }
  | { kind: "merke"; text: string }
  | { kind: "beispiel"; fremd: string; deutsch: string | null };

/** Praefixe, die einen Merk-Kasten ausloesen (auch in aelteren Texten). */
const MERKE_PREFIX = /^(MERKE|Merke|Ganz wichtig|Wichtig|Kurz gemerkt)\s*:\s*/;

/** Saetze pro Haeppchen, wenn ein Text keine Leerzeilen hat. */
const SENTENCES_PER_CHUNK = 2;

function parseBlock(raw: string): IntroBlock[] {
  const block = raw.trim();
  if (!block) return [];

  // Beispielkarte: "> English sentence = deutsche Bedeutung"
  if (block.startsWith(">")) {
    const body = block.slice(1).trim();
    // Trenner ist " = ", damit ein "=" im Satz selbst nicht stoert.
    const at = body.indexOf(" = ");
    if (at > 0) {
      return [
        {
          kind: "beispiel",
          fremd: body.slice(0, at).trim(),
          deutsch: body.slice(at + 3).trim() || null,
        },
      ];
    }
    return [{ kind: "beispiel", fremd: body, deutsch: null }];
  }

  // Merk-Kasten
  const merke = block.match(MERKE_PREFIX);
  if (merke) {
    return [{ kind: "merke", text: block.slice(merke[0].length).trim() }];
  }

  // Normaler Text. Enthaelt er mitten drin einen Merk-Satz (aeltere
  // Einfuehrungen), wird der herausgeloest.
  const sentences = splitSentences(block);
  const out: IntroBlock[] = [];
  let puffer: string[] = [];
  const leeren = () => {
    if (puffer.length > 0) {
      out.push({ kind: "text", sentences: puffer });
      puffer = [];
    }
  };
  for (const sentence of sentences) {
    const treffer = sentence.match(MERKE_PREFIX);
    if (treffer) {
      leeren();
      out.push({ kind: "merke", text: sentence.slice(treffer[0].length).trim() });
    } else {
      puffer.push(sentence);
    }
  }
  leeren();
  return out;
}

/** Zerlegt lange Text-Bloecke in Haeppchen von je zwei Saetzen. */
function chunkText(blocks: IntroBlock[]): IntroBlock[] {
  const out: IntroBlock[] = [];
  for (const block of blocks) {
    if (block.kind !== "text" || block.sentences.length <= SENTENCES_PER_CHUNK) {
      out.push(block);
      continue;
    }
    for (let i = 0; i < block.sentences.length; i += SENTENCES_PER_CHUNK) {
      out.push({
        kind: "text",
        sentences: block.sentences.slice(i, i + SENTENCES_PER_CHUNK),
      });
    }
  }
  return out;
}

/** Baut aus dem Einfuehrungs-Text die Bloecke fuer die Anzeige. */
export function parseIntro(intro: string): IntroBlock[] {
  const roh = intro
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  const blocks = roh.flatMap(parseBlock);
  return chunkText(blocks);
}

/** Reiner Text der Einfuehrung - fuer den Vorlese-Knopf (ohne Steuerzeichen). */
export function introSpeakable(intro: string): string {
  return parseIntro(intro)
    .map((block) => {
      if (block.kind === "text") return block.sentences.join(" ");
      if (block.kind === "merke") return `Merke: ${block.text}`;
      if (!block.deutsch) return block.fremd;
      // Kein zweiter Punkt, wenn der Beispielsatz schon einen hat.
      const trenner = /[.!?…]$/.test(block.fremd) ? " " : ". ";
      return `${block.fremd}${trenner}${block.deutsch}`;
    })
    .join(" ");
}
