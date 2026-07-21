"use client";

// Ponyweide auf der Startseite (Xavier-Ideen 2026-07-11).
// - Grosses Weide-Bild ganz oben (volle Breite, ganze Szene mit Bergen).
// - Jede Nacht 3 Pferdeäpfel; apples = 3 − heute abgeschlossene Lektionen.
//   Solange Pferdeäpfel da sind, wandert das TRAURIGE Pony, sonst das
//   GLÜCKLICHE. Der Weg ist ein freies Herumwandern über die Wiese (2D).
// - Die Begruessung ploppt ab und zu als Sprechblase ÜBER dem Pony auf und
//   wandert mit ihm mit (keine feste Blase mehr oben).
// - Gefuettertes Karotte/Heu liegt auf der Wiese.
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { SafeImage } from "./SafeImage";

const POOP_SPOTS = [
  { left: 26, bottom: 14 },
  { left: 52, bottom: 24 },
  { left: 74, bottom: 12 },
];

const FEED_SPOTS = [
  { left: 14, bottom: 28 },
  { left: 38, bottom: 36 },
  { left: 62, bottom: 38 },
  { left: 85, bottom: 30 },
  { left: 24, bottom: 40 },
  { left: 48, bottom: 15 },
  { left: 70, bottom: 40 },
  { left: 88, bottom: 17 },
];

// Wander-Pfad als Bruchteile der begehbaren Grasflaeche (0..1). Nachgezeichnet
// an Xaviers rotem Kringel: kreuz und quer, hoch und runter.
const PATH = [
  { fx: 0.06, fy: 0.72 },
  { fx: 0.3, fy: 0.15 },
  { fx: 0.18, fy: 0.95 },
  { fx: 0.5, fy: 0.45 },
  { fx: 0.82, fy: 0.1 },
  { fx: 0.92, fy: 0.75 },
  { fx: 0.55, fy: 0.98 },
  { fx: 0.34, fy: 0.55 },
];

const PONY = 90;
const PATH_SECONDS = 46;

