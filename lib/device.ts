// Anonyme Geraete-ID (client-only, Spec §6): eine UUID in localStorage
// identifiziert Amelies Geraet. Beim ersten Mal wird das Geraet
// fire-and-forget in der devices-Tabelle registriert (Plan Task 4) –
// noetig, weil progress/exercise_attempts/daily_activity per Fremdschluessel
// auf devices(id) zeigen.
import { supabaseBrowser } from "@/lib/supabase";

const STORAGE_KEY = "lernapp-device-id";
const REGISTERED_KEY = "lernapp-device-registered";

let registrationInFlight = false;

/**
 * Registriert das Geraet in der devices-Tabelle (fire-and-forget).
 * Erst nach erfolgreichem Insert (oder wenn die Zeile schon existiert)
 * wird das lokale "registriert"-Flag gesetzt – schlaegt der Insert fehl
 * (z. B. offline), wird es beim naechsten getDeviceId() erneut versucht.
 */
function registerDevice(id: string): void {
  if (registrationInFlight) return;
  registrationInFlight = true;
  try {
    void supabaseBrowser()
      .from("devices")
      .insert({ id })
      .then(({ error }) => {
        // 23505 = unique_violation: Geraet ist schon registriert.
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
    // Supabase nicht konfiguriert o. ae. – App laeuft weiter,
    // Registrierung wird beim naechsten Aufruf erneut versucht.
    registrationInFlight = false;
  }
}

/**
 * Liest die Geraete-ID aus localStorage oder erzeugt sie beim ersten Besuch
 * (inkl. Registrierung in der devices-Tabelle, fire-and-forget).
 * Auf dem Server (ohne window) wird ein leerer String zurueckgegeben.
 */
export function getDeviceId(): string {
  if (typeof window === "undefined") return "";

  let id = window.localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(STORAGE_KEY, id);
  }
  if (!window.localStorage.getItem(REGISTERED_KEY)) {
    registerDevice(id);
  }
  return id;
}
