# Vokabeltrainer mit Karteikarten (27.11.2026)

Mama hat am 27.11. über Xavier geschrieben. Sie und Amelie haben mit „Englisch in der Schule“ geübt, und einige Vokabeln sind Amelie noch nicht geläufig. Ihr Wunsch war ein Vokabeltrainer nach dem Karteikartenprinzip:

- Vorne steht das englische Wort. Amelie überlegt, was es heißt.
- Antippen dreht die Karte um, dann sieht sie die deutsche Übersetzung.
- Danach entscheidet sie selbst: gewusst = Karte nach rechts schieben, nicht gewusst = nach links.
- Am Ende einer Runde kommen nur noch die Karten, die sie nicht wusste. Das wiederholt sich, bis sie alle kann.
- Beide Richtungen: Englisch → Deutsch und Deutsch → Englisch.

## So funktioniert es

| Wo | Was |
|---|---|
| Startseite | Kachel „🃏 Vokabeln üben – Karteikarten für Englisch“, direkt unter „Wiederholen & Prüfen“. Sie ist immer sichtbar, auch ohne Fortschritt (z. B. in Mamas Prüf-Profil). |
| Thema „Englisch in der Schule“ | Knopf „🃏 Vokabeln üben“ über den Lektionen. Er erscheint bei jedem Thema, das Vokabel-Stapel hat. |
| `/vokabeln` | Richtung wählen und einen Stapel antippen. Die gewählte Richtung merkt sich das Gerät. |
| `/vokabeln/<thema>/<stapel>` | Der Trainer selbst (Ablauf unten). |

Ablauf eines Stapels:

1. Die Karten kommen gemischt. Vorne steht das Wort, darunter „👆 Antippen zum Umdrehen“ und der Knopf „Karte umdrehen“.
2. Antippen der Karte oder der Knopf dreht sie um. Die Rückseite ist türkis, manchmal mit einem kleinen Hinweis.
3. Jetzt erst kann Amelie entscheiden:
   - Nach rechts wischen oder „✓ Gewusst“. Beim Wischen erscheint ein grünes „✓ Gewusst“.
   - Nach links wischen oder „✗ Nicht gewusst“. Beim Wischen erscheint ein oranges „↻ Nochmal“.
4. Am Ende der Runde zeigt die App, wie viele Karten sie wusste und wie viele nochmal kommen. „Weiter mit n Karten“ startet die nächste Runde, nur mit diesen Karten, neu gemischt.
5. Sind alle gewusst, gibt es Konfetti und eine Übersicht: „Beim ersten Mal gewusst: x von n“ und die Zahl der Runden. Dazu zwei Knöpfe: „Andersherum üben“ (andere Richtung) und „Nochmal von vorne“.

🔊 liest die Seite vor, die gerade sichtbar ist: Englisch mit britischer Stimme, Deutsch mit deutscher. Am Computer geht auch die Tastatur: Enter oder Leertaste dreht die Karte um, die Pfeiltasten rechts und links entscheiden.

## Entscheidungen

1. **Wischen ist ein Angebot, keine Pflicht.** Die Spec sagt „Tap statt Drag – überall … Keine Swipe-/Pinch-Pflicht.“ Darum machen zwei große Knöpfe genau dasselbe wie das Wischen. Ein kurzer Wisch unter 110 Pixel zählt nicht, dann federt die Karte zurück.
2. **Erst umdrehen, dann entscheiden.** Vorne gibt es weder Knöpfe noch Wischen. So schaut Amelie die Lösung an, bevor sie sich selbst bewertet.
3. **Keine Datenbank.** Die Vokabeln liegen als Datei im Repo (`content/vokabeln/englisch-schule.json`), und der Trainer schreibt nichts. Es gibt also keine XP, keine Serie, keinen Eintrag im Lernfluss und keine Sperre. Amelie kann beliebig oft üben, und Testen ist gefahrlos. Neue Wörter heißen: Datei ändern und neu ausliefern, ohne Supabase.
4. **Die Stapel folgen den 9 Lektionen** von „Englisch in der Schule“. Sie enthalten nur Wörter, die auf den Schulblättern stehen oder in den Lektionen schon geübt werden.
5. **Britisches Englisch** wie in den Lektionen. Wo die Blätter amerikanisch schreiben, steht auf der Rückseite ein Hinweis, z. B. bei favourite colour, crisps, utensils, dish towel, washer und dryer. Verwechslungsgefahr hat ebenfalls einen Hinweis (recipe ↔ receipt).
6. **Keine Namen von Mitschülerinnen** vom Bingo-Blatt, wie schon in den Lektionen.
7. **Die Richtung** steht in der Adresse (`?richtung=fremd-deutsch` oder `deutsch-fremd`) und wird im Gerät gemerkt (localStorage `lernapp-vokabel-richtung`). In der Datenbank steht sie nicht.

