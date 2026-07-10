"use client";

// Nur im Mama-Pruef-Modus sichtbar: Knopf zu Amelies Fortschritts-Statistik.
import { useEffect, useState } from "react";
import Link from "next/link";
import { getProfile } from "@/lib/device";

export function MamaStatsLink() {
  const [isMama, setIsMama] = useState(false);
  useEffect(() => {
    setIsMama(getProfile() === "mama");
  }, []);
  if (!isMama) return null;

  return (
    <Link
      href="/amelie-fortschritt"
      className="mt-4 flex min-h-16 w-full items-center gap-3 rounded-2xl border-2 border-b-4 border-primary bg-primary-light p-4 transition-transform select-none active:translate-y-1 active:border-b-2"
    >
      <span aria-hidden className="text-3xl">
        📊
      </span>
      <span className="flex-1">
        <span className="block text-lg font-bold text-ink">
          Amelies Fortschritt
        </span>
        <span className="block text-sm text-ink/70">
          Was klappt gut, wo hilft noch Üben?
        </span>
      </span>
      <span aria-hidden className="text-primary-dark">
        ▶
      </span>
    </Link>
  );
}
