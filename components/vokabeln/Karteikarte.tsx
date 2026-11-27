"use client";

// Eine Karteikarte des Vokabeltrainers (Mama, 2026-11-27).
//
// Vorne steht das Wort, Antippen dreht die Karte um. Danach entscheidet
// Amelie selbst: gewusst (nach rechts wischen) oder nicht gewusst (nach links
// wischen). Wischen ist nur ein Angebot - die zwei grossen Knoepfe darunter
// machen genau dasselbe (Spec: keine Wisch-Pflicht, Tap reicht immer).
// Vor dem Umdrehen laesst sich die Karte nicht wegwischen: erst ueberlegen,
// dann nachsehen, dann entscheiden.
import { useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { Button } from "@/components/ui/Button";
import { TTSButton } from "@/components/ui/TTSButton";

/** Ab hier zaehlt ein Wisch als Entscheidung (Pixel bzw. Pixel pro Sekunde). */
const WISCH_WEG = 110;
const WISCH_TEMPO = 600;

export type KartenSeite = {
  /** Das Wort auf dieser Seite. */
  text: string;
  /** Sprache als Wort, zum Beispiel "Englisch". */
  sprache: string;
  /** Sprache fuers Vorlesen, zum Beispiel "en-GB". */
  lang: string;
};

export function Karteikarte({
  vorne,
  hinten,
  hinweis,
  onEntscheidung,
}: {
  vorne: KartenSeite;
  hinten: KartenSeite;
  hinweis?: string;
  onEntscheidung: (gewusst: boolean) => void;
}) {
  const reducedMotion = useReducedMotion();
  const [umgedreht, setUmgedreht] = useState(false);
  const [weg, setWeg] = useState(false);
  const x = useMotionValue(0);
  const kippen = useTransform(x, [-240, 0, 240], [-12, 0, 12]);
  const gewusstSichtbar = useTransform(x, [20, WISCH_WEG], [0, 1]);
  const nochmalSichtbar = useTransform(x, [-WISCH_WEG, -20], [1, 0]);

  function umdrehen() {
    if (!weg) setUmgedreht((u) => !u);
  }

  function entscheide(gewusst: boolean) {
    if (weg || !umgedreht) return;
    setWeg(true);
    if (reducedMotion) {
      onEntscheidung(gewusst);
      return;
    }
    void animate(x, gewusst ? 520 : -520, { duration: 0.22 }).then(() =>
      onEntscheidung(gewusst),
    );
  }

  const sichtbar = umgedreht ? hinten : vorne;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative h-64 w-full" style={{ perspective: 1000 }}>
        <motion.div
          role="button"
          tabIndex={0}
          aria-label={
            umgedreht
              ? `Lösung: ${hinten.text}. Antippen dreht die Karte zurück.`
              : `${vorne.text}. Antippen dreht die Karte um.`
          }
          className="absolute inset-0 cursor-pointer select-none"
          style={{ x, rotate: kippen }}
          drag={umgedreht && !weg ? "x" : false}
          dragMomentum={false}
          onDragEnd={(_, info) => {
            const nachRechts = info.offset.x > WISCH_WEG || info.velocity.x > WISCH_TEMPO;
            const nachLinks = info.offset.x < -WISCH_WEG || info.velocity.x < -WISCH_TEMPO;
            if (nachRechts) entscheide(true);
            else if (nachLinks) entscheide(false);
            else void animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
          }}
          onTap={(event) => {
            // Motion loest bei Enter selbst noch einen Tap aus (kuenstliches
            // Pointer-Ereignis ohne pointerType). Die Tastatur behandelt
            // schon onKeyDown - sonst dreht Enter die Karte zweimal.
            if ("pointerType" in event && event.pointerType === "") return;
            umdrehen();
          }}
          onKeyDown={(e) => {
            // Am Computer: Enter oder Leertaste dreht um, die Pfeiltasten
            // entscheiden, sobald die Karte umgedreht ist.
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              umdrehen();
            } else if (e.key === "ArrowRight") {
              entscheide(true);
            } else if (e.key === "ArrowLeft") {
              entscheide(false);
            }
          }}
        >
          <motion.div
            className="relative h-full w-full"
            style={{ transformStyle: "preserve-3d" }}
            initial={false}
            animate={{ rotateY: umgedreht ? 180 : 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.35, ease: "easeInOut" }}
          >
            <KartenFlaeche seite={vorne} unten="👆 Antippen zum Umdrehen" />
            <KartenFlaeche seite={hinten} hinweis={hinweis} hinten />
          </motion.div>

          {/* Beim Wischen: was die Karte gleich bedeutet. */}
          <motion.span
            aria-hidden
            className="pointer-events-none absolute top-12 left-4 rounded-xl border-2 border-success-dark bg-success-light px-3 py-1 text-base font-extrabold text-success-dark"
            style={{ opacity: gewusstSichtbar }}
          >
            ✓ Gewusst
          </motion.span>
          <motion.span
            aria-hidden
            className="pointer-events-none absolute top-12 right-4 rounded-xl border-2 border-warning-dark bg-warning-light px-3 py-1 text-base font-extrabold text-warning-dark"
            style={{ opacity: nochmalSichtbar }}
          >
            ↻ Nochmal
          </motion.span>
        </motion.div>
      </div>

      <div className="flex min-h-12 items-center gap-3">
        <TTSButton text={sichtbar.text} lang={sichtbar.lang} />
        <p className="text-sm font-semibold text-ink/70">
          {umgedreht
            ? "Gewusst? Wisch nach rechts. Nicht gewusst? Wisch nach links. Oder tipp auf einen Knopf."
            : "Überleg dir die Antwort. Dann dreh die Karte um."}
        </p>
      </div>

      {umgedreht ? (
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="warning"
            size="lg"
            className="min-h-16 flex-col gap-0 px-3 py-1.5"
            disabled={weg}
            onClick={() => entscheide(false)}
          >
            <span aria-hidden className="text-2xl leading-none">
              ✗
            </span>
            <span className="text-base">Nicht gewusst</span>
          </Button>
          <Button
            variant="success"
            size="lg"
            className="min-h-16 flex-col gap-0 px-3 py-1.5"
            disabled={weg}
            onClick={() => entscheide(true)}
          >
            <span aria-hidden className="text-2xl leading-none">
              ✓
            </span>
            <span className="text-base">Gewusst</span>
          </Button>
        </div>
      ) : (
        <Button size="lg" full onClick={umdrehen}>
          Karte umdrehen
        </Button>
      )}
    </div>
  );
}

function KartenFlaeche({
  seite,
  hinweis,
  unten,
  hinten = false,
}: {
  seite: KartenSeite;
  hinweis?: string;
  unten?: string;
  hinten?: boolean;
}) {
  return (
    <div
      className={
        "absolute inset-0 flex flex-col rounded-3xl border-2 border-b-4 p-5 " +
        (hinten ? "border-primary bg-primary-light" : "border-locked bg-white")
      }
      style={{
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        transform: hinten ? "rotateY(180deg)" : undefined,
      }}
    >
      <span className="text-xs font-bold tracking-wider text-ink/60 uppercase">
        {seite.sprache}
      </span>
      <span
        lang={seite.lang}
        className="flex flex-1 items-center justify-center text-center text-3xl font-extrabold break-words text-ink"
      >
        {seite.text}
      </span>
      {hinweis && (
        <span className="text-center text-sm font-semibold text-primary-dark">{hinweis}</span>
      )}
      {unten && <span className="text-center text-sm text-ink/60">{unten}</span>}
    </div>
  );
}
