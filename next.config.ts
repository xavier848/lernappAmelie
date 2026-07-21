import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Das Projekt liegt auf dem macOS-Desktop, den iCloud Drive synchronisiert.
  // iCloud raeumt Build-Dateien weg / legt "Datei 2"-Duplikate an und hat so
  // Dev-Server-Haenger und ChunkLoadErrors verursacht. Ordner mit der Endung
  // ".nosync" laesst iCloud in Ruhe. NUR lokal - Vercel erwartet ".next".
  distDir: process.env.VERCEL ? ".next" : ".next.nosync",

  images: {
    // Optimierte Bilder laenger im Server-Cache halten.
    minimumCacheTTL: 31536000,
  },

  // Bilder aus public/ wurden bisher mit "max-age=0, must-revalidate"
  // ausgeliefert. Das zwingt den Browser, VOR jedem Anzeigen beim Server
  // rueckzufragen – und verbietet ihm ausdruecklich, die vorhandene Kopie zu
  // benutzen, wenn diese Rueckfrage scheitert. Genau daran ist auf Amelies
  // wackligem Mobilfunk das Pony-Bild zerbrochen, obwohl die Datei laengst
  // auf ihrem Handy lag.
  //
  // "stale-while-revalidate" erlaubt das Gegenteil: sofort die vorhandene
  // Kopie zeigen und im Hintergrund erneuern.
  //
  // BEWUSST KEIN "immutable": icon-192/512.png stecken in manifest.json,
  // mama.webmanifest und als Push-Icon in sw.js – ein ausgetauschtes Icon
  // wuerde sonst nie ankommen.
  async headers() {
    const cache = {
      key: "Cache-Control",
      value: "public, max-age=604800, stale-while-revalidate=2592000",
    };
    // Punkt-Variante statt (png|jpg|...)-Alternative: letztere wuerde auch
    // Pfade wie /thema/irgendwasjson treffen und /_next/static/media/*
    // von "immutable" herunterstufen.
    return ["/:all*.png", "/:all*.jpg", "/:all*.jpeg", "/:all*.webp", "/:all*.svg"].map(
      (source) => ({ source, headers: [cache] })
    );
  },
};

export default nextConfig;
