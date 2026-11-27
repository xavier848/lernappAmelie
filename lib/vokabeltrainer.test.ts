import { describe, expect, it } from "vitest";
import {
  aktuelleKarte,
  andereRichtung,
  beantworte,
  mische,
  naechsteRunde,
  starteTraining,
  type Training,
} from "./vokabeltrainer";

/** Zufall, der immer dieselbe Folge liefert - damit die Tests stabil sind. */
function festerZufall(): () => number {
  let n = 0;
  return () => {
    n = (n * 9301 + 49297) % 233280;
    return n / 233280;
  };
}

/** Spielt eine ganze Runde: `gewusst` sagt fuer jede Karte (Index) ja oder nein. */
function spieleRunde(t: Training, gewusst: (karte: number) => boolean): Training {
  let stand = t;
  while (stand.phase === "karte") {
    const karte = aktuelleKarte(stand)!;
    stand = beantworte(stand, gewusst(karte));
  }
  return stand;
}

describe("mische", () => {
  it("behaelt alle Elemente und veraendert die Vorlage nicht", () => {
    const vorlage = [0, 1, 2, 3, 4, 5];
    const gemischt = mische(vorlage, festerZufall());
    expect([...gemischt].sort()).toEqual(vorlage);
    expect(vorlage).toEqual([0, 1, 2, 3, 4, 5]);
  });
});

describe("Runde 1", () => {
  it("fragt jede Karte genau einmal ab", () => {
    const t = starteTraining(5, festerZufall());
    expect(t.runde).toBe(1);
    expect([...t.reihe].sort()).toEqual([0, 1, 2, 3, 4]);
    expect(t.phase).toBe("karte");
  });

  it("ist fertig, wenn alles gewusst war", () => {
    const ende = spieleRunde(starteTraining(4, festerZufall()), () => true);
    expect(ende.phase).toBe("fertig");
    expect(ende.gewusstBeimErstenMal).toBe(4);
  });

  it("macht eine Pause am Rundenende, wenn etwas nicht gewusst war", () => {
    const ende = spieleRunde(starteTraining(4, festerZufall()), (k) => k !== 2);
    expect(ende.phase).toBe("rundenende");
    expect(ende.nochmal).toEqual([2]);
    expect(ende.gewusstInRunde).toBe(3);
    expect(ende.gewusstBeimErstenMal).toBe(3);
  });
});

describe("Folgerunden", () => {
  it("fragt nur die nicht gewussten Karten wieder ab", () => {
    const r1 = spieleRunde(starteTraining(6, festerZufall()), (k) => k % 2 === 0);
    const r2 = naechsteRunde(r1, festerZufall());
    expect(r2.runde).toBe(2);
    expect([...r2.reihe].sort()).toEqual([1, 3, 5]);
    expect(r2.nochmal).toEqual([]);
    expect(r2.gewusstInRunde).toBe(0);
  });

  it("wiederholt so lange, bis alle Karten sitzen", () => {
    // Karte 1 klappt erst in Runde 3.
    let versuche = 0;
    let t = spieleRunde(starteTraining(3, festerZufall()), (k) => k !== 1);
    expect(t.phase).toBe("rundenende");
    t = spieleRunde(naechsteRunde(t, festerZufall()), () => {
      versuche++;
      return false;
    });
    expect(t.phase).toBe("rundenende");
    t = spieleRunde(naechsteRunde(t, festerZufall()), () => true);
    expect(t.phase).toBe("fertig");
    expect(t.runde).toBe(3);
    expect(versuche).toBe(1);
    // Das Lob am Ende bezieht sich auf die erste Runde.
    expect(t.gewusstBeimErstenMal).toBe(2);
  });

  it("startet keine neue Runde, solange die alte noch laeuft", () => {
    const t = starteTraining(3, festerZufall());
    expect(naechsteRunde(t)).toBe(t);
  });
});

describe("Sonderfaelle", () => {
  it("kommt mit einem leeren Stapel klar", () => {
    const t = starteTraining(0);
    expect(t.phase).toBe("fertig");
    expect(aktuelleKarte(t)).toBeNull();
    expect(beantworte(t, true)).toBe(t);
  });

  it("wechselt die Richtung hin und zurueck", () => {
    expect(andereRichtung("fremd-deutsch")).toBe("deutsch-fremd");
    expect(andereRichtung("deutsch-fremd")).toBe("fremd-deutsch");
  });
});
