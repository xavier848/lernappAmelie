# Lernapp Amelie – Implementierungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> **Pflichtlektüre für jeden Task:** `docs/superpowers/specs/2026-07-09-lernapp-amelie-design.md` (Design-Tokens, UX-Regeln, Datenmodell). Dieser Plan + Spec zusammen sind die vollständige Wahrheit.

**Goal:** Duolingo-artige, mobile-first Lern-PWA (weiß/türkis) für Amelie (Dyspraxie) mit 6 Tap-only-Übungstypen, Supabase-Backend, Admin-Bereich und ~20 Lektionen Startinhalt.

**Architecture:** Next.js 15 App Router liest publizierte Inhalte (topics→lessons→exercises) aus Supabase; Fortschritt/Streak schreibt der Client mit anonymer Geräte-ID direkt (RLS-beschränkt); Admin-Mutationen laufen über API-Routes mit Service-Role-Key hinter Passwort-Cookie. Lektions-Inhalte sind JSON nach Zod-Schema – identisch für Seed-Skript, Admin-Import und Claude-MCP-Einspielung.

**Tech Stack:** Next.js 15 (TypeScript), Tailwind CSS 4, Framer Motion, @supabase/supabase-js v2, Zod, Vitest.

## Global Constraints

- Alle interaktiven Elemente: min. 48×48 px (Tailwind `min-h-12`), Antwortkarten min. 64 px (`min-h-16`), volle Breite, `gap-3`+ zwischen Zielen.
- Aktionen nur via `onClick` (nie `touchstart`/`onPointerDown`). Kein Drag & Drop. Keine Zeitlimits.
- Farben exakt aus Spec §3: Primär `#14b8a6` (teal-500), Dunkel `#0f766e`, Hell `#f0fdfa`, Text `#1e293b`, Erfolg `#22c55e`, Fehler-Orange `#f97316`, Grau `#e2e8f0`. Fehler-Feedback NIE rot.
- Alle Nutzer-Texte: Deutsch, Leichte Sprache (kurze Sätze, keine Fremdwörter), Ausnahme Englisch-Lerninhalte.
- Geldbeträge IMMER als Integer-Cent rechnen; Anzeige via `formatEuro()` aus `lib/money.ts`.
- Buttons im Duolingo-Stil: `rounded-2xl border-b-4 active:border-b-0 active:translate-y-1`.
- Jeder Task endet mit: Tests grün (`npx vitest run`), Build heil (`npx next build` ab Task 6), Commit auf `main`.
- Commits: deutsche Message + `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- Env-Namen exakt: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`.

---

### Task 1: Projekt-Scaffold + Design-Fundament

**Files:** Create: Next.js-App im Repo-Root (`create-next-app` mit TS, Tailwind, App Router, kein src-dir, Import-Alias `@/*`), `app/globals.css` (Design-Tokens), `app/layout.tsx` (Open Sans via `next/font/google`, Meta/PWA-Tags, max-w-md-Shell zentriert auf grauem Desktop-Hintergrund), `public/manifest.json`, `lib/cn.ts`.
**Interfaces – Produces:** Tailwind-Theme-Farben `primary`, `primary-dark`, `primary-light`, `ink`, `success`, `warning` (via `@theme` in globals.css, Tailwind 4); `cn(...classes)` Helper.

- [ ] `npx create-next-app@latest . --ts --tailwind --app --no-src-dir --import-alias "@/*" --use-npm --yes` (Repo-Root; vorhandene docs/assets bleiben; bei Konflikt mit README: create-next-app in Temp-Ordner und Dateien rüberkopieren)
- [ ] Dependencies: `npm i @supabase/supabase-js zod framer-motion && npm i -D vitest @vitejs/plugin-react jsdom @testing-library/react`
- [ ] `vitest.config.ts` (environment jsdom, globals true, alias `@` → Root). Script `"test": "vitest run"` in package.json.
- [ ] globals.css: `@theme { --color-primary: #14b8a6; --color-primary-dark: #0f766e; --color-primary-light: #f0fdfa; --color-ink: #1e293b; --color-success: #22c55e; --color-warning: #f97316; --color-locked: #e2e8f0; }` + `body { background: #fff; color: var(--color-ink); }` + `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }`
- [ ] layout.tsx: `<html lang="de">`, Open Sans (`weights 400,600,700,800`), viewport + theme-color `#14b8a6`, manifest-Link, `<main className="mx-auto min-h-dvh w-full max-w-md bg-white">`.
- [ ] manifest.json: name "Amelies Lernapp", short_name "Lernapp", display standalone, theme_color/background_color, icons 192/512 (Platzhalter-Pfade, echte Icons in Task 10).
- [ ] Smoke-Test `lib/cn.test.ts` (cn kombiniert Klassen, filtert falsy) → grün. `npx next build` → grün. Commit.

