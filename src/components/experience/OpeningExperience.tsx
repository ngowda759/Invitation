import { DiyaMotif, TempleArch, TempleRule } from "@/components/experience/Ornaments";

/**
 * Invitation cover — the ceremonial threshold before the invitation opens.
 *
 * It is a purely presentational overlay: hidden from assistive technology, with no
 * text and no interactive elements, so it never delays or gates the invitation for a
 * screen reader, a keyboard visitor or anyone who lands mid-page. It dissolves on its
 * own with CSS only (no client JavaScript), revealing the hero underneath, and with
 * `prefers-reduced-motion` the animation collapses to its resting state (see
 * `globals.css`), so the invitation is simply present immediately.
 *
 * The composition is a warm lamp glow behind a gilt temple arch, with the diya motif
 * and an ornamental rule: the anticipation of receiving a printed invitation, not a
 * gimmick.
 */
export function OpeningExperience() {
  return (
    <div aria-hidden="true" className="opening-veil">
      <div className="opening-veil__glow" />
      <div className="opening-veil__panel">
        <TempleArch className="opening-veil__arch" />
        <DiyaMotif className="opening-veil__diya h-14 w-14 sm:h-16 sm:w-16" />
        <TempleRule className="opening-veil__rule" />
      </div>
    </div>
  );
}
