// Zeigt einen Aufgaben-Prompt lesbar an: kurzer Kontext-Vorspann klein/
// gedaempft, jeder Satz auf einer eigenen Zeile (siehe lib/prompt-format.ts).
// So klebt nicht mehr alles in einem Block (Xavier-Feedback 2026-07-10).
import { splitPrompt } from "@/lib/prompt-format";

export function PromptText({ text }: { text: string }) {
  const { lead, lines } = splitPrompt(text);
  return (
    <span className="flex flex-col gap-1.5">
      {lead && (
        <span className="text-sm font-semibold text-ink/55">{lead}</span>
      )}
      {lines.map((line, index) => (
        <span key={index} className="leading-snug">
          {line}
        </span>
      ))}
    </span>
  );
}
