import { describe, expect, it } from "vitest";
import {
  advanceQueue,
  createQueue,
  currentExerciseIndex,
  retriedExerciseCount,
  type QueueState,
} from "./queue";

const three = ["a", "b", "c"];

describe("createQueue", () => {
  it("startet mit allen Uebungen in Original-Reihenfolge", () => {
    const state = createQueue(three);
    expect(state.total).toBe(3);
    expect(state.queue).toEqual([0, 1, 2]);
    expect(state.solvedCount).toBe(0);
    expect(state.retried).toEqual([0, 0, 0]);
    expect(state.attemptFails).toEqual([0, 0, 0]);
    expect(state.firstTry).toEqual([false, false, false]);
  });

  it("kommt mit leerer Liste klar", () => {
    const state = createQueue([]);
    expect(state.total).toBe(0);
    expect(state.queue).toEqual([]);
    expect(currentExerciseIndex(state)).toBeNull();
  });
});

describe("currentExerciseIndex", () => {
  it("zeigt auf die vorderste Uebung", () => {
    expect(currentExerciseIndex(createQueue(three))).toBe(0);
  });
});

describe("advanceQueue", () => {
  it("richtig: Uebung verlaesst die Queue, solvedCount steigt, firstTry = true", () => {
    const { state, done, outcome } = advanceQueue(createQueue(three), true);
    expect(state.queue).toEqual([1, 2]);
    expect(state.solvedCount).toBe(1);
    expect(state.firstTry[0]).toBe(true);
    expect(done).toBe(false);
    expect(outcome).toBe("solved");
  });

  it("ERSTER Fehler: Uebung bleibt vorne fuer sofortigen zweiten Versuch (retry)", () => {
    const { state, done, outcome } = advanceQueue(createQueue(three), false);
    expect(outcome).toBe("retry");
    expect(state.queue).toEqual([0, 1, 2]); // bleibt vorne!
    expect(state.retried).toEqual([1, 0, 0]);
    expect(state.attemptFails).toEqual([1, 0, 0]);
    expect(done).toBe(false);
  });

  it("ZWEITER Fehler in Folge: Uebung wandert ans Ende (defer)", () => {
    let state = createQueue(three);
    ({ state } = advanceQueue(state, false)); // 1. Fehler -> retry
    const result = advanceQueue(state, false); // 2. Fehler -> defer
    expect(result.outcome).toBe("defer");
    expect(result.state.queue).toEqual([1, 2, 0]);
    expect(result.state.retried).toEqual([2, 0, 0]);
    // attemptFails fuer die naechste Praesentation zurueckgesetzt:
    expect(result.state.attemptFails).toEqual([0, 0, 0]);
    expect(result.done).toBe(false);
  });

  it("nach deferter Wiederholung gilt wieder: 1. Fehler = retry", () => {
    let state = createQueue(["a", "b"]);
    ({ state } = advanceQueue(state, false)); // a: 1. Fehler -> retry
    ({ state } = advanceQueue(state, false)); // a: 2. Fehler -> defer, queue [b, a]
    ({ state } = advanceQueue(state, true)); // b richtig, queue [a]
    const result = advanceQueue(state, false); // a wieder vorne: 1. Fehler -> retry
    expect(result.outcome).toBe("retry");
    expect(result.state.queue).toEqual([0]);
    expect(result.state.retried[0]).toBe(3);
  });

  it("retry und dann richtig: Uebung geloest, firstTry bleibt false", () => {
    let state = createQueue(["a"]);
    ({ state } = advanceQueue(state, false)); // 1. Fehler -> retry, bleibt vorne
    const result = advanceQueue(state, true); // sofortiger 2. Versuch sitzt
    expect(result.done).toBe(true);
    expect(result.outcome).toBe("solved");
    expect(result.state.firstTry[0]).toBe(false);
    expect(result.state.retried[0]).toBe(1);
    expect(result.state.solvedCount).toBe(1);
  });

  it("done erst, wenn die letzte Uebung richtig geloest ist", () => {
    let state = createQueue(three);
    let done = false;
    ({ state, done } = advanceQueue(state, true));
    expect(done).toBe(false);
    ({ state, done } = advanceQueue(state, true));
    expect(done).toBe(false);
    ({ state, done } = advanceQueue(state, true));
    expect(done).toBe(true);
    expect(state.solvedCount).toBe(3);
    expect(state.firstTry).toEqual([true, true, true]);
  });

  it("leere Queue: done true, Zustand unveraendert", () => {
    const empty = createQueue([]);
    const { state, done } = advanceQueue(empty, true);
    expect(done).toBe(true);
    expect(state).toEqual(empty);
  });

  it("veraendert den Eingabe-Zustand nicht (pure)", () => {
    const before = createQueue(three);
    const snapshot: QueueState = JSON.parse(JSON.stringify(before));
    advanceQueue(before, true);
    advanceQueue(before, false);
    expect(before).toEqual(snapshot);
  });
});

describe("retriedExerciseCount", () => {
  it("zaehlt Uebungen mit mindestens einem Fehler (nicht Versuche)", () => {
    let state = createQueue(three);
    ({ state } = advanceQueue(state, false)); // 0: 1. Fehler (retry, bleibt vorne)
    ({ state } = advanceQueue(state, true)); // 0 im 2. Versuch richtig
    ({ state } = advanceQueue(state, false)); // 1: 1. Fehler
    ({ state } = advanceQueue(state, false)); // 1: 2. Fehler (defer)
    expect(retriedExerciseCount(state)).toBe(2);
  });

  it("0 wenn alles beim ersten Versuch sass", () => {
    let state = createQueue(three);
    ({ state } = advanceQueue(state, true));
    ({ state } = advanceQueue(state, true));
    ({ state } = advanceQueue(state, true));
    expect(retriedExerciseCount(state)).toBe(0);
  });
});
