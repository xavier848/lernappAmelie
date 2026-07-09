// Credits-Seite (Spec §14): Danksagung + Lizenz-Hinweise. Statisch.
import Link from "next/link";

export const metadata = {
  title: "Danke & Lizenzen – Amelies Lernapp",
};

export default function CreditsPage() {
  return (
    <div className="flex min-h-dvh flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-extrabold text-ink">Danke &amp; Lizenzen</h1>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-extrabold text-ink">Danke</h2>
        <p className="text-base text-ink">
          Diese App ist für Amelie gemacht. Mit viel Liebe von deiner Familie.
          Viel Spaß beim Lernen!
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-extrabold text-ink">Lizenz-Hinweise</h2>
        <ul className="flex list-disc flex-col gap-2 pl-5 text-base text-ink">
          <li>
            UI-Muster inspiriert von react-duolingo (MIT-Lizenz, bryanjenningz).
          </li>
          <li>
            Die Bilder von Münzen und Scheinen sind eigene, stilisierte
            Illustrationen. Sie sind bewusst keine echten Abbildungen von
            Euro-Geld.
          </li>
        </ul>
      </section>

      <Link
        href="/"
        className="flex min-h-12 w-fit items-center gap-2 rounded-2xl font-bold text-primary-dark"
      >
        ← Zurück zum Lernpfad
      </Link>
    </div>
  );
}
