import { DiyaMotif } from "@/components/experience/Ornaments";
import { event } from "@/content/event";

/**
 * Opening experience — a brief threshold before the hero.
 *
 * It is a purely presentational overlay: hidden from assistive technology, with no
 * text and no interactive elements. It dissolves on its own with CSS only (no client
 * JavaScript), so the hero underneath is immediately readable for screen readers and
 * for anyone with `prefers-reduced-motion` set (see `globals.css`, which collapses the
 * animation to its resting state).
 */
export function OpeningExperience() {
  return (
    <div aria-hidden="true" className="opening-veil">
      <div className="opening-veil__glow" />
      <DiyaMotif className="opening-veil__diya h-12 w-12" />
    </div>
  );
}

/**
 * The invocation shown at the top of the hero: a lamp motif and, when the product
 * authority supplies one, a short devotional line. The line is omitted while empty so
 * the experience never presents unverified religious copy.
 */
export function Invocation({
  className,
  invocation = event.invocation,
}: {
  className?: string;
  invocation?: string;
}) {
  return (
    <div className={className}>
      <DiyaMotif className="mx-auto h-11 w-11 sm:h-12 sm:w-12" />
      {invocation ? (
        <p className="mt-4 font-display text-lg italic text-gold-light sm:text-xl">
          {invocation}
        </p>
      ) : null}
    </div>
  );
}
