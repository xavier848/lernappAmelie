// Geraete-ID + Profil (client-only, Spec §6). Die App kennt zwei feste
// Profile OHNE Login: "amelie" (Standard, die Lernende) und "mama" (Pruef-
// Modus zum Gegenlesen). Jedes Profil hat eine eigene feste Geraete-ID, also
// getrennten Fortschritt — was Mama tut, aendert bei Amelie nichts.
//
// Warum feste IDs statt zufaellige pro Browser: iOS Safari und die zum
// Home-Bildschirm hinzugefuegte PWA haben getrennte localStorage-Speicher.
// Zufaellige IDs wuerden dort auseinanderlaufen; feste IDs halten den
// Fortschritt pro Profil ueberall gleich.
import { supabaseBrowser } from "@/lib/supabase";

const PROFILE_KEY = "lernapp-profil";
const REGISTERED_KEY = "lernapp-device-registered";

export type Profile = "amelie" | "mama";

/** Amelies feste Geraete-ID (auch von der Mama-Statistik-Seite gelesen). */
export const AMELIE_DEVICE_ID =
  process.env.NEXT_PUBLIC_DEVICE_ID ?? "8ad172de-2bb9-4f6a-8de6-dc720b45b9c0";

const DEVICE_IDS: Record<Profile, string> = {
  amelie: AMELIE_DEVICE_ID,
  mama: "a4a1e000-0000-4000-a000-000000000002",
};

/** Aktives Profil (Default "amelie"). Auf dem Server "amelie". */
export function getProfile(): Profile {
  if (typeof window === "undefined") return "amelie";
  return window.localStorage.getItem(PROFILE_KEY) === "mama" ? "mama" : "amelie";
}

/** Profil umschalten (Mama-Pruefmodus an/aus). Loescht das Registrier-Flag. */
export function setProfile(profile: Profile): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROFILE_KEY, profile);
  window.localStorage.removeItem(REGISTERED_KEY);
}

let registrationInFlight = false;

/** Stellt sicher, dass die Geraete-Zeile existiert (Fremdschluessel-Ziel). */
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

/** Geraete-ID des aktiven Profils. Auf dem Server ein leerer String. */
export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  const id = DEVICE_IDS[getProfile()];
  if (!window.localStorage.getItem(REGISTERED_KEY)) {
    registerDevice(id);
  }
  return id;
}
