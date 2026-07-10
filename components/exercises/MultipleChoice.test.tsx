import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MultipleChoice } from "./MultipleChoice";
import type { MultipleChoiceData } from "@/lib/content-schema";

const quiz: MultipleChoiceData = {
  prompt: "Was machst du, während der Reiniger einwirkt?",
  options: [
    { text: "Spiegel putzen", correct: true },
    { text: "Warten und nichts tun" },
    { text: "Neuen Reiniger kaufen" },
  ],
};

function setup(data: MultipleChoiceData = quiz) {
  const onResult = vi.fn();
  const onReadyChange = vi.fn();
  const view = render(
    <MultipleChoice
      data={data}
      onResult={onResult}
      checkRequested={0}
      onReadyChange={onReadyChange}
    />,
  );
  const check = (count = 1) =>
    view.rerender(
      <MultipleChoice
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

describe("MultipleChoice", () => {
  it("zeigt große Antwortkarten in voller Breite", () => {
    const { onReadyChange } = setup();

    const cards = screen.getAllByTestId("choice-card");
    expect(cards).toHaveLength(3);
    for (const card of cards) {
      expect(card.className).toContain("min-h-14");
      expect(card.className).toContain("w-full");
    }
    expect(onReadyChange).toHaveBeenLastCalledWith(false);
  });

  it("markiert die Auswahl mit türkisem Rand und meldet ready", () => {
    const { onReadyChange } = setup();

    tap("Spiegel putzen");
    const selected = screen.getByRole("button", { name: "Spiegel putzen" });
    expect(selected.getAttribute("aria-pressed")).toBe("true");
    expect(selected.className).toContain("border-primary");
    expect(onReadyChange).toHaveBeenLastCalledWith(true);
  });

  it("neue Auswahl ersetzt die alte", () => {
    setup();

    tap("Spiegel putzen");
    tap("Warten und nichts tun");

    expect(
      screen
        .getByRole("button", { name: "Spiegel putzen" })
        .getAttribute("aria-pressed"),
    ).toBe("false");
    expect(
      screen
        .getByRole("button", { name: "Warten und nichts tun" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("richtige Auswahl → onResult(correct:true), Karte grün", () => {
    const { onResult, check } = setup();

    tap("Spiegel putzen");
    check();

    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith({ correct: true });
    expect(
      screen.getByRole("button", { name: "Spiegel putzen" }).className,
    ).toContain("border-success");
  });

  it("falsche Auswahl → correct:false; gewählte orange, richtige grün", () => {
    const { onResult, check } = setup();

    tap("Warten und nichts tun");
    check();

    // Bei falscher Antwort wird zusaetzlich gemerkt, was angeklickt wurde.
    expect(onResult).toHaveBeenCalledWith({
      correct: false,
      given: "Warten und nichts tun",
    });
    const wrong = screen.getByRole("button", { name: "Warten und nichts tun" });
    const right = screen.getByRole("button", { name: "Spiegel putzen" });
    expect(wrong.className).toContain("border-warning");
    expect(right.className).toContain("border-success");
    // Fehler-Feedback ist orange, NIE rot.
    expect(wrong.className).not.toMatch(/red/);
  });

  it("feuert onResult genau einmal pro Prüf-Vorgang und sperrt danach", () => {
    const { onResult, check } = setup();

    tap("Spiegel putzen");
    check(1);
    check(1);
    expect(onResult).toHaveBeenCalledTimes(1);

    // Nach dem Prüfen sind alle Karten gesperrt.
    for (const card of screen.getAllByTestId("choice-card")) {
      expect((card as HTMLButtonElement).disabled).toBe(true);
    }
    tap("Neuen Reiniger kaufen");
    expect(
      screen
        .getByRole("button", { name: "Neuen Reiniger kaufen" })
        .getAttribute("aria-pressed"),
    ).toBe("false");
  });
});
