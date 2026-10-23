import { describe, it, expect } from "vitest";
import { erklaerAuftrag, erklaerSystem, lektionsKontext, ponySystem } from "./prompts";

const lektion = { slug: "hygiene-haende", title: "Hände waschen", intro: "Wasch die Hände.\nMit Seife." };
const uebungen = [
  { type: "multiple_choice", data: { prompt: "Wie lange?", options: [{ text: "30 Sekunden", correct: true }] } },
  { type: "number_input", data: { prompt: "Wie viele Sekunden?", answer: 30 } },
];

describe("lektionsKontext", () => {
  it("enthaelt Titel, Einfuehrung und nummerierte Uebungen", () => {
    const text = lektionsKontext(lektion, uebungen);
    expect(text).toContain('<lektion slug="hygiene-haende">');
    expect(text).toContain("Titel: Hände waschen");
    expect(text).toContain("Mit Seife.");
    expect(text).toContain('"nr": 1');
    expect(text).toContain('"nr": 2');
    expect(text).toContain("30 Sekunden");
    expect(text.trim().endsWith("</lektion>")).toBe(true);
  });

  it("kommt ohne Einfuehrung aus", () => {
    expect(lektionsKontext({ ...lektion, intro: null }, [])).toContain("(keine Einführung)");
  });
});

describe("System-Bloecke", () => {
  it("erst feste Regeln, dann die Lektion mit Cache-Marke", () => {
    for (const bloecke of [erklaerSystem(lektion, uebungen), ponySystem(lektion, uebungen)]) {
      expect(bloecke).toHaveLength(2);
      expect(bloecke[0].cache_control).toBeUndefined();
      expect(bloecke[0].text).toContain("Leichte Sprache");
      expect(bloecke[0].text).toContain("112");
      expect(bloecke[1].cache_control).toEqual({ type: "ephemeral" });
      expect(bloecke[1].text).toBe(lektionsKontext(lektion, uebungen));
    }
  });

  it("der erste Block haengt nicht von der Lektion ab (Cache ueber Lektionen hinweg)", () => {
    const andere = { slug: "andere", title: "Andere", intro: null };
    expect(erklaerSystem(andere, [])[0].text).toBe(erklaerSystem(lektion, uebungen)[0].text);
    expect(ponySystem(andere, [])[0].text).toBe(ponySystem(lektion, uebungen)[0].text);
    expect(ponySystem(lektion, uebungen)[0].text).not.toBe(erklaerSystem(lektion, uebungen)[0].text);
  });
});

describe("erklaerAuftrag", () => {
  it("nennt Uebung und Antwort und darf beim letzten Versuch die Loesung sagen", () => {
    const text = erklaerAuftrag({ uebung: uebungen[1], nr: 2, antwort: "10", nochmal: false });
    expect(text).toContain("Übung 2");
    expect(text).toContain('"answer":30');
    expect(text).toContain("<antwort>10</antwort>");
    expect(text).toContain("Nenne die richtige Lösung.");
    expect(text).not.toContain("NICHT");
  });

  it("verraet beim Nochmal-Versuch die Loesung nicht", () => {
    const text = erklaerAuftrag({ uebung: uebungen[1], nr: 2, nochmal: true });
    expect(text).toContain("Verrate die richtige Lösung NICHT");
    expect(text).toContain("weiß die App nicht");
  });
});
