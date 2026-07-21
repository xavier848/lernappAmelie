"use client";

// Rendert die passende Uebungskomponente nach exercise.type. Geteilt zwischen
// Lektions-Player und Pruefungs-Player.
import type { ExerciseInput } from "@/lib/content-schema";
import type { ExerciseResult } from "./types";
import { StepsOrder } from "./StepsOrder";
import { MultipleChoice } from "./MultipleChoice";
import { MatchPairs } from "./MatchPairs";
import { SortBuckets } from "./SortBuckets";
import { MoneyCount } from "./MoneyCount";
import { Budget } from "./Budget";
import { NumberInput } from "./NumberInput";
import { MemoryGame } from "./MemoryGame";

export function ExerciseView({
  exercise,
  onResult,
  checkRequested,
  onReadyChange,
  attempt = 0,
}: {
  exercise: ExerciseInput;
  onResult: (r: ExerciseResult) => void;
  checkRequested: number;
  onReadyChange: (ready: boolean) => void;
  attempt?: number;
}) {
  const common = { onResult, checkRequested, onReadyChange, attempt };
  switch (exercise.type) {
    case "steps_order":
      return <StepsOrder data={exercise.data} {...common} />;
    case "multiple_choice":
      return <MultipleChoice data={exercise.data} {...common} />;
    case "match_pairs":
      return <MatchPairs data={exercise.data} {...common} />;
    case "sort_buckets":
      return <SortBuckets data={exercise.data} {...common} />;
    case "money_count":
      return <MoneyCount data={exercise.data} {...common} />;
    case "budget":
      return <Budget data={exercise.data} {...common} />;
    case "number_input":
      return <NumberInput data={exercise.data} {...common} />;
    case "memory_game":
      return <MemoryGame data={exercise.data} {...common} />;
  }
}
