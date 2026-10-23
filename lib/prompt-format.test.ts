import { describe, expect, it } from "vitest";
import { splitPrompt, splitSentences } from "./prompt-format";

describe("splitSentences", () => {
  it("setzt jeden Satz in eine eigene Zeile", () => {
    expect(splitSentences("Das Tuch ist nass. Wringe es aus!")).toEqual([
      "Das Tuch ist nass.",
      "Wringe es aus!",
    ]);
  });

  it("trennt nicht hinter Abkürzungen wie „z. B.“", () => {
    expect(splitSentences("Nimm z. B. Essig. Das hilft.")).toEqual([
      "Nimm z. B. Essig.",
      "Das hilft.",
    ]);
  });

  it("lässt Emoji-Deko beim linken Satz", () => {
    expect(splitSentences("Das Brot ist fertig. 🍞 Schneide es.")).toEqual([
      "Das Brot ist fertig. 🍞",
      "Schneide es.",
    ]);
  });

  it("trennt nicht hinter Ordnungszahlen", () => {
    expect(
      splitSentences("Beikost gibt es nicht vor dem 5. Lebensmonat. Das ist wichtig."),
    ).toEqual(["Beikost gibt es nicht vor dem 5. Lebensmonat.", "Das ist wichtig."]);
    expect(
      splitSentences("Die U7 ist vom 21. bis zum 24. Lebensmonat. Wann gehst du hin?"),
    ).toEqual(["Die U7 ist vom 21. bis zum 24. Lebensmonat.", "Wann gehst du hin?"]);
    expect(splitSentences("Sie ist im 43. bis 48. Lebensmonat.")).toEqual([
      "Sie ist im 43. bis 48. Lebensmonat.",
    ]);
    expect(splitSentences("Wir kommen vom 5. bis 12. März. Geht das?")).toEqual([
      "Wir kommen vom 5. bis 12. März.",
      "Geht das?",
    ]);
    expect(splitSentences("Jeder 10. Kühlschrank war leer.")).toEqual([
      "Jeder 10. Kühlschrank war leer.",
    ]);
  });

  it("trennt weiter, wenn ein Satz mit einer Zahl endet", () => {
    expect(splitSentences("Frau Klein ist 81. Sie isst kein Brot.")).toEqual([
      "Frau Klein ist 81.",
      "Sie isst kein Brot.",
    ]);
    expect(splitSentences("Der PAL-Wert ist 1,4. PAL ist ein Maß.")).toEqual([
      "Der PAL-Wert ist 1,4.",
      "PAL ist ein Maß.",
    ]);
    expect(splitSentences("Die U7 ist im Lebensmonat 21 bis 24. Der Arzt prüft.")).toEqual([
      "Die U7 ist im Lebensmonat 21 bis 24.",
      "Der Arzt prüft.",
    ]);
    expect(splitSentences("Im Notfall rufst du die 112. Dann kommt Hilfe.")).toEqual([
      "Im Notfall rufst du die 112.",
      "Dann kommt Hilfe.",
    ]);
    expect(splitSentences("Du tippst 8, 3, 9. Das ist 8:39 Uhr.")).toEqual([
      "Du tippst 8, 3, 9.",
      "Das ist 8:39 Uhr.",
    ]);
    expect(splitSentences("Das Verhältnis ist 1 : 3. Was heißt das?")).toEqual([
      "Das Verhältnis ist 1 : 3.",
      "Was heißt das?",
    ]);
    expect(splitSentences("Die Schritte stehen mit 1., 2., 3. Wie heißt das?")).toEqual([
      "Die Schritte stehen mit 1., 2., 3.",
      "Wie heißt das?",
    ]);
  });

  it("beginnt bei einer Aufzählung die Zeile mit der Nummer", () => {
    expect(
      splitSentences(
        "Es gibt sechs Schritte. 1. Warenbeschaffung, zum Beispiel der Einkauf. 2. Lagerung, zum Beispiel im Kühlraum.",
      ),
    ).toEqual([
      "Es gibt sechs Schritte.",
      "1. Warenbeschaffung, zum Beispiel der Einkauf.",
      "2. Lagerung, zum Beispiel im Kühlraum.",
    ]);
    expect(
      splitSentences("Der Ablauf: 1. Arbeitsplatz einrichten. 2. Fenster vorbereiten."),
    ).toEqual(["Der Ablauf: 1. Arbeitsplatz einrichten.", "2. Fenster vorbereiten."]);
  });

  it("lässt eine Aufzählung mit Kommas in einer Zeile", () => {
    const satz =
      "Es gibt drei Phasen: 1. ausschließlich Milch, 2. Einführung der Beikost, 3. Übergang zur Familienkost.";
    expect(splitSentences(satz)).toEqual([satz]);
  });
});

describe("splitPrompt", () => {
  it("trennt einen kurzen Vorspann vor dem Doppelpunkt ab", () => {
    expect(splitPrompt("Was bedeutet: Das Zimmer ist frei. Stimmt das?")).toEqual({
      lead: "Was bedeutet:",
      lines: ["Das Zimmer ist frei.", "Stimmt das?"],
    });
  });

  it("lässt die Ordnungszahl im Satz", () => {
    expect(splitPrompt("🍼 Das Kind ist im 5. Lebensmonat. Was isst es?")).toEqual({
      lead: null,
      lines: ["🍼 Das Kind ist im 5. Lebensmonat.", "Was isst es?"],
    });
  });
});
