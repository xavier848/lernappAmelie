// Stilisierte Euro-Muenzen als SVG-Kreise (Spec §10 „Geld-Assets").
// Bewusst illustrativ, keine realistische Reproduktion echter Muenzen.
// Werte IMMER in Cent: 1, 2, 5 (Kupfer), 10, 20, 50 (Gold),
// 100 = 1 € (silber aussen / gold innen), 200 = 2 € (gold aussen / silber innen).

export type CoinSpec = {
  /** Wert in Cent. */
  value: number;
  /** Aufdruck, z. B. "10" oder "1 €". */
  label: string;
  /** Kleine Zusatzzeile unter dem Wert (nur Cent-Muenzen). */
  subLabel?: string;
  /** Rand-Farbe (dunkler als die Flaeche). */
  rim: string;
  /** Haupt-Flaeche der Muenze. */
  face: string;
  /** Innerer Kreis bei Bi-Metall-Muenzen (1 €/2 €). */
  inner?: string;
  /** Textfarbe des Aufdrucks. */
  text: string;
};

const COPPER = "#b87333";
const COPPER_DARK = "#8c5424";
const GOLD = "#d4a017";
const GOLD_DARK = "#a87d10";
const SILVER = "#d1d5db";
const SILVER_DARK = "#9ca3af";
const TEXT_DARK = "#3f2a10";

export const COINS: readonly CoinSpec[] = [
  { value: 1, label: "1", subLabel: "Cent", rim: COPPER_DARK, face: COPPER, text: TEXT_DARK },
  { value: 2, label: "2", subLabel: "Cent", rim: COPPER_DARK, face: COPPER, text: TEXT_DARK },
  { value: 5, label: "5", subLabel: "Cent", rim: COPPER_DARK, face: COPPER, text: TEXT_DARK },
  { value: 10, label: "10", subLabel: "Cent", rim: GOLD_DARK, face: GOLD, text: TEXT_DARK },
  { value: 20, label: "20", subLabel: "Cent", rim: GOLD_DARK, face: GOLD, text: TEXT_DARK },
  { value: 50, label: "50", subLabel: "Cent", rim: GOLD_DARK, face: GOLD, text: TEXT_DARK },
  // 1 €: silberner Ring aussen, goldene Mitte.
  { value: 100, label: "1 €", rim: SILVER_DARK, face: SILVER, inner: GOLD, text: TEXT_DARK },
  // 2 €: goldener Ring aussen, silberne Mitte.
  { value: 200, label: "2 €", rim: GOLD_DARK, face: GOLD, inner: SILVER, text: "#1e293b" },
] as const;

/** Zeichnet eine Muenze in ein 100×100-ViewBox-SVG. Gibt null zurueck, wenn der Wert keine Muenze ist. */
export function CoinSvg({
  value,
  size = 64,
  ariaLabel,
}: {
  value: number;
  size?: number;
  ariaLabel: string;
}) {
  const spec = COINS.find((coin) => coin.value === value);
  if (!spec) return null;
  const hasInner = Boolean(spec.inner);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={ariaLabel}
    >
      <circle cx="50" cy="50" r="48" fill={spec.rim} />
      <circle cx="50" cy="50" r="42" fill={spec.face} />
      {spec.inner && <circle cx="50" cy="50" r="29" fill={spec.inner} />}
      {spec.subLabel ? (
        <>
          <text
            x="50"
            y="56"
            textAnchor="middle"
            fontSize="36"
            fontWeight="800"
            fill={spec.text}
          >
            {spec.label}
          </text>
          <text
            x="50"
            y="74"
            textAnchor="middle"
            fontSize="14"
            fontWeight="700"
            fill={spec.text}
          >
            {spec.subLabel}
          </text>
        </>
      ) : (
        <text
          x="50"
          y="59"
          textAnchor="middle"
          fontSize={hasInner ? 24 : 30}
          fontWeight="800"
          fill={spec.text}
        >
          {spec.label}
        </text>
      )}
    </svg>
  );
}
