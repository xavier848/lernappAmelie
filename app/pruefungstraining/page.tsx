"use client";

// Pruefungs-Training /pruefungstraining (Mama + Xavier, 2026-09-29).
// Uebersicht aller Pruefungen, die gerade anstehen - je Thema "pruefung-..."
// eine Karte (lib/pruefung.ts). Seit 2026-11-04 koennen mehrere Pruefungen
// gleichzeitig laufen (z. B. Wahrnehmung, Textilien, Vitamine). Ein Tipp auf
// eine Karte oeffnet /pruefungstraining/<slug> mit den Lektionen und dem
// eigenen "Test üben" dieser Pruefung. Wie dort: kein Lernfluss, immer frei.
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Mascot } from "@/components/ui/Mascot";
import {
  fetchAttemptsForExercises,
  fetchExerciseIdsForLessons,
  fetchPath,
  fetchProgress,
} from "@/lib/data";
import { getDeviceId } from "@/lib/device";
import {
  baueVersuchsStatistik,
  istSicher,
  pruefungsPfad,
  trennePruefungsThemen,
} from "@/lib/pruefung";
import type { TopicWithLessons } from "@/lib/types";

type PruefungsKarte = {
  thema: TopicWithLessons;
  /** Lektionen mit Sternen (= mindestens einmal geschafft). */
  geschafft: number;
  /** Alle Fragen dieser Pruefung. */
  fragen: number;
  /** Davon sitzen (letzte Antwort richtig). */
  sicher: number;
};

type Phase =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "bereit"; karten: PruefungsKarte[] };

async function ladeKarten(): Promise<PruefungsKarte[]> {
  const deviceId = getDeviceId();
  const [alleThemen, progress] = await Promise.all([
    fetchPath(),
    fetchProgress(deviceId),
  ]);
  const themen = trennePruefungsThemen(alleThemen).pruefung.filter(
    (t) => t.lessons.length > 0
  );
  const erledigt = new Set(progress.map((p) => p.lesson_id));

  // Fuer die Zaehler reichen die IDs der Uebungen.
  const zeilen = await fetchExerciseIdsForLessons(
    themen.flatMap((t) => t.lessons.map((l) => l.id))
  );
  const themaJeLektion = new Map(
    themen.flatMap((t) => t.lessons.map((l) => [l.id, t.id] as const))
  );
  const idsJeThema = new Map<string, string[]>();
  for (const z of zeilen) {
    const themaId = themaJeLektion.get(z.lesson_id);
    if (!themaId) continue;
    const ids = idsJeThema.get(themaId);
    if (ids) ids.push(z.id);
    else idsJeThema.set(themaId, [z.id]);
  }

  // Versuche je Pruefung einzeln: Die IDs landen in der URL (siehe
  // fetchAttemptsForExercises), und jede Pruefung bekommt ihr eigenes Limit.
  return Promise.all(
    themen.map(async (thema) => {
      const ids = idsJeThema.get(thema.id) ?? [];
      const stats = baueVersuchsStatistik(
        await fetchAttemptsForExercises(deviceId, ids)
      );
      return {
        thema,
        geschafft: thema.lessons.filter((l) => erledigt.has(l.id)).length,
        fragen: ids.length,
        sicher: ids.filter((id) => istSicher(stats, id)).length,
      };
    })
  );
}

/** Eine Pruefung als grosse Karte - Tipp oeffnet ihre Seite. */
function Karte({ karte }: { karte: PruefungsKarte }) {
  const { thema, geschafft, fragen, sicher } = karte;
  const lektionen = thema.lessons.length;
  const prozent = fragen > 0 ? Math.round((sicher / fragen) * 100) : 0;
  return (
    <Link
      href={pruefungsPfad(thema.slug)}
      aria-label={`${thema.title}: ${geschafft} von ${lektionen} Lektionen geschafft, ${sicher} von ${fragen} Fragen sitzen schon.`}
      className="flex min-h-24 w-full items-center gap-3 rounded-2xl border-2 border-b-4 border-primary bg-white p-4 select-none active:translate-y-0.5 active:border-b-2"
    >
      <span className="text-4xl" aria-hidden>
        {thema.icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1.5" aria-hidden>
        <span className="text-lg leading-snug font-extrabold text-ink">
          {thema.title}
        </span>
        <span className="text-sm font-semibold text-ink/70">
          {geschafft} von {lektionen} Lektionen geschafft
        </span>
        <span className="h-2.5 w-full overflow-hidden rounded-full bg-locked">
          <span
            className="block h-full rounded-full bg-success"
            style={{ width: `${prozent}%` }}
          />
        </span>
        <span className="text-xs font-semibold text-ink/60">
          Schon sicher: {sicher} von {fragen} Fragen
        </span>
      </span>
      <span className="text-xl text-primary-dark" aria-hidden>
        ▶
      </span>
    </Link>
  );
}

export default function PruefungstrainingPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  const neuLaden = useCallback(() => {
    setPhase({ kind: "loading" });
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const karten = await ladeKarten();
        if (!cancelled) setPhase({ kind: "bereit", karten });
      } catch {
        if (!cancelled) setPhase({ kind: "error" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  if (phase.kind === "loading") {
    return (
      <div className="flex h-full items-center justify-center px-4">
        <p className="animate-pulse text-lg font-semibold text-ink/60">
          Einen Moment bitte …
        </p>
      </div>
    );
  }

  if (phase.kind === "error") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-8 px-4">
        <Mascot
          mood="neutral"
          message="Gerade klappt es nicht. Versuch es später nochmal."
        />
        <Button size="lg" onClick={neuLaden}>
          Nochmal versuchen
        </Button>
      </div>
    );
  }

  const { karten } = phase;

  return (
    <div className="mx-auto flex h-full w-full max-w-md flex-col overflow-y-auto overscroll-contain px-4 py-6">
      <Link
        href="/"
        className="flex min-h-12 w-fit items-center gap-2 rounded-2xl pr-4 text-base font-bold text-primary-dark"
      >
        <span aria-hidden>←</span> Zurück
      </Link>

      <h1 className="mt-2 text-2xl font-extrabold text-ink">
        Prüfungs-Training <span aria-hidden>🎯</span>
      </h1>
      <p className="mt-2 text-base text-ink/80">
        {karten.length > 1
          ? "Hier lernst du für deine Tests in der Schule. Jede Prüfung hat ihre eigenen Lektionen und ihren eigenen Test."
          : "Hier lernst du für deinen Test in der Schule."}{" "}
        Das Prüfungs-Training ist immer frei – ohne Pause und ohne Warten.
      </p>

      {karten.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-6">
          <Mascot mood="neutral" message="Gerade steht keine Prüfung an. 🎉" />
          <Button size="lg" full onClick={() => router.push("/")}>
            Zur Startseite
          </Button>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {karten.map((karte) => (
            <Karte key={karte.thema.id} karte={karte} />
          ))}
        </div>
      )}
      <div className="pb-8" />
    </div>
  );
}
