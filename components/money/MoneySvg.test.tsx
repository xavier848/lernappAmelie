import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  MONEY_VALUES,
  MoneySvg,
  moneyLabel,
  moneyValueFromKey,
} from "./MoneySvg";

describe("moneyLabel", () => {
  it("benennt Cent-Muenzen, Euro-Muenzen und Scheine", () => {
    expect(moneyLabel(1)).toBe("1 Cent");
    expect(moneyLabel(50)).toBe("50 Cent");
    expect(moneyLabel(100)).toBe("1 Euro");
    expect(moneyLabel(200)).toBe("2 Euro");
    expect(moneyLabel(500)).toBe("5 Euro Schein");
    expect(moneyLabel(5000)).toBe("50 Euro Schein");
  });
});

describe("moneyValueFromKey", () => {
  it("liest den Cent-Wert aus verschiedenen Key-Formaten", () => {
    expect(moneyValueFromKey("200")).toBe(200);
    expect(moneyValueFromKey("coin-200")).toBe(200);
    expect(moneyValueFromKey("note-500")).toBe(500);
  });

  it("liefert null fuer unbekannte Keys und Werte", () => {
    expect(moneyValueFromKey("abc")).toBeNull();
    expect(moneyValueFromKey("999")).toBeNull();
    expect(moneyValueFromKey("")).toBeNull();
  });
});

describe("MoneySvg", () => {
  it("rendert alle 12 Nennwerte als beschriftete Grafik", () => {
    for (const value of MONEY_VALUES) {
      const { unmount } = render(<MoneySvg value={value} />);
      expect(screen.getByRole("img", { name: moneyLabel(value) })).toBeTruthy();
      unmount();
    }
  });

  it("zeichnet Cent-Muenzen als Kupfer-Kreis mit Wert-Text", () => {
    const { container } = render(<MoneySvg value={5} />);
    expect(container.querySelector('circle[fill="#b87333"]')).toBeTruthy();
    expect(container.textContent).toContain("5");
    expect(container.textContent).toContain("Cent");
  });

  it("zeichnet 10/20/50 Cent als Gold-Kreis", () => {
    const { container } = render(<MoneySvg value={20} />);
    expect(container.querySelector('circle[fill="#d4a017"]')).toBeTruthy();
  });

  it("zeichnet 1 Euro silber aussen und gold innen", () => {
    const { container } = render(<MoneySvg value={100} />);
    expect(container.querySelector('circle[fill="#d1d5db"]')).toBeTruthy();
    expect(container.querySelector('circle[fill="#d4a017"]')).toBeTruthy();
    expect(container.textContent).toContain("1 €");
  });

  it("zeichnet Scheine als abgerundetes Rechteck in der richtigen Farbe", () => {
    const { container } = render(<MoneySvg value={1000} />);
    const rect = container.querySelector('rect[fill="#f87171"]');
    expect(rect).toBeTruthy();
    expect(rect?.getAttribute("rx")).toBe("12");
    expect(container.textContent).toContain("10 €");
  });

  it("rendert nichts fuer unbekannte Werte", () => {
    const { container } = render(<MoneySvg value={300} />);
    expect(container.firstChild).toBeNull();
  });
});
