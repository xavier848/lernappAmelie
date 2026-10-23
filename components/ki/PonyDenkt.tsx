// "Das Pony denkt nach": drei huepfende Punkte wie beim Tippen im Messenger.
// Ohne Bewegung (prefers-reduced-motion) bleiben die Punkte ruhig stehen.
export function PonyDenkt() {
  return (
    <span role="status" className="relative flex items-center gap-2 py-1 text-ink/60">
      <span className="sr-only">Das Pony denkt nach …</span>
      <span aria-hidden className="flex gap-1.5">
        <span className="size-2.5 rounded-full bg-primary motion-safe:animate-bounce motion-safe:[animation-delay:-0.3s]" />
        <span className="size-2.5 rounded-full bg-primary motion-safe:animate-bounce motion-safe:[animation-delay:-0.15s]" />
        <span className="size-2.5 rounded-full bg-primary motion-safe:animate-bounce" />
      </span>
    </span>
  );
}
