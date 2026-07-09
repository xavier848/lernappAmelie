// Kurze Feedback-Sounds per WebAudio (keine Audiodateien noetig).
// Richtig: froehliches Zwei-Ton-"Ding" (Dur-Terz aufwaerts).
// Fast richtig: ein einzelner, weicher, tiefer Ton - freundlich, nie schrill.
// Leise gemischt (max. ~20 % Lautstaerke), no-op wenn WebAudio fehlt
// oder der Browser Autoplay blockt (dann bleibt es einfach still).

let ctx: AudioContext | null = null;

function audioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  try {
    ctx ??= new Ctor();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(
  context: AudioContext,
  frequency: number,
  startAt: number,
  duration: number,
  volume: number
): void {
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.type = "sine";
  osc.frequency.value = frequency;
  // Sanft ein- und ausblenden (kein Klicken).
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(volume, startAt + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  osc.connect(gain);
  gain.connect(context.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.05);
}

/** Froehliches "Ding-Ding" fuer richtige Antworten. */
export function playCorrect(): void {
  const context = audioContext();
  if (!context) return;
  try {
    const now = context.currentTime;
    tone(context, 660, now, 0.15, 0.16); // E5
    tone(context, 880, now + 0.11, 0.22, 0.16); // A5
  } catch {
    // still bleiben
  }
}

/** Weicher, tiefer Einzelton fuer "Fast!" - freundlich, nicht strafend. */
export function playWrong(): void {
  const context = audioContext();
  if (!context) return;
  try {
    tone(context, 220, context.currentTime, 0.28, 0.12); // A3
  } catch {
    // still bleiben
  }
}

/** Kleiner Jubel fuer den Ergebnis-Screen (drei Toene aufwaerts). */
export function playFinish(): void {
  const context = audioContext();
  if (!context) return;
  try {
    const now = context.currentTime;
    tone(context, 523, now, 0.14, 0.14); // C5
    tone(context, 659, now + 0.12, 0.14, 0.14); // E5
    tone(context, 784, now + 0.24, 0.3, 0.15); // G5
  } catch {
    // still bleiben
  }
}
