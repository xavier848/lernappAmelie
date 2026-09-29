"use client";

// Pruefungs-Training /pruefungstraining (Mama + Xavier, 2026-09-29).
// Eigene "Pruefungsplattform" fuer den Stoff eines konkreten Tests in der
// Schule: alle Themen "pruefung-..." (lib/pruefung.ts). IMMER frei:
//  - kein Lernfluss (keine Wiederholungspflicht, keine Themen-Pause) - die
//    Seite laedt das Lernfluss-Protokoll gar nicht erst;
//  - alle Lektionen in beliebiger Reihenfolge spielbar (kein 🔒);
//  - "Test üben": 20 gemischte Fragen aus allen Lektionen, zuerst das, was
//    noch nicht sitzt (lib/pruefung.waehleTestUebungen), danach die Fehler
//    gleich nachueben.
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Mascot } from "@/components/ui/Mascot";
import { ExamPlayer, type ExamResult } from "@/components/player/ExamPlayer";
import { LessonPlayer } from "@/components/player/LessonPlayer";
import {
  bumpDailyActivity,
  fetchAttemptsForExercises,
  fetchExercisesForLessons,
  fetchPath,
  fetchProgress,
} from "@/lib/data";
import { getDeviceId } from "@/lib/device";
import {
  TEST_ANZAHL,
  baueVersuchsStatistik,
  istSicher,
  trennePruefungsThemen,
  waehleTestUebungen,
  type TestUebung,
} from "@/lib/pruefung";
import type { PathLessonRow, ProgressRow, TopicWithLessons } from "@/lib/types";

type Uebersicht = {
  themen: TopicWithLessons[];
  progress: ProgressRow[];
  /** Alle Uebungen der Pruefungs-Lektionen (fuer Test + Fortschritt). */
  uebungen: TestUebung[];
  /** Wie viele Fragen sitzen schon (letzte Antwort richtig)? */
  sicher: number;
  stats: ReturnType<typeof baueVersuchsStatistik>;
};

type Phase =
  | { kind: "loading" }
  | { kind: "error" }
  | ({ kind: "uebersicht" } & Uebersicht)
  | { kind: "test"; daten: Uebersicht; fragen: TestUebung[] }
  | {
      kind: "ergebnis";
      daten: Uebersicht;
      fragen: TestUebung[];
      ergebnisse: ExamResult[];
    }
  | { kind: "fehler"; fehler: TestUebung[] };

async function ladeUebersicht(): Promise<Uebersicht> {
  const deviceId = getDeviceId();
  const [alleThemen, progress] = await Promise.all([
    fetchPath(),
    fetchProgress(deviceId),
  ]);
  const themen = trennePruefungsThemen(alleThemen).pruefung.filter(
    (t) => t.lessons.length > 0
  );
  const lessonIds = themen.flatMap((t) => t.lessons.map((l) => l.id));
  const zeilen = await fetchExercisesForLessons(lessonIds);
  const uebungen: TestUebung[] = zeilen.map((z) => ({
    id: z.id,
    lessonId: z.lesson_id,
    type: z.type,
    data: z.data,
  }));
  const versuche = await fetchAttemptsForExercises(
    deviceId,
    uebungen.map((u) => u.id)
  );
  const stats = baueVersuchsStatistik(versuche);
  const sicher = uebungen.filter((u) => istSicher(stats, u.id)).length;
  return { themen, progress, uebungen, sicher, stats };
}

/** Sterne-Anzeige (1-3) fuer geschaffte Lektionen. */
function Stars({ stars }: { stars: number }) {
  const count = Math.min(Math.max(stars, 1), 3);
  return (
    <span className="text-sm" aria-label={`${count} von 3 Sternen`}>
      {"⭐".repeat(count)}
    </span>
  );
}