### Task 2: Supabase-Projekt + Schema + Env

**Files:** Create: `supabase/migrations/0001_schema.sql` (Referenz-Kopie der per MCP angewandten Migration), `.env.local` (NICHT committen), `.env.example`.
**Interfaces – Produces:** Live-Supabase-Projekt mit Tabellen aus Spec §6 + RLS + Storage-Bucket `images` (public read).

- [ ] Per Supabase-MCP: Organisation prüfen (`list_organizations`/`list_projects`), neues Projekt `lernapp-amelie` in Free-Tier anlegen (`get_cost` → `confirm_cost` → `create_project`), Region EU (Frankfurt).
- [ ] Migration per `apply_migration` (Name `schema_v1`):

```sql
create table topics (id uuid primary key default gen_random_uuid(), slug text unique not null, title text not null, icon text not null default '📘', sort int not null default 0, published boolean not null default true);
create table lessons (id uuid primary key default gen_random_uuid(), topic_id uuid not null references topics(id) on delete cascade, slug text unique not null, title text not null, sort int not null default 0, published boolean not null default true, created_at timestamptz not null default now());
create table exercises (id uuid primary key default gen_random_uuid(), lesson_id uuid not null references lessons(id) on delete cascade, sort int not null default 0, type text not null check (type in ('steps_order','multiple_choice','match_pairs','sort_buckets','money_count','budget')), data jsonb not null);
create table devices (id uuid primary key, label text, created_at timestamptz not null default now());
create table progress (id uuid primary key default gen_random_uuid(), device_id uuid not null references devices(id), lesson_id uuid not null references lessons(id) on delete cascade, stars int not null check (stars between 1 and 3), xp int not null default 0, completed_at timestamptz not null default now(), unique(device_id, lesson_id));
create table exercise_attempts (id uuid primary key default gen_random_uuid(), device_id uuid not null references devices(id), exercise_id uuid not null references exercises(id) on delete cascade, correct boolean not null, created_at timestamptz not null default now());
create table daily_activity (device_id uuid not null references devices(id), day date not null, xp int not null default 0, primary key (device_id, day));
alter table topics enable row level security; alter table lessons enable row level security; alter table exercises enable row level security; alter table devices enable row level security; alter table progress enable row level security; alter table exercise_attempts enable row level security; alter table daily_activity enable row level security;
create policy "read published topics" on topics for select using (published);
create policy "read published lessons" on lessons for select using (published);
create policy "read exercises of published lessons" on exercises for select using (exists (select 1 from lessons l where l.id = lesson_id and l.published));
create policy "device insert" on devices for insert with check (true);
create policy "device read own" on devices for select using (true);
create policy "progress all" on progress for all using (true) with check (true);
create policy "attempts insert" on exercise_attempts for insert with check (true);
create policy "activity all" on daily_activity for all using (true) with check (true);
```

- [ ] Storage-Bucket `images` (public) per SQL: `insert into storage.buckets (id, name, public) values ('images','images',true);` + Policy public read.
- [ ] `.env.local` mit `get_project_url`/`get_publishable_keys` füllen (Service-Role-Key über Dashboard-Hinweis oder MCP falls verfügbar; sonst Platzhalter + TODO-Log an Xavier am Ende). `.env.example` mit leeren Keys committen.
- [ ] `get_advisors` (security) laufen lassen, kritische Findings beheben. Commit (Migration + .env.example).

### Task 3: Content-Schema (Zod) + Geld-Helfer

