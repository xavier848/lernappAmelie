# Amelies Lernstand – Analyse vom 15. September 2026

Datenbasis: alle Versuche (`exercise_attempts`), abgeschlossene Lektionen (`progress`), Tagesaktivität und Lernfluss-Ereignisse von Amelies Geräte-ID in Supabase, Stand 15.09.2026. Ausgewertet per SQL, nicht über die App-Statistik (die sieht nur die neuesten 1000 Versuche).

## 1. Was Amelie bisher gemacht hat

| Kennzahl | Wert |
|---|---|
| Aktive Tage seit 11.07. | 41 |
| Versuche gesamt | 2 598 |
| Trefferquote gesamt | 64 % |
| Abgeschlossene Lektionen | 82 von 378 |
| davon 3 Sterne / 2 Sterne / 1 Stern | 14 / 36 / 32 |
| Angefangene, nie beendete Lektionen | 3 „echte" Abbrüche (siehe Abschnitt 3) |

**Verlauf.** Vom 11. bis 21. Juli hat sie sehr viel gespielt (bis zu 264 Versuche am Tag), fast nur Englisch und Niederländisch. Seit August sind es 2–3 Sitzungen pro Woche mit 15–75 Versuchen. Seit dem 3. September: Warenwirtschaft, Österreichisch (3 Lektionen), Kinder-Sinne, Kinder-Sprechen und tägliche Wiederholungen über „Fällig".

**Wo sie in den aktiven Themen steht (die erste offene Lektion je Thema = das, was die App ihr als Nächstes zeigt):**

| Thema | fertig | aktuelle Stelle |
|---|---|---|
| Englisch | 26 / 50 | „Wortstellung üben" (2× angefangen, 96 Versuche, 75 falsch, nie geschafft) |
| Niederländisch | 15 / 31 | „Satzstellung im Niederländischen" (seit 24.08. nicht mehr angefasst) |
| Österreichisch | 3 / 11 | „Lei, nit, nix" |
| Warenwirtschaft | 1 / 10 | „Preise vergleichen" (angefangen, 25 Versuche, 17 falsch) |
| Abfall & Nachhaltigkeit | 3 / 5 | „Müll richtig trennen" |
| Kinder-Gefühle | 2 / 5 | „Trösten wie ein Profi" (angefangen am 26./30.07., 74 Versuche, 51 falsch, nie geschafft) |
| Kinder-Sprechen | 3 / 4 | letzte Lektion |
| Geld rechnen | 2 / 12 | „Rückgeld geben und kontrollieren" |

## 2. Stärken

- **Quiz-Fragen (Multiple Choice)** in den Alltagsthemen sitzen: Kinder-Alltag 100 %, Kinder-Sicherheit 82 %, Englisch 81 %, Lebensmittelkunde 80 %.
- **Kopfrechnen** mit Eintippen: 89 %.
- **Vokabel-Erkennen** (englischer Satz → deutsche Bedeutung) funktioniert, sobald es reine Wiedererkennung ist.
- **Englisch-Basis** (Begrüßen, Fragen verstehen, Probleme lösen) hat sie mit 3 Sternen.

## 3. Schwächen und die Muster dahinter

### 3.1 Englische Wortstellung – die größte Baustelle

Sie überträgt die deutsche Reihenfolge auf Englisch. Die Fehler sind über Wochen stabil, nicht zufällig:

