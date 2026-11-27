"use client";

// Vokabeltrainer, ein Stapel (Mama, 2026-11-27). Zwei Modi:
// - "karten": Karteikarte umdrehen und selbst entscheiden (Karteikarte.tsx)
// - "schreiben": die Antwort eintippen, die App prueft (Schreibkarte.tsx,
//   Xavier, 2026-11-27)
// Ablauf in lib/vokabeltrainer.ts: Runde fuer Runde, bis alle Karten sitzen.
// Schreibt nichts in die Datenbank - es gibt keine XP und keinen Eintrag im
// Lernfluss, Amelie kann also beliebig oft ueben.
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Confetti } from "@/components/ui/Confetti";
import { Mascot } from "@/components/ui/Mascot";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Karteikarte, type KartenSeite } from "@/components/vokabeln/Karteikarte";
import { Schreibkarte, type Loesung } from "@/components/vokabeln/Schreibkarte";
import { useIstBrowser, useModus, useRichtung } from "@/components/vokabeln/useEinstellungen";
import { findeStapel, type Karte, type Sammlung } from "@/lib/vokabeln";
import {
  aktuelleKarte,
  andereRichtung,
  beantworte,
  istModus,
  istRichtung,
  naechsteRunde,
  starteTraining,
  type Modus,
  type Richtung,
  type Training,
} from "@/lib/vokabeltrainer";

function param(wert: string | string[] | undefined): string {
  return Array.isArray(wert) ? (wert[0] ?? "") : (wert ?? "");
}

/** Vorder- und Rueckseite einer Karte je nach Richtung, dazu die Loesung zum Tippen. */
function seiten(
  karte: Karte,
  sammlung: Sammlung,
  richtung: Richtung,
): { vorne: KartenSeite; hinten: KartenSeite; loesung: Loesung } {
  const fremd = { text: karte.fremd, sprache: sammlung.spracheName, lang: sammlung.sprache };
  const deutsch = { text: karte.deutsch, sprache: "Deutsch", lang: "de-DE" };
  return richtung === "fremd-deutsch"
    ? { vorne: fremd, hinten: deutsch, loesung: { ...deutsch, auch: karte.deutschAuch } }
    : { vorne: deutsch, hinten: fremd, loesung: { ...fremd, auch: karte.fremdAuch } };
}

function richtungText(richtung: Richtung, sammlung: Sammlung): string {
  return richtung === "fremd-deutsch"
    ? `${sammlung.spracheName} → Deutsch`
    : `Deutsch → ${sammlung.spracheName}`;
}

const MODUS_TEXT: Record<Modus, string> = { karten: "Karteikarten", schreiben: "Schreiben" };

