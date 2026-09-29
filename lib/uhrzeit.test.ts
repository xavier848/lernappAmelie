import { describe, it, expect } from "vitest";
import {
  parseUhrzeit,
  uhrzeitTasteErlaubt,
  uhrzeitVollstaendig,
} from "./uhrzeit";

describe("parseUhrzeit", () => {
  it("liest Uhrzeiten mit Doppelpunkt", () => {
    expect(parseUhrzeit("8:39")).toBe(839);
    expect(parseUhrzeit("08:39")).toBe(839);
    expect(parseUhrzeit("15:41")).toBe(1541);
    expect(parseUhrzeit("0:05")).toBe(5);
  });

  it("liest Uhrzeiten ohne Doppelpunkt (letzte zwei Ziffern = Minuten)", () => {
    expect(parseUhrzeit("839")).toBe(839);
    expect(parseUhrzeit("1541")).toBe(1541);
  });

  it("lehnt ungueltige Eingaben ab", () => {
    expect(parseUhrzeit("")).toBeNull();
    expect(parseUhrzeit("8")).toBeNull();
    expect(parseUhrzeit("8:3")).toBeNull();
    expect(parseUhrzeit("8:75")).toBeNull();
    expect(parseUhrzeit("24:00")).toBeNull();
    expect(parseUhrzeit("875")).toBeNull();
  });
});

describe("uhrzeitTasteErlaubt", () => {
  it("Doppelpunkt nur nach 1-2 Ziffern und nur einmal", () => {
    expect(uhrzeitTasteErlaubt("", ":")).toBe(false);
    expect(uhrzeitTasteErlaubt("8", ":")).toBe(true);
    expect(uhrzeitTasteErlaubt("15", ":")).toBe(true);
    expect(uhrzeitTasteErlaubt("154", ":")).toBe(false);
    expect(uhrzeitTasteErlaubt("8:", ":")).toBe(false);
  });

  it("nach dem Doppelpunkt hoechstens 2 Ziffern", () => {
    expect(uhrzeitTasteErlaubt("8:", "3")).toBe(true);
    expect(uhrzeitTasteErlaubt("8:3", "9")).toBe(true);
    expect(uhrzeitTasteErlaubt("8:39", "1")).toBe(false);
  });

  it("ohne Doppelpunkt hoechstens 4 Ziffern", () => {
    expect(uhrzeitTasteErlaubt("154", "1")).toBe(true);
    expect(uhrzeitTasteErlaubt("1541", "1")).toBe(false);
  });
});

describe("uhrzeitVollstaendig", () => {
  it("erst mit Minuten fertig", () => {
    expect(uhrzeitVollstaendig("8")).toBe(false);
    expect(uhrzeitVollstaendig("8:")).toBe(false);
    expect(uhrzeitVollstaendig("8:3")).toBe(false);
    expect(uhrzeitVollstaendig("8:39")).toBe(true);
    expect(uhrzeitVollstaendig("839")).toBe(true);
    expect(uhrzeitVollstaendig("1541")).toBe(true);
  });
});
