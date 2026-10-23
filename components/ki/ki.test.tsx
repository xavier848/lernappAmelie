// "Pony, erklär's mir" und "Frag das Pony" im Browser: echte Komponenten,
// nachgebautes fetch. Ob die KI eingerichtet ist, steuert der Test direkt.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { FeedbackBanner } from "@/components/ui/FeedbackBanner";
import { ResultScreen } from "@/components/player/ResultScreen";
import { LIMIT_TEXT } from "@/lib/ki/texte";
import { PonyErklaert } from "./PonyErklaert";
import { PonyChatKnopf } from "./PonyChat";

const h = vi.hoisted(() => ({ aktiv: true }));
vi.mock("@/lib/ki/client", async (original) => ({
  ...(await original<typeof import("@/lib/ki/client")>()),
  useKiAktiv: () => h.aktiv,
}));

const exerciseId = "6f1c2a7e-3b4d-4e5f-8a9b-0c1d2e3f4a5b";

function antwort(text: string, status = 200): Response {
  return new Response(text, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  h.aktiv = true;
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function body(aufruf: number) {
  return JSON.parse(fetchMock.mock.calls[aufruf][1].body as string);
}

describe("PonyErklaert", () => {
  it("erklaert nach einem Tipp und schickt Uebung + Antwort mit", async () => {
    fetchMock.mockResolvedValue(antwort("**Fast!** Händewaschen dauert 30 Sekunden."));
    render(<PonyErklaert exerciseId={exerciseId} given="10" nochmal />);
    fireEvent.click(screen.getByRole("button", { name: /Pony, erklär’s mir/ }));
    expect(await screen.findByText("Fast! Händewaschen dauert 30 Sekunden.")).toBeTruthy();
    expect(fetchMock.mock.calls[0][0]).toBe("/api/ki/erklaeren");
    expect(body(0)).toEqual({ exerciseId, given: "10", nochmal: true });
    expect(screen.queryByRole("button", { name: /erklär’s mir/ })).toBeNull();
    expect(screen.queryByRole("button", { name: "Vorlesen" })).toBeNull();
  });

  it("kuerzt sehr lange Antworten, damit die Anfrage gueltig bleibt", async () => {
    fetchMock.mockResolvedValue(antwort("Okay."));
    render(<PonyErklaert exerciseId={exerciseId} given={"x".repeat(500)} nochmal={false} />);
    fireEvent.click(screen.getByRole("button", { name: /erklär’s mir/ }));
    await screen.findByText("Okay.");
    expect(body(0).given).toHaveLength(300);
  });

  it("ist unsichtbar, wenn die KI-Hilfe nicht eingerichtet ist", () => {
    h.aktiv = false;
    const { container } = render(<PonyErklaert exerciseId={exerciseId} nochmal={false} />);
    expect(container.innerHTML).toBe("");
  });
});

describe("FeedbackBanner mit KI-Hilfe", () => {
  it("zeigt den Pony-Knopf nur bei falscher Antwort", () => {
    const ki = { exerciseId, nochmal: false };
    const { rerender } = render(
      <FeedbackBanner state="correct" onContinue={() => {}} kiErklaerung={ki} />,
    );
    expect(screen.queryByRole("button", { name: /erklär’s mir/ })).toBeNull();
    rerender(<FeedbackBanner state="wrong" onContinue={() => {}} kiErklaerung={ki} />);
    expect(screen.getByRole("button", { name: /erklär’s mir/ })).toBeTruthy();
  });
});

describe("FeedbackBanner: Pony erklaert", () => {
  it("ersetzt die App-Erklaerung durch die Sprechblase vom Pony", async () => {
    fetchMock.mockResolvedValue(antwort("Schau auf den Rand der Form."));
    render(
      <FeedbackBanner
        state="wrong"
        explanation="Erklaerung aus der App."
        onContinue={() => {}}
        kiErklaerung={{ exerciseId, nochmal: true }}
      />,
    );
    expect(screen.getByText("Erklaerung aus der App.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /erklär’s mir/ }));
    expect(await screen.findByText("Schau auf den Rand der Form.")).toBeTruthy();
    expect(screen.queryByText("Erklaerung aus der App.")).toBeNull();
    expect(screen.queryByRole("button", { name: /erklär’s mir/ })).toBeNull();
    expect(body(0)).toEqual({ exerciseId, nochmal: true });
  });
});

describe("Frag das Pony", () => {
  it("oeffnet den Chat, schickt Vorschlaege und den Verlauf", async () => {
    fetchMock
      .mockResolvedValueOnce(antwort("Wie lange wäschst du deine Hände?"))
      .mockResolvedValueOnce(antwort("Richtig! 30 Sekunden."));
    render(<PonyChatKnopf lessonSlug="hygiene-haende" lessonTitle="Hände waschen" />);
    fireEvent.click(screen.getByRole("button", { name: /Frag das Pony/ }));
    expect(screen.getByRole("dialog", { name: "Frag das Pony" })).toBeTruthy();
    expect(screen.getByText("Hände waschen")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Frag mich ab!" }));
    expect(await screen.findByText("Wie lange wäschst du deine Hände?")).toBeTruthy();
    expect(fetchMock.mock.calls[0][0]).toBe("/api/ki/pony");
    expect(body(0)).toEqual({
      lessonSlug: "hygiene-haende",
      messages: [{ role: "user", content: "Frag mich ab!" }],
    });

    const feld = screen.getByLabelText("Deine Frage an das Pony");
    fireEvent.change(feld, { target: { value: "30 Sekunden" } });
    fireEvent.keyDown(feld, { key: "Enter" });
    expect(await screen.findByText("Richtig! 30 Sekunden.")).toBeTruthy();
    expect(body(1).messages).toEqual([
      { role: "user", content: "Frag mich ab!" },
      { role: "assistant", content: "Wie lange wäschst du deine Hände?" },
      { role: "user", content: "30 Sekunden" },
    ]);
    // Reiner Text-Chat: kein Vorlesen, kein Mikrofon.
    expect(screen.queryByRole("button", { name: /Vorlesen|sprechen|Zuhören/ })).toBeNull();
  });

  it("schickt Fehler-Antworten nicht als Verlauf zurueck", async () => {
    fetchMock
      .mockResolvedValueOnce(antwort(LIMIT_TEXT, 429))
      .mockResolvedValueOnce(antwort("Gern!"));
    render(<PonyChatKnopf lessonSlug="lektion-fehler" />);
    fireEvent.click(screen.getByRole("button", { name: /Frag das Pony/ }));
    fireEvent.click(screen.getByRole("button", { name: "Gib mir ein Beispiel." }));
    expect(await screen.findByText(LIMIT_TEXT)).toBeTruthy();

    const feld = screen.getByLabelText("Deine Frage an das Pony");
    fireEvent.change(feld, { target: { value: "Nochmal bitte" } });
    fireEvent.click(screen.getByRole("button", { name: "Frage abschicken" }));
    await screen.findByText("Gern!");
    expect(body(1).messages).toEqual([{ role: "user", content: "Nochmal bitte" }]);
  });

  it("schliesst mit dem X und bricht eine laufende Antwort ab", async () => {
    let signal: AbortSignal | undefined;
    fetchMock.mockImplementation((_url: string, init: RequestInit) => {
      signal = init.signal ?? undefined;
      return new Promise(() => {});
    });
    render(<PonyChatKnopf lessonSlug="lektion-abbruch" />);
    fireEvent.click(screen.getByRole("button", { name: /Frag das Pony/ }));
    fireEvent.click(screen.getByRole("button", { name: "Was ist das Wichtigste?" }));
    expect(await screen.findByText("Das Pony denkt nach …")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Chat schließen" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    await waitFor(() => expect(signal?.aborted).toBe(true));
  });

  it("zeigt keinen Knopf ohne KI-Hilfe", () => {
    h.aktiv = false;
    render(<PonyChatKnopf lessonSlug="hygiene-haende" />);
    expect(screen.queryByRole("button", { name: /Frag das Pony/ })).toBeNull();
  });
});

describe("ResultScreen mit Pony", () => {
  it("zeigt den Chat-Knopf ueber \"Weiter lernen\"", () => {
    render(
      <ResultScreen
        xp={30}
        stars={3}
        onContinue={() => {}}
        extra={<PonyChatKnopf lessonSlug="hygiene-haende" />}
      />,
    );
    const knoepfe = screen.getAllByRole("button").map((b) => b.textContent);
    expect(knoepfe).toContain("🐴 Frag das Pony");
    expect(knoepfe.indexOf("🐴 Frag das Pony")).toBeLessThan(knoepfe.indexOf("Weiter lernen"));
  });
});
