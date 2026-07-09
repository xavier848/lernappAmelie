# Lernapp Amelie – Design-Spezifikation

**Datum:** 2026-07-09 · **Status:** Freigegeben durch Xavier · **Repo:** github.com/xavier848/lernappAmelie

## 1. Zweck & Zielgruppe

Duolingo-artige Lern-Web-App (mobile-first PWA) für Amelie, eine junge Frau mit **Dyspraxie**, die eine zweijährige **Hauswirtschaftsschule** besucht. Die App vermittelt Alltags- und Ausbildungsfähigkeiten. Roter Faden: **„Wie gehe ich systematisch vor?"** – die richtige Reihenfolge steht bei fast jedem Thema im Mittelpunkt (Putzen, Wäsche, Geld, Kinderbetreuung).

Genau **eine Lernende** (Amelie, ohne Login), plus passwortgeschützter Admin-Bereich für Xavier und seine Mutter.

## 2. Nicht verhandelbare UX-Regeln (Dyspraxie)

1. **Tap statt Drag – überall.** Keine Übung erfordert Ziehen (WCAG 2.5.7). Ordnen = Karten antippen, Zuordnen = Element antippen → Ziel antippen.
2. **Große Ziele:** interaktive Elemente min. 48×48 px, Antwortkarten min. 64 px hoch / volle Breite, min. 8 px Abstand zwischen Zielen, 16 px+ zu Bildschirmkanten.
3. **Auslösen erst beim Loslassen** (`click`/`touchend`, nie `touchstart`). Keine Swipe-/Pinch-Pflicht. Navigation nur über Buttons.
4. **Keine Zeitlimits, kein Datenverlust:** kein Countdown, Auto-Save, Teilpunkte statt alles-oder-nichts, falsche Übungen werden am Lektionsende wiederholt (kein Leben-/Herzen-System).
5. **Leichte Sprache + konsistentes Layout:** kurze Sätze (eine Aussage pro Satz), einfache Wörter, linksbündig, ≥16 px Open Sans; Buttons immer an derselben Position; Icons immer mit Text; Türkis nur für Flächen/Akzente – Fließtext dunkel (Kontrast ≥ 4.5:1).
6. **Vorlese-Button** 🔊 an jeder Aufgabe (Web Speech API, `de-DE`; bei Englisch-Übungen `en-GB` für die Fremdsprachen-Teile).

## 3. Design-System

- **Farben:** Weißer Hintergrund (`#ffffff`), Primär-Türkis `#14b8a6` (Buttons/Flächen), Türkis-Dunkel `#0f766e` (Hover/gedrückt, Button-Unterkante 3D-Effekt wie Duolingo), Türkis-Hell `#f0fdfa` (Karten-Hintergründe), Text `#1e293b`, Erfolg `#22c55e`, Fehler-Feedback **sanftes Orange** `#f97316` (nie rot/aggressiv), Grau `#e2e8f0` (gesperrte Lektionen).
- **Schrift:** Open Sans (next/font, self-hosted), Basis 16 px, Aufgaben-Prompts 20 px+.
- **Buttons:** Duolingo-Stil – abgerundet (rounded-2xl), satte Fläche, dunklere Unterkante (border-b-4), Press-Animation (translate-y). Primär türkis/weißer Text; Sekundär weiß/türkiser Rand.
- **Maskottchen:** Pony mit Buch (assets/maskottchen-original.png, wird freigestellt). Erscheint: Startseite (Begrüßung), Ergebnis-Screen (Lob), leere Zustände. Sprechblasen in Leichter Sprache.
- **Animationen:** Framer Motion – Karten-Flip (Memory), sanfte Übergänge, Konfetti bei Lektionsabschluss. Alle Animationen dekorativ, nie Interaktions-Voraussetzung. `prefers-reduced-motion` respektieren.

## 4. Screens

### 4.1 Lernpfad `/` (Startseite)
Vertikaler Pfad von Lektions-Kreisen, gruppiert in Themen-Abschnitte mit Header (Icon + Titel). Zustände: ✅ abgeschlossen (türkis, Häkchen, 1–3 Sterne), ▶️ aktuell (groß, pulsierend), 🔒 gesperrt (grau; Lektionen innerhalb eines Themas linear freischalten, Themen selbst sind alle frei wählbar). Sticky-Header: Streak-Flamme 🔥 + Zahl, XP-Stand, Level. Maskottchen begrüßt oben.

