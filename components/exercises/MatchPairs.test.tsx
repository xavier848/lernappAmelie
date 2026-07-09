import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MatchPairs } from "./MatchPairs";
import { shuffleSeeded } from "./shuffle";
import type { MatchPairsData } from "@/lib/content-schema";

beforeAll(() => {
  // jsdom hat kein matchMedia – Framer Motion braucht es.
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

const standard: MatchPairsData = {
  prompt: "Verbinde Deutsch und Englisch.",
  pairs: [
    { left: { text: "Hund" }, right: { text: "dog" } },
    { left: { text: "Katze" }, right: { text: "cat" } },
  ],
};

function setup(data: MatchPairsData, seed?: string) {
  const onResult = vi.fn();
  const onReadyChange = vi.fn();
  const view = render(
    <MatchPairs
      data={data}
      onResult={onResult}
      checkRequested={0}
      onReadyChange={onReadyChange}
      seed={seed}
    />,
  );
  const check = (count = 1) =>
    view.rerender(
      <MatchPairs
        data={data}
        onResult={onResult}
        checkRequested={count}
        onReadyChange={onReadyChange}
        seed={seed}
      />,
    );
  return { onResult, onReadyChange, check };
}

const tap = (name: string | RegExp) =>
  fireEvent.click(screen.getByRole("button", { name }));

describe("MatchPairs (Standard: zwei Spalten)", () => {
  it("zeigt beide Spalten; linke Auswahl wird türkis markiert", () => {
    const { onReadyChange } = setup(standard);

    expect(screen.getAllByTestId("left-item")).toHaveLength(2);
    expect(screen.getAllByTestId("right-item")).toHaveLength(2);
    expect(onReadyChange).toHaveBeenLastCalledWith(false);

    tap("Hund");
    const hund = screen.getByRole("button", { name: "Hund" });
    expect(hund.getAttribute("aria-pressed")).toBe("true");
    expect(hund.className).toContain("border-primary");
  });

  it("Match lässt das Paar verblassen und deaktiviert es", () => {
    setup(standard);

    tap("Hund");
    tap("dog");

    const hund = screen.getByRole("button", { name: "Hund" });
    const dog = screen.getByRole("button", { name: "dog" });
    for (const el of [hund, dog]) {
      expect((el as HTMLButtonElement).disabled).toBe(true);
      expect(el.className).toContain("opacity-30");
    }
  });

  it("alle Paare ohne Fehlversuch → ready und correct:true", () => {
    const { onResult, onReadyChange, check } = setup(standard);

    tap("Hund");
    tap("dog");
    expect(onReadyChange).toHaveBeenLastCalledWith(false);
    tap("Katze");
    tap("cat");
    expect(onReadyChange).toHaveBeenLastCalledWith(true);

    check();
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith({ correct: true });
  });

  it("Fehlversuch setzt die Auswahl zurück und macht das Ergebnis falsch", () => {
    const { onResult, check } = setup(standard);

    // Fehlversuch: Hund → cat
    tap("Hund");
    tap("cat");
    expect(
      screen.getByRole("button", { name: "Hund" }).getAttribute("aria-pressed"),
    ).toBe("false");
    // Falsches Paar bleibt aktiv (kein Malus außer Statistik).
    expect(
      (screen.getByRole("button", { name: "cat" }) as HTMLButtonElement)
        .disabled,
    ).toBe(false);

    // Danach alles richtig zuordnen.
    tap("Hund");
    tap("dog");
    tap("Katze");
    tap("cat");

    check();
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith({ correct: false });
  });

  it("rechts antippen ohne linke Auswahl tut nichts", () => {
    setup(standard);

    tap("dog");
    expect(
      (screen.getByRole("button", { name: "dog" }) as HTMLButtonElement)
        .disabled,
    ).toBe(false);
    // Match funktioniert danach ganz normal.
    tap("Hund");
    tap("dog");
    expect(
      (screen.getByRole("button", { name: "dog" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });
});

describe("MatchPairs (memory: true)", () => {
  const memoryData: MatchPairsData = {
    prompt: "Finde die Paare.",
    memory: true,
    pairs: [
      { left: { text: "Hund" }, right: { text: "dog" } },
      { left: { text: "Katze" }, right: { text: "cat" } },
    ],
  };
  const SEED = "memory-test";
  // Die Komponente mischt [l0, r0, l1, r1] mit demselben Seed –
  // die Permutation hängt nur von Länge + Seed ab, damit kennt der Test das Raster.
  const order = shuffleSeeded([0, 1, 2, 3], SEED);
  // Original-Indizes: 0 = Hund, 1 = dog, 2 = Katze, 3 = cat
  const cardAt = (originalIndex: number) =>
    screen.getAllByTestId("memory-card")[order.indexOf(originalIndex)];

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("startet als 3er-Raster komplett verdeckter Karten", () => {
    setup(memoryData, SEED);

    expect(screen.getByLabelText("Memory-Karten").className).toContain(
      "grid-cols-3",
    );
    const cards = screen.getAllByTestId("memory-card");
    expect(cards).toHaveLength(4);
    for (const card of cards) {
      expect(card.getAttribute("aria-label")).toContain("verdeckt");
    }
  });

  it("zwei offene Karten ohne Match → gesperrt, nach 1,2 s wieder zugedeckt", () => {
    setup(memoryData, SEED);

    fireEvent.click(cardAt(0)); // Hund
    expect(cardAt(0).getAttribute("aria-label")).toBe("Hund");
    fireEvent.click(cardAt(2)); // Katze – kein Match
    expect(cardAt(2).getAttribute("aria-label")).toBe("Katze");

    // Solange zwei falsche Karten offen sind, sind weitere Taps gesperrt.
    fireEvent.click(cardAt(1));
    expect(cardAt(1).getAttribute("aria-label")).toContain("verdeckt");

    act(() => {
      vi.advanceTimersByTime(1200);
    });
    for (const card of screen.getAllByTestId("memory-card")) {
      expect(card.getAttribute("aria-label")).toContain("verdeckt");
    }
  });

  it("Fehlversuche zählen nicht: fertig gespielt → ready und correct:true", () => {
    const { onResult, onReadyChange, check } = setup(memoryData, SEED);

    // 1 Fehlversuch
    fireEvent.click(cardAt(0));
    fireEvent.click(cardAt(2));
    act(() => {
      vi.advanceTimersByTime(1200);
    });

    // Paar 1: Hund + dog – bleibt offen und wird deaktiviert.
    fireEvent.click(cardAt(0));
    fireEvent.click(cardAt(1));
    expect(cardAt(0).getAttribute("aria-label")).toBe("Hund");
    expect(cardAt(1).getAttribute("aria-label")).toBe("dog");
    expect((cardAt(0) as HTMLButtonElement).disabled).toBe(true);
    expect(onReadyChange).toHaveBeenLastCalledWith(false);

    // Paar 2: Katze + cat → fertig gespielt.
    fireEvent.click(cardAt(2));
    fireEvent.click(cardAt(3));
    expect(onReadyChange).toHaveBeenLastCalledWith(true);

    check();
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith({ correct: true });
  });
});
