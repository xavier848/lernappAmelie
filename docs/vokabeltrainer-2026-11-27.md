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
| Startseite | Kachel „🃏 Vokabeln üben – Karteikarten oder Schreiben“, direkt unter „Wiederholen & Prüfen“. Sie ist immer sichtbar, auch ohne Fortschritt (z. B. in Mamas Prüf-Profil). |
| Thema „Englisch in der Schule“ | Knopf „🃏 Vokabeln üben“ über den Lektionen. Er erscheint bei jedem Thema, das Vokabel-Stapel hat. |
| `/vokabeln` | Modus und Richtung wählen, dann einen Stapel antippen. Beides merkt sich das Gerät. |
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

## Zwei Modi: Karteikarten und Schreiben

Xavier hat noch am selben Tag gefragt: „Kannst du auch verschiedene Modi einbauen, dass man auch so machen kann nur tippen und selber lernen, aber auch mit eintippen und schreiben?“ Darum gibt es auf der Übersicht unter „So übst du“ zwei Modi. Das Gerät merkt sich die Wahl, in der Adresse steht sie als `?modus=karten` oder `?modus=schreiben`.

- **🃏 Karteikarten:** der Ablauf oben. Umdrehen und selbst sagen, ob man es wusste.
- **⌨️ Schreiben:** Oben steht das Wort, darunter ein Eingabefeld.
  - „Prüfen“ oder Enter prüft die Antwort. Danach geht die Handy-Tastatur zu, damit die ganze Rückmeldung zu sehen ist. „Weiter“ (oder nochmal Enter) geht zur nächsten Karte und öffnet die Tastatur gleich wieder.
  - „Weiß nicht“ zeigt die Lösung, die Karte kommt dann in der nächsten Runde wieder.
  - Die Rückmeldung zeigt immer die volle Form mit Artikel, z. B. „der Teller“, dazu 🔊 und den Hinweis der Karte.
  - Runden, Rundenende und Abschluss sind wie bei den Karteikarten. Nach den Karteikarten bietet der Abschluss zusätzlich „Jetzt schreiben üben“ an.

**Was beim Schreiben als richtig zählt** (`lib/vokabelpruefung.ts`):

- Groß- und Kleinschreibung, Satzzeichen, Apostrophe und Bindestriche sind egal.
- Artikel dürfen fehlen oder anders sein (der/die/das, the/a/an). Im Englischunterricht geht es um das Wort, nicht um den deutschen Artikel.
- „to“ vor englischen und „sich“ vor deutschen Verben darf fehlen.
- ae/oe/ue/ss statt ä/ö/ü/ß zählt, Akzente sind egal (résumé = resume), & zählt als and/und.
- Mehrere richtige Antworten:
  - Komma im Kartentext, z. B. „stellen, legen“ oder „der Verkäufer, die Verkäuferin“.
  - Die Listen `fremdAuch` und `deutschAuch` der Karte mit gleichwertigen Wörtern: britisch und amerikanisch (cutlery zu utensils, the check zu the bill), Synonyme (Möhren zu Karotten), bairisch (Schwammerl zu Pilze). Sie stehen nur zum Prüfen in der Datei, nicht auf der Karte.
  - Bei so einer Antwort sagt die App „Stimmt auch! Auf dem Blatt steht: …“.
- **Tippfehler:** Ein kleiner Fehler gibt „Fast! So schreibt man es: …“. Das gilt für 1 Fehler ab 4 Buchstaben und 2 Fehler ab 10 Buchstaben. Ein Fehler ist ein Buchstabe zu viel, zu wenig, falsch oder zwei vertauschte.

