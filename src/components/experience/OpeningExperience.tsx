import { DiyaMotif } from "@/components/experience/Ornaments";

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
