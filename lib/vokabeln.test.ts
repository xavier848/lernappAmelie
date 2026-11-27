import { describe, expect, it } from "vitest";
import { kern, pruefeAntwort, richtigeAntworten } from "./vokabelpruefung";
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

  it("nimmt beim Schreiben jede richtige Antwort einer Karte auch als richtig an", () => {
    for (const sammlung of SAMMLUNGEN) {
      for (const stapel of sammlung.stapel) {
        for (const karte of stapel.karten) {
          for (const [haupt, auch, sprache] of [
            [karte.fremd, karte.fremdAuch, sammlung.sprache],
            [karte.deutsch, karte.deutschAuch, "de-DE"],
          ] as const) {
            for (const antwort of richtigeAntworten(haupt, auch)) {
              const ergebnis = pruefeAntwort(antwort.text, haupt, auch, sprache);
              expect(ergebnis.art, `${stapel.slug}: "${antwort.text}"`).toBe("richtig");
            }
          }
        }
      }
    }
  });

  it("hat keine weitere Antwort, die schon die Hauptform ist oder doppelt steht", () => {
    for (const sammlung of SAMMLUNGEN) {
      for (const stapel of sammlung.stapel) {
        for (const karte of stapel.karten) {
          for (const [haupt, auch, sprache] of [
            [karte.fremd, karte.fremdAuch ?? [], sammlung.sprache],
            [karte.deutsch, karte.deutschAuch ?? [], "de-DE"],
          ] as const) {
            const kerne = auch.map((a) => kern(a, sprache));
            expect(new Set(kerne).size, `${stapel.slug}: ${haupt}`).toBe(kerne.length);
            const haupt_kerne = richtigeAntworten(haupt).map((a) => kern(a.text, sprache));
            for (const k of kerne) {
              expect(haupt_kerne, `${stapel.slug}: ${haupt} / ${k}`).not.toContain(k);
            }
          }
        }
      }
    }
  });

  it("hat in keinem Stapel eine Antwort, die zu zwei Karten passt", () => {
    for (const sammlung of SAMMLUNGEN) {
      for (const stapel of sammlung.stapel) {
        for (const seite of ["fremd", "deutsch"] as const) {
          const sprache = seite === "fremd" ? sammlung.sprache : "de-DE";
          const gesehen = new Map<string, string>();
          for (const karte of stapel.karten) {
            const haupt = karte[seite];
            const auch = seite === "fremd" ? karte.fremdAuch : karte.deutschAuch;
            const kerne = new Set(richtigeAntworten(haupt, auch).map((a) => kern(a.text, sprache)));
            for (const k of kerne) {
              const andere = gesehen.get(k);
              expect(andere, `${stapel.slug}: "${k}" passt zu "${andere}" und "${haupt}"`).toBeUndefined();
              gesehen.set(k, haupt);
            }
          }
        }
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