**Wer entscheidet:** Ein vertipptes Wort kommt erst einmal wieder, weil der Modus die Schreibweise üben soll. Mit „Nur vertippt, zählt trotzdem“ entscheidet Amelie selbst, dass es zählt. Bei einer falschen Antwort gibt es „Meine Antwort stimmt auch“, für richtige Wörter, die nicht in der Liste stehen. So hat Amelie wie bei den Karteikarten das letzte Wort.

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
| `lib/vokabeltrainer.ts` | Der Ablauf in Runden, ohne React, mit Tests, dazu Richtung und Modus |
| `lib/vokabelpruefung.ts` | Prüft eingetippte Antworten (Modus „Schreiben“), mit Tests |
| `components/vokabeln/Karteikarte.tsx` | Die Karte: Umdrehen, Wischen, Knöpfe, Tastatur, Vorlesen |
| `components/vokabeln/Schreibkarte.tsx` | Modus „Schreiben“: Wort, Eingabefeld, Rückmeldung |
| `components/vokabeln/useEinstellungen.ts` | Richtung und Modus merken (localStorage) |
| `app/vokabeln/page.tsx` | Übersicht mit Modus, Richtung und Stapeln |
| `app/vokabeln/[thema]/[stapel]/page.tsx` | Der Trainer |
| `app/page.tsx`, `app/thema/[slug]/page.tsx` | Kachel auf der Startseite, Knopf auf der Themenseite |

## Neue Vokabeln oder ein neues Thema

- **Wörter ergänzen:** in `content/vokabeln/englisch-schule.json` eintragen, bei Bedarf mit `fremdAuch`/`deutschAuch`. `npx vitest run lib/vokabeln.test.ts` prüft das Format. Der Test prüft auch, dass jede weitere Antwort beim Schreiben als richtig zählt, keine nur die Hauptform wiederholt (z. B. „on weekends“ zu „on the weekends“, die Artikel zählen ja nicht) und keine Antwort in einem Stapel zu zwei Karten passt.
- **Neues Thema mit Vokabeln:** neue Datei `content/vokabeln/<thema>.json` anlegen und in `lib/vokabeln.ts` bei `SAMMLUNGEN` eintragen. Der Knopf auf der Themenseite erscheint dann von selbst. Die Startseiten-Kachel nennt keine Sprache, sie passt also auch für weitere Sprachen.

## Geprüft

- **vitest:** 37 neue Tests für den Ablauf, die Antwort-Prüfung und den Inhalt, alle grün. In der ganzen Suite scheitern nur die 17 Tests, die auf `main` schon scheitern.
- **Browser (Playwright, alle Schreibzugriffe blockiert):**
  - Karteikarten: 42 Prüfungen, alle grün.
    - Eingabe: Maus, Finger-Wisch am Handy, Tastatur und reduzierte Bewegung.
    - Ablauf: kurzer Wisch federt zurück, Runden bis alles gewusst, andere Richtung, Richtung gemerkt, unbekannter Stapel.
    - Sauberkeit: keine Fehler auf der Seite, nichts in die Datenbank geschrieben.
  - Schreiben: 41 Prüfungen, alle grün.
    - Antworten: richtig, Tippfehler mit „zählt trotzdem“, falsch, „Weiß nicht“, weitere Antworten wie „the check“.
    - Bedienung: Enter zweimal geht genau eine Karte weiter. Nach dem Prüfen liegt der Fokus auf „Weiter“, danach wieder im Feld.
    - Ablauf: Runden, Abschluss, Modus gemerkt.
- **Dabei gefunden und behoben:**
  - Enter drehte die Karteikarte zweimal, also gar nicht. Motion löst bei Enter selbst noch einen Tap aus. Der wird jetzt ignoriert, weil die Tastatur schon über `onKeyDown` läuft.
  - „Weiß nicht“ übersprang im Schreib-Modus die Karte. React baute den angeklickten Knopf noch während des Klicks zum „Weiter“-Knopf (type=submit) um, und der Browser schickte das Formular ab. Die beiden Knopfgruppen haben jetzt eigene keys.

## Nach dem Start: Platz für die Handy-Tastatur (27.11.2026)

