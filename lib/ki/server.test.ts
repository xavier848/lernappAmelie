// @vitest-environment node
// kiStreamAntwort + Limits mit nachgebautem Anthropic-SDK und Supabase -
// es geht keine echte Anfrage raus.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ABLEHNUNG_TEXT, FEHLER_TEXT, LIMIT_TEXT, ZU_SCHNELL_TEXT } from "./texte";

const h = vi.hoisted(() => {
  class APIError extends Error {
    status?: number;
  }
  class APIUserAbortError extends APIError {}
  class AuthenticationError extends APIError {}
  class RateLimitError extends APIError {}

  type Ende = { message: Record<string, unknown> } | { fehler: Error };
  const zustand = {
    aufrufe: [] as Record<string, unknown>[],
    texte: [] as string[],
    ende: { message: {} } as Ende,
    abgebrochen: 0,
    eintraege: [] as Record<string, unknown>[],
    heuteInDb: 0 as number | null,
  };

  class Anthropic {
    static APIError = APIError;
    static APIUserAbortError = APIUserAbortError;
    static AuthenticationError = AuthenticationError;
    static RateLimitError = RateLimitError;
    beta = {
      messages: {
        stream: (params: Record<string, unknown>) => {
          zustand.aufrufe.push(params);
          const hoerer: ((t: string) => void)[] = [];
          return {
            on(art: string, cb: (t: string) => void) {
              if (art === "text") hoerer.push(cb);
              return this;
            },
            async finalMessage() {
              await Promise.resolve();
              for (const t of zustand.texte) hoerer.forEach((cb) => cb(t));
              if ("fehler" in zustand.ende) throw zustand.ende.fehler;
              return zustand.ende.message;
            },
            abort() {
              zustand.abgebrochen += 1;
            },
          };
        },
      },
    };
  }

  const db = {
    from: () => ({
      insert: async (zeile: Record<string, unknown>) => {
        zustand.eintraege.push(zeile);
        return { error: null };
      },
      select: () => ({
        gte: async () =>
          zustand.heuteInDb === null
            ? { count: null, error: { message: "keine Tabelle" } }
            : { count: zustand.heuteInDb, error: null },
      }),
    }),
  };

  return { zustand, Anthropic, RateLimitError, db };
});

vi.mock("@anthropic-ai/sdk", () => ({ default: h.Anthropic }));
vi.mock("@/lib/supabase", () => ({ supabaseService: () => h.db }));

const system = [
  { type: "text" as const, text: "Regeln" },
  { type: "text" as const, text: "Lektion", cache_control: { type: "ephemeral" as const } },
];
const anfrage = {
  art: "pony" as const,
  lessonSlug: "hygiene-haende",
  system,
  messages: [{ role: "user" as const, content: "Warum Seife?" }],
  maxTokens: 3000,
};
const fertig = {
  model: "claude-opus-5-5",
  stop_reason: "end_turn",
  usage: {
    input_tokens: 20,
    output_tokens: 80,
    cache_read_input_tokens: 1500,
    cache_creation_input_tokens: 0,
  },
};

async function server() {
  vi.resetModules();
  return import("./server");
}

beforeEach(() => {
  Object.assign(h.zustand, {
    aufrufe: [],
    texte: [],
    ende: { message: fertig },
    abgebrochen: 0,
    eintraege: [],
    heuteInDb: 0,
  });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  delete process.env.KI_MODELL;
  delete process.env.KI_TAGESLIMIT;
  vi.restoreAllMocks();
});

