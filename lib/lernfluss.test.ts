import { describe, expect, it } from "vitest";
import {
  berechneLernstand,
  loeseSackgasse,
  naechsterSchrittText,
  themaGesperrtFuer,
  STANDARD_CONFIG,
  type LernEreignis,
} from "./lernfluss";

// Kleine Helfer, damit die Faelle lesbar bleiben.
let zeit = 0;
const lektion = (thema: string): LernEreignis => ({
  kind: "lektion",
  topic_slug: thema,
  created_at: new Date(Date.UTC(2026, 6, 12, 0, 0, zeit++)).toISOString(),
});
const wiederholung = (): LernEreignis => ({
  kind: "wiederholung",
  created_at: new Date(Date.UTC(2026, 6, 12, 0, 0, zeit++)).toISOString(),
});

describe("Regel A: nach 3 Lektionen sind 2 Wiederholungen faellig", () => {
  it("laesst die ersten 3 Lektionen ohne Wiederholung zu", () => {
    const a = berechneLernstand([lektion("englisch")]);
    expect(a.wiederholungFaellig).toBe(false);
    const b = berechneLernstand([lektion("englisch"), lektion("kueche")]);
    expect(b.wiederholungFaellig).toBe(false);
  });

  it("fordert nach der 3. Lektion zwei Wiederholungen", () => {
    const stand = berechneLernstand([
      lektion("englisch"),
      lektion("kueche"),
      lektion("waesche"),
    ]);
    expect(stand.wiederholungFaellig).toBe(true);
    expect(stand.offeneWiederholungen).toBe(2);
  });

  it("zaehlt jede erledigte Wiederholung herunter", () => {
    const stand = berechneLernstand([
      lektion("englisch"),
      lektion("kueche"),
      lektion("waesche"),
      wiederholung(),
    ]);
    expect(stand.wiederholungFaellig).toBe(true);
    expect(stand.offeneWiederholungen).toBe(1);
  });

  it("gibt nach der 2. Wiederholung wieder frei und faengt neu an", () => {
    const stand = berechneLernstand([
      lektion("englisch"),
      lektion("kueche"),
      lektion("waesche"),
      wiederholung(),
      wiederholung(),
    ]);
    expect(stand.wiederholungFaellig).toBe(false);
    expect(stand.offeneWiederholungen).toBe(0);
    expect(stand.lektionenImBlock).toBe(0);
  });

  it("rechnet freiwillige Wiederholungen an, statt sie zu bestrafen", () => {
    // Sie uebt frueh freiwillig zweimal - danach reichen die 3 Lektionen,
    // ohne dass nochmal zwei Wiederholungen faellig werden.
    const stand = berechneLernstand([
      wiederholung(),
      wiederholung(),
      lektion("englisch"),
      lektion("kueche"),
      lektion("waesche"),
    ]);
    expect(stand.wiederholungFaellig).toBe(false);
    expect(stand.lektionenImBlock).toBe(0);
  });
});

describe("Regel B: 3 Lektionen im selben Thema -> 9 Fremd-Lektionen Pause", () => {
  it("sperrt das Thema nach der 3. Lektion am Stueck", () => {
    const stand = berechneLernstand([
      lektion("englisch"),
      lektion("englisch"),
      lektion("englisch"),
    ]);
    expect(themaGesperrtFuer(stand, "englisch")).toBe(9);
  });

  it("sperrt noch nicht nach zwei Lektionen", () => {
    const stand = berechneLernstand([lektion("englisch"), lektion("englisch")]);
    expect(themaGesperrtFuer(stand, "englisch")).toBe(0);
  });

  it("baut die Pause mit jeder Lektion aus einem anderen Thema ab", () => {
    const stand = berechneLernstand([
      lektion("englisch"),
      lektion("englisch"),
      lektion("englisch"),
      lektion("kueche"),
      lektion("waesche"),
    ]);
    expect(themaGesperrtFuer(stand, "englisch")).toBe(7);
  });

  it("gibt das Thema nach genau 9 Fremd-Lektionen wieder frei", () => {
    const fremd = [
      "kueche", "waesche", "badezimmer", "kopfrechnen", "hygiene",
      "naehen", "servietten", "handtuecher", "wohnzimmer",
    ].map(lektion);
    const stand = berechneLernstand([
      lektion("englisch"),
      lektion("englisch"),
      lektion("englisch"),
      ...fremd,
    ]);
    expect(themaGesperrtFuer(stand, "englisch")).toBe(0);
    // Nach der Freigabe faengt der Themen-Zaehler wieder bei null an.
    expect(stand.themaZaehler.get("englisch")).toBe(0);
  });

  it("baut die Pause NICHT ueber Wiederholungen ab", () => {
    const stand = berechneLernstand([
      lektion("englisch"),
      lektion("englisch"),
      lektion("englisch"),
      wiederholung(),
      wiederholung(),
      wiederholung(),
      wiederholung(),
    ]);
    expect(themaGesperrtFuer(stand, "englisch")).toBe(9);
  });

  it("behandelt Niederlaendisch als eigenes Thema", () => {
    const stand = berechneLernstand([
      lektion("englisch"),
      lektion("englisch"),
      lektion("englisch"),
      lektion("niederlaendisch"),
    ]);
    expect(themaGesperrtFuer(stand, "englisch")).toBe(8);
    expect(themaGesperrtFuer(stand, "niederlaendisch")).toBe(0);
  });

  it("kann mehrere Themen gleichzeitig pausieren", () => {
    const stand = berechneLernstand([
      lektion("englisch"), lektion("englisch"), lektion("englisch"),
      lektion("kueche"), lektion("kueche"), lektion("kueche"),
    ]);
    expect(themaGesperrtFuer(stand, "kueche")).toBe(9);
    // Die drei Kueche-Lektionen haben Englisch um 3 abgebaut.
    expect(themaGesperrtFuer(stand, "englisch")).toBe(6);
  });
});