Xavier hat ein Bildschirmfoto vom iPhone geschickt: „Wenn man tippt kann man das Wort nur schlecht sehen.“ Die iPhone-Tastatur ist samt der Leiste (^ v ✓) gut 440 pt hoch. iOS schiebt die ganze Seite nach oben, bis das Eingabefeld frei liegt. Dabei rutschte das Wort unter die Statusleiste mit Uhrzeit und Akku. Außerdem brach „Weiß nicht“ auf dem iPhone in zwei Zeilen um.

Geändert:

- Über dem Eingabefeld ist alles kompakt.
  - Der 🔊-Knopf sitzt jetzt in der Wortkarte.
  - Die Anleitung steht im Feld („Auf Englisch schreiben …“) statt in einer eigenen Zeile.
  - Die Zeile „Englisch → Deutsch · Schreiben“ fällt im Schreib-Modus weg. Die Karte nennt die Sprache, das Feld die Zielsprache.
  - Wörter mit mehr als 18 Zeichen sind etwas kleiner, mit Silbentrennung.
- Nach dem Prüfen springt der Fokus auf „Weiter“. Die Tastatur geht zu, und die ganze Rückmeldung ist zu sehen. „Weiter“ öffnet sie für die nächste Karte wieder.
- **Schreib-Fokus:** Solange am Handy ins Feld getippt wird, blendet die Seite Kopf (✕, Fortschritt) und Titel aus. Dann steht das Wort ganz oben, Feld und Knöpfe direkt darunter.
  - Die Schreibkarte meldet das über `onTippen` (Fokus im Feld, nur bei Finger-Bedienung, `pointer: coarse`).
  - Öffnet sich die Tastatur, setzt die Seite die Verschiebung von iOS zurück (`visualViewport`-resize → nach oben).
  - Am Computer bleibt der Kopf stehen.
  - Die Knöpfe und 🔊 nehmen dem Feld beim Antippen den Fokus nicht. Sonst käme der Kopf mitten im Tippen zurück, alles rutschte nach unten, und der Finger träfe etwas anderes.
- „Weiß nicht“ und „Prüfen“ brechen nicht mehr um.

Nachgemessen mit dem Bildschirm vom Foto (390 × 844 pt, App vom Home-Bildschirm): Über der Tastatur bleiben 356 pt sichtbar.

| Fall | Feld endet bei | Knöpfe enden bei |
|---|---|---|
| Normales Wort | 254 pt | 322 pt |
| Langes, zweizeiliges Wort | 282 pt | 350 pt |

Beides liegt über der Tastatur. iOS muss also nichts mehr verschieben, und das Wort bleibt sichtbar.

Danach kamen Fotos von Mama und Amelie. Auf Mamas iPhone war alles zu sehen, auf Amelies nicht. Mama fragte, ob es am kleineren Display liegt und ob es unabhängig von der Displaygröße geht. Es liegt an der Höhe, die über der Tastatur übrig bleibt, und die ist je nach iPhone (und Anzeige-Zoom) verschieden. Darum gibt es den Schreib-Fokus. Mit ihm brauchen Wort, Feld und Knöpfe nur noch 222 pt, mit langem Wort 250 pt. Geprüft im Handy-Format mit vorsichtig geschätzter Höhe über der Tastatur:

| iPhone | sichtbar über der Tastatur | Knöpfe enden bei |
|---|---|---|
| SE | 300 pt | 222 pt (lang 250 pt) |
| 13 mini | 320 pt | 222 pt (lang 250 pt) |
| 16 Pro (Foto) | 355 pt | 222 pt (lang 250 pt) |
| 16 Pro Max | 390 pt | 222 pt (lang 250 pt) |

Dazu geprüft: 🔊, „Weiß nicht“, „Prüfen“ und „Weiter“ treffen beim Antippen, der Kopf kommt nach dem Prüfen zurück, und am Computer bleibt er stehen. Gemessen hat das ein Playwright-Durchlauf im Handy-Format für drei Stapel. Der lange Fall war „die Beutel mit Zipp-Verschluss“.
