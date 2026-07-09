// Streak-Berechnung laut Spec §6/§9: Anzahl aufeinanderfolgender Tage
// mit Lern-Aktivitaet bis heute ODER gestern. Wer heute noch nicht
// gelernt hat, verliert den Streak dadurch nicht.
//
// Alle Datumsangaben sind 'YYYY-MM-DD'-Strings (Kalendertage Europe/Berlin,
// die Umrechnung macht der Aufrufer). Die Rechnung selbst ist rein
// kalendarisch und damit frei von Zeitzonen-Fallen.

/** Verschiebt einen 'YYYY-MM-DD'-Tag um deltaDays (UTC-Kalenderarithmetik). */
function shiftDay(day: string, deltaDays: number): string {
  const [year, month, date] = day.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, date + deltaDays));
  return shifted.toISOString().slice(0, 10);
}

/**
 * Zaehlt zusammenhaengende Lerntage rueckwaerts ab `today` oder,
 * falls heute noch nicht gelernt wurde, ab gestern.
 * Eingabe darf unsortiert sein und Duplikate enthalten.
 */
export function computeStreak(days: string[], today: string): number {
  const learned = new Set(days);

  let cursor: string;
  if (learned.has(today)) {
    cursor = today;
  } else if (learned.has(shiftDay(today, -1))) {
    cursor = shiftDay(today, -1);
  } else {
    return 0;
  }

  let streak = 0;
  while (learned.has(cursor)) {
    streak++;
    cursor = shiftDay(cursor, -1);
  }
  return streak;
}