describe("Notausgang", () => {
  it("hebt die kuerzeste Sperre auf, wenn sonst gar nichts mehr ginge", () => {
    const stand = berechneLernstand([
      lektion("englisch"), lektion("englisch"), lektion("englisch"),
      lektion("kueche"), lektion("kueche"), lektion("kueche"),
    ]);
    // Nur diese beiden Themen haben ueberhaupt noch offene Lektionen.
    const geloest = loeseSackgasse(stand, ["englisch", "kueche"]);
    // Englisch hatte den kleineren Rest (6 gegen 9) und wird freigegeben.
    expect(themaGesperrtFuer(geloest, "englisch")).toBe(0);
    expect(themaGesperrtFuer(geloest, "kueche")).toBe(9);
  });

  it("laesst alles unveraendert, solange noch ein Thema frei ist", () => {
    const stand = berechneLernstand([
      lektion("englisch"), lektion("englisch"), lektion("englisch"),
    ]);
    const geloest = loeseSackgasse(stand, ["englisch", "kueche"]);
    expect(themaGesperrtFuer(geloest, "englisch")).toBe(9);
  });
});

describe("Zusammenspiel und Anzeige", () => {
  it("verlangt Wiederholungen auch dann, wenn ein Thema pausiert", () => {
    const stand = berechneLernstand([
      lektion("englisch"), lektion("englisch"), lektion("englisch"),
    ]);
    expect(stand.wiederholungFaellig).toBe(true);
    expect(themaGesperrtFuer(stand, "englisch")).toBe(9);
  });

  it("beschreibt den naechsten Schritt in einfachen Worten", () => {
    const frisch = berechneLernstand([]);
    expect(naechsterSchrittText(frisch)).toContain("3 Lektionen");

    const zwei = berechneLernstand([lektion("englisch"), lektion("kueche")]);
    expect(naechsterSchrittText(zwei)).toContain("1 Lektion");

    const faellig = berechneLernstand([
      lektion("englisch"), lektion("kueche"), lektion("waesche"),
    ]);
    expect(naechsterSchrittText(faellig)).toContain("2 Wiederholungen");

    const eineOffen = berechneLernstand([
      lektion("englisch"), lektion("kueche"), lektion("waesche"), wiederholung(),
    ]);
    expect(naechsterSchrittText(eineOffen)).toContain("1 Wiederholung");
  });

  it("kommt mit einem leeren Protokoll klar", () => {
    const stand = berechneLernstand([]);
    expect(stand.wiederholungFaellig).toBe(false);
    expect(stand.lektionenImBlock).toBe(0);
    expect(stand.pausierteThemen.size).toBe(0);
  });

  it("nutzt die Standard-Werte 3 / 2 / 3 / 9", () => {
    expect(STANDARD_CONFIG).toEqual({
      lektionenProBlock: 3,
      wiederholungenProBlock: 2,
      themaAmStueck: 3,
      themaPauseLektionen: 9,
    });
  });
});