export function PonyMeadow({
  message,
  apples,
  feeds,
}: {
  message: string;
  apples: number;
  feeds: ("karotte" | "heu" | "apfel")[];
}) {
  const reducedMotion = useReducedMotion();
  const fieldRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [showBubble, setShowBubble] = useState(false);

  const dirty = apples > 0;
  const shownApples = Math.max(0, Math.min(apples, POOP_SPOTS.length));
  const shownFeeds = feeds.slice(0, FEED_SPOTS.length);
  const ponySrc = dirty ? "/pony-traurig.png" : "/pony-gluecklich.png";

  useEffect(() => {
    const measure = () => {
      const el = fieldRef.current;
      if (el) setBox({ w: el.clientWidth, h: el.clientHeight });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Sprechblase ab und zu einblenden (bei reduzierter Bewegung dauerhaft).
  useEffect(() => {
    if (reducedMotion) {
      setShowBubble(true);
      return;
    }
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const cycle = (visible: boolean) => {
      if (!alive) return;
      setShowBubble(visible);
      timer = setTimeout(() => cycle(!visible), visible ? 4200 : 9000);
    };
    timer = setTimeout(() => cycle(true), 2500);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [reducedMotion]);

  // Pfad in Pixel umrechnen: x über fast die ganze Breite, y im Gras (unten).
  const walking = !reducedMotion && box.w > 0;
  const xMin = box.w * 0.03;
  const xMax = box.w - PONY - box.w * 0.03;
  const yMin = box.h * 0.38; // Pony oben im Gras
  const yMax = box.h * 0.62; // Pony ganz vorne
  const xs = walking
    ? [...PATH.map((p) => xMin + p.fx * (xMax - xMin)), xMin + PATH[0].fx * (xMax - xMin)]
    : undefined;
  const ys = walking
    ? [...PATH.map((p) => yMin + p.fy * (yMax - yMin)), yMin + PATH[0].fy * (yMax - yMin)]
    : undefined;

  return (
    <div className="flex flex-col">
      {/* Grosses Weide-Bild, volle Breite, flach unter der Kopfleiste.
          Gruener Grund als Rueckfall: Laedt weide.jpg nicht, sieht es
          trotzdem nach Wiese aus statt nach leerem Kasten. */}
      <div
        ref={fieldRef}
        aria-label={
          dirty
            ? `Ponyweide: noch ${shownApples} Pferdeäpfel. Mach Lektionen, um sie wegzuräumen.`
            : "Ponyweide, schön sauber. Füttere dein Pony!"
        }
        className="relative -mx-4 -mt-6 aspect-square overflow-hidden rounded-b-3xl border-b-2 border-locked bg-[#bfe0a8] select-none"
      >
        <SafeImage
          src="/weide.jpg"
          alt=""
          fill
          sizes="(max-width: 448px) 100vw, 448px"
          className="object-cover object-center"
          priority
          // Faellt das Hintergrundbild aus, bleibt der gruene Grund stehen –
          // ein Emoji waere hier fehl am Platz.
          fallback=""
          fallbackClassName="sr-only"
        />

        {/* Pferdeäpfel */}
        {POOP_SPOTS.slice(0, shownApples).map((spot, i) => (
          <motion.div
            key={`poop-${i}`}
            className="absolute"
            style={{ left: `${spot.left}%`, bottom: `${spot.bottom}%`, transform: "translateX(-50%)" }}
            initial={reducedMotion ? false : { scale: 0, opacity: 0, y: -6 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ delay: reducedMotion ? 0 : 0.15 + i * 0.12, type: "spring", stiffness: 300, damping: 16 }}
          >
            <SafeImage
              src="/pferdeaepfel.png"
              alt=""
              width={34}
              height={34}
              fallback="💩"
              fallbackClassName="text-2xl"
            />
          </motion.div>
        ))}

        {/* Futter (Karotte/Heu) */}
        {shownFeeds.map((item, i) => {
          const spot = FEED_SPOTS[i];
          return (
            <motion.div
              key={`feed-${i}`}
              className="absolute"
              style={{ left: `${spot.left}%`, bottom: `${spot.bottom}%`, transform: "translateX(-50%)" }}
              initial={reducedMotion ? false : { scale: 0, opacity: 0, y: -6 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ delay: reducedMotion ? 0 : 0.15 + i * 0.1, type: "spring", stiffness: 300, damping: 15 }}
            >
              {item === "apfel" ? (
                <span className="text-2xl" aria-label="Apfel">
                  🍎
                </span>
              ) : (
                <SafeImage
                  src={item === "karotte" ? "/karotte.png" : "/heu.png"}
                  alt={item === "karotte" ? "Karotte" : "Heu"}
                  width={item === "karotte" ? 32 : 36}
                  height={item === "karotte" ? 32 : 36}
                  fallback={item === "karotte" ? "🥕" : "🌾"}
                  fallbackClassName="text-2xl"
                />
              )}
            </motion.div>
          );
        })}

        {/* Wanderndes Pony mit mitlaufender Sprechblase */}
        <motion.div
          className="absolute top-0 left-0"
          animate={walking ? { x: xs, y: ys } : undefined}
          transition={{ duration: PATH_SECONDS, repeat: Infinity, ease: "linear" }}
          style={walking ? undefined : { left: "50%", top: "52%", x: "-50%" }}
        >
          <div className="relative" style={{ width: PONY }}>
            <AnimatePresence>
              {showBubble && (
                <motion.div
                  key="bubble"
                  initial={{ scale: 0.5, opacity: 0, y: 6 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.5, opacity: 0, y: 6 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18 }}
                  className="absolute bottom-full left-1/2 mb-1 w-40 -translate-x-1/2"
                >
                  <div className="rounded-2xl border-2 border-locked bg-white px-2.5 py-1.5 text-center shadow-sm">
                    <p className="text-xs font-bold text-ink">{message}</p>
                  </div>
                  <span
                    aria-hidden
                    className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-r-2 border-b-2 border-locked bg-white"
                  />
                </motion.div>
              )}
            </AnimatePresence>
            <motion.div
              animate={reducedMotion ? undefined : { y: [0, -3, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <SafeImage
                src={ponySrc}
                alt={dirty ? "Trauriges Pony" : "Glückliches Pony"}
                width={PONY}
                height={PONY}
                priority
                fallback="🐴"
                fallbackClassName="text-7xl"
              />
            </motion.div>
          </div>
        </motion.div>
      </div>

      <p className="mt-3 text-center text-sm font-semibold text-ink/70">
        {dirty
          ? `🧹 Noch ${shownApples} ${shownApples === 1 ? "Pferdeapfel" : "Pferdeäpfel"} – mach eine Lektion zum Aufräumen!`
          : shownFeeds.length > 0
            ? `🥕 Alles sauber! Heute schon ${shownFeeds.length}× gefüttert.`
            : "🥕 Alles sauber! Füttere dein Pony nach jeder Lektion."}
      </p>
    </div>
  );
}
