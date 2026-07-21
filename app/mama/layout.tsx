import type { Metadata } from "next";

// Eigene Metadaten NUR fuer /mama: verlinkt ein separates Manifest mit
// start_url "/mama" und eigener id. Dadurch legt iOS beim "Zum
// Home-Bildschirm" wirklich die Mama-Seite ab (nicht Amelies Startseite)
// und der Apple-Titel unter dem Icon heisst "Mama".
export const metadata: Metadata = {
  title: "Mama-Modus – Lernapp",
  manifest: "/mama.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mama",
  },
};

export default function MamaLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
