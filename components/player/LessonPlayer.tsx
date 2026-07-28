"use client";

// Lektions-Player (Spec §4.2, Plan Task 9): eine Uebung pro Screen.
// Oben X-Button (mit Bestaetigung) + Fortschrittsbalken, Mitte Prompt mit
// Vorlese-Button + Uebungskomponente, unten fixer „Pruefen"-Button.
// Falsche Uebungen wandern ans Ende der Queue (components/player/queue.ts);
// am Ende XP/Sterne berechnen, speichern und den Ergebnis-Screen zeigen.
// Ueben-Modus (mode="practice" + exercisesOverride, Route /ueben): gleiche
// Mechanik inkl. Wiederholungs-Queue und logAttempt, aber 5 XP pro Uebung,
// kein Lektions-Bonus, keine Sterne, kein saveLessonResult - nur
// bumpDailyActivity (Streak zaehlt).
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { exerciseSchema, type ExerciseInput } from "@/lib/content-schema";
import {
  addFeed,
  berlinToday,
  bumpDailyActivity,
  fetchDailyActivity,
  fetchFeeds,
  fetchLernEreignisse,
  fetchLesson,
  fetchLessonsToday,
  istLektionSchonGeschafft,
  logLernEreignis,
  logAttempt,
  saveLessonResult,
} from "@/lib/data";
import { getDeviceId, getProfile } from "@/lib/device";
import { berechneLernstand, themaGesperrtFuer } from "@/lib/lernfluss";
import {
  LESSON_BONUS_XP,
  PRACTICE_XP_PER_EXERCISE,
  levelForXp,
  starsForLesson,
  xpForExercise,
} from "@/lib/scoring";
import { Button } from "@/components/ui/Button";
import { FeedbackBanner } from "@/components/ui/FeedbackBanner";
import { Mascot } from "@/components/ui/Mascot";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { TTSButton } from "@/components/ui/TTSButton";
import { PromptText } from "@/components/ui/PromptText";
import { IntroBlocks } from "@/components/ui/IntroBlocks";
import { introSpeakable } from "@/lib/intro-format";
import { speakableText } from "@/lib/speakable";
import { NoteButton } from "@/components/ui/NoteButton";
import { ExerciseView } from "@/components/exercises/ExerciseView";
import {
  advanceQueue,
  createQueue,
  currentExerciseIndex,
  retriedExerciseCount,
  type QueueState,
} from "./queue";
import { ResultScreen } from "./ResultScreen";

type PlayableExercise = { id: string; exercise: ExerciseInput };

type Phase = "loading" | "error" | "playing" | "finished" | "gesperrt";

/** Warum der Lernfluss diese Lektion gerade nicht zulaesst. */
type Sperre =
  | { art: "thema"; rest: number }
  | { art: "wiederholung"; offen: number };

type Feedback = {
  correct: boolean;
  explanation?: string;
  /** Was nach "Weiter" passiert: retry = gleiche Uebung sofort nochmal. */
  outcome: "solved" | "retry" | "defer";
};

/** Rohe Uebungs-Zeilen (z. B. aus der DB) fuer exercisesOverride. */
export type ExerciseRowLike = { id: string; type: string; data: unknown };

export type LessonPlayerProps = {
  /** Lektions-Slug (Standard-Modus). Im Ueben-Modus nicht noetig. */
  slug?: string;
  /** "practice" = Ueben-Modus (keine Sterne, 5 XP/Uebung, kein Speichern). */
  mode?: "lesson" | "practice";
  /** Uebungen direkt uebergeben statt per slug zu laden (Ueben-Modus). */
  exercisesOverride?: ExerciseRowLike[];
};

/** Validiert rohe Uebungs-Zeilen; ungueltige werden uebersprungen. */
function parseExerciseRows(rows: ExerciseRowLike[]): PlayableExercise[] {
  const playable: PlayableExercise[] = [];
  for (const row of rows) {
    try {
      const parsed = exerciseSchema.parse({ type: row.type, data: row.data });
      playable.push({ id: row.id, exercise: parsed });
    } catch (error) {
      console.warn(`Übung ${row.id} übersprungen (ungültige Daten):`, error);
    }
  }
  return playable;
}

