"use client";

// Vokabeltrainer, Uebersicht (Mama, 2026-11-27): Modus und Richtung waehlen,
// dann einen Stapel antippen. Die Stapel gehoeren zu den Lektionen des Themas
// (content/vokabeln/<thema>.json, lib/vokabeln.ts). Modus "Schreiben" seit
// Xavier, 2026-11-27.
import Link from "next/link";
import { useModus, useRichtung } from "@/components/vokabeln/useEinstellungen";
import { SAMMLUNGEN } from "@/lib/vokabeln";

const MODUS_ERKLAERUNG = {
  karten: "Karte umdrehen und selbst sagen, ob du es wusstest.",
  schreiben: "Die Antwort eintippen. Die App prüft, ob sie stimmt.",
} as const;

/** Zwei grosse Knoepfe nebeneinander, einer ist gewaehlt. */
function Umschalter<T extends string>({
  name,
  wert,
  optionen,
  waehle,
}: {
  name: string;
  wert: T;
  optionen: readonly (readonly [T, string])[];
  waehle: (neu: T) => void;
}) {
  return (
    <div role="group" aria-label={name} className="grid grid-cols-2 gap-2">
      {optionen.map(([option, label]) => {
        const aktiv = wert === option;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={aktiv}
            onClick={() => waehle(option)}
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
  );
}

export default function VokabelnPage() {
  const [richtung, waehleRichtung] = useRichtung();
  const [modus, waehleModus] = useModus();

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
          Lies das Wort und überleg dir die Antwort. Was du noch nicht kannst, kommt so
          lange wieder, bis es sitzt.
        </p>

        <section aria-label="So übst du" className="pb-6">
          <h2 className="mb-2 text-lg font-extrabold text-ink">So übst du</h2>
          <Umschalter
            name="Modus"
            wert={modus}
            optionen={[
              ["karten", "🃏 Karteikarten"],
              ["schreiben", "⌨️ Schreiben"],
            ]}
            waehle={waehleModus}
          />
          <p className="pt-2 text-sm font-semibold text-ink/70">{MODUS_ERKLAERUNG[modus]}</p>
        </section>

        {SAMMLUNGEN.map((sammlung) => (
          <section key={sammlung.thema} aria-label={sammlung.titel} className="pb-6">
            <h2 className="mb-2 text-lg font-extrabold text-ink">{sammlung.titel}</h2>

            <div className="mb-4">
              <Umschalter
                name="Richtung"
                wert={richtung}
                optionen={[
                  ["fremd-deutsch", `${sammlung.spracheName} → Deutsch`],
                  ["deutsch-fremd", `Deutsch → ${sammlung.spracheName}`],
                ]}
                waehle={waehleRichtung}
              />
            </div>

            <ul className="flex flex-col gap-2.5">
              {sammlung.stapel.map((stapel) => (
                <li key={stapel.slug}>
                  <Link
                    href={`/vokabeln/${sammlung.thema}/${stapel.slug}?richtung=${richtung}&modus=${modus}`}
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
