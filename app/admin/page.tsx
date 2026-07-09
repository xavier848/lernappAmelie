"use client";

// Admin-Startseite: Login-Formular (ohne Session) oder Dashboard (mit Session).
// Bewusst nuechtern gehalten, aber mit den Theme-Farben der App.
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { AdminStats } from "@/app/api/admin/stats/route";

type ViewState =
  | { kind: "loading" }
  | { kind: "login" }
  | { kind: "dashboard"; stats: AdminStats }
  | { kind: "error"; message: string };

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("de-DE", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Europe/Berlin",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function starLabel(stars: number): string {
  return "⭐".repeat(Math.max(0, Math.min(3, stars)));
}

function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        window.location.reload();
        return;
      }
      const body = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(body?.error ?? "Anmeldung fehlgeschlagen.");
    } catch {
      setError("Keine Verbindung. Bitte nochmal versuchen.");
    } finally {
      setBusy(false);
    }
  }, [busy, password]);

  return (
    <Card className="mt-8">
      <h2 className="text-lg font-bold">Anmelden</h2>
      <p className="mt-1 text-sm text-ink/70">
        Dieser Bereich ist nur für die Familie.
      </p>
      <form
        className="mt-4 flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <label className="text-sm font-semibold" htmlFor="admin-password">
          Passwort
        </label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="min-h-12 w-full rounded-xl border-2 border-locked bg-white px-4 text-base focus:border-primary focus:outline-none"
        />
        {error && (
          <p className="rounded-xl bg-warning-light px-4 py-3 text-sm font-semibold text-warning-dark">
            {error}
          </p>
        )}
        <Button type="submit" full disabled={busy || password.length === 0}>
          {busy ? "Einen Moment …" : "Anmelden"}
        </Button>
      </form>
    </Card>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="bg-primary-light text-center">
      <p className="text-2xl font-extrabold text-primary-dark">{value}</p>
      <p className="mt-1 text-sm font-semibold text-ink/80">{label}</p>
    </Card>
  );
}

function Dashboard({ stats }: { stats: AdminStats }) {
  return (
    <div className="mt-6 flex flex-col gap-6">
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Lektionen geschafft"
          value={`${stats.totals.lessonsCompleted}/${stats.totals.lessonsPublished}`}
        />
        <StatCard label="Tage Serie" value={`🔥 ${stats.totals.streak}`} />
        <StatCard label="XP gesamt" value={`⚡ ${stats.totals.xp}`} />
      </div>

      <Link
        href="/admin/inhalte"
        className="flex min-h-12 w-full items-center justify-center rounded-2xl border-b-4 border-primary-dark bg-primary px-5 font-bold text-white active:translate-y-1 active:border-b-0"
      >
        Inhalte verwalten →
      </Link>

      <section>
        <h2 className="text-lg font-bold">Schwierige Übungen</h2>
        <p className="text-sm text-ink/70">
          Fehlerquote ab 40 % bei mindestens 3 Versuchen.
        </p>
        {stats.difficult.length === 0 ? (
          <Card className="mt-3">
            <p className="text-sm text-ink/70">
              Noch keine schwierigen Übungen. Gut so!
            </p>
          </Card>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-2xl border-2 border-locked">
            <table className="w-full min-w-full text-left text-sm">
              <thead className="bg-primary-light text-primary-dark">
                <tr>
                  <th className="px-3 py-2 font-bold">Übung</th>
                  <th className="px-3 py-2 font-bold">Lektion</th>
                  <th className="px-3 py-2 font-bold">Versuche</th>
                  <th className="px-3 py-2 font-bold">Fehler</th>
                </tr>
              </thead>
              <tbody>
                {stats.difficult.map((row) => (
                  <tr key={row.exerciseId} className="border-t border-locked">
                    <td className="px-3 py-2">{row.prompt}</td>
                    <td className="px-3 py-2">{row.lessonTitle}</td>
                    <td className="px-3 py-2">{row.attempts}</td>
                    <td className="px-3 py-2 font-semibold text-warning-dark">
                      {Math.round(row.failRate * 100)} %
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold">Letzte Abschlüsse</h2>
        {stats.recent.length === 0 ? (
          <Card className="mt-3">
            <p className="text-sm text-ink/70">
              Noch keine Lektion abgeschlossen.
            </p>
          </Card>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {stats.recent.map((row) => (
              <li key={`${row.lessonId}-${row.completedAt}`}>
                <Card className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-semibold">{row.lessonTitle}</p>
                    <p className="text-xs text-ink/60">
                      {formatDate(row.completedAt)}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p>{starLabel(row.stars)}</p>
                    <p className="text-xs text-ink/60">+{row.xp} XP</p>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function AdminPage() {
  const [view, setView] = useState<ViewState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/stats");
        if (cancelled) return;
        if (res.status === 401) {
          setView({ kind: "login" });
          return;
        }
        const body = (await res.json().catch(() => null)) as
          | (AdminStats & { error?: string })
          | { error?: string }
          | null;
        if (res.ok && body && "totals" in body) {
          setView({ kind: "dashboard", stats: body as AdminStats });
        } else {
          setView({
            kind: "error",
            message: body?.error ?? "Daten konnten nicht geladen werden.",
          });
        }
      } catch {
        if (!cancelled) {
          setView({
            kind: "error",
            message: "Keine Verbindung. Bitte Seite neu laden.",
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="px-4 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Admin</h1>
        <Link
          href="/"
          className="flex min-h-12 items-center rounded-xl px-3 font-semibold text-primary-dark"
        >
          ← Zur App
        </Link>
      </header>

      {view.kind === "loading" && (
        <p className="mt-8 text-center text-ink/60">Lade …</p>
      )}
      {view.kind === "login" && <LoginForm />}
      {view.kind === "dashboard" && <Dashboard stats={view.stats} />}
      {view.kind === "error" && (
        <Card className="mt-8 bg-warning-light">
          <p className="font-semibold text-warning-dark">{view.message}</p>
        </Card>
      )}
    </div>
  );
}
