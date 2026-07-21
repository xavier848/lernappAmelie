import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Atkinson_Hyperlegible, Lexend, Open_Sans } from "next/font/google";
import { ScrollReset } from "@/components/ui/ScrollReset";
import { ServiceWorkerRegister } from "@/components/ui/ServiceWorkerRegister";
import "./globals.css";

// Schriftarten fuer Amelie (Dyspraxie/Lesbarkeit). Standard = Atkinson
// Hyperlegible: jeder Buchstabe maximal eindeutig (b/d, I/l/1, 0/O). Ueber
// den Schrift-Umschalter im Profil (data-font am <html>) waehlbar: Atkinson,
// Lexend (fluessiges Lesen) oder die gewohnte Open Sans.
const atkinson = Atkinson_Hyperlegible({
  variable: "--font-atkinson",
  subsets: ["latin"],
  weight: ["400", "700"],
});
// preload: false fuer die beiden Alternativ-Schriften. Sonst laedt JEDES
// Handy beim Start alle drei Familien vor (10 Schriftdateien), obwohl immer
// nur eine benutzt wird. Ohne Vorladen holt der Browser eine Alternative
// erst, wenn sie im Schrift-Umschalter wirklich ausgewaehlt wurde.
const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  preload: false,
});
const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  preload: false,
});

// Laeuft VOR dem ersten Paint: setzt die gespeicherte Schrift, damit die
// Seite nicht kurz in der falschen Schrift aufblitzt.
const FONT_INIT = `try{var f=localStorage.getItem('lernapp-font');if(f)document.documentElement.dataset.font=f;}catch(e){}`;

export const metadata: Metadata = {
  title: "Amelies Lernapp",
  description: "Lernen für den Alltag – Schritt für Schritt.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Lernapp",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#14b8a6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Das Dokument scrollt NIE (html/body overflow-hidden): iOS ignoriert
  // overscroll-behavior am Dokument-Scroller und zieht sonst beim
  // Gummiband-Scrollen alles (inkl. Kopfleisten) mit nach unten.
  // Stattdessen ist <main> der einzige Scroll-Container - dort respektiert
  // iOS overscroll-none, und sticky-Leisten bleiben wirklich oben fest.
  return (
    <html
      lang="de"
      className={`${atkinson.variable} ${lexend.variable} ${openSans.variable} h-full overflow-hidden antialiased`}
    >
      <body className="h-full overflow-hidden">
        {/* Verbindung zu Supabase vorab aufbauen (DNS + TCP + TLS). Alle
            Lerndaten kommen von dort; ohne das kostet der erste Abruf beim
            Kaltstart 3 zusaetzliche Umlaeufe. React hoistet die Tags in den
            <head>. */}
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <>
            <link
              rel="preconnect"
              href={process.env.NEXT_PUBLIC_SUPABASE_URL}
              crossOrigin=""
            />
            <link
              rel="dns-prefetch"
              href={process.env.NEXT_PUBLIC_SUPABASE_URL}
            />
          </>
        )}
        <Script id="font-init" strategy="beforeInteractive">
          {FONT_INIT}
        </Script>
        <ScrollReset />
        <ServiceWorkerRegister />
        <main
          id="app-scroll"
          className="mx-auto h-full w-full max-w-md overflow-y-auto overscroll-none bg-white shadow-sm"
        >
          {children}
        </main>
      </body>
    </html>
  );
}
