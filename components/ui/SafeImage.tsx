"use client";

// Bild mit Wiederholung und Notfall-Ersatz.
//
// Hintergrund: Bilder werden mit "must-revalidate" ausgeliefert. Der Browser
// MUSS also vor jedem Anzeigen beim Server rueckfragen und darf die vorhandene
// Kopie NICHT benutzen, wenn diese Rueckfrage scheitert. Auf Amelies wackligem
// Mobilfunk bricht genau das ab – iOS zeichnet dann dauerhaft ein
// Kaputt-Symbol, obwohl die Datei laengst auf dem Geraet liegt.
//
// Diese Komponente faengt das doppelt ab:
//  1. Ein abgebrochener Ladeversuch wird nach kurzer Pause EINMAL wiederholt
//     (frisches <img> per key erzwungen).
//  2. Scheitert auch der zweite Versuch, erscheint ein Emoji in der Groesse
//     des Bildes statt eines defekten Bildes. Alle Bilder sind dekorativ,
//     es geht also kein Inhalt verloren.
import { useEffect, useRef, useState } from "react";
import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/cn";

/** Wartezeit vor dem zweiten Versuch. */
const RETRY_MS = 400;

export type SafeImageProps = ImageProps & {
  /** Emoji, das nach dem letzten Fehlversuch an die Stelle des Bildes tritt. */
  fallback: string;
  /** Groesse/Stil des Ersatz-Emojis, z. B. "text-5xl". */
  fallbackClassName?: string;
};

export function SafeImage({
  fallback,
  fallbackClassName,
  className,
  ...props
}: SafeImageProps) {
  // 0 = erster Versuch, 1 = Wiederholung, 2 = aufgegeben.
  const [versuch, setVersuch] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Wechselt die Bildquelle (z. B. trauriges -> gluecklickes Pony), faengt
  // alles wieder bei null an. Ohne das bliebe ein frueherer Fehlschlag am
  // neuen Bild haengen.
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    setVersuch(0);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [props.src]);

  if (versuch > 1) {
    const label = typeof props.alt === "string" ? props.alt : "";
    return (
      <span
        role="img"
        aria-label={label || undefined}
        aria-hidden={label ? undefined : true}
        style={
          props.fill
            ? undefined
            : { width: props.width, height: props.height }
        }
        className={cn(
          "inline-flex shrink-0 items-center justify-center leading-none",
          fallbackClassName ?? "text-4xl",
          className,
        )}
      >
        {fallback}
      </span>
    );
  }

  return (
    <Image
      {...props}
      // Neuer key => React haengt ein frisches <img> ein und iOS laedt
      // wirklich neu, statt das kaputte Element zu behalten.
      key={versuch}
      className={className}
      onError={() => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setVersuch((v) => v + 1), RETRY_MS);
      }}
    />
  );
}
