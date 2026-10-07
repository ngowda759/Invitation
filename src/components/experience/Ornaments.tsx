import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Decorative temple ornaments.
 *
 * All ornaments are purely presentational: they are hidden from assistive
 * technology and carry no content. They reuse the approved palette
 * (docs/DESIGN-SYSTEM.md) — gold as an accent, never as a large surface. Together
 * they form the invitation's visual vocabulary: a temple arch, a lotus divider, a
 * kolam rule, a corner flourish and the diya lamp motif.
 */

type OrnamentProps = ComponentProps<"svg">;

/**
 * A diya (oil lamp) motif: a shallow bowl with a single steady flame.
 */
export function DiyaMotif({ className, ...props }: OrnamentProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      role="presentation"
      aria-hidden="true"
      focusable="false"
      className={cn("h-10 w-10", className)}
      {...props}
    >
      <path
        d="M32 6c4.6 6.2 7 11.2 7 15.4 0 4.3-3.1 7.6-7 7.6s-7-3.3-7-7.6C25 17.2 27.4 12.2 32 6Z"
        className="fill-gold-light"
      />
      <path
        d="M32 15c2 3 3 5.3 3 7.2 0 2-1.3 3.6-3 3.6s-3-1.6-3-3.6c0-1.9 1-4.2 3-7.2Z"
        className="fill-cream"
      />
      <path
        d="M8 34h48c0 8.8-10.7 16-24 16S8 42.8 8 34Z"
        className="fill-gold"
      />
      <path
        d="M14 36h36c-1.8 5.4-9.4 9-18 9s-16.2-3.6-18-9Z"
        className="fill-gold-light/60"
      />
    </svg>
  );
}

/**
 * An ornamental horizontal rule: a thin gold line broken by a small central motif.
 */
export function TempleRule({ className, ...props }: OrnamentProps) {
  return (
    <svg
      viewBox="0 0 240 12"
      role="presentation"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="none"
      className={cn("h-3 w-full max-w-xs", className)}
      {...props}
    >
      <line
        x1="0"
        y1="6"
        x2="104"
        y2="6"
        className="stroke-gold/50"
        strokeWidth="1"
      />
      <line
        x1="136"
        y1="6"
        x2="240"
        y2="6"
        className="stroke-gold/50"
        strokeWidth="1"
      />
      <path d="M120 1l5 5-5 5-5-5 5-5Z" className="fill-gold" />
    </svg>
  );
}

/**
 * A lotus-petal divider: five petals radiating from a central bud. Used to separate
 * the movements of the invitation story without introducing a hard rule.
 */
