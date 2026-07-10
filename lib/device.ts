// Geraete-ID (client-only, Spec §6). Die App ist fuer GENAU EINE Nutzerin
// (Amelie) gebaut, ohne Login. Frueher wurde pro Browser eine zufaellige UUID
// erzeugt und in localStorage gelegt — das Problem: iOS Safari und die zum
// Home-Bildschirm hinzugefuegte PWA haben GETRENNTE localStorage-Speicher,
// bekamen also verschiedene IDs und damit verschiedenen (leeren) Fortschritt.
//
// Loesung: eine FESTE, geteilte Identitaet. So sieht Amelie ueberall denselben
// Fortschritt — Browser, Home-Screen-App und jedes neue Geraet. Kein Login noetig.
// Die feste ID entspricht Amelies bestehendem Fortschritt (nichts geht verloren).
// Ueberschreibbar per NEXT_PUBLIC_DEVICE_ID, falls spaeter mehrere Profile noetig sind.
import { supabaseBrowser } from "@/lib/supabase";

const REGISTERED_KEY = "lernapp-device-registered";

/** Feste Geraete-ID fuer Amelie (bisheriger Fortschritt haengt hier dran). */
const AMELIE_DEVICE_ID =
  process.env.NEXT_PUBLIC_DEVICE_ID ?? "8ad172de-2bb9-4f6a-8de6-dc720b45b9c0";

let registrationInFlight = false;

/**
 * Stellt sicher, dass die Geraete-Zeile in der devices-Tabelle existiert
 * (progress/exercise_attempts/daily_activity zeigen per Fremdschluessel darauf).
 * Fire-and-forget; bei bereits vorhandener Zeile (23505) ein No-op.
 */
function registerDevice(id: string): void {
  if (registrationInFlight) return;
  registrationInFlight = true;
  try {
    void supabaseBrowser()
      .from("devices")
      .insert({ id })
      .then(({ error }) => {
        if (!error || error.code === "23505") {
          window.localStorage.setItem(REGISTERED_KEY, "1");
        }
      })
      .then(
        () => {
          registrationInFlight = false;
        },
        () => {
          registrationInFlight = false;
        }
      );
  } catch {
    registrationInFlight = false;
  }
}

/**
 * Liefert Amelies feste Geraete-ID. Auf dem Server (ohne window) ein leerer
 * String. Registriert die Zeile beim ersten Aufruf pro Browser (fire-and-forget).
 */
export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  if (!window.localStorage.getItem(REGISTERED_KEY)) {
    registerDevice(AMELIE_DEVICE_ID);
  }
  return AMELIE_DEVICE_ID;
}
