"use client";

// Admin-Inhalte: Themen-Accordion mit Publish-Toggles, Lektions-Import
// als JSON und Bild-Upload in den Storage-Bucket 'images'.
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import type { AdminStats, AdminStatsTopic } from "@/app/api/admin/stats/route";

type ViewState =
  | { kind: "loading" }
  | { kind: "login" }
  | { kind: "ready"; topics: AdminStatsTopic[] }
  | { kind: "error"; message: string };

// ---------------------------------------------------------------------------
// Publish-Toggle
// ---------------------------------------------------------------------------

function PublishToggle({
  kind,
  id,
  published,
  onChanged,
}: {
  kind: "lesson" | "topic";
  id: string;
  published: boolean;
  onChanged: (published: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const toggle = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setError(false);
    try {
      const res = await fetch("/api/admin/toggle-publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, id, published: !published }),
      });
      if (res.ok) {
        onChanged(!published);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }, [busy, kind, id, published, onChanged]);

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      disabled={busy}
      aria-pressed={published}
      className={cn(
        "min-h-12 shrink-0 rounded-xl border-2 px-3 text-sm font-bold",
        published
          ? "border-success bg-success-light text-success-dark"
          : "border-locked bg-white text-ink/60",
        error && "border-warning text-warning-dark",
        busy && "opacity-50"
      )}
    >
      {busy ? "…" : published ? "Sichtbar ✅" : "Versteckt 🚫"}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Themen-Accordion
// ---------------------------------------------------------------------------

function TopicAccordion({
  topics,
  onToggled,
}: {
  topics: AdminStatsTopic[];
  onToggled: (kind: "lesson" | "topic", id: string, published: boolean) => void;
}) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  const toggleOpen = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (topics.length === 0) {
    return (
      <Card className="mt-3">
        <p className="text-sm text-ink/70">
          Noch keine Themen in der Datenbank.
        </p>
      </Card>
    );
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      {topics.map((topic) => {
        const open = openIds.has(topic.id);
        return (
          <Card key={topic.id} className="p-0">
            <div className="flex items-center gap-2 p-3">
              <button
                type="button"
                onClick={() => toggleOpen(topic.id)}
                aria-expanded={open}
                className="flex min-h-12 flex-1 items-center gap-2 rounded-xl px-2 text-left font-bold"
              >
                <span aria-hidden>{topic.icon}</span>
                <span className="flex-1">{topic.title}</span>
                <span className="text-sm text-ink/50">
                  {topic.lessons.length} Lektionen {open ? "▲" : "▼"}
                </span>
              </button>
              <PublishToggle
                kind="topic"
                id={topic.id}
                published={topic.published}
                onChanged={(published) =>
                  onToggled("topic", topic.id, published)
                }
              />
            </div>
            {open && (
              <ul className="flex flex-col gap-2 border-t-2 border-locked p-3">
                {topic.lessons.length === 0 && (
                  <li className="text-sm text-ink/60">
                    Dieses Thema hat noch keine Lektionen.
                  </li>
                )}
                {topic.lessons.map((lesson) => (
                  <li
                    key={lesson.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{lesson.title}</p>
                      <p className="truncate text-xs text-ink/50">
                        {lesson.slug}
                        {lesson.stars !== null &&
                          ` · ${"⭐".repeat(lesson.stars)}`}
                      </p>
                    </div>
                    <PublishToggle
                      kind="lesson"
                      id={lesson.id}
                      published={lesson.published}
                      onChanged={(published) =>
                        onToggled("lesson", lesson.id, published)
                      }
                    />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lektions-Import (JSON)
// ---------------------------------------------------------------------------

type ImportResult =
  | { ok: true; lessonId: string }
  | { ok: false; error: string; issues?: string[] };

function LessonImport({ onImported }: { onImported: () => void }) {
  const [json, setJson] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const submit = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setResult(null);
    try {
      let parsed: unknown;
      try {
        parsed = JSON.parse(json);
      } catch {
        setResult({
          ok: false,
          error: "Das ist kein gueltiges JSON. Bitte pruefen.",
        });
        return;
      }
      const res = await fetch("/api/admin/lesson-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const body = (await res.json().catch(() => null)) as {
        ok?: boolean;
        lessonId?: string;
        error?: string;
        issues?: string[];
      } | null;
      if (res.ok && body?.ok && body.lessonId) {
        setResult({ ok: true, lessonId: body.lessonId });
        setJson("");
        onImported();
      } else {
        setResult({
          ok: false,
          error: body?.error ?? "Import fehlgeschlagen.",
          issues: body?.issues,
        });
      }
    } catch {
      setResult({
        ok: false,
        error: "Keine Verbindung. Bitte nochmal versuchen.",
      });
    } finally {
      setBusy(false);
    }
  }, [busy, json, onImported]);

  return (
    <Card className="mt-3">
      <p className="text-sm text-ink/70">
        Eine Lektion als JSON einfügen (Format siehe CONTENT_FORMAT.md).
        Gleicher slug = Lektion wird ersetzt.
      </p>
      <textarea
        value={json}
        onChange={(event) => setJson(event.target.value)}
        spellCheck={false}
        aria-label="Lektions-JSON"
        placeholder='{"topic_slug": "…", "slug": "…", "title": "…", "sort": 1, "exercises": […]}'
        className="mt-3 h-64 w-full rounded-xl border-2 border-locked bg-white p-3 font-mono text-sm focus:border-primary focus:outline-none"
      />
      <Button
        full
        className="mt-3"
        disabled={busy || json.trim().length === 0}
        onClick={() => void submit()}
      >
        {busy ? "Importiere …" : "Lektion importieren"}
      </Button>
      {result?.ok === true && (
        <p className="mt-3 rounded-xl bg-success-light px-4 py-3 text-sm font-semibold text-success-dark">
          Lektion gespeichert. ✅ (id: {result.lessonId})
        </p>
      )}
      {result?.ok === false && (
        <div className="mt-3 rounded-xl bg-warning-light px-4 py-3 text-sm text-warning-dark">
          <p className="font-semibold">{result.error}</p>
          {result.issues && result.issues.length > 0 && (
            <ul className="mt-2 list-disc pl-5">
              {result.issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Bild-Upload
// ---------------------------------------------------------------------------

function ImageUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const upload = useCallback(async () => {
    if (busy || !file) return;
    setBusy(true);
    setError(null);
    setUrl(null);
    setCopied(false);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: form,
      });
      const body = (await res.json().catch(() => null)) as {
        ok?: boolean;
        url?: string;
        error?: string;
      } | null;
      if (res.ok && body?.ok && body.url) {
        setUrl(body.url);
      } else {
        setError(body?.error ?? "Upload fehlgeschlagen.");
      }
    } catch {
      setError("Keine Verbindung. Bitte nochmal versuchen.");
    } finally {
      setBusy(false);
    }
  }, [busy, file]);

  const copy = useCallback(async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }, [url]);

  return (
    <Card className="mt-3">
      <p className="text-sm text-ink/70">
        Bild hochladen. Die URL kannst du dann in einer Übung als{" "}
        <code className="font-mono">image</code> verwenden.
      </p>
      <input
        type="file"
        accept="image/*"
        aria-label="Bild-Datei auswaehlen"
        onChange={(event) => {
          setFile(event.target.files?.[0] ?? null);
          setUrl(null);
          setError(null);
          setCopied(false);
        }}
        className="mt-3 block w-full rounded-xl border-2 border-locked p-3 text-sm file:mr-3 file:min-h-12 file:cursor-pointer file:rounded-xl file:border-0 file:bg-primary-light file:px-4 file:font-semibold file:text-primary-dark"
      />
      <Button
        full
        className="mt-3"
        disabled={busy || !file}
        onClick={() => void upload()}
      >
        {busy ? "Lade hoch …" : "Hochladen"}
      </Button>
      {url && (
        <div className="mt-3 flex flex-col gap-2">
          <input
            readOnly
            value={url}
            aria-label="Oeffentliche Bild-URL"
            onFocus={(event) => event.target.select()}
            className="min-h-12 w-full rounded-xl border-2 border-success bg-success-light px-3 font-mono text-xs text-ink"
          />
          <Button variant="secondary" full onClick={() => void copy()}>
            {copied ? "Kopiert! ✅" : "URL kopieren"}
          </Button>
        </div>
      )}
      {error && (
        <p className="mt-3 rounded-xl bg-warning-light px-4 py-3 text-sm font-semibold text-warning-dark">
          {error}
        </p>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Seite
// ---------------------------------------------------------------------------

export default function AdminInhaltePage() {
  const [view, setView] = useState<ViewState>({ kind: "loading" });

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.status === 401) {
        setView({ kind: "login" });
        return;
      }
      const body = (await res.json().catch(() => null)) as
        | (AdminStats & { error?: string })
        | { error?: string }
        | null;
      if (res.ok && body && "topics" in body) {
        setView({ kind: "ready", topics: (body as AdminStats).topics });
      } else {
        setView({
          kind: "error",
          message: body?.error ?? "Daten konnten nicht geladen werden.",
        });
      }
    } catch {
      setView({
        kind: "error",
        message: "Keine Verbindung. Bitte Seite neu laden.",
      });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const applyToggle = useCallback(
    (kind: "lesson" | "topic", id: string, published: boolean) => {
      setView((prev) => {
        if (prev.kind !== "ready") return prev;
        return {
          kind: "ready",
          topics: prev.topics.map((topic) => {
            if (kind === "topic" && topic.id === id) {
              return { ...topic, published };
            }
            if (kind === "lesson") {
              return {
                ...topic,
                lessons: topic.lessons.map((lesson) =>
                  lesson.id === id ? { ...lesson, published } : lesson
                ),
              };
            }
            return topic;
          }),
        };
      });
    },
    []
  );

  return (
    <div className="px-4 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Inhalte</h1>
        <Link
          href="/admin"
          className="flex min-h-12 items-center rounded-xl px-3 font-semibold text-primary-dark"
        >
          ← Admin
        </Link>
      </header>

      {view.kind === "loading" && (
        <p className="mt-8 text-center text-ink/60">Lade …</p>
      )}

      {view.kind === "login" && (
        <Card className="mt-8">
          <p className="font-semibold">Bitte zuerst anmelden.</p>
          <Link
            href="/admin"
            className="mt-3 flex min-h-12 w-full items-center justify-center rounded-2xl border-b-4 border-primary-dark bg-primary px-5 font-bold text-white active:translate-y-1 active:border-b-0"
          >
            Zur Anmeldung
          </Link>
        </Card>
      )}

      {view.kind === "error" && (
        <Card className="mt-8 bg-warning-light">
          <p className="font-semibold text-warning-dark">{view.message}</p>
        </Card>
      )}

      {view.kind === "ready" && (
        <div className="mt-6 flex flex-col gap-8">
          <section>
            <h2 className="text-lg font-bold">Themen &amp; Lektionen</h2>
            <TopicAccordion topics={view.topics} onToggled={applyToggle} />
          </section>

          <section>
            <h2 className="text-lg font-bold">Neue Lektion (JSON)</h2>
            <LessonImport onImported={() => void load()} />
          </section>

          <section>
            <h2 className="text-lg font-bold">Bild-Upload</h2>
            <ImageUpload />
          </section>
        </div>
      )}
    </div>
  );
}