**Files:** Create: `lib/content-schema.ts`, `lib/content-schema.test.ts`, `lib/money.ts`, `lib/money.test.ts`.
**Interfaces – Produces:**
```ts
// content-schema.ts
export const exerciseSchema: z.ZodType<ExerciseInput> // discriminated union on "type"
export const lessonSchema  // { topic_slug, slug, title, sort, exercises: exerciseSchema[] (min 1) }
export type LessonInput = z.infer<typeof lessonSchema>
export type ExerciseData = /* union der 6 data-Formen, exakt Spec §5 */
// money.ts
export function formatEuro(cents: number): string           // 350 → "3,50 €"
export function optimalChange(cents: number): number[]      // Greedy, EUR-Stückelung [50000,20000,10000,5000,2000,1000,500,200,100,50,20,10,5,2,1]
export function sumCents(items: number[]): number
```
Schema-Details (data-Felder je Typ, alle mit `prompt: string`, optional `image`, optional `tts_lang`):
- `steps_order`: `steps: [{text, image?}]` (2–10; korrekte Reihenfolge = Arrayreihenfolge), `mode?: 'steps'|'words'`
- `multiple_choice`: `options: [{text, image?, correct?: boolean}]` (2–4, genau 1 correct – per `.refine`), `explanation?`
- `match_pairs`: `pairs: [{left: {text?, image?}, right: {text?, image?}}]` (2–6), `memory?: boolean`; refine: jede Seite hat text oder image
- `sort_buckets`: `buckets: [{id, label, icon?}]` (2–3), `items: [{text, image?, bucket}]` (2–8); refine: jedes `item.bucket` existiert in buckets
- `money_count`: `mode: 'recognize'|'assemble'|'change'`; recognize: `options` wie multiple_choice + `moneyImage: string` (SVG-Key); assemble: `target: int > 0`; change: `price: int`, `given: int`, refine `given > price`
- `budget`: `income: int`, `categories: [{id, label, icon?, fixed?: int}]` (3–8; `fixed` = vorbelegt/nicht änderbar), `savingsGoal?: int`

- [ ] Tests zuerst: je Typ 1 gültiges + 1 ungültiges Beispiel (z. B. multiple_choice mit 2× correct → fail; sort_buckets mit unbekanntem bucket → fail; money_count change mit given ≤ price → fail); money: `formatEuro(350)==='3,50 €'`, `optimalChange(280)` → `[200,50,20,10]`-Summe==280 & minimale Stückzahl, Rundtrip-Property (Summe des Ergebnisses == Eingabe). Rot laufen lassen → implementieren → grün → Commit.

### Task 4: Scoring, Streak, Badges, Device, TTS

**Files:** Create: `lib/scoring.ts` + Test, `lib/streak.ts` + Test, `lib/badges.ts` + Test, `lib/device.ts`, `lib/tts.ts`.
**Interfaces – Produces:**
```ts
// scoring.ts
export function stepsOrderPartial(correct: string[], given: string[]): {correctPairs: number, totalPairs: number, perfect: boolean}
export function xpForExercise(firstTry: boolean): number   // 10 | 5
export const LESSON_BONUS_XP = 20
export function starsForLesson(totalExercises: number, retriedCount: number): 1|2|3  // 0 retried→3, ≤2→2, sonst 1
export function levelForXp(totalXp: number): {level: number, currentXp: number, nextLevelXp: number} // Schwelle Level n→n+1: n*100
// streak.ts
export function computeStreak(days: string[] /* 'YYYY-MM-DD', beliebige Reihenfolge */, today: string): number
// Regel: zählt zusammenhängende Tage rückwärts ab today ODER gestern (heute noch nicht gelernt bricht Streak nicht)
// badges.ts
export type Badge = {id: string, title: string, description: string, emoji: string}
export const ALL_BADGES: Badge[]
export function earnedBadges(input: {completedLessonSlugs: string[], topicsCompleted: string[], streak: number, totalXp: number}): string[]
// Badge-IDs: 'erste-lektion', 'topic-<slug>' je Thema, 'streak-3','streak-7','streak-14','streak-30', 'xp-100','xp-500','xp-1000','xp-2500'
// device.ts (client-only)
export function getDeviceId(): string  // localStorage 'lernapp-device-id', erzeugt UUID + POST devices-Insert beim ersten Mal
// tts.ts
export function speak(text: string, lang?: string): void  // SpeechSynthesis, cancel() vor neuem speak, no-op wenn nicht verfügbar
export function ttsAvailable(): boolean
```

- [ ] TDD: streak-Kanten testen (leer→0; nur heute→1; gestern+vorgestern ohne heute→2; Lücke→bricht), levelForXp(0)→Level 1, levelForXp(100)→Level 2; stepsOrderPartial exakt/teilweise/leer; starsForLesson-Grenzen; earnedBadges Kombinationen. Grün → Commit.

### Task 5: Supabase-Client + Datenzugriff