| Fehler | Beispiel (ihre Antwort) | Häufigkeit |
|---|---|---|
| Zeit in die Mitte (deutsch: „nächste Woche frei") | *The apartment is next week free* | 22 von 30 |
| Zeit vor Ort (deutsch: „um sechs zum Flughafen") | *Your taxi takes you at six to the airport* | 8 von 10 |
| Tun-Wort ans Ende (deutsch: „hinter dem Haus parken") | *You can behind park the house* | 6 von 15 |
| Person ans Ende der Frage | *When would like come to you* / *When do arrive your guests* | 6 von 10, 5 von 6 |
| Sätze nach deutschem Muster als „richtig" sortiert | *I clean every morning the bathroom* → „Richtig gebaut" | 18 von 18 |
| Vokabel nicht als Tun-Wort erkannt | *We booking your confirm* | 8 von 12 |
| Wort unbekannt (spare, keep) | *We keep two office keys in the spare* | 10 von 12 |
| Uhrzeit past/to | *a quarter past seven* ↔ 7:45 | 19 von 39 |

Die Lektion „Wortstellung üben" (sort 27) ist genau daran gescheitert, und weil eine Lektion erst endet, wenn jede Übung richtig ist, blieb sie zweimal hängen und hat abgebrochen. Seitdem ist Englisch für sie blockiert.

### 3.2 Sortier-Übungen: Stichwort statt Wirkung

Sortieren ist über alle Fachthemen ihr schwächster Übungstyp (Badezimmer 8 %, Kinder-Gefühle 8 %, Arbeitssicherheit 10 %, Hygiene 17 %, Österreichisch 19 %, Warenwirtschaft 0 %). Das Muster: Sie sortiert nach einem Wort im Satz, nicht nach dem, was der Satz bewirkt.

- „Das tut weh, oder?" → „Das verletzt" (weil *weh* drinsteht); „Ein großes Kind weint doch nicht!" → „Das tröstet" (klingt freundlich). 21 von 21 falsch.
- „Verschüttetes sofort aufwischen" → „Gefährlich" (weil *verschüttet*); „Fleisch bis 80 Grad durchgaren" → „So wird es gefährlich" (weil *80 Grad*).
- „Auf den Grundpreis pro Kilo achten" → „Trick des Ladens" (weil *Grundpreis* ein Laden-Wort ist); „Einkaufszettel schreiben" → „Trick".
- „Speiseöl, 750 ml" → „pro Kilogramm" (750 klingt nach Gewicht).

Was nachweislich hilft: eine **Kontrollfrage**, die sie sich bei jedem Item stellen kann („Wer macht das?", „Darf das Gefühl da sein?", „Wird es dadurch trocken oder nass?"). Die Lektion „Trösten üben" wurde genau so gebaut, liegt aber *hinter* der Lektion, an der sie hängt. Sie hat sie nie erreicht.

### 3.3 Vokabeln, die sich gegenseitig stören

- Englisch: *hungry* → Bäckerei; *Did you sleep well?* → *I am fine*; *available/confirmation/booking* durcheinander; *Enjoy your stay* → Abreise.
- Österreichisch: *Griaß enk* → Abschied, *Pfiat di* → Begrüßung; *Leit* → eine Person; *a* = auch/ein genau verkehrt herum; *wor* → „weiß"; *hom/host/san/konnst* der falschen Person zugeordnet.
- Fachwörter: Griffzone ↔ „Ware an der Kasse"; Grundpreis ↔ Schrumpfpackung; Hersteller/Verbraucher/Entsorger vertauscht; Mehrweg-Lösungen ohne Funktions-Logik (Einweg-Flasche ↔ Stofftuch).

### 3.4 Abläufe (Schritte ordnen)

Bei deutschen Abläufen setzt sie den „körperlichen" Schritt vor den „sozialen": trösten vor in-die-Hocke-gehen, Hände waschen vor Mund abwischen, rechts-links-links statt links-rechts-links. Bei Rezepten fehlt das Prinzip (Mehlschwitze: Mehl vor Flüssigkeit). Hier helfen Erklärungen, die die *Regel* nennen – die meisten dieser Übungen hatten bisher keine.

### 3.5 Weitere Baustellen (nicht in diesem Paket)

- **Rückgeld** (money_count „change"): 11 von 13 falsch bei 20 € − 12,50 €. Die nächste offene Lektion in „Geld rechnen" ist bereits „Rückgeld geben und kontrollieren" – sie muss sie nur spielen.
- **Zahlen merken (5 Ziffern)**: ~50 %. Das ist Arbeitsgedächtnis-Training, kein Prüfungsstoff.
- **Niederländisch** ruht seit 24.08.; Satzstellung dort hat dieselben Muster wie im Englischen. Erst Englisch sichern, dann übertragen.

## 4. Was jetzt gemacht wurde (Stand dieses Commits)

Leitidee: **nicht ans Ende anhängen, sondern an die aktuelle Stelle**. Die App zeigt je Thema die erste offene Lektion. Neue Lektionen bekommen deshalb genau diese Sortier-Nummer; alles dahinter rückt auf.

### Englisch (vier neue Lektionen um die Wortstellung herum)

| sort | Lektion | Ziel |
|---|---|---|
| 27 | **Die Zeit steht ganz hinten** (neu) | Fehler 1 und 2: Zeit nie in die Mitte, erst wo, dann wann |
| 28 | **can, will, do: Danach kommt sofort das Tun-Wort** (neu) | Fehler 3 und 4: Modalverb + Verb, Person in der Frage |
| 29 | **Wörter, die dich stolpern lassen** (neu) | confirm/booking, spare/keep, hungry/bakery, sleep well, available |
| 30 | Wortstellung üben (bisher 27) | wird zur Prüfung nach den drei Brücken |
| 31 | **Uhrzeiten: past und to** (neu) | 19 von 39 falsch, wird bis heute in „Fällig" wiederholt |
| 32–54 | alle bisherigen Lektionen ab 28 | +4 verschoben |

Jede Sortier-Übung darin hat eine Kontrollfrage in der Erklärung („Lies nur das letzte Wort", „Lies die ersten drei Wörter").

### Österreichisch

- sort 4 **Griaß di oder Pfiat di? Alles nochmal, anders gefragt** (neu): Kommen/Gehen, di/enk/Leit, a = ein/auch mit der Regel „schau, was davor steht", Helfer-Wörter über die Endung -st, wor/woaß. Lektionen 4–11 rücken auf 5–12.

### Warenwirtschaft

- sort 12 **Fachwörter im Supermarkt** (neu, vor „Preise vergleichen"): sechs Fachwörter einzeln mit Merkhilfe, Trick/Schutz mit der Frage „Wer macht das?", Kilo/Liter mit der Frage „wiegen oder gießen?".

### Abfall & Nachhaltigkeit

- sort 205 **Andersherum gefragt: Müll und Mehrweg** (neu, vor „Müll richtig trennen"): Duales System als Sortierung, Mehrweg mit „gleiche Arbeit, nur öfter", Entsorgungsplan mit „Mensch, Ort oder Behälter?".

### Kinder-Gefühle

- **Reihenfolge getauscht**: „Trösten üben" (die Lektion mit der Kontrollfrage „Darf das Gefühl da sein?") ist jetzt sort 3 und damit ihre aktuelle Lektion; „Trösten wie ein Profi" rückt auf 4. Keine neue Lektion nötig, die passende gab es schon – nur an der falschen Stelle.

### Erklärungen an den Fallen-Übungen (in bestehenden Lektionen, Übungen bleiben erhalten)

Bei zehn Übungen, an denen sie wiederholt scheitert, fehlte die Erklärung ganz oder sie nannte keine Regel. Jetzt steht dort die Kontrollfrage: englische Uhrzeiten, *sleep well*, *hungry*, *Enjoy your stay*, Gefahren-Sortierung (dazu das mehrdeutige Eimer-Item umformuliert), sicher/gefährlich, Straße links-rechts-links, Lebensmittelvergiftung, Schimmel, Nachfüllen/Wegbringen, Augenhöhe („bequem greifen heißt teuer bezahlen"), Trösten/Verletzen.

## 5. Nebenbefund: Repo und Datenbank waren nicht mehr deckungsgleich

Abgleich aller 3 442 Übungen per Fingerabdruck: 8 Übungen wichen ab.

- Kita-Abschiedsübung („Trösten wie ein Profi"): in der DB bereits mit klareren Schritt-Texten, im Repo noch alt → Repo angeglichen.
- „Sicher wickeln" (6 Übungen) und „Arbeiten im Warenlager" (1): im Repo die geschärfte Fassung vom 21.07., in der DB noch die alte → DB angeglichen.
- Drei Einführungstexte unterschieden sich nur in den Anführungszeichen → DB angeglichen.

Danach: 0 Abweichungen.

## 6. Empfehlung für die nächsten Wochen

1. Amelie spielt Englisch 27, 28, 29 (Lernfluss macht danach automatisch Pause), dann 30 als Test. Wenn 30 mit 2 Sternen oder besser klappt, ist die Wortstellung gesichert.
2. Bei jeder neuen Sortier-Übung, egal in welchem Thema: Kontrollfrage in die Erklärung. Das ist der Hebel, den die Daten zeigen.
3. In vier Wochen dieselbe Auswertung wiederholen: Trefferquote Sortieren (Ziel > 50 %), Englisch-Wortstellung (Ziel > 70 %), und ob „Wortstellung üben" abgeschlossen ist.
