# Englisch in der Schule (24.11.2026)

Xavier hat am 24.11. sechs Fotos aus Amelies Englisch-Ordner geschickt: „Das hat Amelie in der Schule gemacht und sollte es auch können.“ Die Blätter gehören zur Klasse EUV26, Schuljahr 26/27. Es geht nicht um einen bestimmten Test, darum ist es ein normales Thema und keine Prüfung.

| Foto | Inhalt |
|---|---|
| 1 | „Questions!“: 10 Fragen zu einem Text über Ken und Gina, mit Amelies Antworten. Der Text selbst ist nicht auf dem Foto. |
| 2 | „Describing a Scence: In the Kitchen“: Bild einer Küche mit 7 Personen. #1 fünf Dinge aufschreiben, #2 „What are the people doing?“, #3 „True or false?“ (nicht ausgefüllt) |
| 3 | „Introducing Yourself“: „What information do we give when we introduce ourselves?“, Amelies Tabelle |
| 4 | „Nutrition, Hospitality, and Housekeeping: What Words Do You Know Already?“: 16 Felder mit Amelies Wörtern (19.11.2026) |
| 5 | „At the Restaurant“: 10 Dinge auf einem Foto beschriftet, alle mit Haken der Lehrkraft |
| 6 | „Student Bingo: Find Someone Who …“: 14 Felder auf Deutsch, dazu Namen von Mitschülerinnen |

## Neues Thema

`englisch-schule`, Titel „Englisch in der Schule“, Icon 🏫, sort 92. Es steht im Bereich „Sprachen“ direkt nach „Englisch für Gäste“ (`lib/categories.ts`).

Warum nicht hinten an „Englisch für Gäste“: Innerhalb eines Themas schaltet die App die Lektionen der Reihe nach frei. Amelie steht dort bei Lektion 27 von 54. Neue Lektionen ab Nummer 55 hätte sie erst nach 28 anderen erreicht.

## Lektionen

| # | Lektion | Quelle |
|---|---|---|
| 1 | Sich vorstellen | Foto 3 |
| 2 | Find someone who: Fragen stellen | Foto 6 |
| 3 | Ken und Gina: Fragen zum Text | Foto 1 |
| 4 | Im Restaurant: der gedeckte Tisch | Foto 5 |
| 5 | In der Küche: Was machen die Leute? | Foto 2, Aufgabe #2 |
| 6 | In der Küche: There is und There are | Foto 2, Aufgaben #1 und #3 |
| 7 | Wörter: Essen, Kochen, Küche | Foto 4, die acht Felder zu Essen und Küche |
| 8 | Wörter: Service, Putzen, Wäsche | Foto 4, vier Felder |
| 9 | Wörter: Einkaufen, Arbeit, Gesundheit | Foto 4, vier Felder |

Alle Übungen haben `tts_lang: en-GB` wie die Lektionen in „Englisch für Gäste“.

## Entscheidungen

