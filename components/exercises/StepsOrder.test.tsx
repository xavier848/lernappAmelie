import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StepsOrder } from "./StepsOrder";
import type { StepsOrderData } from "@/lib/content-schema";

const threeSteps: StepsOrderData = {
  prompt: "Bringe die Schritte in die richtige Reihenfolge.",
  steps: [{ text: "Eins" }, { text: "Zwei" }, { text: "Drei" }],
};

function setup(data: StepsOrderData) {
  const onResult = vi.fn();
  const onReadyChange = vi.fn();
  const view = render(
    <StepsOrder
      data={data}
      onResult={onResult}
      checkRequested={0}
      onReadyChange={onReadyChange}
    />,
  );
  const check = (count = 1) =>
    view.rerender(
      <StepsOrder
        data={data}
        onResult={onResult}
        checkRequested={count}
        onReadyChange={onReadyChange}
      />,
    );
  return { onResult, onReadyChange, check };
}

const tap = (name: string | RegExp) =>
  fireEvent.click(screen.getByRole("button", { name }));

describe("StepsOrder", () => {
  it("zeigt alle Karten gemischt im Pool und leere nummerierte Slots", () => {
    const { onReadyChange } = setup(threeSteps);

    expect(screen.getAllByTestId("pool-card")).toHaveLength(3);
    expect(screen.getAllByTestId("empty-slot")).toHaveLength(3);
    // Pool ist gemischt, aber alle Texte sind da.
    for (const text of ["Eins", "Zwei", "Drei"]) {
      expect(screen.getByRole("button", { name: text })).toBeTruthy();
    }
    // Der Pool liegt NIE schon in Lösungs-Reihenfolge da.
    const poolTexts = screen
      .getAllByTestId("pool-card")
      .map((el) => el.textContent);
    expect(poolTexts).not.toEqual(["Eins", "Zwei", "Drei"]);
    expect(onReadyChange).toHaveBeenLastCalledWith(false);
  });

  it("Karte antippen → nächster freier Slot; Slot antippen → zurück in den Pool", () => {
    setup(threeSteps);

    tap("Zwei");
    // "Zwei" sitzt jetzt im ersten Slot, Pool hat noch 2 Karten.
    const slot = screen.getByTestId("slot-card");
    expect(slot.getAttribute("aria-label")).toContain("Schritt 1: Zwei");
    expect(screen.getAllByTestId("pool-card")).toHaveLength(2);

    // Slot antippen → Karte zurück in den Pool.
    fireEvent.click(slot);
    expect(screen.queryByTestId("slot-card")).toBeNull();
    expect(screen.getAllByTestId("pool-card")).toHaveLength(3);
  });

  it("meldet ready erst, wenn alle Karten platziert sind", () => {
    const { onReadyChange } = setup(threeSteps);

    tap("Eins");
    tap("Zwei");
    expect(onReadyChange).toHaveBeenLastCalledWith(false);
    tap("Drei");
    expect(onReadyChange).toHaveBeenLastCalledWith(true);
  });

  it("richtige Reihenfolge → onResult(correct:true) und alle Slots grün", () => {
    const { onResult, check } = setup(threeSteps);

    tap("Eins");
    tap("Zwei");
    tap("Drei");
    check();

    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith({ correct: true });
    for (const slot of screen.getAllByTestId("slot-card")) {
      expect(slot.className).toContain("border-success");
    }
  });

  it("falsche Reihenfolge → correct:false; korrekt platzierte grün, falsche orange", () => {
    const { onResult, check } = setup(threeSteps);

    tap("Eins"); // Slot 1: richtig
    tap("Drei"); // Slot 2: falsch
    tap("Zwei"); // Slot 3: falsch
    check();

    expect(onResult).toHaveBeenCalledWith({ correct: false });
    const slots = screen.getAllByTestId("slot-card");
    expect(slots[0].className).toContain("border-success");
    expect(slots[1].className).toContain("border-warning");
    expect(slots[2].className).toContain("border-warning");
    // Fehler-Feedback ist orange, NIE rot.
    for (const slot of slots) {
      expect(slot.className).not.toMatch(/red/);
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

    // Pool-Karte und Slots sind deaktiviert, Antippen ändert nichts mehr.
    const pool = screen.getByTestId("pool-card");
    expect((pool as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(pool);
    expect(screen.getAllByTestId("slot-card")).toHaveLength(2);
  });

  it("words-Mode zeigt kompakte Chips statt voller Breite", () => {
    const wordsData: StepsOrderData = {
      prompt: "Baue den Satz.",
      mode: "words",
      steps: [{ text: "Good" }, { text: "morning" }, { text: "to" }, { text: "you" }],
    };
    setup(wordsData);

    const chip = screen.getAllByTestId("pool-card")[0];
    expect(chip.className).toContain("inline-flex");
    expect(chip.className).toContain("min-h-12");
    expect(chip.className).not.toContain("w-full");

    // Platzierte Wörter erscheinen als Chips im Antwortbereich.
    tap("Good");
    const placedChip = screen.getByTestId("slot-card");
    expect(placedChip.className).toContain("inline-flex");
    expect(placedChip.textContent).toBe("Good");
  });
});
