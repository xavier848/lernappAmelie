import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { MoneyCountData } from "@/lib/content-schema";
import { formatEuro } from "@/lib/money";
import { MoneyCount } from "./MoneyCount";

// formatEuro nutzt geschütztes Leerzeichen vor dem € – Testing Library
// normalisiert Node-Text zu normalen Leerzeichen, der String-Matcher aber nicht.
function euroText(cents: number) {
  return formatEuro(cents).replace(/\s/g, " ");
}

function makeProps(data: MoneyCountData) {
  return {
    data,
    onResult: vi.fn(),
    onReadyChange: vi.fn(),
    checkRequested: 0,
  };
}

describe("MoneyCount recognize", () => {
  const data: MoneyCountData = {
    mode: "recognize",
    prompt: "Welches Geld ist das?",
    moneyImage: "200",
    options: [{ text: "2 Euro", correct: true }, { text: "1 Euro" }],
  };

  it("zeigt die Geld-Grafik gross ueber den Optionen", () => {
    const props = makeProps(data);
    render(<MoneyCount {...props} />);
    expect(screen.getByRole("img", { name: "2 Euro" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "2 Euro" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "1 Euro" })).toBeTruthy();
    expect(props.onReadyChange).toHaveBeenLastCalledWith(false);
  });

  it("Auswahl macht ready, richtige Antwort → correct: true", () => {
    const props = makeProps(data);
    const { rerender } = render(<MoneyCount {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "2 Euro" }));
    expect(props.onReadyChange).toHaveBeenLastCalledWith(true);

    rerender(<MoneyCount {...props} checkRequested={1} />);
    expect(props.onResult).toHaveBeenCalledTimes(1);
    expect(props.onResult).toHaveBeenCalledWith({ correct: true });
  });

  it("falsche Antwort → correct: false und Warn-Markierung (orange, nie rot)", () => {
    const props = makeProps(data);
    const { rerender } = render(<MoneyCount {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "1 Euro" }));
    rerender(<MoneyCount {...props} checkRequested={1} />);
    expect(props.onResult).toHaveBeenCalledWith({ correct: false });
    expect(
      screen.getByRole("button", { name: "1 Euro" }).className,
    ).toContain("border-warning");
    expect(
      screen.getByRole("button", { name: "2 Euro" }).className,
    ).toContain("border-success");
  });
});

describe("MoneyCount assemble", () => {
  const data: MoneyCountData = {
    mode: "assemble",
    prompt: "Lege den Betrag.",
    target: 280,
  };

  it("zeigt Ziel, Palette mit allen 12 Nennwerten und Live-Summe", () => {
    const props = makeProps(data);
    render(<MoneyCount {...props} />);
    expect(screen.getByText(euroText(280))).toBeTruthy();
    expect(screen.getByRole("button", { name: "1 Cent legen" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "50 Euro Schein legen" })).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /legen$/ })).toHaveLength(12);
    expect(screen.getByTestId("money-sum").textContent).toBe(formatEuro(0));
    expect(props.onReadyChange).toHaveBeenLastCalledWith(false);
  });

  it("Geld legen erhoeht die Summe, exakter Betrag → correct: true", () => {
    const props = makeProps(data);
    const { rerender } = render(<MoneyCount {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "2 Euro legen" }));
    fireEvent.click(screen.getByRole("button", { name: "50 Cent legen" }));
    fireEvent.click(screen.getByRole("button", { name: "20 Cent legen" }));
    fireEvent.click(screen.getByRole("button", { name: "10 Cent legen" }));

    expect(screen.getByTestId("money-sum").textContent).toBe(formatEuro(280));
    expect(props.onReadyChange).toHaveBeenLastCalledWith(true);

    rerender(<MoneyCount {...props} checkRequested={1} />);
    expect(props.onResult).toHaveBeenCalledTimes(1);
    expect(props.onResult).toHaveBeenCalledWith({ correct: true });
  });

  it("Antippen in der Hand entfernt das Geld wieder", () => {
    const props = makeProps(data);
    const { rerender } = render(<MoneyCount {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "2 Euro legen" }));
    fireEvent.click(screen.getByRole("button", { name: "1 Euro legen" }));
    expect(screen.getByTestId("money-sum").textContent).toBe(formatEuro(300));

    fireEvent.click(screen.getByRole("button", { name: "1 Euro entfernen" }));
    expect(screen.getByTestId("money-sum").textContent).toBe(formatEuro(200));

    fireEvent.click(screen.getByRole("button", { name: "2 Euro entfernen" }));
    expect(screen.getByTestId("money-sum").textContent).toBe(formatEuro(0));
    expect(props.onReadyChange).toHaveBeenLastCalledWith(false);

    fireEvent.click(screen.getByRole("button", { name: "2 Euro legen" }));
    rerender(<MoneyCount {...props} checkRequested={1} />);
    expect(props.onResult).toHaveBeenCalledWith({ correct: false });
  });
});

describe("MoneyCount change", () => {
  const data: MoneyCountData = {
    mode: "change",
    prompt: "Lege das Rückgeld.",
    price: 350,
    given: 500,
  };

  it("zeigt Preis und Gegeben mit formatEuro", () => {
    const props = makeProps(data);
    render(<MoneyCount {...props} />);
    expect(screen.getByText(euroText(350))).toBeTruthy();
    expect(screen.getByText(euroText(500))).toBeTruthy();
  });

  it("correct, wenn die Summe genau dem Rueckgeld entspricht", () => {
    const props = makeProps(data);
    const { rerender } = render(<MoneyCount {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "1 Euro legen" }));
    fireEvent.click(screen.getByRole("button", { name: "50 Cent legen" }));
    expect(screen.getByTestId("money-sum").textContent).toBe(formatEuro(150));

    rerender(<MoneyCount {...props} checkRequested={1} />);
    expect(props.onResult).toHaveBeenCalledWith({ correct: true });
  });

  it("falscher Betrag → correct: false", () => {
    const props = makeProps(data);
    const { rerender } = render(<MoneyCount {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "2 Euro legen" }));
    rerender(<MoneyCount {...props} checkRequested={1} />);
    expect(props.onResult).toHaveBeenCalledWith({ correct: false });
  });
});
