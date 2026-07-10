"use client";

// Schaltet zurueck auf Amelies Profil (normaler Lern-Modus).
import { useEffect, useState } from "react";
import Link from "next/link";
import { setProfile } from "@/lib/device";
import { Mascot } from "@/components/ui/Mascot";
import { Button } from "@/components/ui/Button";

export default function AmeliePage() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    setProfile("amelie");
    setDone(true);
  }, []);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-6 py-10 text-center">
      <Mascot mood="cheer" size={120} message="Hallo Amelie! 🐴" />
      <h1 className="text-2xl font-extrabold text-ink">
        Amelies Bereich ist an.
      </h1>
      {done && (
        <Link href="/" className="w-full max-w-xs">
          <Button size="lg" full>
            Los geht&apos;s
          </Button>
        </Link>
      )}
    </div>
  );
}
