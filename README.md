# Amelies Lernapp 🐴

Eine Duolingo-artige Lern-Web-App für Amelie – mobile-first, weiß/türkis, mit Pony-Maskottchen. Über 100 Lektionen mit ~950 Übungen zu Alltags- und Ausbildungsfähigkeiten für die Hauswirtschaftsschule: Putzen in der richtigen Reihenfolge, Wäsche, Servietten falten, Rechnen mit Geld, Geld verwalten, Englisch für Feriengäste und Kinderbetreuung.

**Roter Faden:** „Wie gehe ich systematisch vor?" – die richtige Reihenfolge steht überall im Mittelpunkt.

## Für wen & was ist besonders

Amelie hat Dyspraxie. Deshalb gilt in der ganzen App:

- **Nur Tippen, nie Ziehen** – kein Drag & Drop, große Buttons (min. 48 px), Aktion erst beim Loslassen
- **Kein Zeitdruck, keine Leben/Herzen** – Fehler werden freundlich (orange, nie rot) erklärt und am Ende der Lektion einfach wiederholt
- **Leichte Sprache** und ein Vorlese-Button 🔊 an jeder Aufgabe
- **Gamification, die gut tut:** XP, Level (mit Level-Up-Moment 🎉), Streak 🔥, Abzeichen – und ein Wiederholen-Menü (/wiederholen), das zeigt, was zuletzt schwergefallen ist, plus „Gemischt üben" mit Fehler-Priorisierung
- **Fehler-Ablauf:** 1. Fehler = sofort nochmal versuchen, 2. Fehler = Lösung ansehen, Übung kommt am Lektionsende wieder
- **Reset:** Im Profil kann alles auf null gesetzt werden (mit Sicherheitsabfrage)

## Technik

- **Next.js** (App Router, TypeScript, Tailwind 4, Framer Motion)
- **Supabase** (Projekt `lernapp-amelie`): Inhalte (topics → lessons → exercises), Bilder-Storage, Fortschritt/Streak über anonyme Geräte-ID – **kein Login für Amelie**
- **Admin-Bereich** `/admin` (gemeinsames Passwort): Fortschritts-Dashboard, schwierige Übungen, Publish-Schalter, Lektions-Import per JSON, Bild-Upload
- 6 Übungstypen: Schritte ordnen, Quiz, Paare/Memory, Sortieren, Geld zählen, Budget-Challenge – Format dokumentiert in [CONTENT_FORMAT.md](CONTENT_FORMAT.md)

## Lokal starten

```bash
npm install
cp .env.example .env.local   # Werte eintragen, siehe unten
npm run dev                  # http://localhost:3000
npm test                     # Vitest
```

### Umgebungsvariablen (.env.local)

| Variable | Woher |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ebenda („anon public") |
| `SUPABASE_SERVICE_ROLE_KEY` | ebenda („service_role" – geheim!). Nur nötig für Admin-Import/Upload/Publish und Seed-Skript |
| `ADMIN_PASSWORD` | frei wählen – Login für `/admin` |
| `ANTHROPIC_API_KEY` | optional: Claude Console → API Keys. Schaltet die KI-Hilfe „Pony“ ein (siehe unten) |
| `KI_TAGESLIMIT` | optional: höchstens so viele KI-Anfragen pro Tag (Standard 150) |
| `KI_MODELL` | optional: anderes Claude-Modell (Standard `claude-opus-5-5`) |

### KI-Hilfe „Pony“

Zwei Hilfen mit Claude, beide in Leichter Sprache und nur mit dem Wissen der jeweiligen Lektion:

- **„Pony, erklär’s mir“** – Knopf im orangen Banner nach einer falschen Antwort (Lektion, Üben, Prüfung). Beim Sofort-Nochmal gibt das Pony nur einen Hinweis und verrät die Lösung nicht.
- **„Frag das Pony“** – Chat zur Lektion, erreichbar auf dem Einführungs- und dem Ergebnis-Screen. Reiner Text-Chat mit Vorschlags-Knöpfen („Frag mich ab!“).

Der Server lädt die Lektion selbst aus Supabase und spricht mit Claude (`app/api/ki/*`, `lib/ki/`). Der Schlüssel bleibt auf dem Server. Kostenbremsen: Tageslimit (`KI_TAGESLIMIT`, gezählt in der Tabelle `ki_nutzung`, braucht `SUPABASE_SERVICE_ROLE_KEY`), höchstens 12 Anfragen pro Minute, kurze Antworten, Prompt-Caching. In `ki_nutzung` stehen nur Zeitpunkt, Lektion und Token-Zahlen, keine Fragen oder Antworten. Ohne `ANTHROPIC_API_KEY` sind die Pony-Knöpfe unsichtbar.

## Neue Inhalte

**Weg 1 (empfohlen):** Xavier beschreibt Claude im Chat das Thema → Claude erstellt die Lektion nach [CONTENT_FORMAT.md](CONTENT_FORMAT.md), legt sie unter `content/lessons/` ab und spielt sie direkt per Supabase ein. Kein Deploy nötig, sofort auf dem Handy.

**Weg 2:** `/admin/inhalte` → „Neue Lektion (JSON)" einfügen.

**Seed-Skript:** `npx tsx scripts/seed.ts` (validiert + upsertet alles aus `content/`; `--check` validiert nur).

## Deployment (Vercel)

1. Repo importieren: `vercel` CLI oder vercel.com → Projekt aus `xavier848/lernappAmelie`
2. Die 4 Umgebungsvariablen setzen (Production), für die KI-Hilfe zusätzlich `ANTHROPIC_API_KEY`
3. Deploy – fertig. Danach Domain zuweisen: Subdomain von alpflow.net (z. B. `lernen.alpflow.net`) als CNAME auf `cname.vercel-dns.com` + Domain im Vercel-Projekt eintragen
4. Amelie: Seite öffnen → „Zum Home-Bildschirm hinzufügen" → fühlt sich wie eine App an (PWA)

## Projekt-Dokumente

- Design-Spezifikation: [docs/superpowers/specs/2026-07-09-lernapp-amelie-design.md](docs/superpowers/specs/2026-07-09-lernapp-amelie-design.md)
- Implementierungsplan: [docs/superpowers/plans/2026-07-09-lernapp-amelie.md](docs/superpowers/plans/2026-07-09-lernapp-amelie.md)
- Inhalts-Format: [CONTENT_FORMAT.md](CONTENT_FORMAT.md)
- Lizenzen/Credits: in der App unter `/credits`
