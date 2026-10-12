// Laedt Lektion + Uebungen fuer die KI-Hilfen auf dem Server. Bewusst aus
// der Datenbank und nicht aus dem Browser: so erklaert das Pony nur echte
// App-Inhalte, und niemand kann eigene Texte als "Lektion" unterschieben.
// Liest mit dem anon-Key - RLS liefert nur veroeffentlichte Lektionen.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { KiLektion, KiUebung } from "./prompts";

export type KiLektionMitUebungen = {
  lektion: KiLektion;
  uebungen: (KiUebung & { id: string })[];
};

function db(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Supabase ist nicht konfiguriert.");
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

type LektionZeile = {
  id: string;
  slug: string;
  title: string;
  intro: string | null;
  exercises: { id: string; type: string; data: unknown; sort: number }[] | null;
};

const SPALTEN = "id, slug, title, intro, exercises(id, type, data, sort)";

function umwandeln(zeile: LektionZeile): KiLektionMitUebungen {
  const uebungen = [...(zeile.exercises ?? [])]
    .sort((a, b) => a.sort - b.sort)
    .map(({ id, type, data }) => ({ id, type, data }));
  return {
    lektion: { slug: zeile.slug, title: zeile.title, intro: zeile.intro },
    uebungen,
  };
}

/** Lektion per Slug; null, wenn es sie nicht gibt (oder nicht veroeffentlicht). */
export async function ladeLektion(slug: string): Promise<KiLektionMitUebungen | null> {
  const { data, error } = await db()
    .from("lessons")
    .select(SPALTEN)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data ? umwandeln(data as LektionZeile) : null;
}

/** Die Lektion, zu der eine Uebung gehoert, plus die Position der Uebung. */
export async function ladeLektionZuUebung(
  exerciseId: string,
): Promise<(KiLektionMitUebungen & { index: number }) | null> {
  const client = db();
  const uebung = await client
    .from("exercises")
    .select("lesson_id")
    .eq("id", exerciseId)
    .maybeSingle();
  if (uebung.error) throw uebung.error;
  if (!uebung.data) return null;

  const { data, error } = await client
    .from("lessons")
    .select(SPALTEN)
    .eq("id", (uebung.data as { lesson_id: string }).lesson_id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const geladen = umwandeln(data as LektionZeile);
  const index = geladen.uebungen.findIndex((u) => u.id === exerciseId);
  return index < 0 ? null : { ...geladen, index };
}
