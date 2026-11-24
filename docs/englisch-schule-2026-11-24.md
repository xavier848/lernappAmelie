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
4. **Amelies Notizen verbessert:** „Do we have pets?“ wird „Do you have pets?“. „get fire“ wird „get fired“. „mopp“ wird „mop“. „dust pan“ und „table cloth“ werden „dustpan“ und „tablecloth“. Zu „zip lock bags“ hat sie „Frischhalteboxen“ notiert. Gemeint sind aber Beutel. Bei „Introducing Yourself“ sind in ihrer Tabelle einige Zeilen verrutscht (z. B. „wie geht's?“ neben „How old are you?“). Die App ordnet richtig zu und übt den Unterschied How are you / How old are you.
5. **Nicht übernommen:** „smack (schmatzen)“ aus dem Feld Food Hygiene, die Markennamen Red Bull und Tupperware als eigene Wörter (Tupperware wird nur in einer Erklärung erwähnt) und die Namen der Mitschülerinnen vom Bingo.
6. **Amerikanisch und britisch.** Das Blatt nutzt oft amerikanische Wörter (vacation, band-aid, mall, résumé, paycheck, emergency room). Die App lehrt die Wörter vom Blatt und nennt das britische Wort dazu, wo es „Englisch für Gäste“ schon verwendet (holiday, plaster).

## Prüfung der Lektionen

Hausregeln (8–10 Übungen, mindestens 2 Typen, MERKE am Ende, Emoji am Anfang jeder Frage, Länge der richtigen Antwort, höchstens eine verneinte Frage) und `scripts/seed.ts --check`: alles in Ordnung.
