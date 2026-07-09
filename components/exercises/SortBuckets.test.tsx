import { describe, it, expect, vi, beforeAll, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import type { SortBucketsData } from "@/lib/content-schema";
import { SortBuckets, SORT_FEEDBACK_MS } from "./SortBuckets";

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

afterEach(() => {
  vi.useRealTimers();
});

const data: SortBucketsData = {
  prompt: "Sortiere die Wäsche.",
  buckets: [
    { id: "b30", label: "30 Grad", icon: "🧺" },
    { id: "b60", label: "60 Grad", icon: "🔥" },
  ],
  items: [
    { text: "T-Shirt", bucket: "b30" },
    { text: "Handtuch", bucket: "b60" },
  ],
};

function makeProps() {
  return {
    data,
    onResult: vi.fn(),
    onReadyChange: vi.fn(),
    checkRequested: 0,
  };
}

describe("SortBuckets", () => {
  it("zeigt Koerbe, das aktuelle Item und den Fortschritt", () => {
    const props = makeProps();
    render(<SortBuckets {...props} />);
    expect(screen.getByRole("button", { name: /30 Grad/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /60 Grad/ })).toBeTruthy();
    expect(screen.getByText("T-Shirt")).toBeTruthy();
    expect(screen.getByText("Karte 1 von 2")).toBeTruthy();
    expect(props.onReadyChange).toHaveBeenLastCalledWith(false);
  });

  it("richtig sortiert: alle Items durch → ready, Prüfen → correct: true", () => {
    const props = makeProps();
    const { rerender } = render(<SortBuckets {...props} />);

    fireEvent.click(screen.getByRole("button", { name: /30 Grad/ })); // T-Shirt
    expect(screen.getByText("Handtuch")).toBeTruthy();
    expect(props.onReadyChange).toHaveBeenLastCalledWith(false);

    fireEvent.click(screen.getByRole("button", { name: /60 Grad/ })); // Handtuch
    expect(props.onReadyChange).toHaveBeenLastCalledWith(true);
    expect(screen.getByText(/Alles sortiert/)).toBeTruthy();

    rerender(<SortBuckets {...props} checkRequested={1} />);
    expect(props.onResult).toHaveBeenCalledTimes(1);
    expect(props.onResult).toHaveBeenCalledWith({ correct: true });
  });

  it("falsch sortiert: Fehler zaehlt, richtiger Korb pulsiert, Ergebnis correct: false", () => {
    vi.useFakeTimers();
    const props = makeProps();
    const { rerender } = render(<SortBuckets {...props} />);

    // T-Shirt (gehoert in 30 Grad) faelschlich in 60 Grad sortieren.
    fireEvent.click(screen.getByRole("button", { name: /60 Grad/ }));

    // Richtiger Korb pulsiert tuerkis, Item-Karte zeigt Warn-Zustand.
    const correctBucket = screen.getByRole("button", { name: /30 Grad/ });
    expect(correctBucket.className).toContain("animate-pulse");
    expect(correctBucket.className).toContain("border-primary");
    expect(screen.getByTestId("sort-item").className).toContain("border-warning");
    expect(screen.getByText(/Der richtige Korb leuchtet/)).toBeTruthy();

    // Waehrend der Rueckmeldung sind die Koerbe gesperrt.
    expect((correctBucket as HTMLButtonElement).disabled).toBe(true);

    act(() => {
      vi.advanceTimersByTime(SORT_FEEDBACK_MS + 50);
    });

    // Naechstes Item, Korb korrekt antippen.
    expect(screen.getByText("Handtuch")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /60 Grad/ }));
    expect(props.onReadyChange).toHaveBeenLastCalledWith(true);

    rerender(<SortBuckets {...props} checkRequested={1} />);
    expect(props.onResult).toHaveBeenCalledTimes(1);
    expect(props.onResult).toHaveBeenCalledWith({ correct: false });
  });

  it("feuert onResult genau einmal pro Prüf-Vorgang", () => {
    const props = makeProps();
    const { rerender } = render(<SortBuckets {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /30 Grad/ }));
    fireEvent.click(screen.getByRole("button", { name: /60 Grad/ }));

    rerender(<SortBuckets {...props} checkRequested={1} />);
    rerender(<SortBuckets {...props} checkRequested={1} />);
    expect(props.onResult).toHaveBeenCalledTimes(1);

    rerender(<SortBuckets {...props} checkRequested={2} />);
    expect(props.onResult).toHaveBeenCalledTimes(2);
  });
});
