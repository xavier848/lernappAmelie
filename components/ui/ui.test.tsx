import { describe, it, expect, vi, beforeAll, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "./Button";
import { Card } from "./Card";
import { ProgressBar } from "./ProgressBar";
import { FeedbackBanner } from "./FeedbackBanner";
import { TTSButton } from "./TTSButton";
import { Mascot } from "./Mascot";
import { Confetti } from "./Confetti";
import { AppHeader } from "./AppHeader";

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

describe("Button", () => {
  it("rendert Kinder und feuert onClick", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Prüfen</Button>);
    const button = screen.getByRole("button", { name: "Prüfen" });
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("feuert nicht, wenn disabled", () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Prüfen
      </Button>
    );
    fireEvent.click(screen.getByRole("button", { name: "Prüfen" }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("setzt Varianten- und Größen-Klassen", () => {
    render(
      <Button variant="secondary" size="lg" full>
        Weiter
      </Button>
    );
    const button = screen.getByRole("button", { name: "Weiter" });
    expect(button.className).toContain("border-primary");
    expect(button.className).toContain("min-h-14");
    expect(button.className).toContain("w-full");
  });

  it("hat Standard-Variante primary mit Duolingo-Stil", () => {
    render(<Button>Los</Button>);
    const button = screen.getByRole("button", { name: "Los" });
    expect(button.className).toContain("bg-primary");
    expect(button.className).toContain("rounded-2xl");
    expect(button.className).toContain("border-b-4");
    expect(button.className).toContain("min-h-12");
  });
});

describe("Card", () => {
  it("rendert Inhalt", () => {
    render(<Card>Karten-Inhalt</Card>);
    expect(screen.getByText("Karten-Inhalt")).toBeTruthy();
  });
});

describe("ProgressBar", () => {
  it("rendert mit korrekten ARIA-Werten", () => {
    render(<ProgressBar value={3} max={8} />);
    const bar = screen.getByRole("progressbar", { name: "Fortschritt" });
    expect(bar.getAttribute("aria-valuenow")).toBe("3");
    expect(bar.getAttribute("aria-valuemax")).toBe("8");
  });
});

describe("FeedbackBanner", () => {
  it("zeigt Richtig-Variante in Grün und feuert onContinue", () => {
    const onContinue = vi.fn();
    const { container } = render(
      <FeedbackBanner state="correct" onContinue={onContinue} />
    );
    expect(screen.getByText(/Richtig!/)).toBeTruthy();
    expect(container.querySelector(".bg-success-light")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Weiter" }));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("zeigt Fast-Variante in Orange mit Erklärung", () => {
    const { container } = render(
      <FeedbackBanner
        state="wrong"
        explanation="Erst trocken, dann nass putzen."
        onContinue={() => {}}
      />
    );
    expect(screen.getByText(/Fast! Schau nochmal\./)).toBeTruthy();
    expect(screen.getByText("Erst trocken, dann nass putzen.")).toBeTruthy();
    expect(container.querySelector(".bg-warning-light")).toBeTruthy();
    expect(container.querySelector(".bg-success-light")).toBeNull();
  });
});

describe("TTSButton", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete (window as unknown as { speechSynthesis?: unknown }).speechSynthesis;
  });

  it("versteckt sich, wenn keine Sprachausgabe verfügbar ist", () => {
    render(<TTSButton text="Hallo" />);
    expect(screen.queryByRole("button", { name: "Vorlesen" })).toBeNull();
  });

  it("liest bei Klick vor, wenn Sprachausgabe verfügbar ist", () => {
    const speakMock = vi.fn();
    const cancelMock = vi.fn();
    vi.stubGlobal(
      "SpeechSynthesisUtterance",
      class {
        text: string;
        lang = "";
        rate = 1;
        constructor(text: string) {
          this.text = text;
        }
      }
    );
    Object.defineProperty(window, "speechSynthesis", {
      value: { speak: speakMock, cancel: cancelMock },
      configurable: true,
    });

    render(<TTSButton text="Hallo Amelie" />);
    const button = screen.getByRole("button", { name: "Vorlesen" });
    fireEvent.click(button);

    expect(cancelMock).toHaveBeenCalled();
    expect(speakMock).toHaveBeenCalledTimes(1);
  });
});

describe("Mascot", () => {
  it("rendert Bild und Sprechblase", () => {
    render(<Mascot mood="cheer" message="Super, Amelie!" />);
    expect(screen.getByAltText(/Pony/)).toBeTruthy();
    expect(screen.getByText("Super, Amelie!")).toBeTruthy();
  });

  it("rendert ohne Nachricht keine Sprechblase", () => {
    render(<Mascot />);
    expect(screen.getByAltText(/Pony/)).toBeTruthy();
    expect(screen.queryByText("Super, Amelie!")).toBeNull();
  });
});

describe("Confetti", () => {
  it("rendert 40 Partikel ohne Pointer-Events", () => {
    render(<Confetti />);
    const root = screen.getByTestId("confetti");
    expect(root.childElementCount).toBe(40);
    expect(root.className).toContain("pointer-events-none");
  });
});

describe("AppHeader", () => {
  it("zeigt Streak, XP und Level-Chip", () => {
    render(<AppHeader streak={5} xp={250} />);
    expect(screen.getByLabelText("5 Tage Serie")).toBeTruthy();
    expect(screen.getByLabelText("250 Punkte")).toBeTruthy();
    // 250 XP: Level 1→2 kostet 100, Level 2→3 kostet 200 → Level 2
    expect(screen.getByText("Level 2")).toBeTruthy();
  });
});
