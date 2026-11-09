# Prüfungs-Training: Textilien und Vitamine (04.11.2026)

Mama hat vom 28. bis 30.10. neue Blätter geschickt. Am 04.11. hat sie in der WhatsApp-Gruppe „LernApp Amelie“ geschrieben:

> Amelie muss den Stoff über Baumwolle, Leinen und Seide lernen. Das Thema Vitamine gehört zu einem anderen Fach und sollte deshalb in einen separaten Ordner.

Xavier wollte dazu: Im Prüfungs-Training sollen mehrere Prüfungen Platz haben.

## Was sich in der App geändert hat

- `/pruefungstraining` zeigt jede Prüfung als eigene Karte. Auf der Karte steht, wie viele Lektionen geschafft sind und wie viele Fragen schon sitzen.
- Ein Tipp auf eine Karte öffnet `/pruefungstraining/<slug>`. Dort stehen nur die Lektionen dieser Prüfung und ihr eigener „Test üben“. Der Test mischt nur Fragen aus dieser Prüfung.
- Nach einer Prüfungs-Lektion kommt Amelie zurück zu ihrer Prüfung.
- Die Startseiten-Kachel nennt die Prüfungen mit Kurznamen: „Wahrnehmung · Textilien · Vitamine“.
- Jede Prüfung ist ein eigenes Thema mit dem Präfix `pruefung-`. Vitamine hat ein eigenes Thema, weil es aus einem anderen Fach kommt („Ernährung und Verpflegung“).

## Welches Blatt wohin gehört

| Blatt (Foto vom) | Thema |
|---|---|
| Baumwolle + Leinen Steckbrief, zusammen auf einem Blatt (28.10.) | `pruefung-textilien` |
| Steckbrief Baumwolle (28.10.) | `pruefung-textilien` |
| Steckbrief Leinen (28.10.) | `pruefung-textilien` |
| Seide Steckbrief (29.10.) | `pruefung-textilien` |
| Seide-Quiz, 12 Fragen mit Lösungen (29.10.) | `pruefung-textilien` |
| Gewinnung der Fasern, Seide (29.10.) | `pruefung-textilien` |
| Einteilung der Fasern (30.10.) | `pruefung-textilien` |
| Wahrnehmung: Wahrnehmungsstörungen (28.10.) | `pruefung-wahrnehmung`, Lektionen 18 und 19 |
| 3.8 Täglich Vitamine (29.10.) | `pruefung-vitamine` |
| Aufgaben und Einteilung der Vitamine (29.10.) | `pruefung-vitamine` |
| Arbeitsblatt Vitamin-C-Verlust (29.10.) | `pruefung-vitamine` |
| Vitamin-Quiz, 10 Fragen ohne Lösungen (29.10.) | `pruefung-vitamine` |

Zwei Scans vom 04.11. (spanische Arbeitsblätter) gehören nicht zu Amelie. Xavier hat das bestätigt.

## Lektionen

**Textilien: Baumwolle, Leinen & Seide** (`pruefung-textilien`, 12 Lektionen, 118 Übungen)

1. Was sind Fasern?
2. Naturfasern: tierisch, pflanzlich, mineralisch
3. Chemiefasern und ihre Markennamen
4. Baumwolle: Anbau und Gewinnung
5. Baumwolle: Eigenschaften, Pflege, Verwendung
6. Leinen: Flachs, Anbau und Gewinnung
7. Leinen: Eigenschaften, Pflege, Verwendung
8. Seide: Steckbrief
9. Seide: So wird die Faser gewonnen
10. Seide-Quiz wie im Test (Fragen 1–6)
11. Seide-Quiz wie im Test (Fragen 7–12)
12. Baumwolle, Leinen oder Seide?

**Vitamine** (`pruefung-vitamine`, 9 Lektionen, 88 Übungen)

1. Die Aufgaben der Vitamine
2. Wasserlöslich oder fettlöslich?
3. Wasserlösliche Vitamine und ihre Aufgaben (bis 08.11.: „… und ihre Namen“)
4. Fettlösliche Vitamine und ihre Aufgaben (bis 08.11.: „Fettlösliche Vitamine: Namen und Aufgaben“)
5. Welche Vitamine stecken im Essen?
6. Lückentext wie im Test: Wofür brauchen wir Vitamine?
7. Vitamin-C-Verlust: Wärme, Zerkleinern und Kochwasser
8. So bleiben die Vitamine erhalten
9. Vitamin-Quiz wie im Test

**Wahrnehmung** (`pruefung-wahrnehmung`, neu: 2 Lektionen, 19 Übungen): siehe `docs/pruefung-wahrnehmung-2026-10-27.md`.

## Prüfung der Lektionen

Alle neuen Lektionen sind einmal unabhängig gegen die Originalblätter geprüft worden: fachlich, didaktisch und sprachlich. Es gab keine falschen Fakten. Alle Befunde sind eingearbeitet:

