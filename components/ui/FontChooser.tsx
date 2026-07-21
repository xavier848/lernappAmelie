"use client";

// Schrift-Umschalter (Profil). Setzt data-font am <html> und merkt sich die
// Wahl in localStorage ("lernapp-font"). Standard = Atkinson Hyperlegible
// (max. eindeutige Buchstaben, gut bei Dyspraxie). Jede Option zeigt sich
// selbst in ihrer Schrift, damit Amelie den Unterschied sieht.
// Welche Schrift am besten passt, ist individuell - deshalb zum Ausprobieren.
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

type FontKey = "atkinson" | "lexend" | "standard";

const OPTIONS: {
  key: FontKey;
  label: string;
  hint: string;
  cssVar: string;
}[] = [
  {
    key: "atkinson",
    label: "Klar & deutlich",
    hint: "Jeder Buchstabe gut zu unterscheiden",
    cssVar: "var(--font-atkinson)",
  },
  {
    key: "lexend",
    label: "Leicht lesbar",
    hint: "Mit viel Abstand, flüssig zu lesen",
    cssVar: "var(--font-lexend)",
  },
  {
    key: "standard",
    label: "Gewohnt",
    hint: "Die bisherige Schrift",
    cssVar: "var(--font-open-sans)",
  },
];

export function FontChooser() {
  const [font, setFont] = useState<FontKey>("atkinson");

  useEffect(() => {
    const saved = document.documentElement.dataset.font as FontKey | undefined;
    if (saved === "lexend" || saved === "standard" || saved === "atkinson") {
      setFont(saved);
    }
  }, []);

  const choose = (key: FontKey) => {
    setFont(key);
    document.documentElement.dataset.font = key;
    try {
      localStorage.setItem("lernapp-font", key);
    } catch {
      // localStorage kann in seltenen Faellen blockiert sein - dann bleibt
      // nur die aktuelle Sitzung umgestellt, das ist ok.
    }
  };

  return (
    <section aria-label="Schriftart">
      <h2 className="mb-3 text-lg font-extrabold text-ink">Schriftart 🔤</h2>
      <div className="flex flex-col gap-2.5">
        {OPTIONS.map((option) => {
          const active = font === option.key;
          return (
            <button
              key={option.key}
              type="button"
              aria-pressed={active}
              onClick={() => choose(option.key)}
              style={{ fontFamily: option.cssVar }}
              className={cn(
                "flex min-h-16 w-full items-center gap-3 rounded-2xl border-2 border-b-4 p-3 text-left select-none active:translate-y-0.5 active:border-b-2",
                active
                  ? "border-primary bg-primary-light"
                  : "border-locked bg-white",
              )}
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-2xl font-bold text-ink"
                aria-hidden
              >
                Ag
              </span>
              <span className="flex flex-1 flex-col">
                <span className="text-base font-bold text-ink">
                  {option.label}
                </span>
                <span className="text-sm text-ink/70">{option.hint}</span>
              </span>
              {active && (
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white"
                  aria-hidden
                >
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
