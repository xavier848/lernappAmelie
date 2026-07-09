import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { StepsOrder } from "./StepsOrder";
import type { StepsOrderData } from "@/lib/content-schema";

beforeAll(() => {
  // jsdom hat kein matchMedia – Framer Motion (useReducedMotion) braucht es.
  if (!window.matchMedia) {
    window.matchMedia = ((query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList) as typeof window.matchMedia;
  }
});

const threeSteps: StepsOrderData = {
  prompt: "Bringe die Schritte in die richtige Reihenfolge.",
  steps: [{ text: "Eins" }, { text: "Zwei" }, { text: "Drei" }],
};

function setup(data: StepsOrderData, seed?: string) {
  const onResult = vi.fn();
  const onReadyChange = vi.fn();
  const view = render(
    <StepsOrder
      data={data}
      onResult={onResult}
      checkRequested={0}
      onReadyChange={onReadyChange}
      seed={seed}
    />,
  );
  const check = (count = 1) =>
    view.rerender(
      <StepsOrder
        data={data}
        onResult={onResult}
        checkRequested={count}
        onReadyChange={onReadyChange}
        seed={seed}
      />,
    );
  return { onResult, onReadyChange, check, view };
}

/** Findet die Karte, deren Schritt-Text enthalten ist. */
const cardByText = (text: string): HTMLElement => {
  const card = screen
    .getAllByTestId("order-card")
    .find((el) => el.textContent?.includes(text));
  if (!card) throw new Error(`Keine Karte mit Text "${text}" gefunden.`);
  return card;
};

const tap = (text: string) => fireEvent.click(cardByText(text));

/** Nummer im Kreis der Karte oder null (leerer gestrichelter Kreis). */
const numberOf = (text: string): string | null =>
  within(cardByText(text)).queryByTestId("number-badge")?.textContent ?? null;

describe("StepsOrder (Nummern-Tap)", () => {
  it("zeigt EINE gemischte Liste ohne Nummern, alle Kreise leer", () => {
    const { onReadyChange } = setup(threeSteps);

    const cards = screen.getAllByTestId("order-card");
    expect(cards).toHaveLength(3);
    // Alle Texte sind da, keine Karte hat schon eine Nummer.
    for (const text of ["Eins", "Zwei", "Drei"]) {
      expect(numberOf(text)).toBeNull();
    }
    expect(screen.getAllByTestId("empty-number")).toHaveLength(3);
    // Die Liste liegt NIE schon in Lösungs-Reihenfolge da.
    const texts = cards.map((el) => el.textContent);
    expect(texts).not.toEqual(["Eins", "Zwei", "Drei"]);
    expect(onReadyChange).toHaveBeenLastCalledWith(false);
  });

  it("Antippen vergibt fortlaufende Nummern; Karten bleiben an ihrem Platz", () => {
    setup(threeSteps, "test-seed");

    const orderBefore = screen
      .getAllByTestId("order-card")
      .map((el) => el.textContent);

    tap("Zwei");
    expect(numberOf("Zwei")).toBe("1");
    tap("Eins");
    expect(numberOf("Eins")).toBe("2");
    expect(numberOf("Drei")).toBeNull();

    // Nummerierte Karte ist türkis markiert.
    expect(cardByText("Zwei").className).toContain("border-primary");
    expect(cardByText("Zwei").className).toContain("bg-primary-light");

    // Die Listen-Reihenfolge ändert sich durch das Nummerieren nicht.
    const orderAfter = screen
      .getAllByTestId("order-card")
      .map((el) => el.textContent);
    expect(orderAfter.map((t) => t?.replace(/^\d/, ""))).toEqual(
      orderBefore.map((t) => t?.replace(/^\d/, "")),
    );
  });

  it("Nummer entfernen renummeriert alle höheren Nummern", () => {
    setup(threeSteps);

    tap("Zwei"); // Nummer 1
    tap("Eins"); // Nummer 2
    tap("Drei"); // Nummer 3

    // "Zwei" ent-nummerieren → "Eins" rutscht auf 1, "Drei" auf 2.
    tap("Zwei");
    expect(numberOf("Zwei")).toBeNull();
    expect(numberOf("Eins")).toBe("1");
    expect(numberOf("Drei")).toBe("2");

    // Erneutes Antippen vergibt die nächste freie Nummer (3).
    tap("Zwei");
    expect(numberOf("Zwei")).toBe("3");
  });

  it("meldet ready erst, wenn alle Karten nummeriert sind", () => {
    const { onReadyChange } = setup(threeSteps);

    tap("Eins");
    tap("Zwei");
    expect(onReadyChange).toHaveBeenLastCalledWith(false);
    tap("Drei");
    expect(onReadyChange).toHaveBeenLastCalledWith(true);
    // Nummer entfernen → wieder nicht bereit.
    tap("Drei");
    expect(onReadyChange).toHaveBeenLastCalledWith(false);
  });

  it("richtige Reihenfolge → onResult(correct:true), alle Karten grün", () => {
    const { onResult, check } = setup(threeSteps);

    tap("Eins");
    tap("Zwei");
    tap("Drei");
    check();

    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith({ correct: true });
    for (const card of screen.getAllByTestId("order-card")) {
      expect(card.className).toContain("border-success");
    }
  });

  it("falsche Reihenfolge → correct:false; falsche Karten orange mit 'richtig: X.'", () => {
    const { onResult, check } = setup(threeSteps);

    tap("Eins"); // Nummer 1: richtig
    tap("Drei"); // Nummer 2: falsch (richtig wäre 3)
    tap("Zwei"); // Nummer 3: falsch (richtig wäre 2)
    check();

    expect(onResult).toHaveBeenCalledWith({ correct: false });
    expect(cardByText("Eins").className).toContain("border-success");
    expect(cardByText("Drei").className).toContain("border-warning");
    expect(cardByText("Zwei").className).toContain("border-warning");
    // Falsche Karten zeigen die korrekte Position an.
    expect(cardByText("Drei").textContent).toContain("richtig: 3.");
    expect(cardByText("Zwei").textContent).toContain("richtig: 2.");
    // Richtige Karte zeigt KEINEN Korrektur-Hinweis.
    expect(cardByText("Eins").textContent).not.toContain("richtig:");
    // Fehler-Feedback ist orange, NIE rot.
    for (const card of screen.getAllByTestId("order-card")) {
      expect(card.className).not.toMatch(/red/);
    }
  });

  it("feuert onResult genau einmal pro Prüf-Vorgang", () => {
    const { onResult, check } = setup(threeSteps);

    tap("Eins");
    tap("Zwei");
    tap("Drei");
    check(1);
    check(1); // gleicher Zähler → kein zweiter Aufruf
    expect(onResult).toHaveBeenCalledTimes(1);
    check(2); // Player prüft erneut
    expect(onResult).toHaveBeenCalledTimes(2);
  });

  it("sperrt nach dem Prüfen alle Karten", () => {
    const { check } = setup(threeSteps);

    tap("Eins");
    tap("Zwei");
    check();

    for (const card of screen.getAllByTestId("order-card")) {
      expect((card as HTMLButtonElement).disabled).toBe(true);
    }
    // Antippen ändert nichts mehr.
    tap("Drei");
    expect(numberOf("Drei")).toBeNull();
    tap("Eins");
    expect(numberOf("Eins")).toBe("1");
  });

  it("gleicher seed → gleiche Karten-Reihenfolge (deterministisch)", () => {
    const first = setup(threeSteps, "stable-seed");
    const firstOrder = screen
      .getAllByTestId("order-card")
      .map((el) => el.textContent);
    first.view.unmount();

    setup(threeSteps, "stable-seed");
    const secondOrder = screen
      .getAllByTestId("order-card")
      .map((el) => el.textContent);
    expect(secondOrder).toEqual(firstOrder);
  });
});

describe("StepsOrder (words-Mode)", () => {
  const wordsData: StepsOrderData = {
    prompt: "Baue den Satz.",
    mode: "words",
    steps: [{ text: "Good" }, { text: "morning" }, { text: "to" }, { text: "you" }],
  };

  const tapWord = (name: string | RegExp) =>
    fireEvent.click(screen.getByRole("button", { name }));

  it("zeigt kompakte Chips: Wortbank unten, Antwortzeile oben", () => {
    setup(wordsData);

    const chips = screen.getAllByTestId("pool-card");
    expect(chips).toHaveLength(4);
    for (const chip of chips) {
      expect(chip.className).toContain("inline-flex");
      expect(chip.className).toContain("min-h-12");
      expect(chip.className).not.toContain("w-full");
    }

    // Wort antippen → erscheint als Chip in der Antwortzeile.
    tapWord("Good");
    const placed = screen.getByTestId("slot-card");
    expect(placed.className).toContain("inline-flex");
    expect(placed.textContent).toBe("Good");
    expect(screen.getAllByTestId("pool-card")).toHaveLength(3);
  });

  it("Chip in der Antwortzeile antippen → zurück in die Wortbank", () => {
    setup(wordsData);

    tapWord("Good");
    tapWord("morning");
    // "Good" aus der Antwort entfernen.
    fireEvent.click(screen.getByRole("button", { name: /Good. Antippen zum Entfernen/ }));
    expect(screen.getAllByTestId("slot-card")).toHaveLength(1);
    expect(screen.getByTestId("slot-card").textContent).toBe("morning");
    expect(screen.getAllByTestId("pool-card")).toHaveLength(3);
  });

  it("richtiger Satz → correct:true; falscher → correct:false mit orange", () => {
    const { onResult, check } = setup(wordsData);

    tapWord("Good");
    tapWord("morning");
    tapWord("to");
    tapWord("you");
    check();

    expect(onResult).toHaveBeenCalledWith({ correct: true });
    for (const chip of screen.getAllByTestId("slot-card")) {
      expect(chip.className).toContain("border-success");
    }
  });

  it("meldet ready erst, wenn alle Wörter platziert sind", () => {
    const { onReadyChange } = setup(wordsData);

    tapWord("Good");
    tapWord("morning");
    tapWord("to");
    expect(onReadyChange).toHaveBeenLastCalledWith(false);
    tapWord("you");
    expect(onReadyChange).toHaveBeenLastCalledWith(true);
  });
});
