"use client";

// Vokabeltrainer, Uebersicht (Mama, 2026-11-27): Richtung waehlen und einen
// Stapel antippen. Die Stapel gehoeren zu den Lektionen des Themas
// (content/vokabeln/<thema>.json, lib/vokabeln.ts).
import Link from "next/link";
import { useRichtung } from "@/components/vokabeln/useRichtung";
import { SAMMLUNGEN } from "@/lib/vokabeln";

export default function VokabelnPage() {
  const [richtung, waehle] = useRichtung();

  return (
    <div className="flex min-h-svh flex-col">
      <div className="mx-auto w-full max-w-md px-4 pt-4 pb-10">
        <Link
          href="/"
          className="flex min-h-12 w-fit items-center gap-2 rounded-2xl pr-4 text-base font-bold text-primary-dark"
        >
          <span aria-hidden>←</span> Zurück
        </Link>

        <div className="flex items-center gap-4 pt-4 pb-2">
          <span className="text-5xl" aria-hidden>
            🃏
          </span>
          <h1 className="text-2xl font-extrabold text-ink">Vokabeln üben</h1>
        </div>
        <p className="pb-5 text-base text-ink/70">
          Karteikarten: Lies das Wort und überleg dir die Antwort. Dann dreh die
          Karte um. Was du nicht wusstest, kommt so lange wieder, bis du es
          kannst.
        </p>

        {SAMMLUNGEN.map((sammlung) => (
          <section key={sammlung.thema} aria-label={sammlung.titel} className="pb-6">
            <h2 className="mb-2 text-lg font-extrabold text-ink">{sammlung.titel}</h2>

            <div
              role="group"
              aria-label="Richtung"
              className="mb-4 grid grid-cols-2 gap-2"
            >
              {(
                [
                  ["fremd-deutsch", `${sammlung.spracheName} → Deutsch`],
                  ["deutsch-fremd", `Deutsch → ${sammlung.spracheName}`],
                ] as const
              ).map(([wert, label]) => {
                const aktiv = richtung === wert;
                return (
                  <button
                    key={wert}
                    type="button"
                    aria-pressed={aktiv}
                    onClick={() => waehle(wert)}
                    className={
                      "min-h-12 rounded-2xl border-2 border-b-4 px-2 text-sm font-bold select-none active:translate-y-0.5 active:border-b-2 " +
                      (aktiv
                        ? "border-primary-dark bg-primary text-white"
                        : "border-locked bg-white text-ink")
                    }
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <ul className="flex flex-col gap-2.5">
              {sammlung.stapel.map((stapel) => (
                <li key={stapel.slug}>
                  <Link
                    href={`/vokabeln/${sammlung.thema}/${stapel.slug}?richtung=${richtung}`}
                    className="flex min-h-16 w-full items-center gap-3 rounded-2xl border-2 border-b-4 border-locked bg-white p-3 select-none active:translate-y-0.5 active:border-b-2"
                  >
                    <span className="text-3xl" aria-hidden>
                      {stapel.icon}
                    </span>
                    <span className="flex flex-1 flex-col">
                      <span className="text-base font-bold text-ink">{stapel.titel}</span>
                      <span className="text-sm font-semibold text-ink/70">
                        {stapel.karten.length} Karten
                      </span>
                    </span>
                    <span className="text-xl text-primary-dark" aria-hidden>
                      ▶
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