## Stapel (137 Karten)

| Stapel | Karten | Lektion |
|---|---|---|
| 👋 Sich vorstellen | 16 | 1 Sich vorstellen |
| 🔎 Find someone who | 15 | 2 Find someone who: Fragen stellen |
| 📖 Ken und Gina | 13 | 3 Ken und Gina: Fragen zum Text |
| 🍽️ Im Restaurant | 15 | 4 Im Restaurant: der gedeckte Tisch |
| 🧑‍🍳 Küche: Was machen die Leute? | 13 | 5 In der Küche: Was machen die Leute? |
| 🍳 Küche: Dinge | 15 | 6 In der Küche: There is und There are |
| 🥗 Essen, Kochen, Küche | 17 | 7 Wörter: Essen, Kochen, Küche |
| 🧹 Service, Putzen, Wäsche | 16 | 8 Wörter: Service, Putzen, Wäsche |
| 🛒 Einkaufen, Arbeit, Gesundheit | 17 | 9 Wörter: Einkaufen, Arbeit, Gesundheit |

## Dateien

| Datei | Inhalt |
|---|---|
| `content/vokabeln/englisch-schule.json` | Die Karten: `fremd`, `deutsch`, optional `hinweis` |
| `lib/vokabeln.ts` | Lädt und prüft die Stapel (zod): 4 bis 25 Karten pro Stapel, kein Wort doppelt je Seite, kein Stapel doppelt |
| `lib/vokabeltrainer.ts` | Der Ablauf in Runden, ohne React, mit Tests |
| `components/vokabeln/Karteikarte.tsx` | Die Karte: Umdrehen, Wischen, Knöpfe, Tastatur, Vorlesen |
| `components/vokabeln/useRichtung.ts` | Richtung merken (localStorage) |
| `app/vokabeln/page.tsx` | Übersicht mit Richtung und Stapeln |
| `app/vokabeln/[thema]/[stapel]/page.tsx` | Der Trainer |
| `app/page.tsx`, `app/thema/[slug]/page.tsx` | Kachel auf der Startseite, Knopf auf der Themenseite |

## Neue Vokabeln oder ein neues Thema

- **Wörter ergänzen:** in `content/vokabeln/englisch-schule.json` eintragen. `npx vitest run lib/vokabeln.test.ts` prüft das Format.
- **Neues Thema mit Vokabeln:** neue Datei `content/vokabeln/<thema>.json` anlegen und in `lib/vokabeln.ts` bei `SAMMLUNGEN` eintragen. Der Knopf auf der Themenseite erscheint dann von selbst. Kommt eine andere Sprache dazu, den Untertitel der Startseiten-Kachel („Karteikarten für Englisch“) anpassen.

## Geprüft

- **vitest:** 14 neue Tests für den Ablauf und den Inhalt, alle grün. In der ganzen Suite scheitern nur die 17 Tests, die auf `main` schon scheitern.
- **Browser (Playwright, alle Schreibzugriffe blockiert):** 41 Prüfungen, alle grün.
  - Eingabe: Maus, Finger-Wisch am Handy (Touch), Tastatur und reduzierte Bewegung.
  - Ablauf: kurzer Wisch federt zurück, Runden bis alles gewusst, andere Richtung, Richtung gemerkt, unbekannter Stapel.
  - Sauberkeit: keine Fehler auf der Seite, nichts in die Datenbank geschrieben.
- **Dabei gefunden und behoben:** Enter drehte die Karte zweimal, also gar nicht. Motion löst bei Enter selbst noch einen Tap aus. Der wird jetzt ignoriert, weil die Tastatur schon über `onKeyDown` läuft.
