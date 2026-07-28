// Lernfluss-Regeln (Xavier, 2026-07-12).
//
// Amelie hatte sich Englisch in einem Rutsch vorgenommen, alles durchgespielt
// und war damit "fertig" - andere Bereiche blieben liegen, und die vielen
// Lektionen mit nur 1 oder 2 Sternen hat sie nie wieder angefasst. Darum
// steuert die App jetzt, was als Naechstes dran ist:
//
//   Regel A: Nach 3 Lektionen sind 2 Wiederholungen faellig. Solange die
//            offen sind, geht keine neue Lektion.
//   Regel B: Nach 3 Lektionen im selben Thema macht dieses Thema Pause, bis
//            9 Lektionen aus ANDEREN Themen gespielt wurden.
//
// Bewusste Festlegungen:
//  - Wiederholungen zaehlen NICHT gegen Regel B. Sonst koennte sie eine
//    Themen-Pause abbauen, ohne je ein anderes Thema anzufassen.
//  - Freiwillige Wiederholungen zaehlen fuer Regel A mit. Wer mehr uebt als
//    verlangt, soll dafuer nicht bestraft werden.
//  - Notausgang: Waeren ALLE spielbaren Themen gleichzeitig gesperrt, wird die
//    Sperre mit dem kuerzesten Rest aufgehoben. Amelie darf nie vor einer
//    App sitzen, in der gar nichts mehr geht.
//
// Reine Funktionen ueber dem Ereignis-Protokoll (Tabelle lesson_events) -
// kein eigener Zustand, der verrutschen kann. Getestet in lernfluss.test.ts.

export type LernEreignis = {
  kind: "lektion" | "wiederholung";
  /** Nur bei kind === "lektion" gesetzt. */
  topic_slug?: string | null;
  created_at: string;
};

export type LernflussConfig = {
  /** Lektionen, bis Wiederholungen faellig werden. */
  lektionenProBlock: number;
  /** Wiederholungen, die den Block wieder freischalten. */
  wiederholungenProBlock: number;
  /** Lektionen am Stueck im selben Thema, bis es Pause macht. */
  themaAmStueck: number;
  /** Fremd-Lektionen, bis ein pausiertes Thema wieder freigegeben wird. */
  themaPauseLektionen: number;
};

export const STANDARD_CONFIG: LernflussConfig = {
  lektionenProBlock: 3,
  wiederholungenProBlock: 2,
  themaAmStueck: 3,
  themaPauseLektionen: 9,
};

export type Lernstand = {
  /** true = jetzt sind Wiederholungen dran, keine neue Lektion moeglich. */
  wiederholungFaellig: boolean;
  /** Wie viele Wiederholungen noch fehlen (0, wenn nichts faellig). */
  offeneWiederholungen: number;
  /** Lektionen im laufenden Block (0 bis lektionenProBlock). */
  lektionenImBlock: number;
  /** Thema-Slug -> wie viele Fremd-Lektionen noch bis zur Freigabe. */
  pausierteThemen: Map<string, number>;
  /** Thema-Slug -> Lektionen am Stueck (nur fuer Anzeige "noch 1 bis Pause"). */
  themaZaehler: Map<string, number>;
};

/**
 * Wertet das Ereignis-Protokoll aus. `ereignisse` muss chronologisch
 * aufsteigend sortiert sein (aelteste zuerst).
 */
export function berechneLernstand(
  ereignisse: LernEreignis[],
  config: LernflussConfig = STANDARD_CONFIG,
): Lernstand {
  let lektionenImBlock = 0;
  let wiederholungenImBlock = 0;

  // Thema -> Lektionen am Stueck seit der letzten Freigabe.
  const themaZaehler = new Map<string, number>();
  // Thema -> wie viele Fremd-Lektionen noch fehlen.
  const pausierteThemen = new Map<string, number>();

  for (const e of ereignisse) {
    if (e.kind === "wiederholung") {
      wiederholungenImBlock++;
    } else {
      lektionenImBlock++;

      const thema = e.topic_slug ?? null;
      if (thema) {
        // Jede Lektion aus einem ANDEREN Thema baut laufende Pausen ab.
        for (const [slug, rest] of [...pausierteThemen]) {
          if (slug === thema) continue;
          const neu = rest - 1;
          if (neu <= 0) {
            pausierteThemen.delete(slug);
            themaZaehler.set(slug, 0);
          } else {
            pausierteThemen.set(slug, neu);
          }
        }

        const zaehler = (themaZaehler.get(thema) ?? 0) + 1;
        themaZaehler.set(thema, zaehler);
        if (zaehler >= config.themaAmStueck) {
          pausierteThemen.set(thema, config.themaPauseLektionen);
        }
      }
    }

    // Block abgeschlossen? Dann beides zuruecksetzen.
    if (
      lektionenImBlock >= config.lektionenProBlock &&
      wiederholungenImBlock >= config.wiederholungenProBlock
    ) {
      lektionenImBlock = 0;
      wiederholungenImBlock = 0;
    }
  }

  const wiederholungFaellig = lektionenImBlock >= config.lektionenProBlock;
  const offeneWiederholungen = wiederholungFaellig
    ? Math.max(0, config.wiederholungenProBlock - wiederholungenImBlock)
    : 0;

  return {
    wiederholungFaellig,
    offeneWiederholungen,
    lektionenImBlock,
    pausierteThemen,
    themaZaehler,
  };
}

/**
 * Ist ein Thema gerade spielbar? Gibt den Rest bis zur Freigabe zurueck
 * (0 = frei).
 */
export function themaGesperrtFuer(stand: Lernstand, topicSlug: string): number {
  return stand.pausierteThemen.get(topicSlug) ?? 0;
}

/**
 * Notausgang: Waeren ALLE Themen mit noch offenen Lektionen pausiert, haette
 * Amelie nichts mehr zu tun. Dann wird die Sperre mit dem kuerzesten Rest
 * aufgehoben. `spielbareThemen` sind die Themen, in denen ueberhaupt noch
 * eine Lektion offen ist.
 */
export function loeseSackgasse(
  stand: Lernstand,
  spielbareThemen: string[],
): Lernstand {
  if (spielbareThemen.length === 0) return stand;
  const frei = spielbareThemen.filter((t) => !stand.pausierteThemen.has(t));
  if (frei.length > 0) return stand;

  let bestes: string | null = null;
  let kleinsterRest = Infinity;
  for (const t of spielbareThemen) {
    const rest = stand.pausierteThemen.get(t) ?? 0;
    if (rest > 0 && rest < kleinsterRest) {
      kleinsterRest = rest;
      bestes = t;
    }
  }
  if (!bestes) return stand;

  const pausierteThemen = new Map(stand.pausierteThemen);
  pausierteThemen.delete(bestes);
  const themaZaehler = new Map(stand.themaZaehler);
  themaZaehler.set(bestes, 0);
  return { ...stand, pausierteThemen, themaZaehler };
}

/** Kurzer Satz fuer die Startseite: Was ist jetzt dran? */
export function naechsterSchrittText(
  stand: Lernstand,
  config: LernflussConfig = STANDARD_CONFIG,
): string {
  if (stand.wiederholungFaellig) {
    const n = stand.offeneWiederholungen;
    return n === 1
      ? "Noch 1 Wiederholung, dann geht es weiter."
      : `Jetzt sind ${n} Wiederholungen dran.`;
  }
  const rest = config.lektionenProBlock - stand.lektionenImBlock;
  return rest === 1
    ? "Noch 1 Lektion, dann kommen 2 Wiederholungen."
    : `Noch ${rest} Lektionen, dann kommen 2 Wiederholungen.`;
}
