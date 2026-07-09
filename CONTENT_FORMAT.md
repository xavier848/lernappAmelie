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

## Die 6 Übungstypen

Jede Übung: `data.prompt` (Pflicht, Leichte Sprache), optional `data.image` (URL), optional `data.tts_lang` (Default `de-DE`, für englische Inhalte `en-GB`).

### 1. `steps_order` – Schritte ordnen
```json
{ "type": "steps_order", "data": {
  "prompt": "Bringe die Schritte in die richtige Reihenfolge.",
  "steps": [ { "text": "Putzmaterial holen." }, { "text": "Reiniger auftragen." }, { "text": "Spiegel putzen." } ]
} }
```
Die Reihenfolge im Array **ist** die richtige Lösung (2–10 Schritte, ideal ≤ 6). Die App mischt selbst. Variante Satzbau: `"mode": "words"` mit einzelnen Wörtern als steps (für Englisch-Sätze).

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
2–6 Paare. `left`/`right` brauchen je `text` und/oder `image`. `"memory": true` macht daraus ein Memory-Spiel mit verdeckten Karten (max. 6 Paare).

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
2–3 Körbe, 2–8 Items. Jedes `item.bucket` muss eine Korb-`id` sein.

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

## Wie neue Lektionen in die App kommen

**Weg A – Claude im Chat (empfohlen):** Xavier beschreibt das Thema (oder leitet Nachrichten der Mutter weiter). Claude erstellt die Lektion nach diesem Format, validiert sie gegen `lib/content-schema.ts` und spielt sie direkt per Supabase MCP ein (Tabellen `lessons` + `exercises`, `topic_slug` → `topic_id` auflösen; neues Thema vorher in `topics` anlegen). Zusätzlich die JSON-Datei unter `content/lessons/<topic>/<slug>.json` ins Repo legen (Quelle der Wahrheit, für Seed reproduzierbar).

**Weg B – Admin-Bereich:** `/admin/inhalte` → „Neue Lektion (JSON)" → einfügen → validiert automatisch → gespeichert.

**Seed-Skript:** `npx tsx scripts/seed.ts` liest `content/topics.json` + `content/lessons/**/*.json`, validiert alles und upsertet idempotent in Supabase. `npx tsx scripts/seed.ts --check` validiert nur (CI-tauglich).
