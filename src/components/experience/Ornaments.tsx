import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Decorative temple ornaments.
 *
 * All ornaments are purely presentational: they are hidden from assistive
 * technology and carry no content. They reuse the approved palette
 * (docs/DESIGN-SYSTEM.md) — gold as an accent, never as a large surface.
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
