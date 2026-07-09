"use client";

// Streak-Kalender (Spec §4.4): aktueller Monat als Raster Mo–So.
// Tage mit Lern-Aktivitaet sind tuerkis gefuellt, heute ist umrandet.
// Rein anzeigend - keine interaktiven Elemente.
import { berlinToday } from "@/lib/data";
import { cn } from "@/lib/cn";

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function StreakCalendar({
  activityDays,
  today = berlinToday(),
}: {
  /** Lerntage als 'YYYY-MM-DD' (Europe/Berlin). */
  activityDays: string[];
  /** Heutiger Tag 'YYYY-MM-DD'; Default: heute in Europe/Berlin. */
  today?: string;
}) {
  const learned = new Set(activityDays);
  const [year, month] = today.split("-").map(Number);

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  // Wochentag des Monatsersten, Montag = 0.
  const firstWeekday =
    (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;

  const monthLabel = new Intl.DateTimeFormat("de-DE", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div>
      <p className="mb-3 text-base font-bold text-ink">{monthLabel}</p>
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day) => (
          <span
            key={day}
            className="flex h-8 items-center justify-center text-xs font-bold text-ink/60"
          >
            {day}
          </span>
        ))}
        {cells.map((day, index) => {
          if (day === null) {
            return <span key={`leer-${index}`} aria-hidden />;
          }
          const iso = `${year}-${pad2(month)}-${pad2(day)}`;
          const isLearned = learned.has(iso);
          const isToday = iso === today;
          return (
            <span
              key={iso}
              aria-label={`${day}. ${isLearned ? "– gelernt" : ""}${
                isToday ? " – heute" : ""
              }`}
              className={cn(
                "mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold",
                isLearned ? "bg-primary text-white" : "text-ink",
                isToday && "border-2 border-primary-dark"
              )}
            >
              {day}
            </span>
          );
        })}
      </div>
    </div>
  );
}
