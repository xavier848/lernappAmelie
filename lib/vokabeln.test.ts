import { describe, expect, it } from "vitest";
import { findeStapel, SAMMLUNGEN, sammlungFuerThema, sammlungSchema } from "./vokabeln";

describe("Vokabel-Sammlungen", () => {
  it("hat eine Sammlung fuer Englisch in der Schule mit 9 Stapeln", () => {
    const sammlung = sammlungFuerThema("englisch-schule");
    expect(sammlung).toBeDefined();
    expect(sammlung!.stapel).toHaveLength(9);
    expect(sammlung!.sprache).toBe("en-GB");
  });

  it("hat keine Sammlung fuer Themen ohne Vokabeln", () => {
    expect(sammlungFuerThema("kueche")).toBeUndefined();
    expect(sammlungFuerThema(null)).toBeUndefined();
  });

  it("findet einen Stapel ueber Thema und Slug", () => {
    const treffer = findeStapel("englisch-schule", "im-restaurant");
    expect(treffer?.stapel.titel).toBe("Im Restaurant");
    expect(findeStapel("englisch-schule", "gibt-es-nicht")).toBeUndefined();
    expect(findeStapel("gibt-es-nicht", "im-restaurant")).toBeUndefined();
  });

  it("hat in jedem Stapel eindeutige Woerter in beide Richtungen", () => {
    for (const sammlung of SAMMLUNGEN) {
      for (const stapel of sammlung.stapel) {
        const fremd = stapel.karten.map((k) => k.fremd.toLowerCase());
        const deutsch = stapel.karten.map((k) => k.deutsch.toLowerCase());
        expect(new Set(fremd).size).toBe(fremd.length);
        expect(new Set(deutsch).size).toBe(deutsch.length);
      }
    }
  });

  it("lehnt doppelte Woerter in einem Stapel ab", () => {
    const kaputt = {
      thema: "test",
      titel: "Test",
      sprache: "en-GB",
      spracheName: "Englisch",
      stapel: [
        {
          slug: "a",
          titel: "A",
          icon: "🅰️",
          karten: [
            { fremd: "table", deutsch: "der Tisch" },
            { fremd: "desk", deutsch: "der Tisch" },
            { fremd: "chair", deutsch: "der Stuhl" },
            { fremd: "plate", deutsch: "der Teller" },
          ],
        },
      ],
    };
    expect(sammlungSchema.safeParse(kaputt).success).toBe(false);
  });
});