export default function VokabelStapelPage() {
  const params = useParams<{ thema: string; stapel: string }>();
  const treffer = findeStapel(param(params?.thema), param(params?.stapel));
  const anzahl = treffer?.stapel.karten.length ?? 0;

  const istBrowser = useIstBrowser();
  const [gespeicherteRichtung, speichereRichtung] = useRichtung();
  const [gespeicherterModus, speichereModus] = useModus();
  // Erst im Browser starten - sonst unterscheiden sich Server- und
  // Client-HTML (Math.random beim Mischen, Richtung und Modus aus der
  // Adresse). Zustand einmalig waehrend des Renderns setzen (React-Muster
  // "storing information from previous renders"), ohne useEffect.
  const [richtungHier, setRichtungHier] = useState<Richtung | null>(null);
  const [modusHier, setModusHier] = useState<Modus | null>(null);
  const [training, setTraining] = useState<Training | null>(null);
  if (istBrowser && (richtungHier === null || modusHier === null)) {
    const adresse = new URLSearchParams(window.location.search);
    const ausAdresseRichtung = adresse.get("richtung");
    const ausAdresseModus = adresse.get("modus");
    setRichtungHier(istRichtung(ausAdresseRichtung) ? ausAdresseRichtung : gespeicherteRichtung);
    setModusHier(istModus(ausAdresseModus) ? ausAdresseModus : gespeicherterModus);
  }
  if (istBrowser && training === null && anzahl > 0) {
    setTraining(starteTraining(anzahl));
  }
  const richtung = richtungHier ?? gespeicherteRichtung;
  const modus = modusHier ?? gespeicherterModus;

  if (!treffer) {
    return (
      <Rahmen>
        <Card className="mt-6">
          <p className="text-base font-bold text-ink">Diesen Stapel gibt es nicht.</p>
          <Link href="/vokabeln" className="mt-3 inline-flex min-h-12 items-center font-bold text-primary-dark">
            Zur Übersicht
          </Link>
        </Card>
      </Rahmen>
    );
  }

  const { sammlung, stapel } = treffer;

  if (!training) {
    return (
      <Rahmen>
        <div className="mt-6 h-64 animate-pulse rounded-3xl bg-locked" />
      </Rahmen>
    );
  }

  function neuStarten(neueRichtung: Richtung, neuerModus: Modus) {
    setRichtungHier(neueRichtung);
    speichereRichtung(neueRichtung);
    setModusHier(neuerModus);
    speichereModus(neuerModus);
    setTraining(starteTraining(anzahl));
  }

  const schreiben = modus === "schreiben";

  const kopf = (
    <div className="flex items-center gap-3 pt-2 pb-1">
      <Link
        href="/vokabeln"
        aria-label="Beenden und zur Übersicht"
        className="flex min-h-12 min-w-12 items-center justify-center rounded-2xl text-2xl font-bold text-ink/60"
      >
        ✕
      </Link>
      <div className="flex-1">
        <ProgressBar value={training.pos} max={training.reihe.length} />
      </div>
    </div>
  );

  if (training.phase === "fertig") {
    const erste = training.gewusstBeimErstenMal ?? anzahl;
    return (
      <Rahmen>
        <Confetti />
        <div className="flex flex-col items-center gap-4 pt-8 text-center">
          <Mascot
            mood="cheer"
            message={
              schreiben
                ? `Super! Du kannst alle ${anzahl} Vokabeln von „${stapel.titel}“ schreiben.`
                : `Super! Du kannst alle ${anzahl} Vokabeln von „${stapel.titel}“.`
            }
          />
          <Card className="w-full text-left">
            <p className="text-base font-bold text-ink">
              {richtungText(richtung, sammlung)} · {MODUS_TEXT[modus]}
            </p>
            <p className="pt-1 text-base text-ink/80">
              Beim ersten Mal {schreiben ? "richtig" : "gewusst"}: {erste} von {anzahl}
            </p>
            <p className="text-base text-ink/80">
              {training.runde === 1
                ? "Alles in der ersten Runde. Stark!"
                : `Geschafft in ${training.runde} Runden.`}
            </p>
          </Card>
          <Button size="lg" full onClick={() => neuStarten(andereRichtung(richtung), modus)}>
            Andersherum üben: {richtungText(andereRichtung(richtung), sammlung)}
          </Button>
          {!schreiben && (
            <Button size="lg" full onClick={() => neuStarten(richtung, "schreiben")}>
              Jetzt schreiben üben
            </Button>
          )}
          <Button variant="secondary" size="lg" full onClick={() => neuStarten(richtung, modus)}>
            Nochmal von vorne
          </Button>
          <Link href="/vokabeln" className="flex min-h-12 items-center font-bold text-primary-dark">
            Zur Übersicht
          </Link>
        </div>
      </Rahmen>
    );
  }

  if (training.phase === "rundenende") {
    const n = training.nochmal.length;
    const welche = n === 1 ? "die Karte" : `die ${n} Karten`;
    return (
      <Rahmen>
        {kopf}
        <div className="flex flex-col items-center gap-4 pt-6 text-center">
          <Mascot
            mood="happy"
            message={`Runde ${training.runde} geschafft! Jetzt kommen nur noch ${welche}, ${
              schreiben ? "die du noch nicht richtig geschrieben hast" : "die du noch nicht wusstest"
            }.`}
          />
          <Card className="grid w-full grid-cols-2 gap-2 text-center">
            <p className="flex flex-col">
              <span className="text-3xl font-extrabold text-success-dark">{training.gewusstInRunde}</span>
              <span className="text-sm font-bold text-ink/70">{schreiben ? "richtig" : "gewusst"}</span>
            </p>
            <p className="flex flex-col">
              <span className="text-3xl font-extrabold text-warning-dark">{n}</span>
              <span className="text-sm font-bold text-ink/70">nochmal</span>
            </p>
          </Card>
          <Button size="lg" full onClick={() => setTraining(naechsteRunde(training))}>
            Weiter mit {n === 1 ? "1 Karte" : `${n} Karten`}
          </Button>
        </div>
      </Rahmen>
    );
  }

  const index = aktuelleKarte(training);
  const karte = index === null ? null : stapel.karten[index];
  if (!karte) return null;
  const { vorne, hinten, loesung } = seiten(karte, sammlung, richtung);
  const entscheiden = (gewusst: boolean) =>
    setTraining((t) => (t ? beantworte(t, gewusst) : t));

  return (
    <Rahmen>
      {kopf}
      <div className="flex items-baseline justify-between gap-2 pt-2 pb-3">
        <h1 className="text-lg font-extrabold text-ink">
          <span aria-hidden>{stapel.icon} </span>
          {stapel.titel}
        </h1>
        <p className="text-sm font-semibold whitespace-nowrap text-ink/70">
          Runde {training.runde} · {training.pos + 1}/{training.reihe.length}
        </p>
      </div>
      <p className="pb-3 text-sm font-bold text-primary-dark">
        {richtungText(richtung, sammlung)} · {MODUS_TEXT[modus]}
      </p>
      {schreiben ? (
        // Kein key: Das Eingabefeld bleibt dasselbe, die Tastatur bleibt offen.
        <Schreibkarte
          kartenSchluessel={`${training.runde}-${training.pos}`}
          frage={vorne}
          loesung={loesung}
          hinweis={karte.hinweis}
          onEntscheidung={entscheiden}
        />
      ) : (
        <Karteikarte
          key={`${training.runde}-${training.pos}`}
          vorne={vorne}
          hinten={hinten}
          hinweis={karte.hinweis}
          onEntscheidung={entscheiden}
        />
      )}
    </Rahmen>
  );
}

function Rahmen({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <div className="mx-auto w-full max-w-md px-4 pt-2 pb-10">{children}</div>
    </div>
  );
}
