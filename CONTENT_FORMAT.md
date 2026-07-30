# Lektions-Format – Anleitung für neue Inhalte

Dieses Dokument ist die verbindliche Referenz, wie Lektionen für Amelies Lernapp erstellt werden – von Hand, von Claude im Chat oder über den Admin-Bereich. Die technische Validierung ist `lib/content-schema.ts` (Zod); dieses Dokument beschreibt dasselbe Format menschenlesbar.

## Grundprinzipien (immer einhalten)

1. **Leichte Sprache:** Kurze Sätze. Eine Aussage pro Satz. Bekannte Wörter. „Du"-Anrede. Keine Fremdwörter ohne Erklärung.
2. **Positiv formulieren:** Nie bestrafen. Erklärungen helfen („Fast! Schau nochmal.").
3. **Reihenfolge ist der rote Faden:** Wo immer es einen Ablauf gibt → `steps_order`.
4. **Max. 6 Schritte** pro `steps_order`-Übung. Lange Abläufe in zwei Übungen teilen.
5. **6–10 Übungen pro Lektion**, mindestens 2 verschiedene Übungstypen, die letzte Übung leicht (Erfolgserlebnis).
6. **Geldbeträge immer in Cent** (Integer): 3,50 € = `350`.
7. **Emojis statt Bilder** im Text sind erlaubt und erwünscht (z. B. „🧽 Schwamm"). Das Feld `image` (URL) nur nutzen, wenn ein echtes Bild in Supabase Storage liegt.
8. **Abschluss-Niveau:** Amelie soll die Prüfung schaffen. Aufgaben anspruchsvoll, nicht kindlich-einfach: Fachbegriffe aktiv verwenden (und einmal in Leichter Sprache erklären), Anwendungs-/Transferfragen statt reiner Wiedergabe, Distraktoren plausibel und nah an der richtigen Antwort. Leichte Sprache heißt einfache SÄTZE – nicht einfacher INHALT.

## Bestehenden Stoff anders fragen (Wiederholungs-Lektionen)

Amelie sieht dieselben Übungen über `/wiederholen` und `/faellig` mehrfach. Ohne Variation lernt sie irgendwann die Form der richtigen Antwort statt den Inhalt. Eine Wiederholungs-Lektion greift deshalb vorhandenen Stoff auf und verlangt eine **andere Denkleistung** – nicht dieselbe Frage mit anderen Wörtern.

Acht Umformungen, geordnet nach Wirkung:

| Umformung | Aus … wird … |
|---|---|
| **Richtung drehen** | „Was heißt *available*?" → „Wie sagt man *frei/verfügbar*?"; Begriff→Definition wird Definition→Begriff |
| **Fehler suchen** | „Welcher Satz stimmt?" → „Welcher ist falsch?" – sie muss alle prüfen, nicht einen erkennen |
| **Typ wechseln** | Dieselbe Regel als `multiple_choice`, als `sort_buckets`, als `steps_order` |
| **Vom Fall her** | Faktenfrage → Situation: „Ein Gast sagt X. Was tust du?" |
| **Begründen** | „Was kommt zuletzt?" → „Warum kommt der Boden zuletzt?" |
| **Rückwärts vom Fehler** | „Sie gab 13,50 € statt 7,50 € zurück. Was ist ihr passiert?" |
| **Transfer** | Dieselbe Regel, anderer Raum, anderer Gast, andere Tageszeit |
| **Negativ fragen** | „Was gehört **nicht** dazu?" – sparsam, max. einmal pro Lektion, NICHT deutlich markieren |

**Richtung drehen** und **Fehler suchen** wirken am stärksten, weil beide das Auswendiglernen der Antwortform unmöglich machen. „Fehler suchen" funktioniert bei Amelie nachweislich gut (die „Richtig gebaut / Falsch gebaut"-Sortierung in `englisch-wortstellung`).

**Keine Variation** sind: dieselbe Frage umformuliert, oder dieselbe Frage mit vertauschten Antwortoptionen. Das erhöht nur die Übungszahl.

Beim Schreiben einer Wiederholungs-Lektion zuerst die bestehenden Lektionen des Bereichs lesen und die Fakten sammeln. Die neue Lektion darf dem vorhandenen Stoff **nie widersprechen** – Amelie lernt sonst beides.

## Eine Lektion (JSON)

```json
{
  "topic_slug": "badezimmer",
  "slug": "badezimmer-grundlagen",
  "title": "Das brauchst du zum Putzen",
  "sort": 1,
  "exercises": [ { "type": "…", "data": { … } } ]
}
```

- `topic_slug`: muss in `content/topics.json` existieren (bzw. in der topics-Tabelle).
- `slug`: eindeutig in der ganzen App, kleinbuchstaben-mit-bindestrich.
- `sort`: Reihenfolge innerhalb des Themas (1, 2, 3 …).

## Die 8 Übungstypen

Jede Übung: `data.prompt` (Pflicht, Leichte Sprache), optional `data.image` (URL), optional `data.tts_lang` (Default `de-DE`, für englische Inhalte `en-GB`).

**`explanation` gibt es bei allen 8 Typen** und erscheint im Feedback-Banner – auch bei richtiger Antwort. Sie ist das wichtigste Lern-Werkzeug: Ohne sie wiederholt Amelie denselben Fehler beliebig oft (Statistik 2026-07-28: 13 von 13 Versuchen an derselben Sortier-Übung falsch).

- **Erkläre die REGEL, nicht die Lösung.** Bei `steps_order`, `sort_buckets` und `match_pairs` erscheint der Banner auch beim Sofort-Retry. „Die Zeitangabe steht ganz am Ende" hilft; „Die Reihenfolge ist A, B, C" verrät nur.
- Bei `number_input`, `money_count` und `memory_game` enthält die `explanation` das Ergebnis. Der Player blendet sie deshalb beim Sofort-Retry aus (`hideOnRetry` in `LessonPlayer`), dort gibt stattdessen `hint` den Tipp.
- Guter Aufbau: erst die Regel als Frage („Frag dich: Was passiert mit dem Lebensmittel?"), dann das Unterscheidungsmerkmal, dann der häufigste Irrtum.

### 1. `steps_order` – Schritte ordnen
```json
{ "type": "steps_order", "data": {
  "prompt": "Bringe die Schritte in die richtige Reihenfolge.",
  "steps": [ { "text": "Putzmaterial holen." }, { "text": "Reiniger auftragen." }, { "text": "Spiegel putzen." } ]
} }
```
Die Reihenfolge im Array **ist** die richtige Lösung (2–10 Schritte, ideal ≤ 6). Die App mischt selbst. Variante Satzbau: `"mode": "words"` mit einzelnen Wörtern als steps (für Englisch-Sätze). Optional `explanation` (siehe unten).

### 2. `multiple_choice` – Quiz
```json
{ "type": "multiple_choice", "data": {
  "prompt": "Was machst du, während der Reiniger einwirkt?",
  "options": [
    { "text": "Den Spiegel putzen.", "correct": true },
    { "text": "Warten und nichts tun." },
    { "text": "Den Boden nass wischen." }
  ],
  "explanation": "Die Einwirkzeit kannst du nutzen. Putze in der Zeit den Spiegel."
} }
```
2–4 Optionen, **genau eine** mit `"correct": true`. `explanation` erscheint im Feedback (auch bei richtiger Antwort). 

### 3. `match_pairs` – Paare zuordnen / Memory
```json
{ "type": "match_pairs", "data": {
  "prompt": "Was gehört zusammen?",
  "pairs": [
    { "left": { "text": "🪭 Fächer" }, "right": { "text": "Festliches Essen" } },
    { "left": { "text": "🕯️ Kerze" }, "right": { "text": "Feier am Abend" } }
  ],
  "memory": false
} }
```
2–6 Paare. `left`/`right` brauchen je `text` und/oder `image`. `"memory": true` macht daraus ein Memory-Spiel mit verdeckten Karten (max. 6 Paare). Optional `explanation` (siehe unten).

### 4. `sort_buckets` – Sortieren
```json
{ "type": "sort_buckets", "data": {
  "prompt": "Sortiere die Wäsche.",
  "buckets": [
    { "id": "hell", "label": "Helle Wäsche", "icon": "⚪" },
    { "id": "dunkel", "label": "Dunkle Wäsche", "icon": "⚫" }
  ],
  "items": [
    { "text": "Weißes T-Shirt", "bucket": "hell" },
    { "text": "Schwarze Hose", "bucket": "dunkel" }
  ]
} }
```
2–3 Körbe, 2–8 Items. Jedes `item.bucket` muss eine Korb-`id` sein. Optional `explanation` (siehe unten).

**Körbe müssen sich klar ausschließen.** Zwei Körbe, die inhaltlich überlappen („Feiern" vs. „was wir gemacht haben"), sind nicht lösbar – Amelie rät dann. Prüfe jedes Item: Passt es nur in genau einen Korb?

### 5. `money_count` – Geld
Drei Modi:
```json
{ "type": "money_count", "data": { "prompt": "Welche Münze ist das?", "mode": "recognize", "moneyImage": "200", "options": [ { "text": "2 Euro", "correct": true }, { "text": "1 Euro" }, { "text": "50 Cent" } ] } }
{ "type": "money_count", "data": { "prompt": "Lege 3,50 € hin.", "mode": "assemble", "target": 350 } }
{ "type": "money_count", "data": { "prompt": "Es kostet 7,20 €. Du bekommst 10 €. Gib das Rückgeld.", "mode": "change", "price": 720, "given": 1000 } }
```
`moneyImage` = Nennwert in Cent als String (`"1"`,`"2"`,`"5"`,`"10"`,`"20"`,`"50"`,`"100"`,`"200"`,`"500"`,`"1000"`,`"2000"`,`"5000"`). Bei `change` muss `given > price` sein.

### 6. `budget` – Monats-Challenge
```json
{ "type": "budget", "data": {
  "prompt": "Du bekommst 950 €. Teile dein Geld ein.",
  "income": 95000,
  "categories": [
    { "id": "handy", "label": "Handy", "icon": "📱", "fixed": 2000 },
    { "id": "lebensmittel", "label": "Lebensmittel", "icon": "🛒" },
    { "id": "freizeit", "label": "Freizeit", "icon": "🎉" },
    { "id": "sparen", "label": "Sparen", "icon": "🐷" }
  ],
  "savingsGoal": 10000
} }
```
Alles in Cent. `fixed` = fester Betrag (nicht änderbar, z. B. Handyvertrag). `savingsGoal` (optional): Kategorie `sparen` muss mindestens diesen Betrag bekommen. Richtig = Gesamtausgaben ≤ Einnahmen (und Sparziel erfüllt, falls gesetzt).

### 7. `number_input` – Kopfrechnen (Antwort eintippen)
```json
{ "type": "number_input", "data": {
  "prompt": "Rechne im Kopf: 34 + 3 + 7 + 8 = ?",
  "answer": 52,
  "hint": "Rechne Schritt für Schritt:\n34 + 3 = 37\n37 + 7 = 44\n44 + 8 = ?",
  "explanation": "34 + 3 + 7 + 8 = 52. Schritt für Schritt geht es am leichtesten."
} }
```
Die Antwort wird über einen großen Ziffernblock eingetippt (kein Raten möglich). `answer` = ganze Zahl ≥ 0. `hint` (optional, mit `\n` für Zeilenumbrüche) erscheint automatisch ab dem zweiten Versuch. Aufgaben am besten mit `scripts/gen-kopfrechnen.mjs` generieren – dann sind alle Antworten rechnerisch garantiert richtig.

### 8. `memory_game` – Gedächtnistraining
```json
{ "type": "memory_game", "data": {
  "prompt": "Merke dir die 3 Zahlen in der richtigen Reihenfolge.",
  "mode": "reihenfolge",
  "items": [ { "text": "3" }, { "text": "7" }, { "text": "1" } ],
  "explanation": "Die richtige Reihenfolge war: 3  7  1."
} }
{ "type": "memory_game", "data": {
  "prompt": "Schau dir die 4 Bilder gut an. Gleich fehlt eines davon!",
  "mode": "fehlt",
  "items": [ { "text": "🍎" }, { "text": "🥛" }, { "text": "🔑" }, { "text": "🧦" } ],
  "distractors": [ { "text": "🍌" }, { "text": "☕" } ]
} }
```
Merkphase ohne Zeitdruck (endet erst mit „Ich hab's mir gemerkt"). `mode: "reihenfolge"`: Items gemischt in gemerkter Reihenfolge antippen; `"reverse": true` = rückwärts (schwerer). `mode: "fehlt"` (Kim-Spiel): ein zufälliges Item verschwindet, aus 3 Optionen wählen — braucht genau 2 `distractors` (nicht in `items`). 3–6 Items, alle eindeutig. Lektionen generiert `scripts/gen-gedaechtnis.mjs`.

## Wie neue Lektionen in die App kommen

**Weg A – Claude im Chat (empfohlen):** Xavier beschreibt das Thema (oder leitet Nachrichten der Mutter weiter). Claude erstellt die Lektion nach diesem Format, validiert sie gegen `lib/content-schema.ts` und spielt sie direkt per Supabase MCP ein (Tabellen `lessons` + `exercises`, `topic_slug` → `topic_id` auflösen; neues Thema vorher in `topics` anlegen). Zusätzlich die JSON-Datei unter `content/lessons/<topic>/<slug>.json` ins Repo legen (Quelle der Wahrheit, für Seed reproduzierbar).

**Weg B – Admin-Bereich:** `/admin/inhalte` → „Neue Lektion (JSON)" → einfügen → validiert automatisch → gespeichert.

**Seed-Skript:** `npx tsx scripts/seed.ts` liest `content/topics.json` + `content/lessons/**/*.json`, validiert alles und upsertet idempotent in Supabase. `npx tsx scripts/seed.ts --check` validiert nur (CI-tauglich).

⚠️ **Bestehende Übungen NIE löschen und neu einfügen.** `exercise_attempts.exercise_id` hängt per `ON DELETE CASCADE` an `exercises` – ein `delete from exercises …` reißt Amelies komplette Versuchs-Historie mit: Mamas Statistik unter `/amelie-fortschritt` und die fällige Wiederholung (`lib/spaced.ts`) verlieren dann still ihre Grundlage. Beim Nachpflegen einer Lektion also per `update … where lesson_id = … and sort = …` arbeiten (oder `jsonb_set`, wenn nur ein Feld dazukommt). `scripts/seed.ts` macht das seit 2026-07-28 selbst so; Übungen werden nur gelöscht, wenn eine Lektion tatsächlich kürzer geworden ist.
