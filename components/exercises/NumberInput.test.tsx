import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NumberInput } from "./NumberInput";
import type { NumberInputData } from "@/lib/content-schema";

const aufgabe: NumberInputData = {
  prompt: "Rechne im Kopf: 34 + 3 + 7 + 8 = ?",
  answer: 52,
  hint: "Rechne Schritt für Schritt:\n34 + 3 = 37\n37 + 7 = 44\n44 + 8 = ?",
};

function setup(data: NumberInputData = aufgabe, attempt = 0) {
  const onResult = vi.fn();
  const onReadyChange = vi.fn();
  const view = render(
    <NumberInput
      data={data}
      onResult={onResult}
      checkRequested={0}
      onReadyChange={onReadyChange}
      attempt={attempt}
    />,
  );
  const check = (count = 1) =>
    view.rerender(
      <NumberInput
        data={data}
        onResult={onResult}
        checkRequested={count}
        onReadyChange={onReadyChange}
        attempt={attempt}
      />,
    );
  return { onResult, onReadyChange, check };
}

const tap = (name: string | RegExp) =>
  fireEvent.click(screen.getByRole("button", { name }));

describe("NumberInput (Kopfrechnen mit Eingabe)", () => {
  it("meldet ready erst nach der ersten Ziffer", () => {
    const { onReadyChange } = setup();
    expect(onReadyChange).toHaveBeenLastCalledWith(false);
    tap("5");
    expect(onReadyChange).toHaveBeenLastCalledWith(true);
  });

  it("richtige Eingabe → correct: true", () => {
    const { onResult, check } = setup();
    tap("5");
    tap("2");
    check();
    expect(onResult).toHaveBeenCalledWith({ correct: true, given: undefined });
  });

  it("falsche Eingabe → correct: false mit given", () => {
    const { onResult, check } = setup();
    tap("5");
    tap("1");
    check();
    expect(onResult).toHaveBeenCalledWith({ correct: false, given: "51" });
  });

  it("⌫ löscht die letzte Ziffer", () => {
    const { onResult, check } = setup();
    tap("5");
    tap("1");
    tap("Letzte Ziffer löschen");
    tap("2");
    check();
    expect(onResult).toHaveBeenCalledWith({ correct: true, given: undefined });
  });

  it("Tipp erscheint erst ab dem zweiten Anlauf", () => {
    setup(aufgabe, 0);
    expect(screen.queryByText(/Tipp:/)).toBeNull();
  });

  it("Tipp sichtbar bei attempt >= 1", () => {
    setup(aufgabe, 1);
    expect(screen.getByText(/Tipp:/)).not.toBeNull();
    expect(screen.getByText(/34 \+ 3 = 37/)).not.toBeNull();
  });
});
