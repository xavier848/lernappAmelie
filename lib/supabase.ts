// Supabase-Clients: Browser (anon, Singleton) und Server (Service-Role).
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

/**
 * Browser-Client mit anon key (Singleton).
 * Darf ueberall benutzt werden - RLS schuetzt die Daten.
 */
export function supabaseBrowser(): SupabaseClient {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase ist nicht konfiguriert: NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_ANON_KEY muessen in .env.local gesetzt sein."
    );
  }

  browserClient = createClient(url, anonKey);
  return browserClient;
}

/**
 * Service-Role-Client. NUR in Server-Code importieren (API-Routes)!
 * Wirft einen verstaendlichen Fehler, wenn der Service-Key fehlt.
 */
export function supabaseService(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error(
      "Supabase ist nicht konfiguriert: NEXT_PUBLIC_SUPABASE_URL fehlt in .env.local."
    );
  }
  if (!serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY fehlt. Bitte den Service-Role-Key aus dem Supabase-Dashboard (Project Settings -> API) in .env.local eintragen. Ohne diesen Key koennen Admin-Funktionen nicht schreiben."
    );
  }

  // Kein Singleton und keine Session-Persistenz: jeder Server-Aufruf bekommt
  // einen frischen Client, damit nichts in den Browser leakt.
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