- erratbare Antworten (Länge, Emoji, gleicher Wortstamm, Wörter wie „nur“)
- doppeldeutige Sortier- und Zuordnungsübungen
- Erklärungen, die beim zweiten Versuch die Lösung verraten hätten
- Lücken in der Abdeckung

Der Prüfer der Textilien wollte Seide-Quiz-Frage 8 so üben lassen, wie sie gedruckt ist. Die App bleibt beim Leinen (siehe unten), weil die Zahlen im Schultext beim Leinen stehen.

## Widersprüche auf den Blättern und wie die App sie löst

**Textilien**

- **Lange Baumwollfasern:** Auf dem Doppelblatt steht „ca. 16–50 mm“, auf dem Steckbrief „ca. 20–50 mm“.
  - Die App fragt die Untergrenze nie ab.
  - Sie lehrt: lange Fasern bis ca. 50 mm, spinnbar. Kurze Fasern (Linters) 2–16 mm, nicht spinnbar, für Zelluloseprodukte.
- **Leinen waschen:** Das Doppelblatt zeigt ein 30-°C-Symbol. Der Steckbrief sagt „je nach Pflegeetikett oft bis 60 °C“.
  - Die App lehrt: so waschen, wie es auf dem Pflegeetikett steht.
  - Keine Frage hängt an 30 oder 60 °C.
- **Seide-Quiz, Frage 8:** Die Lösung C („bis zu achtmal stärker als Wolle und etwa doppelt so stark wie Baumwolle“) steht wörtlich auf dem Leinen-Steckbrief („laut Schultext“).
  - Die App lehrt für Seide „sehr reißfest“, wie auf dem Seide-Steckbrief.
  - Die Zahlen ordnet sie Leinen zu.
- **Raupe oder Puppe:** Der Seide-Steckbrief sagt „Puppe“, das Gewinnungsblatt sagt „Raupe“.
  - Die App sagt „Raupe“.
  - Im Lernzettel steht einmal: Im Kokon nennt man die Raupe auch Puppe.
- **Pflegesymbole:** Die Symbole auf dem Doppelblatt werden nicht abgefragt. Sie sind dort nicht erklärt.
- **Die zwei Baumwoll-Blätter:** Die Listen zu Ländern, Eigenschaften und Verwendung ergänzen sich. Die App nimmt beide zusammen.
- **Überschneidungen:** Bei Vergleichen und Ländern fragt die App nur Merkmale ab, die zu genau einer Faser gehören. Ein Beispiel: China steht bei allen drei Fasern.

**Vitamine**

- **Kohlrabi-Diagramm:** Die App liest es so:
  - Im Gemüse bleiben beim Dämpfen 98 %, beim Dünsten 70 % und beim Kochen 44 %.
  - In die Garflüssigkeit gehen beim Kochen 82 %, beim Dünsten 67 % und beim Dämpfen 6 %.
  - Gefragt wird nur, wo am meisten bleibt (Dämpfen) und wo am meisten ins Wasser geht (Kochen).
- **Kartoffel-Diagramm:** Die Zeiten heißen „nach 1 Std., nach 6 Std., nach 5 Std.“. Das sieht nach einem Druckfehler aus.
  - Die App fragt keine Stunden ab.
  - Gefragt wird: ganze Kartoffel bis 20 %, pürierte Kartoffel bis 47 %, püriert geht mehr verloren.
- **Bild und Tabelle auf „3.8 Täglich Vitamine“** passen nicht immer zusammen. Beispiel: Karotten liegen nur im Feld A, die Tabelle sagt „Gemüse: A, C“.
  - Die Fragen sagen deshalb „laut Bild“ oder „laut Tabelle“.
  - Bei Sortier-Übungen zum Bild stehen nur Lebensmittel, die in genau einem Feld liegen.
- **Vitamin-Quiz:** Das Blatt hat keine Lösungen. Die App leitet sie aus den anderen Blättern ab.
  - Frage 3 hat mehrere richtige Antworten. In der App ist sie eine Sortier-Übung „viel / kaum Vitamin C“.
  - Die Fragen 5 und 8 (richtig oder falsch) sind eine Sortier-Übung „Stimmt / Stimmt nicht“.
  - Frage 4: Die Lösung ist B1. B2 steht nicht als falsche Antwort da, weil die Tabelle Getreide auch B2 gibt.
- **Zusätzlich zu den Blättern:**
  - die Merkhilfe EDEKA für die fettlöslichen Vitamine E, D, K und A
  - „Beta-Carotin ist eine Vorstufe von Vitamin A“
  - „erst waschen, dann schneiden“
- **„Vitamin C stärkt die Abwehrkraft bei Erkältung und Krebs“** steht nur im Lückentext, so wie auf dem Blatt gedruckt.

## Offene Fragen an Mama oder die Lehrerin

