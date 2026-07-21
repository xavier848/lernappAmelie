// Baut den Vorlese-Text einer Übung. Bei Multiple-Choice werden ZUSÄTZLICH
// die Antwortmöglichkeiten vorgelesen (Entlastung beim Lesen, Dyspraxie).
// Nur bei deutschen Aufgaben - bei Sprach-Aufgaben (tts_lang en/nl) bleibt es
// beim Prompt, damit die fremdsprachliche Aussprache nicht die deutschen
// Optionen mischt.
import type { ExerciseInput } from "@/lib/content-schema";

export function speakableText(exercise: ExerciseInput): string {
  const data = exercise.data;
  const prompt = data.prompt;
  const lang = "tts_lang" in data ? data.tts_lang : undefined;
  const german = !lang || lang.toLowerCase().startsWith("de");

  if (exercise.type === "multiple_choice" && german) {
    const options = exercise.data.options
      .map((o) => o.text)
      .filter(Boolean)
      .join(". ");
    if (options) return `${prompt} … ${options}`;
  }
  return prompt;
}
