/**
 * OmniCampus Logo Mark
 *
 * The mark is an abstract "O" formed by two overlapping arcs —
 * one solid (representing the campus / institution) and one dashed
 * (representing the open, anonymous conversation layer).
 * A small filled circle anchors the bottom-right, hinting at
 * a speech-bubble origin point.
 *
 * Usage:
 *   <OmniLogo size={32} />          // default brand blue
 *   <OmniLogo size={28} mono />     // single-color (inherits currentColor)
 */

interface OmniLogoProps {
  size?: number
  mono?: boolean
  className?: string
}

export function OmniLogo({ size = 32, mono = false, className = '' }: OmniLogoProps) {
  // Scale everything relative to a 32×32 viewBox
  const s = size / 32

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Outer arc — solid, the "campus" layer */}
      <path
        d="M6 20C6 12.268 12.268 6 20 6"
        stroke={mono ? 'currentColor' : '#3B82F6'}
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      {/* Inner arc — dashed, the "conversation" layer */}
      <path
        d="M12 26C12 17.163 19.163 10 28 10"
        stroke={mono ? 'currentColor' : '#60A5FA'}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeDasharray="3.2 2.8"
      />
      {/* Anchor dot — speech-bubble tail */}
      <circle
        cx="8"
        cy="24"
        r="2.8"
        fill={mono ? 'currentColor' : '#3B82F6'}
      />
    </svg>
  )
}