### 4.2 Lektions-Player `/lektion/[slug]`
Eine Übung pro Screen. Oben: Fortschrittsbalken + Schließen-X (mit „Wirklich beenden?"-Dialog, Fortschritt der Session geht sonst verloren – Hinweis in Leichter Sprache). Mitte: Übung. Unten: großer „Prüfen"-Button (min. 56 px hoch, volle Breite). Feedback als Bottom-Banner: Grün „Richtig! 🎉" / Orange „Fast! Schau nochmal." mit Erklärung + „Weiter"-Button. Falsche Übungen werden ans Ende der Warteschlange gehängt. Lektion endet, wenn alle Übungen richtig gelöst.

### 4.3 Ergebnis-Screen
Konfetti, Maskottchen lobt („Super, Amelie!"), verdiente XP, Sterne (3 = alles beim ersten Versuch, 2 = max. 2 Wiederholungen, 1 = geschafft), ggf. neues Abzeichen, „Weiter lernen"-Button → Lernpfad.

### 4.4 Profil `/profil`
Streak-Kalender (Monatsansicht, gelernte Tage markiert), Level + XP-Balken zum nächsten Level, Abzeichen-Galerie (erreicht farbig, offen grau mit Beschreibung).

### 4.5 Admin `/admin` (passwortgeschützt)
- **Login:** ein gemeinsames Passwort (ENV `ADMIN_PASSWORD`), HTTP-only-Cookie-Session.
- **Dashboard:** Lektionen abgeschlossen (pro Thema), aktueller Streak, XP-Verlauf, „Schwierige Übungen" (höchste Fehlerquote, min. 3 Versuche) → Grundlage für gezielte neue Übungen.
- **Inhalte:** Themen-/Lektionsliste mit Publish-Toggle, „Lektion als JSON einfügen" (Textarea + Validierung gegen Schema + Vorschau), Bild-Upload in Supabase Storage (gibt URL zum Einfügen zurück).

## 5. Übungstypen (6)

Alle Tap-only. Jede Übung: `prompt` (Leichte Sprache), optional `image`, optional `tts_lang` (Default `de-DE`).

1. **`steps_order` – Schritte ordnen** (Kern-Übungstyp). Gemischte Karten unten, Antippen → Karte wandert in nummerierte Antwortliste, erneut antippen → zurück. Prüfen: Teilpunkte pro korrektem Paar aufeinanderfolgender Schritte. Variante `mode: "words"`: englischen/deutschen Satz aus Wort-Bausteinen zusammentippen (Duolingo-Word-Bank).
2. **`multiple_choice` – Quiz.** 2–4 große Antwortkarten (Text und/oder Bild), genau eine richtig. Optional `explanation` (wird im Feedback-Banner gezeigt).
3. **`match_pairs` – Paare zuordnen.** Zwei Spalten (Bild↔Text oder Text↔Text), links eins antippen → rechts eins antippen; richtig = Paar verschwindet mit Animation, falsch = kurzes Schütteln, kein Malus außer Statistik. Variante `memory: true`: Karten verdeckt als Memory-Raster (max. 6 Paare).
4. **`sort_buckets` – Sortieren.** 2–3 Körbe (große Ziel-Buttons oben), Items einzeln nacheinander präsentiert oder als Liste; Item antippen → Korb antippen. Beispiel: Wäsche nach 30°/60°/Feinwäsche; Wunsch vs. Bedürfnis.
5. **`money_count` – Geld.** Modi: `recognize` (Welche Münze/Schein ist das? → multiple choice mit Geld-Bildern), `assemble` (Betrag legen: Münz-/Schein-Buttons unten, Antippen fügt in „Hand" hinzu, dort Antippen entfernt; Ziel-Betrag + laufende Summe groß sichtbar), `change` (Wechselgeld: Preis + gegebener Betrag angezeigt, Rückgeld legen). Beträge in Cent (Integer!), Anzeige via `Intl.NumberFormat de-DE EUR`.
6. **`budget` – Monats-Challenge.** Einnahme vorgegeben (z. B. 950 €), Kategorien-Liste (Sparen, Lebensmittel, Kleidung, Freizeit, Pferd, …) mit großen −/+ Steppern (10-€-Schritte, min. 48 px). Live-Anzeige „Noch übrig: X €" (türkis solange ≥ 0, orange wenn < 0). Prüfen: ✔️ im Budget geblieben (+ Bonus wenn Sparziel erfüllt) / ⚠️ mehr ausgegeben als eingenommen → nochmal versuchen. Ergebnis als einfaches Balken-Diagramm.

**Scoring einheitlich:** Übung richtig beim 1. Versuch = 10 XP, nach Wiederholung = 5 XP, Lektions-Bonus 20 XP. Teilpunkte intern für Statistik, nach außen immer positiv formuliert.

## 6. Datenmodell (Supabase)

```sql
topics(id uuid pk default gen_random_uuid(), slug text unique, title text, icon text, sort int, published bool default true)
lessons(id uuid pk, topic_id uuid fk→topics, slug text unique, title text, sort int, published bool default true, created_at timestamptz default now())
exercises(id uuid pk, lesson_id uuid fk→lessons, sort int, type text check in (6 Typen), data jsonb)
devices(id uuid pk, label text, created_at)            -- Amelies Handy registriert sich beim 1. Besuch selbst
progress(id uuid pk, device_id fk, lesson_id fk, stars int, xp int, completed_at timestamptz, unique(device_id, lesson_id) → bei Wiederholung Upsert auf bestes Ergebnis)
exercise_attempts(id uuid pk, device_id fk, exercise_id fk, correct bool, created_at)  -- für „Schwierige Übungen"
daily_activity(device_id fk, day date, xp int, primary key(device_id, day))            -- Streak-Basis
```

- **RLS:** `topics/lessons/exercises`: anon SELECT nur `published = true`. `devices/progress/exercise_attempts/daily_activity`: anon INSERT/UPSERT/SELECT (Geräte-ID ist client-generierte UUID in localStorage; Bedrohungsmodell = Familien-App, das reicht). Schreiben auf Content-Tabellen NUR über Server-Routes mit Service-Role-Key (hinter Admin-Cookie).
- **Storage:** Bucket `images` (public read), Upload nur über Admin-Route.
- **Streak-Logik client/server:** Streak = Anzahl aufeinanderfolgender Tage (Europe/Berlin) mit Eintrag in `daily_activity` bis heute/gestern.

## 7. Content-Format (KI-Pipeline)

Dokumentiert in `CONTENT_FORMAT.md` im Repo-Root (Single Source of Truth, von Claude direkt nutzbar). Eine Lektion = ein JSON:

```json
{
  "topic_slug": "badezimmer",
  "slug": "badezimmer-reinigen-1",
  "title": "Das Badezimmer putzen",
  "sort": 1,
  "exercises": [
    { "type": "steps_order", "data": { "prompt": "Bringe die Schritte in die richtige Reihenfolge.", "steps": [{"text": "Putzmaterial holen."}, {"text": "Reiniger auftragen."}] } },
    { "type": "multiple_choice", "data": { "prompt": "Was machst du, während der Reiniger einwirkt?", "options": [{"text": "Spiegel putzen", "correct": true}, {"text": "Warten und nichts tun"}], "explanation": "Einwirkzeit klug nutzen: In der Zeit den Spiegel putzen." } }
  ]
}
```

**Workflows für neue Inhalte:** (a) Xavier + Claude im Chat → Claude validiert gegen Schema und schreibt direkt via Supabase MCP in die DB → sofort live, kein Deploy. (b) Admin-UI „JSON einfügen". Zod-Schema in `lib/content-schema.ts` ist die Referenz-Validierung (auch von der Admin-Route genutzt).

## 8. Themen & Lektionen zum Start (Inhalts-Inventar)

Aus den Nachrichten der Mutter, in 5 Themen-Gruppen (= Pfad-Abschnitte):

**🧽 Putzen & Ordnung:** 1. Badezimmer (Putzmittel-Quiz, Reihenfolge, Einwirkzeit-Logik) · 2. Schlafzimmer/Gästezimmer (Bettwäsche zuerst!, Reihenfolge, Endkontrolle) · 3. Wohnzimmer (Reihenfolge, Deko, Polster) · 4. Küche (Reihenfolge, Kühlschrank-Kontrolle) · 5. Ferienwohnung komplett (Gesamtablauf, Material-Checkliste, Arbeiten verbinden) · 6. Wäsche (sortieren nach Temperatur/Art, Programm-Wahl, Trockner ja/nein, zusammenlegen, einräumen)

**🍽️ Tisch & Gäste:** 7. Servietten falten (Formen↔Namen, Memory, welcher Anlass) · 8. Handtücher falten (Techniken↔Namen, Memory, welcher Raum, Schrank einräumen) · 9. Englisch für die Ferienwohnung (Begrüßung/Schlüssel, Check-in/Check-out-Fragen verstehen, Zahlen & Uhrzeiten, Frühstück, Verabschiedung – match_pairs DE↔EN, Quiz „Was antwortest du?", Wort-Bausteine-Sätze, TTS englisch)

**💶 Geld:** 10. Rechnen mit Geld (4 Lektionen aufsteigend: Münzen & Scheine kennen → Beträge legen → Wechselgeld → Taschengeld-Aufgaben) · 11. Geld selbst verwalten (Einnahmen-Arten, feste vs. variable Ausgaben [sort_buckets], Wünsche vs. Bedürfnisse [sort_buckets mit Bildern], Sparziele-Rechnen [„600 € Ziel, 50 €/Monat → wie lange?"], Konten verstehen [Girokonto/Sparkonto/Dauerauftrag/Überweisung/Lastschrift – Quiz+Zuordnen], Budget planen [Rechen-Quiz], Preise vergleichen [Kilopreis, Angebote], Monats-Challenge [budget-Übung, 950 €])

**🧒 Kinder betreuen:** 12. Motorische Entwicklung (steps_order: Bauchlage→…→Rennen; Feinmotorik-Reihenfolge Greifen→…→Schleife; Quiz) · 13. Sprachentwicklung (Reihenfolge Lallen→Erste Wörter→Zweiwortsätze→…; Quiz) · 14. Spielen & Denken lernen (kognitiv: Farben/Formen/Mengen; sozial: allein→nebeneinander→miteinander [steps_order]; Quiz) · 15. Gefühle erkennen (Freude/Trauer/Wut/Angst zuordnen, Bilderbuch-Situationen-Quiz, Trotzphase) · 16. Sinne & Wahrnehmung (Sinn↔Beispiel zuordnen: Fühlkiste→Tasten, Gewürze raten→Riechen; Quiz) · 17. Sicherheit mit Kindern (Straßenverkehr-Quiz: abgewandte Seite, links-rechts-links, nicht zwischen Autos; Gefahren-Quiz: Schere, heiße Töpfe, Verschlucken; Aufsicht) · 18. Mit Kindern sprechen (ruhig, einfache Sätze, Blickkontakt, Lob, Grenzen – Quiz + Zuordnen gut/nicht gut [sort_buckets]) · 19. Was wird gefördert? (Aktivität→Förderbereich: Perlen auffädeln→Feinmotorik, Balancieren→Gleichgewicht, Singen→Sprache … als Quiz und match_pairs; direkt nach den Vorlagen der Mutter) · 20. Alltag & Hygiene mit Kindern (Hände waschen, Niesetikette, wettergerechte Kleidung, kleine Erste Hilfe; Auffälligkeiten: nur wahrnehmen & Fachkraft sagen – Quiz)

**Jede Lektion:** 6–10 Übungen, Mix aus min. 2 Übungstypen. Alle Texte in Leichter Sprache. Später kommen laufend weitere Themen dazu (Xavier liefert Material, Claude erstellt Lektionen).

## 9. Gamification

- **XP & Level:** Level-Schwelle = `level * 100 XP` kumulativ. Level-Up-Animation im Ergebnis-Screen.
- **Streak:** Tage in Folge mit ≥ 1 abgeschlossenen Lektion. Anzeige 🔥 + Kalender im Profil. Kein Streak-Verlust-Drama: Verlust wird neutral angezeigt („Neue Serie starten!").
- **Abzeichen:** „Erste Lektion", pro Thema „[Thema]-Profi" (alle Lektionen), Streak 3/7/14/30, XP 100/500/1000/2500, „Geld-Meister" (alle Geld-Themen), „Kinder-Profi". Definiert in Code (`lib/badges.ts`), berechnet aus progress-Daten.

## 10. Tech-Stack & Struktur

- **Next.js 15 (App Router, TypeScript), Tailwind CSS 4, Framer Motion, Supabase JS v2, Zod.** Kein Auth-Framework (Geräte-ID + Admin-Cookie reichen). Keine DnD-Library.
- **PWA:** `manifest.json` (Name „Amelies Lernapp", Maskottchen-Icon, standalone, Theme-Color türkis), Apple-Touch-Icons, Meta-Tags. Service Worker optional minimal (App-Shell-Cache); Übungsdaten brauchen Netz.
- **Geld-Assets:** Eigene stilisierte SVG-Scheine (klar als Illustration erkennbar, umgeht EZB-Regeln) + SVG-Münzen (nach Wikimedia-CC0-Vorbild). Als React-Komponenten (`components/money/`).
- **Struktur:** `app/` (Routen: `/`, `/lektion/[slug]`, `/profil`, `/admin/*`, API-Routes `api/admin/*`) · `components/exercises/` (6 Übungs-Komponenten + `ExercisePlayer`) · `components/ui/` (Button, Card, ProgressBar, FeedbackBanner, Mascot, TTSButton) · `lib/` (supabase.ts, content-schema.ts, scoring.ts, streak.ts, badges.ts, device.ts, tts.ts) · `content/` (Lektions-JSONs als Quelle + Seed-Skript `scripts/seed.ts`).
- **Env:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`.

## 11. Fehlerbehandlung

- Kein Netz / Supabase down: freundlicher Leerzustand mit Maskottchen („Gerade klappt es nicht. Versuch es später nochmal."), Retry-Button. Fortschritts-Writes werden bei Fehler in localStorage gepuffert und beim nächsten Erfolg nachgereicht.
- Ungültiges Lektions-JSON (Admin/MCP): Zod-Fehler in verständlicher Form, nichts wird halb gespeichert (eine Lektion = eine Transaktion).
- TTS nicht verfügbar: Button ausblenden, keine Fehlermeldung.

## 12. Tests & Verifikation

- **Vitest-Unit-Tests** für die Logik: scoring (Teilpunkte steps_order), Wechselgeld-/Budget-Mathe (Cent-Integer!), Streak-Berechnung (Zeitzonen-Kanten), Zod-Content-Schema (gültige + ungültige Lektionen), Badge-Vergabe.
- **Manuelle Verifikation** per Preview: mobile Viewport (375 px), jeden Übungstyp einmal durchspielen, Admin-Flow, Lighthouse-Kontrast-Check.

## 13. Deployment

1. GitHub `xavier848/lernappAmelie` (Push nach jedem Meilenstein).
2. Vercel-Projekt, ENV-Variablen setzen.
3. Subdomain von alpflow.net (z. B. `lernen.alpflow.net`) – DNS-CNAME auf Vercel; macht Xavier am Ende, App funktioniert bis dahin unter `*.vercel.app`.

## 14. Lizenz-Regeln (aus der Recherche, bindend)

- UI-Muster von `bryanjenningz/react-duolingo` (MIT) – Muster/Idee übernehmen ist ok, bei direkter Code-Übernahme MIT-Notiz in LICENSE/Credits.
- Kein Code von AGPL-Projekten (LibreLingo u. a.) und vom CodeWithAntonio-Repo (keine Lizenz).
- Bilder: CC0 (Openclipart, publicdomainvectors) bevorzugt; Pixabay/Pexels/Unsplash ok (Download + Selbst-Hosting); CC-BY nur mit Credits-Seite (`/credits`: Urheber + Lizenz + Link). Keine NC/ND-Bilder. ARASAAC (CC BY-NC-SA) nur solange App nicht kommerziell, mit Namensnennung.
- Keine fotorealistischen Euro-Schein-Grafiken selbst zeichnen; stilisierte eigene SVGs oder EZB-Specimen-Bilder.
- Fremde Lehrtexte (HAMET, Steinfels, hauswirtschaft.info, ANTON): nur Didaktik/Struktur als Inspiration, alle Texte selbst in Leichter Sprache formulieren, Fotos selbst machen.