export function LessonPlayer({
  slug,
  mode = "lesson",
  exercisesOverride,
}: LessonPlayerProps) {
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("loading");
  const [lessonId, setLessonId] = useState<string | null>(null);
  // Thema der Lektion - fuer das Lernfluss-Protokoll (lib/lernfluss.ts).
  const [topicSlug, setTopicSlug] = useState<string | null>(null);
  // Gesetzt, wenn der Lernfluss diese Lektion gerade nicht zulaesst.
  const [sperre, setSperre] = useState<Sperre | null>(null);
  // Einführung: optionaler Vorschalt-Screen vor der ersten Übung.
  const [intro, setIntro] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState(false);
  const [exercises, setExercises] = useState<PlayableExercise[]>([]);
  const [queueState, setQueueState] = useState<QueueState>(() =>
    createQueue([])
  );
  const [checkRequested, setCheckRequested] = useState(0);
  const [ready, setReady] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [showQuitDialog, setShowQuitDialog] = useState(false);
  const [result, setResult] = useState<{
    xp: number;
    stars: 1 | 2 | 3;
    levelUp: number | null;
  }>({ xp: 0, stars: 1, levelUp: null });
  // Ponyweide: darf Amelie nach dieser Lektion das Pony fuettern (Weide schon
  // sauber)? Und was hat sie gewaehlt?
  const [canFeed, setCanFeed] = useState(false);
  const [fedItem, setFedItem] = useState<"karotte" | "heu" | "apfel" | null>(null);

  const load = useCallback(async () => {
    setPhase("loading");
    setFeedback(null);
    setReady(false);
    setCheckRequested(0);
    setCanFeed(false);
    setFedItem(null);
    setIntro(null);
    setShowIntro(false);
    setSperre(null);
    try {
      // Ueben-Modus: Uebungen kommen fertig geladen von aussen.
      if (exercisesOverride) {
        const playable = parseExerciseRows(exercisesOverride);
        if (playable.length === 0) {
          setPhase("error");
          return;
        }
        setLessonId(null);
        setExercises(playable);
        setQueueState(createQueue(playable));
        setPhase("playing");
        return;
      }

      if (!slug) {
        setPhase("error");
        return;
      }

      // Lernfluss-Riegel (lib/lernfluss.ts). Muss HIER sitzen, nicht nur in
      // der Kachel-Anzeige: sonst kaeme man ueber die direkte Adresse
      // /lektion/... an jeder Sperre vorbei. Das Protokoll wird parallel zur
      // Lektion geladen, kostet also keine zusaetzliche Wartezeit.
      const deviceId = getDeviceId();
      const istMama = getProfile() === "mama";
      const [data, ereignisse] = await Promise.all([
        fetchLesson(slug),
        istMama || !deviceId
          ? Promise.resolve([] as Awaited<ReturnType<typeof fetchLernEreignisse>>)
          : fetchLernEreignisse(deviceId),
      ]);
      if (!data) {
        setPhase("error");
        return;
      }

      if (!istMama && deviceId) {
        const stand = berechneLernstand(ereignisse);

        // 1. Thema in Pause: gilt fuer ALLES aus diesem Thema, auch fuers
        //    Wiederholen. Sonst koennte sie die Pause aussitzen, indem sie
        //    dieselben Lektionen nochmal spielt.
        const rest = data.topicSlug
          ? themaGesperrtFuer(stand, data.topicSlug)
          : 0;
        if (rest > 0) {
          setSperre({ art: "thema", rest });
          setPhase("gesperrt");
          return;
        }

        // 2. Wiederholungen faellig: NEUE Lektionen sind dicht. Eine schon
        //    geschaffte Lektion darf sie aber spielen - die zaehlt selbst als
        //    Wiederholung, wir wuerden ihr sonst den geforderten Weg
        //    versperren.
        if (stand.wiederholungFaellig) {
          let schonGeschafft = false;
          try {
            schonGeschafft = await istLektionSchonGeschafft(
              deviceId,
              data.lesson.id
            );
          } catch {
            // Im Zweifel durchlassen - lieber eine Lektion zu viel als eine
            // Amelie, die vor einer toten App sitzt.
            schonGeschafft = true;
          }
          if (!schonGeschafft) {
            setSperre({
              art: "wiederholung",
              offen: stand.offeneWiederholungen,
            });
            setPhase("gesperrt");
            return;
          }
        }
      }

      const playable = parseExerciseRows(data.exercises);
      if (playable.length === 0) {
        setPhase("error");
        return;
      }
      setLessonId(data.lesson.id);
      setTopicSlug(data.topicSlug);
      setExercises(playable);
      setQueueState(createQueue(playable));
      // Einführung nur im normalen Lektions-Modus und nur wenn vorhanden.
      const introText = data.lesson.intro?.trim();
      if (introText) {
        setIntro(introText);
        setShowIntro(true);
      }
      setPhase("playing");
      // Sicherheitsnetz gegen wiederhergestellte Scroll-Positionen (iOS).
      window.scrollTo(0, 0);
    } catch (error) {
      console.warn("Lektion konnte nicht geladen werden:", error);
      setPhase("error");
    }
  }, [slug, exercisesOverride]);

  useEffect(() => {
    void load();
  }, [load]);

  // Waehrend einer laufenden Uebung das Dokument-Scrollen komplett sperren.
  // Sonst kann iOS die ganze Seite per Gummiband nach unten ziehen und die
  // Kopfzeile (✕ + Fortschrittsbalken) wandert mit. Nur der Aufgabenbereich
  // (unten, overflow-y-auto) darf scrollen. Beim Verlassen wieder freigeben.
  useEffect(() => {
    if (phase !== "playing") return;
    const html = document.documentElement;
    const body = document.body;
    const prev = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      overscroll: body.style.overscrollBehavior,
    };
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";
    return () => {
      html.style.overflow = prev.htmlOverflow;
      body.style.overflow = prev.bodyOverflow;
      body.style.overscrollBehavior = prev.overscroll;
    };
  }, [phase]);

  const currentIndex = currentExerciseIndex(queueState);
  const current = currentIndex !== null ? exercises[currentIndex] : null;

  function handleResult(r: { correct: boolean; given?: string }) {
    if (feedback || !current) return;
    const explanation =
      "explanation" in current.exercise.data
        ? current.exercise.data.explanation
        : undefined;
    // advanceQueue ist pure - wir schauen nur, was "Weiter" bewirken wird,
    // damit der Banner-Text ehrlich ankuendigt, wie es weitergeht.
    const { outcome } = advanceQueue(queueState, r.correct);
    // Kopfrechnen & Gedaechtnis: Beim Sofort-Retry die Loesung NICHT
    // verraten (die explanation enthaelt das Ergebnis) - Kopfrechnen zeigt
    // stattdessen den Tipp, das Gedaechtnisspiel die Merkphase erneut.
    const hideOnRetry =
      current.exercise.type === "number_input" ||
      current.exercise.type === "memory_game";
    const bannerExplanation =
      outcome === "retry" && hideOnRetry ? undefined : explanation;
    setFeedback({ correct: r.correct, explanation: bannerExplanation, outcome });
    // Statistik fire-and-forget – Fehler schluckt lib/data.
    const deviceId = getDeviceId();
    if (deviceId) {
      void logAttempt({
        deviceId,
        exerciseId: current.id,
        correct: r.correct,
        given: r.given,
      });
    }
  }

  /**
   * Prueft (fire-and-forget), ob die frisch verdienten XP ein neues Level
   * bedeuten, und blendet den Level-Up-Hinweis im Ergebnis-Screen nach.
   * Muss VOR bumpDailyActivity laufen, sonst zaehlt das neue XP doppelt.
   */
  async function detectLevelUp(deviceId: string, gainedXp: number) {
    try {
      const activity = await fetchDailyActivity(deviceId);
      const before = activity.reduce((sum, row) => sum + row.xp, 0);
      const levelBefore = levelForXp(before).level;
      const levelAfter = levelForXp(before + gainedXp).level;
      if (levelAfter > levelBefore) {
        setResult((prev) => ({ ...prev, levelUp: levelAfter }));
      }
    } catch {
      // kein Netz -> einfach kein Level-Up-Hinweis
    }
  }

  function finishLesson(finalState: QueueState) {
    // Ueben-Modus: 5 XP pro (am Ende immer richtig geloester) Uebung,
    // kein Lektions-Bonus, keine Sterne, kein Lektions-Ergebnis –
    // aber Tages-Aktivitaet zaehlt (Streak!).
    if (mode === "practice") {
      const xp = finalState.total * PRACTICE_XP_PER_EXERCISE;
      setResult({ xp, stars: 1, levelUp: null });
      setPhase("finished");
      try {
        const deviceId = getDeviceId();
        if (deviceId) {
          // Ueben zaehlt als Wiederholung: damit baut sie die nach 3
          // Lektionen faelligen Wiederholungen ab (lib/lernfluss.ts).
          void logLernEreignis({ deviceId, art: "wiederholung" });
          void detectLevelUp(deviceId, xp).then(() =>
            bumpDailyActivity(deviceId, xp)
          );
        }
      } catch {
        // bewusst still – Ergebnis-Screen zeigen wir trotzdem
      }
      return;
    }

    const xp =
      finalState.firstTry.reduce(
        (sum, firstTry) => sum + xpForExercise(firstTry),
        0
      ) + LESSON_BONUS_XP;
    const stars = starsForLesson(
      finalState.total,
      retriedExerciseCount(finalState)
    );
    setResult({ xp, stars, levelUp: null });
    setPhase("finished");

    // Speichern + Ponyweide-Logik. saveLessonResult zuerst (schreibt
    // completed_at), dann zaehlen wir die heutigen Lektionen fuer die
    // Fuetter-Freigabe. Bei Netzfehlern uebernimmt die Offline-Queue.
    const deviceId = getDeviceId();
    if (deviceId && lessonId) {
      void (async () => {
        try {
          // Lernfluss-Protokoll: Eine Lektion, die sie zum ERSTEN Mal
          // schafft, zaehlt als Lektion. Spielt sie eine schon geschaffte
          // noch einmal (z. B. um von 2 auf 3 Sterne zu kommen), ist das
          // eine Wiederholung. Muss VOR saveLessonResult geprueft werden -
          // danach steht der Fortschritt ja schon drin.
          let schonGeschafft = false;
          try {
            schonGeschafft = await istLektionSchonGeschafft(deviceId, lessonId);
          } catch {
            // Im Zweifel als neue Lektion werten.
          }
          void logLernEreignis({
            deviceId,
            art: schonGeschafft ? "wiederholung" : "lektion",
            lessonId,
            topicSlug: schonGeschafft ? null : topicSlug,
          });

          await saveLessonResult({ deviceId, lessonId, stars, xp });
          const day = berlinToday();
          const [lessonsToday, feeds] = await Promise.all([
            fetchLessonsToday(deviceId, day),
            fetchFeeds(deviceId, day),
          ]);
          // Erst wenn die 3 Pferdeaepfel weg sind (>=3 Lektionen), gibt es
          // pro weiterer Lektion ein Futter - aber nur, wenn noch nicht
          // eingeloest (kein Farmen durch Wiederholen).
          const earnedFeeds = Math.max(0, lessonsToday - 3);
          if (earnedFeeds > feeds.length) setCanFeed(true);
          await detectLevelUp(deviceId, xp);
          await bumpDailyActivity(deviceId, xp);
        } catch {
          // still – Ergebnis-Screen zeigen wir trotzdem
        }
      })();
    }
  }

  /** Amelie gibt dem Pony Karotte/Heu (landet auf der Startseiten-Weide). */
  function handleFeed(item: "karotte" | "heu" | "apfel") {
    if (fedItem) return;
    setFedItem(item);
    try {
      const deviceId = getDeviceId();
      if (deviceId) void addFeed(deviceId, berlinToday(), item);
    } catch {
      // still – die Auswahl bleibt trotzdem sichtbar
    }
  }

  function handleContinue() {
    if (!feedback) return;
    const { state: nextState, done } = advanceQueue(
      queueState,
      feedback.correct
    );
    setFeedback(null);
    setReady(false);
    setQueueState(nextState);
    if (done) {
      finishLesson(nextState);
    }
  }

  if (phase === "loading") {
    return (
      <div className="flex h-full items-center justify-center px-4">
        <p className="animate-pulse text-lg font-semibold text-ink/60">
          Einen Moment bitte …
        </p>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-8 px-4">
        <Mascot
          mood="neutral"
          message="Gerade klappt es nicht. Versuch es später nochmal."
        />
        <Button size="lg" full onClick={() => void load()}>
          Nochmal versuchen
        </Button>
      </div>
    );
  }

  // Lernfluss-Sperre: freundlich erklaeren, WARUM es gerade nicht geht, und
  // gleich den Weg zeigen, der jetzt offen ist. Nie eine blosse Absage.
  if (phase === "gesperrt" && sperre) {
    const themenPause = sperre.art === "thema";
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 px-4">
        <Mascot
          mood="neutral"
          message={
            themenPause
              ? "Dieses Thema macht gerade Pause."
              : "Erst sind Wiederholungen dran."
          }
        />
        <div className="w-full rounded-2xl border-2 border-locked bg-white p-4 text-center">
          {themenPause ? (
            <>
              <p className="text-lg font-bold text-ink">
                <span aria-hidden>⏸️ </span>
                Wieder frei nach {sperre.rest}{" "}
                {sperre.rest === 1 ? "Lektion" : "Lektionen"} aus anderen
                Themen.
              </p>
              <p className="mt-2 text-base text-ink/70">
                So kommst du überall weiter und vergisst nichts.
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-bold text-ink">
                <span aria-hidden>🔁 </span>
                Noch {sperre.offen}{" "}
                {sperre.offen === 1 ? "Wiederholung" : "Wiederholungen"}, dann
                geht es weiter.
              </p>
              <p className="mt-2 text-base text-ink/70">
                Wiederholen hilft dir, dass es wirklich sitzt.
              </p>
            </>
          )}
        </div>
        <div className="flex w-full flex-col gap-3">
          {!themenPause && (
            <Button size="lg" full onClick={() => router.push("/faellig")}>
              Jetzt wiederholen
            </Button>
          )}
          <Button
            size="lg"
            full
            variant={themenPause ? "primary" : "secondary"}
            onClick={() => router.push("/")}
          >
            {themenPause ? "Anderes Thema wählen" : "Zurück zur Übersicht"}
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "finished") {
    if (mode === "practice") {
      return (
        <ResultScreen
          xp={result.xp}
          levelUp={result.levelUp}
          message="Fleißig geübt, Amelie!"
          buttonLabel="Fertig"
          onContinue={() => router.push("/")}
        />
      );
    }
    return (
      <ResultScreen
        xp={result.xp}
        stars={result.stars}
        levelUp={result.levelUp}
        canFeed={canFeed}
        fedItem={fedItem}
        onFeed={handleFeed}
        onContinue={() => router.push("/")}
      />
    );
  }

  // Einführungs-Screen: kommt VOR der ersten Übung. Text (ein Satz pro Zeile,
  // gut lesbar) + Vorlese-Knopf, unten „Los geht’s". Kein Fortschritt/keine XP.
  if (showIntro && intro) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-4 pt-4">
          <button
            type="button"
            aria-label="Zurück"
            onClick={() => router.push("/")}
            className="flex min-h-12 min-w-12 cursor-pointer items-center justify-center rounded-2xl text-2xl font-bold text-ink/50 select-none"
          >
            <span aria-hidden>✕</span>
          </button>
          <p className="flex-1 text-center text-sm font-bold text-ink/60">
            Einführung
          </p>
          <div className="min-h-12 min-w-12" aria-hidden />
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-2 pb-40">
          {/* Ganze Einfuehrung vorlesen - die einzelnen Beispielsaetze haben
              zusaetzlich ihren eigenen Knopf. */}
          <div className="mb-3 flex justify-end">
            <TTSButton text={introSpeakable(intro)} />
          </div>
          <IntroBlocks intro={intro} lang={exercises[0]?.exercise.data.tts_lang} />
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40">
          <div className="mx-auto w-full max-w-md bg-white px-4 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <Button size="lg" full onClick={() => setShowIntro(false)}>
              Los geht’s 👍
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!current || currentIndex === null) return null;

  return (
    // Exakt shell-hoch (h-full von <main>) und selbst NICHT scrollbar: nur
    // der Aufgabenbereich scrollt (wenn noetig). So kann die Seite auf dem
    // Handy nicht "verrutschen" (iOS-Gummiband ueber der ganzen Karte).
    <div className="flex h-full flex-col overflow-hidden">
      {/* Kopf: X-Button + Fortschritt (+ Notiz-Knopf im Mama-Modus) */}
      <div className="flex items-center gap-3 px-4 pt-4">
        <button
          type="button"
          aria-label={mode === "practice" ? "Üben beenden" : "Lektion beenden"}
          onClick={() => setShowQuitDialog(true)}
          className="flex min-h-12 min-w-12 cursor-pointer items-center justify-center rounded-2xl text-2xl font-bold text-ink/50 select-none"
        >
          <span aria-hidden>✕</span>
        </button>
        <div className="flex-1">
          <ProgressBar value={queueState.solvedCount} max={queueState.total} />
        </div>
        <NoteButton
          lessonSlug={slug}
          exerciseIndex={currentIndex}
          exercisePrompt={current.exercise.data.prompt}
        />
      </div>

      {/* Prompt + Vorlesen */}
      <div className="flex items-start gap-3 px-4 pt-6">
        <h1 className="flex-1 text-xl font-bold text-ink">
          <PromptText text={current.exercise.data.prompt} />
        </h1>
        <TTSButton
          text={speakableText(current.exercise)}
          lang={current.exercise.data.tts_lang}
        />
      </div>

      {/* Uebung – key erzwingt Remount bei Wiederholung derselben Uebung */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-6 pb-40">
        <ExerciseView
          key={`${currentIndex}-${queueState.retried[currentIndex]}`}
          exercise={current.exercise}
          onResult={handleResult}
          checkRequested={checkRequested}
          onReadyChange={setReady}
          attempt={queueState.retried[currentIndex] ?? 0}
        />
      </div>

      {/* Unten: fixer Pruefen-Button (verdeckt vom FeedbackBanner waehrend Feedback) */}
      {feedback === null && (
        <div className="fixed inset-x-0 bottom-0 z-40">
          <div className="mx-auto w-full max-w-md bg-white px-4 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <Button
              size="lg"
              full
              disabled={!ready}
              onClick={() => setCheckRequested((n) => n + 1)}
            >
              Prüfen
            </Button>
          </div>
        </div>
      )}

      {feedback !== null && (
        <FeedbackBanner
          state={feedback.correct ? "correct" : "wrong"}
          title={
            feedback.outcome === "retry"
              ? "Fast! Probier es gleich nochmal."
              : feedback.outcome === "defer"
                ? "Schau es dir in Ruhe an. Die Übung kommt später nochmal."
                : undefined
          }
          continueLabel={
            feedback.outcome === "retry" ? "Nochmal versuchen" : "Weiter"
          }
          explanation={feedback.explanation}
          onContinue={handleContinue}
        />
      )}

      {/* Bestaetigungs-Overlay fuer den X-Button */}
      {showQuitDialog && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={mode === "practice" ? "Üben beenden?" : "Lektion beenden?"}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-6"
        >
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-lg">
            <p className="text-xl font-bold text-ink">
              Willst du wirklich aufhören?
            </p>
            <p className="mt-2 text-base text-ink">
              {mode === "practice"
                ? "Dein Fortschritt beim Üben geht dann verloren."
                : "Dein Fortschritt in dieser Lektion geht dann verloren."}
            </p>
            <div className="mt-5 flex flex-col gap-3">
              <Button size="lg" full onClick={() => setShowQuitDialog(false)}>
                Weiter lernen
              </Button>
              <Button
                size="lg"
                full
                variant="secondary"
                onClick={() => router.push("/")}
              >
                Beenden
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