export function LotusDivider({ className, ...props }: OrnamentProps) {
  return (
    <svg
      viewBox="0 0 120 40"
      role="presentation"
      aria-hidden="true"
      focusable="false"
      className={cn("h-6 w-28", className)}
      {...props}
    >
      <g className="fill-gold/80">
        <path d="M60 6c2.6 4 2.6 8.6 0 12.6C57.4 14.6 57.4 10 60 6Z" />
        <path d="M44 12c4.6 1.6 7 5.6 6.6 10.2C46 21.4 42.8 18 44 12Z" />
        <path d="M76 12c-1.2 6 2 9.4 5.4 10.2C82 17.6 79.6 13.6 76 12Z" />
        <path d="M30 22c5 0 8.6 2.6 10.6 6.6-5.4 1.2-9.8-1-10.6-6.6Z" />
        <path d="M90 22c.8 5.6-3.6 7.8-10.6 6.6 2-4 5.6-6.6 10.6-6.6Z" />
      </g>
      <path d="M60 16c1.8 2.6 1.8 5.4 0 8-1.8-2.6-1.8-5.4 0-8Z" className="fill-saffron" />
      <path
        d="M18 30h30M72 30h30"
        className="stroke-gold/45"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * A kolam rule: a repeating temple-forecourt dot-and-loop band. Drawn as a repeating
 * background-free SVG strip so it can span any width without an image asset.
 */
export function KolamRule({ className, ...props }: OrnamentProps) {
  return (
    <svg
      viewBox="0 0 320 16"
      role="presentation"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="none"
      className={cn("h-3 w-full", className)}
      {...props}
    >
      <line x1="0" y1="8" x2="320" y2="8" className="stroke-gold/35" strokeWidth="1" />
      {[40, 80, 120, 160, 200, 240, 280].map((x) => (
        <g key={x}>
          <path
            d={`M${x} 3l5 5-5 5-5-5 5-5Z`}
            className="fill-gold/70"
          />
        </g>
      ))}
      <circle cx="20" cy="8" r="1.6" className="fill-saffron" />
      <circle cx="300" cy="8" r="1.6" className="fill-saffron" />
    </svg>
  );
}

/**
 * A temple arch: a cusped South Indian gopura archway with a finial. Used to frame
 * the invitation cover, the hero and the significant headings.
 */
export function TempleArch({ className, ...props }: OrnamentProps) {
  return (
    <svg
      viewBox="0 0 240 320"
      role="presentation"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
      className={cn("h-full w-full", className)}
      {...props}
    >
      <path
        d="M24 320V132c0-53 43-96 96-96s96 43 96 96v188"
        fill="none"
        className="stroke-gold/45"
        strokeWidth="1.5"
      />
      <path
        d="M44 320V136c0-42 34-76 76-76s76 34 76 76v184"
        fill="none"
        className="stroke-gold/25"
        strokeWidth="1"
      />
      {/* Cusped arch crown, in the manner of a gopura torana. */}
      <path
        d="M96 96c8-10 16-10 24 0 8-10 16-10 24 0"
        fill="none"
        className="stroke-gold/60"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M120 44l4 8-4 8-4-8 4-8Z" className="fill-gold" />
      <path d="M120 60v10" className="stroke-gold/60" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * A corner flourish: a curling vine and petal used at the four corners of a framed
 * panel. It is rotated per corner by the caller.
 */
export function CornerFlourish({ className, ...props }: OrnamentProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      role="presentation"
      aria-hidden="true"
      focusable="false"
      className={cn("h-8 w-8", className)}
      {...props}
    >
      <path
        d="M6 6h14M6 6v14"
        className="stroke-gold/70"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M6 20c8 0 14-6 14-14"
        fill="none"
        className="stroke-gold/45"
        strokeWidth="1"
      />
      <path d="M24 8c3 0 5 2 5 5-3 0-5-2-5-5Z" className="fill-gold/70" />
      <path d="M8 24c0 3 2 5 5 5 0-3-2-5-5-5Z" className="fill-gold/50" />
    </svg>
  );
}

/**
 * A mandala: concentric rings of petals, the central devotional geometry of the
 * invitation. Purely decorative; it never carries meaning on its own.
 */
export function Mandala({ className, ...props }: OrnamentProps) {
  const petals = Array.from({ length: 16 }, (_, i) => (i * 360) / 16);
  return (
    <svg
      viewBox="0 0 200 200"
      role="presentation"
      aria-hidden="true"
      focusable="false"
      className={cn("h-40 w-40", className)}
      {...props}
    >
      <circle cx="100" cy="100" r="86" fill="none" className="stroke-gold/35" strokeWidth="1" />
      <circle cx="100" cy="100" r="66" fill="none" className="stroke-gold/25" strokeWidth="1" />
      <circle cx="100" cy="100" r="22" fill="none" className="stroke-gold/60" strokeWidth="1.5" />
      {petals.map((angle) => (
        <ellipse
          key={angle}
          cx="100"
          cy="45"
          rx="6"
          ry="18"
          className="fill-gold/20"
          transform={`rotate(${angle} 100 100)`}
        />
      ))}
      {petals.map((angle) => (
        <circle
          key={`dot-${angle}`}
          cx="100"
          cy="76"
          r="2"
          className="fill-saffron/70"
          transform={`rotate(${angle + 11.25} 100 100)`}
        />
      ))}
      <path d="M100 78c6 8 6 16 0 24-6-8-6-16 0-24Z" className="fill-gold/70" />
    </svg>
  );
}
