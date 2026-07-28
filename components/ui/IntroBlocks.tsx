"use client";

// Zeigt die Einfuehrung einer Lektion als luftige Bloecke statt als Textwand.
//
// Amelie (2026-07-11): "sieht nicht schoen aus und schlecht leserlich, einfach
// sehr viel Text". Darum:
//  - Erklaerungen stehen als kurze Absaetze, ein Satz pro Zeile.
//  - Beispielsaetze bekommen eine eigene Karte MIT eigenem Vorlese-Knopf -
//    beim Sprachenlernen will man genau diesen einen Satz noch mal hoeren.
//  - Die Kernregel steht in einem tuerkisen Merk-Kasten.
// Orange ist bewusst NICHT im Spiel: die Farbe steht in der App fuer falsche
// Antworten.
import { parseIntro } from "@/lib/intro-format";
import { TTSButton } from "./TTSButton";

export function IntroBlocks({
  intro,
  lang,
}: {
  intro: string;
  /** Sprache der Beispielsaetze, z. B. "en-GB". Deutsch, wenn leer. */
  lang?: string;
}) {
  const blocks = parseIntro(intro);

  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block, index) => {
        if (block.kind === "merke") {
          return (
            <div
              key={index}
              className="flex items-start gap-3 rounded-2xl border-2 border-primary bg-primary-light p-4"
            >
              <span aria-hidden className="text-2xl leading-none">
                💡
              </span>
              <p className="flex-1 text-lg leading-relaxed font-bold text-primary-dark">
                {block.text}
              </p>
            </div>
          );
        }

        if (block.kind === "beispiel") {
          return (
            <div
              key={index}
              className="flex items-start gap-3 rounded-2xl border-2 border-b-4 border-locked bg-white p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="text-lg leading-relaxed font-bold text-ink">
                  {block.fremd}
                </p>
                {block.deutsch && (
                  <p className="mt-1.5 text-base leading-relaxed text-ink/60">
                    {block.deutsch}
                  </p>
                )}
              </div>
              <TTSButton text={block.fremd} lang={lang} />
            </div>
          );
        }

        return (
          <div key={index} className="flex flex-col gap-2">
            {block.sentences.map((sentence, i) => (
              <p
                key={i}
                className="text-lg leading-relaxed font-medium text-ink"
              >
                {sentence}
              </p>
            ))}
          </div>
        );
      })}
    </div>
  );
}