**Files:** Create: `lib/supabase.ts`, `lib/data.ts`, `lib/types.ts` (DB-Row-Typen), `lib/data.test.ts` (nur pure Helfer wie `groupLessonsByTopic`).
**Interfaces – Produces:**
```ts
// supabase.ts
export function supabaseBrowser(): SupabaseClient      // anon, singleton
export function supabaseService(): SupabaseClient      // service role, NUR in Server-Code importieren
// data.ts (alle async, browser-client)
export async function fetchPath(): Promise<TopicWithLessons[]>          // topics+lessons published, sortiert
export async function fetchLesson(slug: string): Promise<{lesson: LessonRow, exercises: ExerciseRow[]} | null>
export async function fetchProgress(deviceId: string): Promise<ProgressRow[]>
export async function saveLessonResult(p: {deviceId: string, lessonId: string, stars: number, xp: number}): Promise<void>  // upsert bestes Ergebnis (stars max, xp addieren via daily_activity)
export async function logAttempt(p: {deviceId: string, exerciseId: string, correct: boolean}): Promise<void>  // fire-and-forget, Fehler schlucken
export async function bumpDailyActivity(deviceId: string, xp: number): Promise<void>  // upsert heute (Europe/Berlin) += xp
export async function fetchActivityDays(deviceId: string): Promise<string[]>
```
- [ ] localStorage-Fallback: `saveLessonResult`/`bumpDailyActivity` schreiben bei Netzfehler in Queue `lernapp-pending-writes`; `flushPendingWrites()` wird beim App-Start aufgerufen. Test für Queue-Helfer (pure). Grün → Commit.

### Task 6: UI-Bausteine

**Files:** Create: `components/ui/Button.tsx`, `Card.tsx`, `ProgressBar.tsx`, `FeedbackBanner.tsx`, `TTSButton.tsx`, `Mascot.tsx`, `Confetti.tsx`, `AppHeader.tsx` (Streak+XP+Level Sticky-Header), Test: `components/ui/ui.test.tsx` (Render-Smoke + Button feuert onClick, FeedbackBanner-Varianten).
**Interfaces – Produces:**
```ts
Button: {variant?: 'primary'|'secondary'|'success'|'warning', size?: 'md'|'lg', full?: boolean, disabled, onClick, children}
ProgressBar: {value: number, max: number}                       // türkis, animiert width
FeedbackBanner: {state: 'correct'|'wrong', explanation?: string, onContinue: () => void}  // fixed bottom, grün/orange, „Weiter"-Button lg
TTSButton: {text: string, lang?: string}                        // 🔊, min-h-12, aria-label "Vorlesen"
Mascot: {mood?: 'happy'|'cheer'|'neutral', message?: string, size?: number}  // Bild /mascot.png + Sprechblase
Confetti: {}                                                    // einmalige CSS/Framer-Animation, ~40 Partikel in Türkis/Gelb/Orange
```
- [ ] Duolingo-Button-Stil exakt (Global Constraints). FeedbackBanner: state wechselt Farbe+Emoji (🎉/🤔) + Text „Richtig!"/„Fast! Schau nochmal." Tests grün, Build grün, Commit.

### Task 7: Übungskomponenten Teil 1 (steps_order, multiple_choice, match_pairs)

