import { describe, expect, it } from "vitest";
import {
  abstand,
  erlaubteTippfehler,
  kern,
  normalisiere,
  pruefeAntwort,
  richtigeAntworten,
} from "./vokabelpruefung";

const DE = "de-DE";
const EN = "en-GB";

describe("normalisiere", () => {
  it("macht klein, entfernt Satzzeichen und fasst Leerzeichen zusammen", () => {
    expect(normalisiere("  How are   you?! ", EN)).toBe("how are you");
  });

  it("schreibt Umlaute und ß aus, auch bei zerlegten Umlauten", () => {
    expect(normalisiere("Kühlschrank Löffel Schürze Blumenstrauß", DE)).toBe(
      "kuehlschrank loeffel schuerze blumenstrauss",
    );
    expect(normalisiere("Kuehlschrank", DE)).toBe("kuehlschrank");
    // "u" + kombinierendes Trema (so tippen manche Tastaturen)
    expect(normalisiere("Kühlschrank", DE)).toBe("kuehlschrank");
  });

  it("entfernt Akzente und Apostrophe, Bindestrich wird Leerzeichen", () => {
    expect(normalisiere("résumé", EN)).toBe("resume");
    expect(normalisiere("one’s", EN)).toBe("ones");
    expect(normalisiere("first-aid kit", EN)).toBe("first aid kit");
  });

  it("liest & als and bzw. und", () => {
    expect(normalisiere("salt & pepper", EN)).toBe("salt and pepper");
    expect(normalisiere("Salz & Pfeffer", DE)).toBe("salz und pfeffer");
  });
});

describe("kern", () => {
  it("laesst Artikel weg", () => {
    expect(kern("der Teller", DE)).toBe("teller");
    expect(kern("den Tisch decken", DE)).toBe("tisch decken");
    expect(kern("the bill", EN)).toBe("bill");
    expect(kern("a pet", EN)).toBe("pet");
  });

  it("laesst to vor englischen und sich vor deutschen Verben weg", () => {
    expect(kern("to go hiking", EN)).toBe("go hiking");
    expect(kern("sich gut verstehen", DE)).toBe("gut verstehen");
  });

  it("laesst ein einzelnes Wort stehen", () => {
    expect(kern("to", EN)).toBe("to");
    expect(kern("the", EN)).toBe("");
  });
});

describe("richtigeAntworten", () => {
  it("teilt Komma-Listen in einzelne richtige Antworten", () => {
    expect(richtigeAntworten("stellen, legen").map((a) => a.text)).toEqual([
      "stellen, legen",
      "stellen",
      "legen",
    ]);
  });

  it("haengt weitere Antworten an, aber nicht als Hauptform", () => {
    expect(richtigeAntworten("utensils", ["cutlery"])).toEqual([
      { text: "utensils", hauptform: true },
      { text: "cutlery", hauptform: false },
    ]);
  });
});

describe("abstand", () => {
  it("zaehlt einfuegen, loeschen, ersetzen und vertauschen als je 1", () => {
    expect(abstand("teller", "teller")).toBe(0);
    expect(abstand("teler", "teller")).toBe(1);
    expect(abstand("tellerr", "teller")).toBe(1);
    expect(abstand("tellor", "teller")).toBe(1);
    expect(abstand("tleler", "teller")).toBe(1);
    expect(abstand("", "abc")).toBe(3);
  });
});

describe("erlaubteTippfehler", () => {
  it("erlaubt bei kurzen Woertern keinen, bei langen bis zu zwei", () => {
    expect(erlaubteTippfehler(3)).toBe(0);
    expect(erlaubteTippfehler(4)).toBe(1);
    expect(erlaubteTippfehler(9)).toBe(1);
    expect(erlaubteTippfehler(10)).toBe(2);
  });
});

describe("pruefeAntwort", () => {
  it("nimmt die Hauptform an, egal ob mit Artikel und gross oder klein", () => {
    expect(pruefeAntwort("Teller", "der Teller", undefined, DE)).toEqual({
      art: "richtig",
      treffer: "der Teller",
      hauptform: true,
    });
    expect(pruefeAntwort("die teller", "der Teller", undefined, DE).art).toBe("richtig");
    expect(pruefeAntwort("plate", "plate", undefined, EN).art).toBe("richtig");
  });

  it("nimmt Umlaut-Ersatz und englische Verben ohne to an", () => {
    expect(pruefeAntwort("Kuehlschrank", "der Kühlschrank", undefined, DE).art).toBe("richtig");
    expect(pruefeAntwort("set the table", "to set the table", undefined, EN).art).toBe("richtig");
  });

  it("nimmt jede Antwort aus einer Komma-Liste und auch beide zusammen", () => {
    expect(pruefeAntwort("Verkäuferin", "der Verkäufer, die Verkäuferin", undefined, DE).art).toBe(
      "richtig",
    );
    expect(
      pruefeAntwort("Verkäufer, Verkäuferin", "der Verkäufer, die Verkäuferin", undefined, DE).art,
    ).toBe("richtig");
  });

  it("nimmt weitere Antworten an und sagt, dass es nicht die Hauptform war", () => {
    expect(pruefeAntwort("cutlery", "utensils", ["cutlery"], EN)).toEqual({
      art: "richtig",
      treffer: "cutlery",
      hauptform: false,
    });
  });

  it("nimmt Fragen ohne Fragezeichen und mit anderem Apostroph an", () => {
    expect(pruefeAntwort("how are you", "How are you?", undefined, EN).art).toBe("richtig");
    expect(pruefeAntwort("Wie geht’s dir", "Wie geht es dir?", ["Wie geht's dir?"], DE).art).toBe(
      "richtig",
    );
  });

  it("meldet einen kleinen Tippfehler als fast", () => {
    expect(pruefeAntwort("Teler", "der Teller", undefined, DE)).toEqual({
      art: "fast",
      treffer: "der Teller",
    });
    expect(pruefeAntwort("vegetabels", "vegetables", undefined, EN).art).toBe("fast");
    expect(pruefeAntwort("Kuhlschrank", "der Kühlschrank", undefined, DE).art).toBe("fast");
  });

  it("nimmt bei Tippfehlern die naechste richtige Antwort", () => {
    expect(pruefeAntwort("cutlerry", "utensils", ["cutlery"], EN)).toEqual({
      art: "fast",
      treffer: "cutlery",
    });
  });

  it("zaehlt kurze Woerter mit Fehler und andere Woerter als falsch", () => {
    expect(pruefeAntwort("pan", "pot", undefined, EN).art).toBe("falsch");
    expect(pruefeAntwort("Gabel", "der Löffel", undefined, DE).art).toBe("falsch");
    expect(pruefeAntwort("Tisch", "den Tisch decken", undefined, DE).art).toBe("falsch");
  });

  it("zaehlt eine leere Antwort oder nur einen Artikel als falsch", () => {
    expect(pruefeAntwort("   ", "der Teller", undefined, DE).art).toBe("falsch");
    expect(pruefeAntwort("der", "der Teller", undefined, DE).art).toBe("falsch");
  });
});
