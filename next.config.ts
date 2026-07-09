import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Das Projekt liegt auf dem macOS-Desktop, den iCloud Drive synchronisiert.
  // iCloud raeumt Build-Dateien weg / legt "Datei 2"-Duplikate an und hat so
  // Dev-Server-Haenger und ChunkLoadErrors verursacht. Ordner mit der Endung
  // ".nosync" laesst iCloud in Ruhe.
  distDir: ".next.nosync",
};

export default nextConfig;
