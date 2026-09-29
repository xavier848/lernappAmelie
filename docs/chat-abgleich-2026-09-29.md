# Chat-Abgleich „LernApp Amelie“ – Stand 29. September 2026

Datenbasis: WhatsApp-Export der Gruppe „LernApp Amelie“ vom 09.07. bis 29.09.2026. Er umfasst alle Textnachrichten, rund 560 Fotos, 3 Sprachnachrichten und 1 Video. Ich habe jeden Wunsch mit den Lektionen in `content/lessons` und mit der Datenbank verglichen.

Kurz gesagt: Die Listen vom Juli waren schon fast vollständig drin. Offen waren vor allem vier Dinge:
- Mamas Aufgaben zum Rechnen mit Uhrzeiten vom 11.07.
- Die Blätter vom 24.–29.09.
- Der Prüfungsstoff für Amelies Test.
- Die rund 300 Fachbuch-Seiten vom 10./11.07.

Der Prüfungsstoff ist in PR #6, alles andere in PR #7.

## 1. Alle Wünsche aus dem Chat

| Datum | Von | Wunsch | Status | Wo in der App |
|---|---|---|---|---|
| 09.07. | Xavier | Türkise Elemente auf Weiß | ✅ erledigt | Farbschema der App |
| 09.07. | Mama | Arbeitsabläufe: Ferienwohnung, Bad, Schlafzimmer, Wohnzimmer, Küche, Wäsche; „Wie würdest du anfangen?“ | ✅ erledigt | Themen Ferienwohnung, Badezimmer, Schlafzimmer, Wohnzimmer, Küche, Wäsche, Arbeit organisieren. Dort gibt es 73 Reihenfolge-Aufgaben, in der ganzen App 275. |
| 09.07. | Mama | Servietten falten: Techniken, Namen, Memory, passender Anlass | ✅ erledigt | Thema „Servietten falten“ (5 Lektionen, mit Memory) |
| 09.07. | Mama | Handtücher falten: Techniken, Memory, Gästezimmer/Bad/Wellness, Schrank | ✅ erledigt | Thema „Handtücher falten“ (5 Lektionen) |
| 09.07. | Mama | Kinder: Liste mit 14 Bereichen (Motorik bis Auffälligkeiten) | ✅ erledigt | Themen Kinder-Motorik, -Sprache, -Spielen, -Gefühle, -Sinne, -Sicherheit, -Sprechen, -Alltag, Beobachten, Betreuung. Letzte Lücken in PR #7 geschlossen: Tiefensensibilität, wettergerechte Kleidung, saisonale Angebote, kleine Experimente |
| 09.07. | Mama | „Was wird gefördert?“ mit Quiz | ✅ erledigt | Thema „Was wird gefördert?“ (7 Lektionen) |
| 09.07. | Mama | Modul „Geld selbst verwalten“ (10 Teile + Monats-Challenge) | ✅ erledigt | Thema „Mein Geld verwalten“ (10 Lektionen) mit Budget-Spiel und Balken |
| 10.07. | Mama | Sicherheit: Wickeln, kleine Teile, Hochziehen, richtig reagieren | ✅ erledigt | Thema „Sicherheit mit Kindern“ |
| 10.07. | Mama | Arbeitsblätter (Fotos 15–208, „rote Schrift = Lösung“) | ✅ erledigt | Grundstock der App vom 10.07. |
| 10.07. | Mama | Eigener Zugang, ohne Amelies Fortschritt zu verändern | ✅ erledigt | Mama-Profil mit eigenem Fortschritt |
| 10.07. | Mama | Englisch: Wohnung zeigen, Freunde treffen, Lermoos-Texte | ✅ erledigt | Thema „Englisch für Gäste“ |
| 10.07. | Mama | Kopfrechnen mit Eintippen, Stufen, Tipp, nahe Antworten | ✅ erledigt | Thema „Kopfrechnen“ (16 Lektionen) |
| 10.07. | Mama | „Fragen nicht allzu einfach … Fachbegriffe“ | ✅ umgesetzt | gilt für alle neuen Buch-Lektionen (siehe Abschnitt 2) |
| 10./11.07. | Mama | Fachbuch, Fotos 268–596 | 🔄 PR #7 | siehe Abschnitt 2 |
| 11.07. | Mama | Uhrzeit & Zeit rechnen (Zug, Ausreiten, Pizza, Nudeln, Haushalt, Spaziergang; 5 Stufen) | ✅ PR #7, schon live | Neues Thema „Uhrzeit & Zeit rechnen“ (8 Lektionen). Die Uhrzeit wird eingetippt, der Ziffernblock hat dafür eine „:“-Taste. |
| 11.07. | Amelie | „Gibt es eine Lektion Aufräumen?“ | – kein Auftrag | Missverständnis: Die Pferdeäpfel räumt man weg, indem man Lektionen macht |
| 11.07. | Amelie | „In welchen Lektionen mache ich Fehler?“ | ✅ vorhanden | „Üben“ → Fehler wiederholen |
| 12.07. | Mama | Bad-Reihenfolge war nicht eindeutig (Fotos 615–617) | ✅ erledigt (28.07.) | `badezimmer-sanitaer-taeglich`: Die Reihenfolge-Aufgabe ist jetzt eine eindeutige Auswahlfrage. |
| 13.07. | Amelie | Satz mit der Decke schwer zu verstehen (Foto 623) | ✅ erledigt (21.07.) | `englisch-saetze-bauen`: Neue Antwort-Option und eine Erklärung zu *another* und *in a moment*. |
| 19.–21.07. | Amelie | App lädt lange | ✅ erledigt (21.07.) | Service Worker und Bilder-Cache |
| 27.07. | Amelie | Conditional 1 und 2 | ✅ erledigt | `englisch-conditional-1`, `englisch-conditional-2` |
| 07.09. | Amelie | 100 österreichische Wörter | ✅ erledigt | Thema „Österreichisch für den Alltag“ (12 Lektionen) |
| 20.09. | Amelie | Farbcodierung der Putztücher (rot/gelb/grün/blau) | ✅ erledigt (PR #5) | `badezimmer-farbcodierung`, Transfer in der Küche |
| 24.09. | Mama | Hygiene-Quiz (Foto 720) | ✅ erledigt (PR #6) | Prüfungs-Training, Lektion „Hygiene-Quiz vom 24.09.“ |
| 25.09. | Mama | Mikrofasertücher: wo ja, wo nein | ✅ PR #7, schon live | `ferienwohnung-mikrofasertuecher` |
| 25.09. | Mama | Feuchtwischen große/kleine Flächen (Fotos 725–726) | ✅ PR #7, schon live | `ferienwohnung-wischen-grosse-kleine-flaechen` |
| 26.09. | Mama | Fragequiz Mikroorganismen: Nutzen oder Gefahr? | ✅ PR #7, schon live | `hygiene-mikroorganismen-nutzen-gefahr` |
| 27.09. | Amelie/Mama | Schütt- und Klopfmaße, Messhilfen, Kuchenrezept umrechnen (Fotos 728–729) | ✅ PR #7, schon live | `mengen-masse-schuettmasse-messhilfen`, `mengen-masse-kuchenrezept-4-12`, `mengen-masse-kuchenrezept-20` |
| 29.09. | Mama | Test nächste Woche: 5 Blätter (Fotos 730–734) und Sprachnachricht | ✅ erledigt (PR #6) | Kachel „🎯 Prüfungs-Training“ auf der Startseite, nie gesperrt |

„Schon live“ heißt: Die Lektion steht bereits in der Datenbank. Amelie sieht sie also schon, obwohl der PR noch offen ist.

## 2. Fachbuch „Hauswirtschaft“ (Fotos 268–596)

*Wird nach der Prüfrunde ergänzt.*

## 3. Offene Fragen an Mama

1. **Arbeitsrichtung für Rechtshänder.**
   - Das Prüfungsblatt (Foto 733) sagt beim Einrichten des Arbeitsplatzes: „von links nach rechts“.
   - Das Fachbuch (LF 1, Kap. 8.3) sagt: „von rechts nach links“.
   - Die App folgt dem Prüfungsblatt.
   - Beim Spülen sagen beide Quellen „rechts nach links“. Da gibt es keinen Widerspruch.
   - Bitte bei der Lehrerin nachfragen, welche Richtung in der Prüfung zählt.
