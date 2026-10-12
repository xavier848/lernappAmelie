import { describe, it, expect } from "vitest";
import { chatMerken, gemerkterChat, verlaufFuerServer, type ChatNachricht } from "./verlauf";
import { MAX_VERLAUF, ponySchema } from "./schemas";

const f = (content: string): ChatNachricht => ({ role: "user", content });
const a = (content: string, fehler = false): ChatNachricht => ({ role: "assistant", content, fehler });

describe("verlaufFuerServer", () => {
  it("laesst fehlgeschlagene Antworten samt Frage weg", () => {
    const verlauf = verlaufFuerServer([f("Eins"), a("Antwort eins"), f("Zwei"), a("Offline", true), f("Drei")]);
    expect(verlauf).toEqual([
      { role: "user", content: "Eins" },
      { role: "assistant", content: "Antwort eins" },
      { role: "user", content: "Drei" },
    ]);
  });

  it("schneidet alte Nachrichten ab und faengt mit einer Frage an", () => {
    const chat: ChatNachricht[] = [];
    for (let i = 0; i < 12; i++) chat.push(f(`Frage ${i}`), a(`Antwort ${i}`));
    chat.push(f("Neu"));
    const verlauf = verlaufFuerServer(chat);
    expect(verlauf.length).toBeLessThanOrEqual(MAX_VERLAUF);
    expect(verlauf[0].role).toBe("user");
    expect(verlauf[verlauf.length - 1]).toEqual({ role: "user", content: "Neu" });
    expect(ponySchema.safeParse({ lessonSlug: "x", messages: verlauf }).success).toBe(true);
  });

  it("macht aus unsauberen Daten einen gueltigen Verlauf", () => {
    const verlauf = verlaufFuerServer([a("Hallo"), f("Alt"), f("Neu"), a(""), f("Frage"), a("x".repeat(3000)), f("Ende")]);
    expect(verlauf[0]).toEqual({ role: "user", content: "Frage" });
    expect(verlauf[1].content).toHaveLength(2500);
    expect(ponySchema.safeParse({ lessonSlug: "x", messages: verlauf }).success).toBe(true);
  });
});

describe("chatMerken", () => {
  it("merkt sich den Chat nur fuer dieselbe Lektion", () => {
    chatMerken("lektion-a", [f("Hi"), a("Hallo")]);
    expect(gemerkterChat("lektion-a")).toHaveLength(2);
    expect(gemerkterChat("lektion-b")).toEqual([]);
  });
});
