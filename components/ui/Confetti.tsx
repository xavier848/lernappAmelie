"use client";

// Konfetti bei Lektionsabschluss (Spec §3): ~40 Partikel in Türkis, Gelb,
// Orange und Grün fallen einmalig herab und verblassen. Rein dekorativ,
// pointer-events-none, respektiert prefers-reduced-motion (dann gar nichts).
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

const PARTICLE_COUNT = 40;
const COLOR_CLASSES = ["bg-primary", "bg-yellow-400", "bg-warning", "bg-success"];

type Particle = {
  id: number;
  left: number;
  width: number;
  height: number;
  delay: number;
  duration: number;
  rotate: number;
  colorClass: string;
};

function makeParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    width: 6 + Math.round(Math.random() * 6),
    height: 8 + Math.round(Math.random() * 8),
    delay: Math.random() * 0.6,
    duration: 2.2 + Math.random() * 1.6,
    rotate: (Math.random() - 0.5) * 540,
    colorClass: COLOR_CLASSES[i % COLOR_CLASSES.length],
  }));
}

export function Confetti() {
  const reducedMotion = useReducedMotion();
  const [particles] = useState(makeParticles);

  if (reducedMotion) return null;

  return (
    <div
      aria-hidden
      data-testid="confetti"
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
    >
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className={`absolute top-0 rounded-sm ${p.colorClass}`}
          style={{ left: `${p.left}%`, width: p.width, height: p.height }}
          initial={{ y: -30, opacity: 1, rotate: 0 }}
          animate={{ y: "105vh", opacity: [1, 1, 0], rotate: p.rotate }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
        />
      ))}
    </div>
  );
}
