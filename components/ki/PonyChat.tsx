"use client";

// "Frag das Pony": Text-Chat zur aktuellen Lektion. Amelie tippt eine Frage,
// Claude antwortet in Leichter Sprache - nur mit dem Wissen aus dieser
// Lektion. Die Lektion laedt der Server selbst aus der Datenbank.
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/Button";
import { SafeImage } from "@/components/ui/SafeImage";
import { kiAnfrage, useKiAktiv } from "@/lib/ki/client";
import { cn } from "@/lib/cn";
import { KiText } from "./KiText";
import { MAX_FRAGE_ZEICHEN } from "@/lib/ki/schemas";
import {
  chatMerken,
  gemerkterChat,
  verlaufFuerServer,
  type ChatNachricht,
} from "@/lib/ki/verlauf";

const VORSCHLAEGE = [
  "Erklär mir das Thema ganz einfach.",
  "Gib mir ein Beispiel.",
  "Was ist das Wichtigste?",
  "Frag mich ab!",
];

export function PonyChat({
  lessonSlug,
  lessonTitle,
  onClose,
}: {
  lessonSlug: string;
  lessonTitle?: string;
  onClose: () => void;
}) {
  const [nachrichten, setNachrichten] = useState<ChatNachricht[]>(() =>
    gemerkterChat(lessonSlug)
  );
  const [eingabe, setEingabe] = useState("");
  const [laedt, setLaedt] = useState(false);
  const abbruch = useRef<AbortController | null>(null);
  const liste = useRef<HTMLDivElement | null>(null);

  // Chat zu: laufende Anfrage abbrechen, das spart Tokens.
  useEffect(() => () => abbruch.current?.abort(), []);

  // Neue Nachricht oder neuer Text -> nach unten scrollen.
  useEffect(() => {
    const el = liste.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [nachrichten]);

  async function senden(roh: string) {
    const frage = roh.trim().slice(0, MAX_FRAGE_ZEICHEN);
    if (!frage || laedt) return;
    const mitFrage: ChatNachricht[] = [...nachrichten, { role: "user", content: frage }];
    setNachrichten([...mitFrage, { role: "assistant", content: "" }]);
    setEingabe("");
    setLaedt(true);

    const ctrl = new AbortController();
    abbruch.current = ctrl;
    try {
      const { text, ok } = await kiAnfrage(
        "/api/ki/pony",
        { lessonSlug, messages: verlaufFuerServer(mitFrage) },
        (bisher) => setNachrichten([...mitFrage, { role: "assistant", content: bisher }]),
        ctrl.signal
      );
      const fertig: ChatNachricht[] = [
        ...mitFrage,
        { role: "assistant", content: text, fehler: !ok },
      ];
      setNachrichten(fertig);
      chatMerken(lessonSlug, fertig);
      setLaedt(false);
    } catch {
      // abgebrochen - der Chat ist schon zu
    }
  }

  function absenden(e: FormEvent) {
    e.preventDefault();
    void senden(eingabe);
  }

  // Enter schickt ab, Umschalt+Enter macht eine neue Zeile.
  function tasteGedrueckt(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void senden(eingabe);
    }
  }


  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Frag das Pony"
      className="fixed inset-0 z-[60] bg-ink/40"
    >
      <div className="mx-auto flex h-full w-full max-w-md flex-col bg-white">
        <div className="flex items-center gap-3 border-b-2 border-locked px-4 pt-4 pb-3">
          <span className="text-4xl" aria-hidden>
            🐴
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xl font-extrabold text-ink">Frag das Pony</p>
            {lessonTitle && (
              <p className="truncate text-sm font-semibold text-ink/60">{lessonTitle}</p>
            )}
          </div>
          <button
            type="button"
            aria-label="Chat schließen"
            onClick={onClose}
            className="flex min-h-12 min-w-12 cursor-pointer items-center justify-center rounded-2xl text-2xl font-bold text-ink/50 select-none"
          >
            <span aria-hidden>✕</span>
          </button>
        </div>

        <div
          ref={liste}
          className="flex flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-4 py-4"
        >
          {nachrichten.length === 0 ? (
            <>
              <p className="rounded-2xl bg-primary-light px-4 py-3 text-base text-ink">
                Hallo Amelie! Ich kenne diese Lektion. Frag mich alles dazu. Du kannst
                auch einen Knopf antippen.
              </p>
              <div className="flex flex-col gap-2">
                {VORSCHLAEGE.map((v) => (
                  <Button key={v} variant="secondary" full onClick={() => void senden(v)}>
                    {v}
                  </Button>
                ))}
              </div>
            </>
          ) : (
            nachrichten.map((m, i) =>
              m.role === "user" ? (
                <p
                  key={i}
                  className="max-w-[85%] self-end rounded-2xl rounded-br-md bg-primary px-4 py-2 text-base whitespace-pre-line text-white"
                >
                  {m.content}
                </p>
              ) : (
                <div key={i} className="flex max-w-[94%] items-end gap-2 self-start">
                  <SafeImage
                    src="/pony-gluecklich.png"
                    alt=""
                    width={36}
                    height={36}
                    fallback="🐴"
                    fallbackClassName="text-2xl"
                    className="mb-0.5 shrink-0"
                  />
                  <div
                    className={cn(
                      "min-w-0 rounded-2xl rounded-bl-md px-4 py-3 text-ink",
                      // Fehler-Antworten (offline, Limit) sanft orange statt tuerkis
                      m.fehler ? "bg-warning-light" : "bg-primary-light"
                    )}
                  >
                    {m.content ? (
                      <KiText text={m.content} />
                    ) : (
                      <span className="animate-pulse text-ink/60">Das Pony denkt nach …</span>
                    )}
                  </div>
                </div>
              )
            )
          )}
        </div>

        <form
          onSubmit={absenden}
          className="border-t-2 border-locked px-3 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          <div className="flex items-end gap-2">
            <label htmlFor="pony-frage" className="sr-only">
              Deine Frage an das Pony
            </label>
            <textarea
              id="pony-frage"
              value={eingabe}
              onChange={(e) => setEingabe(e.target.value)}
              onKeyDown={tasteGedrueckt}
              maxLength={MAX_FRAGE_ZEICHEN}
              rows={2}
              placeholder="Deine Frage …"
              className="min-h-12 min-w-0 flex-1 resize-none rounded-2xl border-2 border-locked px-3 py-2 text-base text-ink focus:border-primary focus:outline-none"
            />
            <Button
              type="submit"
              aria-label="Frage abschicken"
              disabled={laedt || !eingabe.trim()}
              className="min-w-12 px-3 text-2xl"
            >
              <span aria-hidden>➤</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/** Knopf "Frag das Pony" + Chat. Nur sichtbar, wenn die KI-Hilfe eingerichtet ist. */
export function PonyChatKnopf({
  lessonSlug,
  lessonTitle,
  className,
}: {
  lessonSlug: string;
  lessonTitle?: string;
  className?: string;
}) {
  const aktiv = useKiAktiv();
  const [offen, setOffen] = useState(false);
  if (!aktiv) return null;
  return (
    <>
      <Button variant="secondary" size="lg" full className={className} onClick={() => setOffen(true)}>
        <span aria-hidden>🐴</span> Frag das Pony
      </Button>
      {offen && (
        <PonyChat
          lessonSlug={lessonSlug}
          lessonTitle={lessonTitle}
          onClose={() => setOffen(false)}
        />
      )}
    </>
  );
}