/** Eine Lektions-Zeile: IMMER antippbar - hier gibt es keine Sperren. */
function LektionsZeile({
  lesson,
  sterne,
  naechste,
}: {
  lesson: PathLessonRow;
  /** Beste Sterne, wenn geschafft - sonst undefined. */
  sterne?: number;
  /** Die erste noch offene Lektion wird hervorgehoben. */
  naechste: boolean;
}) {
  if (sterne !== undefined) {
    return (
      <Link
        href={`/lektion/${lesson.slug}`}
        aria-label={`${lesson.title} – geschafft, nochmal üben`}
        className="flex min-h-16 w-full items-center gap-3 rounded-2xl border-2 border-b-4 border-locked bg-white p-3 select-none active:translate-y-0.5 active:border-b-2"
      >
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-extrabold text-white"
          aria-hidden
        >
          ✓
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="font-bold text-ink">{lesson.title}</span>
          <Stars stars={sterne} />
        </span>
        <span className="shrink-0 text-sm font-bold text-primary-dark">
          Nochmal <span aria-hidden>▶</span>
        </span>
      </Link>
    );
  }
  return (
    <Link
      href={`/lektion/${lesson.slug}`}
      aria-label={`${lesson.title} – jetzt lernen`}
      className={`flex min-h-16 w-full items-center gap-3 rounded-2xl border-2 border-b-4 p-3 select-none active:translate-y-0.5 active:border-b-2 ${
        naechste ? "border-primary bg-primary-light" : "border-locked bg-white"
      }`}
    >
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl ${
          naechste ? "bg-primary text-white" : "bg-primary-light text-primary-dark"
        }`}
        aria-hidden
      >
        ▶
      </span>
      <span className="flex-1 font-bold text-ink">{lesson.title}</span>
      <span className="shrink-0 text-sm font-bold text-primary-dark">
        Lernen
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
        const daten = await ladeUebersicht();
        if (!cancelled) setPhase({ kind: "uebersicht", ...daten });
      } catch {
        if (!cancelled) setPhase({ kind: "error" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  // Der ExamPlayer ruft onDone nach der letzten Antwort auf. Stabil halten,
  // weil der Player es auch in einem Effekt benutzt.
  const testFertig = useCallback((ergebnisse: ExamResult[]) => {
    setPhase((prev) => {
      if (prev.kind !== "test") return prev;
      return {
        kind: "ergebnis",
        daten: prev.daten,
        fragen: prev.fragen,
        ergebnisse,
      };
    });
    // Test zaehlt als Lern-Aktivitaet (Streak) - 5 XP je richtiger Antwort.
    try {
      const deviceId = getDeviceId();
      const richtig = ergebnisse.filter((e) => e.correct).length;
      if (deviceId && richtig > 0) void bumpDailyActivity(deviceId, richtig * 5);
    } catch {
      // egal - das Ergebnis zeigen wir trotzdem
    }
  }, []);

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

  if (phase.kind === "test") {
    return (
      <ExamPlayer
        exercises={phase.fragen}
        onQuit={neuLaden}
        onDone={testFertig}
      />
    );
  }

  if (phase.kind === "fehler") {
    // Fehler gleich nachueben: gleiche Mechanik wie /ueben (jede Frage, bis
    // sie sitzt), aber ausserhalb des Lernflusses und zurueck hierher.
    return (
      <LessonPlayer
        mode="practice"
        exercisesOverride={phase.fehler}
        onExit={neuLaden}
        zaehltFuerLernfluss={false}
      />
    );
  }

  if (phase.kind === "ergebnis") {
    const gesamt = phase.ergebnisse.length;
    const richtig = phase.ergebnisse.filter((e) => e.correct).length;
    const prozent = gesamt > 0 ? Math.round((richtig / gesamt) * 100) : 0;
    const falschIds = new Set(
      phase.ergebnisse.filter((e) => !e.correct).map((e) => e.exerciseId)
    );
    const fehler = phase.fragen.filter((f) => falschIds.has(f.id));

    // Welche Lektionen sollte sie sich nochmal anschauen?
    const lektionen = new Map(
      phase.daten.themen.flatMap((t) => t.lessons.map((l) => [l.id, l] as const))
    );
    const fehlerJeLektion = new Map<string, number>();
    for (const f of fehler) {
      fehlerJeLektion.set(f.lessonId, (fehlerJeLektion.get(f.lessonId) ?? 0) + 1);
    }
    const nochmalAnschauen = [...fehlerJeLektion.entries()]
      .map(([id, anzahl]) => ({ lesson: lektionen.get(id), anzahl }))
      .filter((e): e is { lesson: PathLessonRow; anzahl: number } => Boolean(e.lesson))
      .sort((a, b) => b.anzahl - a.anzahl || a.lesson.sort - b.lesson.sort);

    const message =
      gesamt === 0
        ? "Da ist etwas schiefgegangen. Starte den Test einfach nochmal."
        : prozent >= 90
          ? "Wow! Das sitzt richtig gut. 🎉"
          : prozent >= 70
            ? "Gut gemacht! Übe noch deine Fehler, dann bist du bereit. 💪"
            : "Guter Anfang! Schau dir die Lektionen unten nochmal an. 🌱";

    return (
      <div className="mx-auto flex h-full w-full max-w-md flex-col overflow-y-auto overscroll-contain px-4 py-6">
        <Mascot mood="cheer" size={90} message={message} />
        <p className="mt-4 text-center text-4xl font-extrabold text-primary">
          {richtig} von {gesamt} richtig
        </p>
        <p className="mt-1 text-center text-base font-semibold text-ink/70">
          Das sind {prozent}%.
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          {fehler.length > 0 && (
            <Button
              size="lg"
              full
              onClick={() => setPhase({ kind: "fehler", fehler })}
            >
              <span aria-hidden>🔁</span> Meine {fehler.length}{" "}
              {fehler.length === 1 ? "Fehler-Frage" : "Fehler-Fragen"} üben
            </Button>
          )}
          <Button
            size="lg"
            full
            variant={fehler.length > 0 ? "secondary" : "primary"}
            onClick={() => {
              const fragen = waehleTestUebungen(
                phase.daten.uebungen,
                phase.daten.stats,
                TEST_ANZAHL
              );
              setPhase({ kind: "test", daten: phase.daten, fragen });
            }}
          >
            Neuer Test
          </Button>
        </div>

        {nochmalAnschauen.length > 0 && (
          <>
            <h2 className="mt-7 mb-3 text-lg font-extrabold text-ink">
              Das schaust du dir nochmal an
            </h2>
            <div className="flex flex-col gap-2.5">
              {nochmalAnschauen.map(({ lesson, anzahl }) => (
                <Link
                  key={lesson.id}
                  href={`/lektion/${lesson.slug}`}
                  className="flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 border-b-4 border-warning bg-warning-light p-3 select-none active:translate-y-0.5 active:border-b-2"
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="font-bold text-ink">{lesson.title}</span>
                    <span className="text-sm text-ink/70">
                      {anzahl} Fehler im Test
                    </span>
                  </span>
                  <span className="text-xl text-primary-dark" aria-hidden>
                    ▶
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}

        <Button
          size="lg"
          full
          variant="secondary"
          className="mt-6"
          onClick={neuLaden}
        >
          Zur Übersicht
        </Button>
        <div className="pb-6" />
      </div>
    );
  }

  // Uebersicht
  const { themen, progress, uebungen, sicher, stats } = phase;
  const sterneJeLektion = new Map(progress.map((p) => [p.lesson_id, p.stars]));

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
        Hier lernst du für deinen Test in der Schule. Das Prüfungs-Training ist
        immer frei – ohne Pause und ohne Warten.
      </p>

      {themen.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-6">
          <Mascot mood="neutral" message="Gerade steht keine Prüfung an. 🎉" />
          <Button size="lg" full onClick={() => router.push("/")}>
            Zur Startseite
          </Button>
        </div>
      ) : (
        <>
          <Card className="mt-5 flex flex-col gap-3 p-4">
            <p className="text-lg font-extrabold text-ink">
              <span aria-hidden>📝 </span>Test üben
            </p>
            <p className="text-sm text-ink/70">
              {Math.min(TEST_ANZAHL, uebungen.length)} gemischte Fragen aus allen
              Lektionen – wie im echten Test. Zuerst kommt, was noch nicht sitzt.
            </p>
            <div
              className="h-3 w-full overflow-hidden rounded-full bg-locked"
              role="img"
              aria-label={`${sicher} von ${uebungen.length} Fragen sitzen schon`}
            >
              <span
                className="block h-full rounded-full bg-success"
                style={{
                  width: `${uebungen.length > 0 ? Math.round((sicher / uebungen.length) * 100) : 0}%`,
                }}
              />
            </div>
            <p className="text-sm font-semibold text-ink/70">
              Schon sicher: {sicher} von {uebungen.length} Fragen
            </p>
            <Button
              size="lg"
              full
              disabled={uebungen.length === 0}
              onClick={() => {
                const fragen = waehleTestUebungen(uebungen, stats, TEST_ANZAHL);
                setPhase({
                  kind: "test",
                  daten: { themen, progress, uebungen, sicher, stats },
                  fragen,
                });
              }}
            >
              <span aria-hidden>▶</span> Test starten
            </Button>
          </Card>

          {themen.map((thema) => {
            const lektionen = [...thema.lessons].sort((a, b) => a.sort - b.sort);
            const geschafft = lektionen.filter((l) => sterneJeLektion.has(l.id)).length;
            const naechsteId = lektionen.find((l) => !sterneJeLektion.has(l.id))?.id;
            return (
              <section key={thema.id} aria-label={thema.title} className="pt-7">
                <div className="mb-3 flex items-center gap-3">
                  <span className="text-4xl" aria-hidden>
                    {thema.icon}
                  </span>
                  <span className="flex flex-col">
                    <h2 className="text-lg font-extrabold text-ink">{thema.title}</h2>
                    <span className="text-sm font-semibold text-ink/60">
                      {geschafft} von {lektionen.length} Lektionen geschafft
                    </span>
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {lektionen.map((lesson) => (
                    <LektionsZeile
                      key={lesson.id}
                      lesson={lesson}
                      sterne={sterneJeLektion.get(lesson.id)}
                      naechste={lesson.id === naechsteId}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </>
      )}
      <div className="pb-8" />
    </div>
  );
}