1. Leinen waschen: 30 °C wie auf dem Doppelblatt oder „oft bis 60 °C“ wie auf dem Steckbrief?
2. Seide-Quiz, Frage 8: Sind die Zahlen „achtmal stärker als Wolle, doppelt so stark wie Baumwolle“ wirklich für Seide gemeint? Auf dem Leinen-Steckbrief stehen sie „laut Schultext“ für Leinen.
3. Lange Baumwollfasern: Beginnen sie bei 16 oder bei 20 mm?
4. Kartoffel-Diagramm: Welche Zeiten sind richtig (1, 6, 5 Stunden)?
5. Kohlrabi-Diagramm: Ist es so gemeint wie oben beschrieben?

## Änderung am 09.11.: neue Fassung des Vitamin-Blatts

Am 08.11. hat Amelie in der WhatsApp-Gruppe eine neue Fassung des Blatts „Aufgaben der Vitamine / Einteilung der Vitamine“ geschickt. Dazu schrieb sie:

> Auf diesem Blatt sind die Aufgaben der Vitamine und die Einteilung in wasserlösliche und fettlösliche Vitamine. Niacin und lateinische Begriffe lassen wir weg.

Unterschiede zur alten Fassung vom 29.10.:

- Die lateinischen Namen sind weg: Thiamin, Riboflavin, Pyridoxin, Cobalamin, Ascorbinsäure, Retinol, Calciferol, Tocopherol, Phyllochinon.
- Auch „Biotin = Vitamin H“ und „Niacin = Vitamin B3“ sind weg.
- Dafür hat jedes wasserlösliche Vitamin eine Aufgabe:
  - B1: Energiestoffwechsel
  - B2: Haut und Augen
  - B6: Protein- und Energiestoffwechsel
  - B12: Blutbildung und Nervensystem
  - Biotin: Haut, Haare und Nägel
  - Folsäure: Zellteilung und Blutbildung
  - Pantothensäure: Energiestoffwechsel
  - Vitamin C: stärkt das Immunsystem und die Wundheilung
- Vitamin D: „Knochen und Zähne“, ohne Calciumstoffwechsel.
- Die vier Aufgaben der Vitamine stehen nur noch als Überschriften da. Lektion 1 lehrt die Stichpunkte der alten Fassung weiter als Erklärung. Sie beruft sich dabei aber nicht mehr auf „das Blatt“. Das Wort „Antioxidans“ steht auf der neuen Fassung nur bei Vitamin E. Lektion 1 sagt deshalb: „Auch Vitamin C wirkt als Antioxidans.“

Was sich in der App geändert hat:

- **Lektion 2:** Niacin ist raus, in der Sortier-Übung steht jetzt Pantothensäure.
- **Lektion 3:** neu geschrieben, „Wasserlösliche Vitamine und ihre Aufgaben“. Die Übungen zu Folsäure und Pantothensäure sind unverändert.
- **Lektion 4:** Die lateinischen Namen sind raus. Vitamin D steht da wie auf der neuen Fassung. Dazu kommen eine Sortier-Übung „wasser- oder fettlöslich nach der Aufgabe“ und eine Frage zu Vitamin A und B2. Beide sind für die Haut wichtig.
- **Lektion 1:** Die Frage zum Aufbau von Blut lautet jetzt: „Welche zwei Vitamine sind laut Blatt für die Blutbildung wichtig?“ Die Antwort bleibt B12 und Folsäure. Vier Erklärungen berufen sich nicht mehr auf Stichpunkte der alten Fassung. Die Antworten bleiben gleich.
- **Lektion 9:** Eine Erklärung sagte „B1 und B2 sind für Nerven und Stoffwechsel“. Jetzt heißt es: B1 für den Energiestoffwechsel, B2 für Haut und Augen.
- **Überschneidungen in Lektion 3:**
  - Für den Energiestoffwechsel sind B1, B6 und Pantothensäure wichtig. Nur bei B6 steht auch Protein.
  - Für die Blutbildung sind B12 und Folsäure wichtig. Unterschieden werden sie durch das Nervensystem (B12) und die Zellteilung (Folsäure).
  - Eigene Übungen fragen genau diese Unterschiede ab.
- **Unabhängige Prüfung:** Die Lektionen wurden einmal gegen die neue Fassung geprüft. Es gab 12 Befunde, alle sind eingearbeitet:
  - zwei Widersprüche in den Lektionen 1 und 9, siehe oben
  - erratbare Antworten: Emoji 🍊 bei Vitamin C, immer dieselben falschen Antworten
  - eine Sortier-Übung, in der B6 in beide Körbe passte
  - Erklärungen, die beim zweiten Versuch die Lösung verraten hätten
  - Leichte Sprache
- In der Datenbank sind die Übungen an ihren Plätzen aktualisiert. Es wurde nichts gelöscht, Amelies bisherige Antworten bleiben erhalten. Die Lektionen 3 und 4 hatte sie noch nicht geübt.
- „Beta-Carotin“ bleibt. Es steht im Vitamin-Quiz vom Blatt und ist kein Name eines Vitamins.

## Nach der Prüfung

Das Thema im Admin-Bereich auf „nicht veröffentlicht“ stellen. Dann verschwindet seine Karte im Prüfungs-Training. Die anderen Prüfungen bleiben.
