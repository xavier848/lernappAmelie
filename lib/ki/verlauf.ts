// Chat-Verlauf fuer "Frag das Pony": was der Browser an /api/ki/pony
// mitschickt. Reine Funktion, damit sie ohne Browser testbar ist.
import { MAX_ANTWORT_ZEICHEN, MAX_FRAGE_ZEICHEN, MAX_VERLAUF } from "./schemas";

export type ChatNachricht = {
  role: "user" | "assistant";
  content: string;
  /** Antwort ist ein Fehlertext (offline, Limit ...) und keine echte Antwort. */
  fehler?: boolean;
};

/**
 * Baut den Verlauf so, wie die Route ihn erwartet: Fragen und Antworten
 * abwechselnd, Anfang und Ende eine Frage, hoechstens MAX_VERLAUF
 * Nachrichten. Fehlgeschlagene Antworten fallen samt ihrer Frage weg -
 * sonst wuerde das Pony seine eigenen Fehlertexte als Antwort lernen.
 */
export function verlaufFuerServer(
  chat: ChatNachricht[],
): { role: "user" | "assistant"; content: string }[] {
  const sauber: ChatNachricht[] = [];
  for (const m of chat) {
    const vorher = sauber[sauber.length - 1];
    if (m.role === "assistant") {
      if (vorher?.role !== "user") continue;
      if (m.fehler || !m.content.trim()) {
        sauber.pop();
        continue;
      }
      sauber.push(m);
    } else {
      if (!m.content.trim()) continue;
      // Zwei Fragen hintereinander: die aeltere blieb ohne Antwort.
      if (vorher?.role === "user") sauber.pop();
      sauber.push(m);
    }
  }

  let verlauf = sauber.slice(-MAX_VERLAUF);
  while (verlauf.length > 0 && verlauf[0].role !== "user") verlauf = verlauf.slice(1);
  return verlauf.map((m) => ({
    role: m.role,
    content: m.content
      .trim()
      .slice(0, m.role === "user" ? MAX_FRAGE_ZEICHEN : MAX_ANTWORT_ZEICHEN),
  }));
}

// Der Chat bleibt erhalten, solange Amelie in derselben Lektion ist
// (Einfuehrung -> Ergebnis), aber nur bis zum Neuladen der Seite.
let gemerkt: { slug: string; nachrichten: ChatNachricht[] } | null = null;

export function chatMerken(slug: string, nachrichten: ChatNachricht[]): void {
  gemerkt = { slug, nachrichten };
}

export function gemerkterChat(slug: string): ChatNachricht[] {
  return gemerkt?.slug === slug ? gemerkt.nachrichten : [];
}
