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
    const { state, done } = advanceQueue(createQueue(three), true);
    expect(state.queue).toEqual([1, 2]);
    expect(state.solvedCount).toBe(1);
    expect(state.firstTry[0]).toBe(true);
    expect(done).toBe(false);
  });

  it("falsch: Uebung wandert ans Ende, retried zaehlt hoch", () => {
    const { state, done } = advanceQueue(createQueue(three), false);
    expect(state.queue).toEqual([1, 2, 0]);
    expect(state.solvedCount).toBe(0);
    expect(state.retried).toEqual([1, 0, 0]);
    expect(done).toBe(false);
  });

  it("nach Wiederholung geloest: firstTry bleibt false", () => {
    let state = createQueue(["a"]);
    ({ state } = advanceQueue(state, false)); // falsch -> ans Ende
    const result = advanceQueue(state, true); // beim 2. Mal richtig
    expect(result.done).toBe(true);
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

  it("mehrfach falsch: retried zaehlt je Uebung weiter", () => {
    let state = createQueue(["a", "b"]);
    ({ state } = advanceQueue(state, false)); // a falsch -> [1, 0]... queue [b, a]
    ({ state } = advanceQueue(state, true)); // b richtig
    ({ state } = advanceQueue(state, false)); // a wieder falsch
    expect(state.retried).toEqual([2, 0]);
    expect(state.queue).toEqual([0]);
    const result = advanceQueue(state, true);
    expect(result.done).toBe(true);
    expect(result.state.firstTry).toEqual([false, true]);
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
  it("zaehlt Uebungen mit mindestens einer Wiederholung (nicht Versuche)", () => {
    let state = createQueue(three);
    ({ state } = advanceQueue(state, false)); // 0 falsch
    ({ state } = advanceQueue(state, true)); // 1 richtig
    ({ state } = advanceQueue(state, false)); // 2 falsch
    ({ state } = advanceQueue(state, false)); // 0 nochmal falsch
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