describe("kiStreamAntwort", () => {
  it("streamt nur den Antwort-Text und protokolliert den Verbrauch", async () => {
    h.zustand.texte = ["Seife löst ", "den Schmutz."];
    const { kiStreamAntwort } = await server();
    const res = kiStreamAntwort(anfrage);
    expect(res.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");
    expect(await res.text()).toBe("Seife löst den Schmutz.");
    expect(h.zustand.eintraege).toEqual([
      {
        art: "pony",
        lesson_slug: "hygiene-haende",
        model: "claude-opus-5-5",
        input_tokens: 20,
        output_tokens: 80,
        cache_read_tokens: 1500,
        cache_write_tokens: 0,
        ok: true,
      },
    ]);
  });

  it("schickt die Anfrage mit effort low, Cache-Bloecken und Ersatzmodell", async () => {
    const { kiStreamAntwort } = await server();
    await kiStreamAntwort(anfrage).text();
    const params = h.zustand.aufrufe[0];
    expect(params.model).toBe("claude-opus-5-5");
    expect(params.max_tokens).toBe(3000);
    expect(params.output_config).toEqual({ effort: "low" });
    expect(params.system).toBe(system);
    expect(params.betas).toEqual(["server-side-fallback-2026-07-01"]);
    expect(params.fallbacks).toBe("default");
    expect(params).not.toHaveProperty("thinking");
    expect(params).not.toHaveProperty("temperature");
  });

  it("laesst den Ersatz weg, wenn das Modell ihn nicht kennt", async () => {
    process.env.KI_MODELL = "claude-haiku-5-5";
    const { kiStreamAntwort } = await server();
    await kiStreamAntwort(anfrage).text();
    const params = h.zustand.aufrufe[0];
    expect(params.model).toBe("claude-haiku-5-5");
    expect(params).not.toHaveProperty("betas");
    expect(params).not.toHaveProperty("fallbacks");
  });

  it("haengt bei einer Ablehnung einen freundlichen Satz an", async () => {
    h.zustand.ende = { message: { ...fertig, stop_reason: "refusal" } };
    const { kiStreamAntwort } = await server();
    expect(await kiStreamAntwort(anfrage).text()).toBe(`\n\n${ABLEHNUNG_TEXT}`);
    expect(h.zustand.eintraege[0].ok).toBe(false);
  });

  it("zeigt bei API-Fehlern den Pony-Satz statt einer leeren Blase", async () => {
    h.zustand.texte = ["Seife "];
    h.zustand.ende = { fehler: new h.RateLimitError("zu viel") };
    const { kiStreamAntwort } = await server();
    expect(await kiStreamAntwort(anfrage).text()).toBe(`Seife ${FEHLER_TEXT}`);
    expect(h.zustand.eintraege[0]).toMatchObject({ ok: false, input_tokens: 0 });
  });

  it("bricht die Anfrage ab, wenn der Browser nicht mehr zuhoert", async () => {
    const { kiStreamAntwort } = await server();
    await kiStreamAntwort(anfrage).body!.cancel();
    expect(h.zustand.abgebrochen).toBe(1);
  });
});

describe("limitPruefen", () => {
  it("laesst Anfragen bis zum Tageslimit durch", async () => {
    process.env.KI_TAGESLIMIT = "5";
    h.zustand.heuteInDb = 4;
    const { limitPruefen } = await server();
    expect(await limitPruefen()).toBeNull();
    h.zustand.heuteInDb = 5;
    expect(await limitPruefen()).toBe(LIMIT_TEXT);
  });

  it("zaehlt ohne Datenbank im Speicher mit", async () => {
    process.env.KI_TAGESLIMIT = "3";
    h.zustand.heuteInDb = null;
    const { limitPruefen } = await server();
    expect(await limitPruefen()).toBeNull();
    expect(await limitPruefen()).toBeNull();
    expect(await limitPruefen()).toBeNull();
    expect(await limitPruefen()).toBe(LIMIT_TEXT);
  });

  it("bremst mehr als 12 Anfragen pro Minute", async () => {
    const { limitPruefen } = await server();
    for (let i = 0; i < 12; i++) expect(await limitPruefen()).toBeNull();
    expect(await limitPruefen()).toBe(ZU_SCHNELL_TEXT);
  });
});
