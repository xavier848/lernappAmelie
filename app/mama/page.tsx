"use client";

// Aktiviert das Pruef-Profil "Mama": eigener, von Amelie getrennter
// Fortschritt + Notiz-Knopf bei den Uebungen. Mama oeffnet diese Seite
// einmal und legt sie als App auf ihr Handy.
import { useEffect, useState } from "react";
import Link from "next/link";
import { setProfile } from "@/lib/device";
import { Mascot } from "@/components/ui/Mascot";
import { Button } from "@/components/ui/Button";

export default function MamaPage() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    setProfile("mama");
    setDone(true);
  }, []);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-6 py-10 text-center">
      <Mascot mood="happy" size={120} message="Prüf-Modus für Mama ist an! 📝" />
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-extrabold text-ink">Hallo Mama! 👋</h1>
        <p className="text-base text-ink">
          Das hier ist dein eigener Bereich. Dein Fortschritt ist getrennt von
          Amelie – du kannst nichts kaputt machen.
        </p>
        <p className="text-base text-ink">
          Bei jeder Aufgabe siehst du unten einen{" "}
          <span className="font-bold text-primary-dark">📝 Notiz</span>-Knopf.
          Wenn etwas falsch ist, tipp drauf und schreib es auf.
        </p>
      </div>
      {done && (
        <Link href="/" className="w-full max-w-xs">
          <Button size="lg" full>
            Los geht&apos;s
          </Button>
        </Link>
      )}
      <p className="text-sm text-ink/60">
        Tipp: Über das Teilen-Menü „Zum Home-Bildschirm" kannst du dir diesen
        Bereich als App speichern.
      </p>
    </div>
  );
}
