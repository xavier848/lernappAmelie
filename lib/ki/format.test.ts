import { describe, it, expect } from "vitest";
import { kiBloecke } from "./format";

describe("kiBloecke", () => {
  it('trennt Absaetze und macht aus "- "-Zeilen eine Liste', () => {
    expect(kiBloecke("Gute Frage! Das sind die Regeln:\n- Erst waschen\n- Dann trocknen\n\nSo klappt es. 🍰")).toEqual([
      { art: "absatz", text: "Gute Frage! Das sind die Regeln:" },
      { art: "liste", nummeriert: false, punkte: ["Erst waschen", "Dann trocknen"] },
      { art: "absatz", text: "So klappt es. 🍰" },
    ]);
  });

  it("erkennt nummerierte Schritte und Markdown-Reste", () => {
    expect(kiBloecke("**Merke:**\n1. Hände waschen\n2) Abtrocknen\n* Fertig")).toEqual([
      { art: "absatz", text: "Merke:" },
      { art: "liste", nummeriert: true, punkte: ["Hände waschen", "Abtrocknen"] },
      { art: "liste", nummeriert: false, punkte: ["Fertig"] },
    ]);
  });

  it("laesst normalen Text und Rechnungen in Ruhe", () => {
    expect(kiBloecke("Rechne 3 - 1 = 2.\nDas ist alles.")).toEqual([
      { art: "absatz", text: "Rechne 3 - 1 = 2.\nDas ist alles." },
    ]);
  });

  it("kommt mit halbem Text aus dem Stream klar", () => {
    expect(kiBloecke("Regeln:\n- Erst")).toEqual([
      { art: "absatz", text: "Regeln:" },
      { art: "liste", nummeriert: false, punkte: ["Erst"] },
    ]);
    expect(kiBloecke("")).toEqual([]);
  });
});
