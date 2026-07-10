# Nachtplan 2026-07-10 (~5 Stunden autonome Arbeit)

Xaviers Auftrag: weiterarbeiten, verbessern, so viele Übungen wie möglich – keine Rückfragen.
Budget-Regel nach dem Limit-Crash von 0:15 Uhr: kleinere Wellen (max. 5 Agenten), zwischen den Wellen committen.

## Stunde 1 – Laufendes abschließen ✅ (in Arbeit)
- [x] 40 Vertiefungs-Lektionen validiert + committet + gepusht
- [ ] Seed der 40 Lektionen in Supabase (Agent läuft) → Kontrollzahlen: 108 Lektionen, ~950 Übungen
- [ ] Vercel-Deploy prüfen, Live-Smoke-Test (/, /wiederholen, /thema/x, neue Vertiefungs-Lektion spielen)
- [x] Diesen Plan schreiben und committen

## Stunde 2 – Fachliche Qualitätssicherung über ALLEN Content
Workflow (4 Prüf-Agenten + 1 Fixer, adversarial):
- Alle Geld-Beträge NACHRECHNEN (jede money_count/budget/Rechen-MC-Aufgabe: stimmt die Mathematik?)
- Fachliche Korrektheit Putzen/Wäsche/Kinder (Reihenfolgen, Temperaturen, Sicherheitsaussagen)
- Leichte-Sprache-Konsistenz + explanation-Qualität (erklärt das WARUM?)
- Themenübergreifende Dopplungen
- Gefundene Fehler direkt in JSONs fixen → geänderte Lektionen reseeden → committen

## Stunde 3 – Systematische E2E-Testrunde im Preview (inline, kein Workflow)
- Je Übungstyp 2–3 echte Lektionen komplett durchspielen (auch Vertiefungs-Lektionen)
- Flows: Wiederholen-Menü → Fehler-Lektion → besser werden → verschwindet aus Liste?
- /ueben-Priorisierung mit den (jetzt lesbaren!) Fehlerdaten
- Reset-Flow mit Wegwerf-Browser-Profil (NICHT das Test-Device mit Fortschritt löschen)
- Gefundene Probleme sofort fixen, Tests ergänzen

## Stunde 4 – Kleine Features mit großem Gefühl
- Level-Up-Moment im Ergebnis-Screen („Level 3 erreicht! 🎉" wenn Level gestiegen)
- Neue-Abzeichen-Anzeige im Ergebnis-Screen prüfen/nachrüsten
- Themen-Karten: „Alle ⭐⭐⭐"-Zustand hervorheben
- Credits-Seite inhaltlich vervollständigen
- Falls Zeit: sanfte Haptik (navigator.vibrate, Android) bei richtig/falsch

## Stunde 5 – Politur, Doku, Abschluss
- A11y-/Kontrast-Stichproben (aria-Labels der neuen Seiten, Fokus-Reihenfolge)
- README + Spec auf Stand bringen (Wiederholen-Menü, Reset, 108 Lektionen)
- Kompletter Testlauf + Build + finaler Deploy + Live-Check
- Ausführlicher Morgenbericht an Xavier: was ist neu, was ist offen, was braucht er (Service-Key, Fotos, Domain)

## Harte Regeln für die Nacht
- Nichts Destruktives ohne Netz: vor jedem Reseed erst committen
- Nach jeder Stunde: git push (Auto-Deploy) → Fortschritt ist nie nur lokal
- Bei erneutem API-Limit: inline weiterarbeiten (Tests/Fixes), keine neuen Agenten
