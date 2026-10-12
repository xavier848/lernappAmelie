import { describe, it, expect, vi, afterEach } from "vitest";
import { kiAnfrage, ohneMarkdown } from "./client";
import { FEHLER_TEXT, LIMIT_TEXT, OFFLINE_TEXT } from "./texte";

/** Antwort, die in mehreren Stuecken ankommt (wie der echte Stream). */
function streamAntwort(stuecke: string[], status = 200): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const s of stuecke) controller.enqueue(encoder.encode(s));
      controller.close();
    },
  });
  return new Response(body, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

afterEach(() => vi.unstubAllGlobals());

describe("kiAnfrage", () => {
  it("meldet den Text Stueck fuer Stueck und am Ende komplett", async () => {
    const fetchMock = vi.fn().mockResolvedValue(streamAntwort(["Seife ", "hilft. 🧼"]));
    vi.stubGlobal("fetch", fetchMock);
    const zwischen: string[] = [];
    const ergebnis = await kiAnfrage("/api/ki/pony", { a: 1 }, (t) => zwischen.push(t));
    expect(ergebnis).toEqual({ text: "Seife hilft. 🧼", ok: true });
    expect(zwischen).toContain("Seife ");
    expect(zwischen[zwischen.length - 1]).toBe("Seife hilft. 🧼");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/ki/pony");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ a: 1 });
  });

  it("setzt Emojis ueber Stueck-Grenzen richtig zusammen", async () => {
    const bytes = new TextEncoder().encode("Pony 🐴");
    const body = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(bytes.slice(0, 6));
        c.enqueue(bytes.slice(6));
        c.close();
      },
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body)));
    expect((await kiAnfrage("/x", {}, () => {})).text).toBe("Pony 🐴");
  });

  it("markiert Limit- und Abbruch-Saetze als Fehler", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(streamAntwort([LIMIT_TEXT], 429)));
    expect(await kiAnfrage("/x", {}, () => {})).toEqual({ text: LIMIT_TEXT, ok: false });

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(streamAntwort(["Halb ", FEHLER_TEXT])));
    expect((await kiAnfrage("/x", {}, () => {})).ok).toBe(false);
  });

  it("sagt ohne Internet freundlich Bescheid", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    const zwischen: string[] = [];
    expect(await kiAnfrage("/x", {}, (t) => zwischen.push(t))).toEqual({ text: OFFLINE_TEXT, ok: false });
    expect(zwischen).toEqual([OFFLINE_TEXT]);
  });

  it("wirft beim Abbrechen, damit niemand mehr in den Zustand schreibt", async () => {
    const ctrl = new AbortController();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() => {
        ctrl.abort();
        return Promise.reject(new DOMException("aborted", "AbortError"));
      }),
    );
    const onText = vi.fn();
    await expect(kiAnfrage("/x", {}, onText, ctrl.signal)).rejects.toThrow();
    expect(onText).not.toHaveBeenCalled();
  });
});

describe("ohneMarkdown", () => {
  it("entfernt Fett, Ueberschriften und Sternchen-Listen", () => {
    expect(ohneMarkdown("## Tipp\n**Wichtig:** immer __kalt__ lagern.\n* Milch\n* Käse")).toBe(
      "Tipp\nWichtig: immer kalt lagern.\n- Milch\n- Käse",
    );
  });

  it("entfernt *kursiv*", () => {
    expect(ohneMarkdown("Das ist *sehr* wichtig.")).toBe("Das ist sehr wichtig.");
  });

  it("laesst normalen Text in Ruhe", () => {
    const text = "Rechne 3 * 4 = 12 oder 3*4*5.\n- Erst waschen\n- Dann trocknen";
    expect(ohneMarkdown(text)).toBe(text);
  });
});

describe("kiStatus", () => {
  it("fragt nur einmal und merkt sich die Antwort", async () => {
    vi.resetModules();
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ aktiv: true }));
    vi.stubGlobal("fetch", fetchMock);
    const { kiStatus } = await import("./client");
    expect(await kiStatus()).toBe(true);
    expect(await kiStatus()).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("fragt nach einem Netzfehler beim naechsten Mal neu", async () => {
    vi.resetModules();
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("offline"))
      .mockResolvedValue(Response.json({ aktiv: false }));
    vi.stubGlobal("fetch", fetchMock);
    const { kiStatus } = await import("./client");
    expect(await kiStatus()).toBe(false);
    expect(await kiStatus()).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
