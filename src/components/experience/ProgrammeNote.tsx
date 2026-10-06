/**
 * Programme boundary note.
 *
 * The programme timeline is delivered in a later phase (Phase 4). This section is an
 * honest placeholder that explains what comes next and anchors the secondary call to
 * action. It contains no dates, timings or programme claims.
 */
export function ProgrammeNote() {
  return (
    <section
      id="programme"
      aria-labelledby="programme-heading"
      className="scroll-mt-8 border-t border-maroon/10 bg-paper/60 px-5 py-16 sm:px-8 sm:py-20"
    >
      <div className="mx-auto max-w-2xl text-center">
        <h2
          id="programme-heading"
          className="font-display text-2xl leading-tight text-maroon sm:text-3xl"
        >
          Programme
        </h2>
        <p className="mt-4 text-base leading-relaxed text-text-dark/80">
          The programme details are being prepared and will be added here. This
          invitation is a work in progress.
        </p>
      </div>
    </section>
  );
}