**Files:** Create: `components/exercises/StepsOrder.tsx`, `MultipleChoice.tsx`, `MatchPairs.tsx`, gemeinsamer Typ `components/exercises/types.ts`, Tests je Komponente (Testing Library: tap-Interaktionen, onResult-Aufruf).
**Interfaces – Produces:**
```ts
// types.ts – Vertrag für ALLE Übungskomponenten:
export type ExerciseComponentProps<D> = {
  data: D
  onResult: (r: {correct: boolean}) => void   // genau einmal pro Prüf-Vorgang
  checkRequested: number                       // Player erhöht Counter wenn „Prüfen" gedrückt
  onReadyChange: (ready: boolean) => void      // steuert ob „Prüfen"-Button aktiv
}
```
Verhalten:
- **StepsOrder:** Karten gemischt (deterministischer Shuffle via seeded RNG aus exercise-id, damit Tests stabil; NIE zufällig schon korrekt sortiert), Antippen → in nummerierte Antwortliste; in Antwortliste antippen → zurück. `ready` = alle Karten platziert. Bei `words`-Mode: Chips als Inline-Wortbank. Nach Prüfen: korrekt platzierte Karten grün markieren, falsche orange (visuelles Lernen), correct = exakte Reihenfolge.
- **MultipleChoice:** Karten (Text/Bild), eine auswählbar (türkiser Rand), ready = Auswahl vorhanden.
- **MatchPairs:** Standard: zwei Spalten, links wählen (türkis) → rechts wählen → match? Paar verblasst : beide schütteln kurz (Framer) + Fehlversuch zählt intern; correct = alle Paare mit ≤ (pairs.length) Fehlversuchen… **Vereinfachung:** correct = am Ende alle gematcht UND Fehlversuche === 0 (sonst „wrong", Wiederholung ans Lektionsende). `memory: true`: Raster verdeckt, Tap = aufdecken, 2 offen → match/zudecken nach 1,2 s.
- [ ] TDD je Komponente (z. B. StepsOrder: 3 Karten antippen in falscher Reihenfolge → onResult({correct:false}) nach checkRequested). Grün → Commit.

### Task 8: Übungskomponenten Teil 2 (sort_buckets, money_count, budget) + Geld-SVGs

**Files:** Create: `components/exercises/SortBuckets.tsx`, `MoneyCount.tsx`, `Budget.tsx`, `components/money/MoneySvg.tsx` (+ `coins.tsx`, `notes.tsx`), Tests.
**Interfaces – Produces:** `MoneySvg: {value: number /* cents: 1,2,5,…,50000 */, size?: number}` – stilisierte eigene SVGs: Münzen als Kreise (Gold/Silber/Bronze-Töne, Wertaufdruck), Scheine als abgerundete Rechtecke in EZB-Farbwelt (5€ grau, 10€ rot, 20€ blau, 50€ orange, 100€ grün, 200€ gelb) mit großem Wert – bewusst illustrativ, KEINE realistische Reproduktion.
Verhalten:
- **SortBuckets:** Item-Karte (eins nach dem anderen, groß mittig) + 2–3 Korb-Buttons; Item→Korb per zwei Taps ODER direkt Korb antippen sortiert aktuelles Item. Falsch einsortiert → sofort oranges Wackeln + richtige Korb-Markierung, zählt als Fehler. correct = 0 Fehler.
- **MoneyCount:** assemble/change: unten Münz-/Schein-Palette (je Nennwert ein Button mit MoneySvg + Badge „×n" wenn mehrfach gelegt), oben „Hand"-Bereich mit gelegtem Geld (Antippen entfernt) + Live-Summe groß (`formatEuro`). ready = Summe > 0. correct = Summe === target (assemble) bzw. === given−price (change). recognize = MultipleChoice mit MoneySvg statt Bild.
- **Budget:** Kategorien-Liste, je Zeile: Icon+Label, Betrag, −/+ Stepper (`min-h-12`-Buttons, 10-€-Schritte, min 0); `fixed`-Kategorien ohne Stepper. Kopf: „Einnahmen: X €" + „Noch übrig: Y €" (türkis ≥ 0, orange < 0), Balken je Kategorie relativ. ready = mind. 1 Kategorie > 0. correct = Summe ≤ income UND (savingsGoal ? Kategorie 'sparen' ≥ savingsGoal : true). Nach Prüfen: Ergebnis-Balkendiagramm + ✔️/⚠️-Text.
- [ ] TDD (Budget-Mathe, MoneyCount-Summenlogik als pure Helfer + Interaktionstests). Grün → Commit.

### Task 9: Lektions-Player + Ergebnis-Screen

**Files:** Create: `app/lektion/[slug]/page.tsx` (Server: fetch via anon geht auch serverseitig; einfacher: Client-Component mit fetchLesson), `components/player/LessonPlayer.tsx`, `components/player/ResultScreen.tsx`, Test: `components/player/queue.test.ts` (pure Queue-Logik `nextQueueState`).
**Interfaces – Consumes:** ExerciseComponentProps-Vertrag (Task 7), data.ts, scoring.ts.
Verhalten: Queue = Übungen sortiert; falsche Übung → ans Ende (Wiederholung, `retriedCount` je Übung tracken); Fortschrittsbalken = gelöste/gesamt; oben links X → Bestätigungs-Dialog („Willst du wirklich aufhören? Dein Fortschritt in dieser Lektion geht verloren." – Buttons „Weiter lernen" / „Beenden"); pro Übung: TTSButton neben Prompt; nach onResult: FeedbackBanner + logAttempt; Lektion fertig → XP berechnen (xpForExercise je Übung nach firstTry + LESSON_BONUS_XP), starsForLesson, saveLessonResult + bumpDailyActivity, ResultScreen (Confetti + Mascot cheer + XP-CountUp + Sterne + neue Badges + Button „Weiter lernen" → `/`).
- [ ] Queue-Logik als pure Funktion TDD, Player zusammenstecken, Build grün → Commit.

### Task 10: Lernpfad (Startseite) + Profil + Maskottchen-Assets

**Files:** Create: `app/page.tsx`, `components/path/LearningPath.tsx`, `components/path/LessonNode.tsx`, `app/profil/page.tsx`, `components/profile/StreakCalendar.tsx`, `components/profile/BadgeGrid.tsx`, `public/mascot.png` (freigestellt), `public/icon-192.png`, `public/icon-512.png`, `app/credits/page.tsx` (Lizenz-Nachweise), Test: Pfad-Ableitung pure (`pathStates(lessons, progress)` → completed/current/locked je Lektion).
Verhalten: Themen-Abschnitte mit Icon+Titel als Trenner; Lektions-Knoten = Kreis 72 px, Zustände laut Spec §4.1 (Sterne als ⭐-Reihe unterm Kreis); erster nicht-abgeschlossener Knoten je Thema = „current" (pulsierender Ring, Framer), spätere im Thema locked; AppHeader sticky (🔥Streak, ⚡XP, Level); Maskottchen + Begrüßung oben („Hallo Amelie! Schön, dass du da bist."). Profil: StreakCalendar (aktueller Monat, gelernte Tage türkis gefüllt), Level-Fortschrittsbalken, BadgeGrid (erreicht farbig / offen grau, je Emoji+Titel+Beschreibung).
**Maskottchen freistellen:** Python (Pillow): Hintergrund ist dunkelgrau+Glow → Ansatz: `rembg` falls `pip install rembg` klappt, sonst Farbschwellen-Maske (Hintergrund-Sample aus Ecken, Distanz-Threshold, Kanten weichzeichnen). Ergebnis auf Weiß prüfen (Screenshot). Icons: Maskottchen-Kopf auf türkisem Kreis, 192+512 px.
- [ ] pathStates-TDD, Seiten bauen, Build grün → Commit.

### Task 11: Admin-Bereich

**Files:** Create: `app/admin/page.tsx` (Login-Form wenn kein Cookie, sonst Dashboard), `app/admin/inhalte/page.tsx`, `app/api/admin/login/route.ts`, `app/api/admin/lesson-import/route.ts`, `app/api/admin/toggle-publish/route.ts`, `app/api/admin/upload/route.ts`, `app/api/admin/stats/route.ts`, `lib/admin-auth.ts`, Test: `lib/admin-auth.test.ts` (Token-Erzeugung/-Prüfung pure).
**Interfaces – Produces:** `requireAdmin(req): boolean` (HMAC-signiertes Cookie `admin-session`, Secret = ADMIN_PASSWORD, 30 Tage). Login: POST Passwort → Cookie httpOnly+secure+sameSite=lax.
Verhalten:
- Dashboard: Karten „Lektionen geschafft x/y", „Aktueller Streak", „XP gesamt"; Liste „Schwierige Übungen" (exercise_attempts: Fehlerquote ≥ 40 % bei ≥ 3 Versuchen, mit Lektions-/Themen-Name + Prompt); Tabelle zuletzt abgeschlossene Lektionen.
- Inhalte: Themen→Lektionen-Baum mit Publish-Toggles (PATCH via Service-Route); „Neue Lektion (JSON)": Textarea → POST lesson-import → Zod-validieren (`lessonSchema`) → topic per slug finden (Fehler wenn fehlt) → lesson+exercises in einer Transaktion (RPC oder sequentiell mit Cleanup bei Fehler) → Erfolgsmeldung mit Link; Fehlerausgabe verständlich (Zod-Issues formatiert). Bild-Upload: file input → Service-Upload in `images/` → öffentliche URL anzeigen + Kopier-Button.
- [ ] admin-auth-TDD, Routes + Seiten, manuell testen (curl Login + Import einer Test-Lektion), Build grün → Commit.

### Task 12: CONTENT_FORMAT.md + Seed-Skript

**Files:** Create: `CONTENT_FORMAT.md` (vollständige Doku: alle 6 Typen mit je einem kompletten Beispiel-JSON, Leichte-Sprache-Regeln für Prompts, Slug-Konventionen, Anleitung „Wie Claude neue Lektionen einspielt": (a) Supabase MCP direkt in topics/lessons/exercises, (b) Admin-API), `scripts/seed.ts` (liest `content/topics.json` + `content/lessons/*.json`, validiert ALLES mit lessonSchema, upsert per Service-Key: topics nach slug, lessons nach slug [delete+insert exercises], idempotent, `npx tsx scripts/seed.ts`), `content/topics.json` (die 20 Topics aus Spec §8 mit slug/title/icon/sort in 5 Gruppen-Reihenfolge), 2 Beispiel-Lektionen als Formatreferenz.
**Interfaces – Produces:** `content/lessons/<topic>/<lesson-slug>.json`-Konvention; Seed idempotent (mehrfach ausführbar ohne Duplikate).
- [ ] `npm i -D tsx`. Seed mit 2 Beispiel-Lektionen gegen Live-DB laufen lassen, App zeigt sie an. Commit.

### Task 13: Startinhalte erstellen (~20 Lektionen, parallelisierbar)

**Files:** Create: `content/lessons/**/*.json` gemäß Inventar Spec §8 (Putzen: 6 Themen · Tisch & Gäste: 3 · Geld: 2 Themen mit zusammen ~12 Lektionen · Kinder: 9 Themen). Pro Thema 1–4 Lektionen à 6–10 Übungen, Mix aus min. 2 Typen, Bilder = Emojis im text (kein Bild-Download-Blocker; `image`-Felder bleiben leer bis echte Fotos kommen).
**Regeln für Content-Autoren (Subagents):** Leichte Sprache (Hauptsätze, bekannte Wörter, „du"-Anrede); fachlich korrekt nach Spec-§8-Stichpunkten (Reihenfolgen: oben→unten, trocken→nass, Einwirkzeit nutzen; Entwicklungsreihenfolgen exakt wie von der Mutter vorgegeben); jede steps_order max. 6 Schritte (kognitiv beherrschbar – lange Abläufe in 2 Übungen teilen); Englisch-Lektionen: `tts_lang: "en-GB"` NUR auf englischen Items; Geld-Lektionen aufsteigende Schwierigkeit; jede Lektion endet mit einer leichten „Erfolgs-Übung".
- [ ] Jede Datei einzeln gegen lessonSchema validieren (Seed-Skript im dry-run `--check`), Seed in DB, Stichproben in der App durchspielen. Commit.

### Task 14: Verifikation + Deployment

- [ ] `npx vitest run` komplett grün, `npx next build` grün, `npm audit` keine Criticals.
- [ ] Preview (launch.json `dev` → `npm run dev`, Port 3000): mobile Viewport 375 px – Lernpfad, JEDEN der 6 Übungstypen einmal komplett durchspielen (Screenshots), Falsch-Antwort-Wiederholung prüfen, Ergebnis-Screen, Profil/Streak, Admin-Login + JSON-Import + Publish-Toggle. Konsole fehlerfrei. Kontrast-Stichprobe (weiß auf türkis nur ≥ 18 px fett).
- [ ] Fixes aus Verifikation, dann `git push -u origin main`.
- [ ] Vercel: `vercel whoami` – wenn eingeloggt: Projekt anlegen + ENV setzen + deploy; sonst README-Abschnitt „Deployment" mit exakten Schritten (Vercel-Import, 4 ENV-Variablen, Domain `lernen.alpflow.net` CNAME) für Xavier.
- [ ] Abschluss: README.md (Was ist das, wie lokal starten, wie Inhalte hinzufügen → CONTENT_FORMAT.md, Deployment), finaler Commit + Push.

## Self-Review (erledigt)

- Spec-Abdeckung: §2–§14 ↔ Tasks 1–14 gemappt; PWA-Icons (Task 10), Credits-Seite (Task 10), Offline-Puffer (Task 5), Wiederholungs-Queue (Task 9) enthalten. ✔
- Platzhalter: keine TBDs; UI-Tasks definieren Verhalten + Verträge, Logik-Tasks volle Signaturen/SQL. ✔
- Typ-Konsistenz: ExerciseComponentProps einheitlich (Task 7 definiert, Task 8/9 konsumieren); Cent-Integer durchgängig; lessonSchema überall dieselbe Referenz. ✔