1. **Ken und Gina.** Der Lesetext ist nicht auf dem Foto. Die Lektion nimmt nur die Fakten aus Amelies Antworten. Ginas Hobby hat Amelie auf Deutsch notiert („viel Zeit mit dem Computer“). In der App steht dafür „She spends a lot of time on the computer.“
2. **Küchenbild.** Die App zeigt keine Bilder (CONTENT_FORMAT: Emojis statt Bilder). Die Übungen beschreiben deshalb in Worten, was die Personen tun. Die Antworten zu „True or false?“ sind aus dem Bild abgelesen: Heidelbeeren auf der Arbeitsfläche = true, Weingläser auf dem Tisch = false (dort stehen Wassergläser), Pfanne auf dem Herd = true (neben dem roten Topf), Fleisch im Kühlschrank = false (dort sind Milch, Gemüse, Gläser und Flaschen).
3. **Lösungen bei „What are the people doing?“** Die App nimmt is washing, is making, is drying, is putting, is setting, is stirring und is cutting. Andere richtige Lösungen (is baking, is cooking) stehen in der Erklärung und nie als falsche Antwort.
4. **Amelies Notizen verbessert:** „Do we have pets?“ wird „Do you have pets?“. „get fire“ wird „get fired“. „caver letter“ wird „cover letter“. „mopp“ wird „mop“. „dust pan“ und „table cloth“ werden „dustpan“ und „tablecloth“. Zu „zip lock bags“ hat sie „Frischhalteboxen“ notiert. Gemeint sind aber Beutel, eine Box heißt container. Bei „Introducing Yourself“ sind in ihrer Tabelle einige Zeilen verrutscht („wie geht's?“ steht neben „How old are you?“). Die Einführung sagt das, und Lektion 1 übt den Unterschied zwischen How are you und How old are you.
5. **smack (schmatzen)** steht auf dem Blatt bei Food Hygiene. „Smack“ allein heißt auch „einen Klaps geben“. Lektion 8 fragt es deshalb bei Etiquette ab: schmatzen = to smack your lips.
6. **Nicht übernommen:** die Markennamen Red Bull und Tupperware als eigene Wörter (Tupperware steht nur in einer Erklärung) und die Namen der Mitschülerinnen vom Bingo. Der Beispielname in Lektion 1 ist Mia, weil auf dem Bingo eine Anna-Lena und eine Elena stehen.
7. **Amerikanisch und britisch.** Das Blatt nutzt oft amerikanische Wörter (vacation, band-aid, mall, résumé, paycheck, emergency room, washer, on the weekends). „Englisch für Gäste“ nutzt britisches Englisch. Die App lehrt die Wörter vom Blatt und nennt das britische Wort dazu: holiday, plaster, shopping centre, cutlery, washing machine, tumble dryer, tea towel, at the weekend. Bei der Frage zum Pflaster ist plaster die richtige Antwort, wie in `englisch-notfall-arzt`.
8. **There is bei Milch und Fleisch.** Auf dem Blatt steht „There is meat in the fridge“. Darum nennt Lektion 6 auch die Regel für Dinge, die man nicht zählt: There is milk, ohne a.

## Prüfung der Lektionen

Hausregeln (8–10 Übungen, mindestens 2 Typen, MERKE am Ende, Emoji am Anfang jeder Frage, Länge der richtigen Antwort, höchstens eine verneinte Frage) und `scripts/seed.ts --check`: alles in Ordnung.

Eine unabhängige Prüfung hat alle Lektionen mit den sechs Fotos verglichen. Ken und Gina, die Restaurant-Wörter, die sieben Personen und die vier True-or-false-Sätze hat sie bestätigt. Gemeldet hat sie 9 Fehler und 12 Verbesserungen. Alles ist eingearbeitet:

- **Handschrift falsch gelesen:** „career ladder“ war „cover letter“ (Anschreiben), „skiing“ war „hiking“ (wandern).
- **Falsches Englisch:** „Ich war schon mal in England“ wäre Present Perfect (Have you ever been …?), nicht Were you. Ersetzt durch „Ich war gestern im Kino“.
- **Passte in zwei Körbe:** hospital (auch ein Arbeitsort) und napkin (auch Tischdeko). Beide sind aus diesen Sortier-Übungen raus.
- **Regeln ungenau:** die ing-Regel für stir, die Regel „from und born in nennen einen Ort“ (I was born in May).
- **Bild:** Auf dem Küchenbild sind acht Leute, nur sieben haben eine Nummer.
- **Ratbare Antworten:** Mehrere Emojis haben die Lösung verraten, zum Beispiel 💻 bei Ginas Hobby. Ersetzt sind 💻, 🍷, 🧂, 🪑, 🥩, 🧼, 🤝, 💐, 🩹, 🏥 und bei einer eigenen Nachkontrolle noch 🥡, 🧻 und 💧. Bei Ginas Hobby war die richtige Antwort außerdem die längste.
- **Erklärungen:** Bei Zuordnen und Sortieren nennen sie jetzt einen Hinweis statt die ganze Lösung.
- **Ernährungslehre:** Kartoffeln stehen im DGE-Ernährungskreis nicht beim Gemüse. In der Sortier-Übung „fruit or vegetables“ steht jetzt broccoli.
