// Zeigt eine Pony-Antwort lesbar an: Absaetze mit Luft dazwischen und
// Aufzaehlungen mit echten Punkten (eingerueckt, wie in einem Merkblatt).
import { cn } from "@/lib/cn";
import { kiBloecke } from "@/lib/ki/format";

export function KiText({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn("space-y-2.5 text-base leading-relaxed", className)}>
      {kiBloecke(text).map((b, i) =>
        b.art === "absatz" ? (
          <p key={i} className="whitespace-pre-line">
            {b.text}
          </p>
        ) : (
          <ul key={i} className="space-y-1.5">
            {b.punkte.map((punkt, j) => (
              <li key={j} className="flex gap-2.5">
                {b.nummeriert ? (
                  <span className="min-w-5 font-bold text-primary-dark">{j + 1}.</span>
                ) : (
                  <span aria-hidden className="mt-[0.6em] size-2 shrink-0 rounded-full bg-primary" />
                )}
                <span className="min-w-0">{punkt}</span>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}
