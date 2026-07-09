// Stilisierte Euro-Scheine als abgerundete SVG-Rechtecke (Spec §10, §14).
// Bewusst illustrativ mit einfachem €-Emblem – KEINE realistische
// Banknoten-Reproduktion (EZB-Regeln). Werte IMMER in Cent.

export type NoteSpec = {
  /** Wert in Cent. */
  value: number;
  /** Aufdruck in Euro, z. B. "5 €". */
  label: string;
  /** Grundfarbe des Scheins. */
  face: string;
  /** Dunkle Kontrastfarbe fuer Rand und Aufdruck. */
  dark: string;
};

export const NOTES: readonly NoteSpec[] = [
  { value: 500, label: "5 €", face: "#9ca3af", dark: "#374151" },
  { value: 1000, label: "10 €", face: "#f87171", dark: "#7f1d1d" },
  { value: 2000, label: "20 €", face: "#60a5fa", dark: "#1e3a8a" },
  { value: 5000, label: "50 €", face: "#fb923c", dark: "#7c2d12" },
] as const;

/**
 * Zeichnet einen Schein in ein 160×90-ViewBox-SVG.
 * `size` ist die Referenz-Hoehe einer Muenze – der Schein wird dazu passend
 * breiter (×1.7) und etwas flacher (×0.95) gerendert.
 * Gibt null zurueck, wenn der Wert kein Schein ist.
 */
export function NoteSvg({
  value,
  size = 64,
  ariaLabel,
}: {
  value: number;
  size?: number;
  ariaLabel: string;
}) {
  const spec = NOTES.find((note) => note.value === value);
  if (!spec) return null;
  return (
    <svg
      width={size * 1.7}
      height={size * 0.95}
      viewBox="0 0 160 90"
      role="img"
      aria-label={ariaLabel}
    >
      <rect
        x="3"
        y="3"
        width="154"
        height="84"
        rx="12"
        fill={spec.face}
        stroke={spec.dark}
        strokeWidth="3"
      />
      <rect x="14" y="14" width="132" height="62" rx="8" fill="#ffffff" opacity="0.25" />
      {/* Einfaches €-Emblem statt echter Motive – klar als Illustration erkennbar. */}
      <circle cx="40" cy="45" r="19" fill="#ffffff" opacity="0.55" />
      <text
        x="40"
        y="53"
        textAnchor="middle"
        fontSize="24"
        fontWeight="800"
        fill={spec.dark}
      >
        €
      </text>
      <text
        x="103"
        y="54"
        textAnchor="middle"
        fontSize="30"
        fontWeight="800"
        fill={spec.dark}
      >
        {spec.label}
      </text>
      <text
        x="103"
        y="70"
        textAnchor="middle"
        fontSize="10"
        fontWeight="700"
        fill={spec.dark}
        opacity="0.85"
      >
        EURO
      </text>
    </svg>
  );
}
