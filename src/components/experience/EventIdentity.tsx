import { TempleRule } from "@/components/experience/Ornaments";
import { event } from "@/content/event";

/**
 * Event identity — a compact, legible restatement of what this invitation is for.
 *
 * It states the event name and, when the product authority supplies one, the Kannada
 * identity line. It deliberately contains no dates, timings or claims; those arrive
 * with the invitation content in a later phase.
 */
export function EventIdentity() {
  return (
    <section
      id="event"
      aria-labelledby="event-heading"
      className="scroll-mt-8 bg-background px-5 py-16 sm:px-8 sm:py-24"
    >
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <TempleRule className="opacity-70" />
        <p className="mt-6 text-xs uppercase tracking-[0.3em] text-gold">
          Invitation
        </p>
        <h2
          id="event-heading"
          className="mt-3 font-display text-3xl leading-tight text-maroon sm:text-4xl"
        >
          {event.name}
        </h2>
        {event.kannadaName ? (
          <p lang="kn" className="mt-2 font-display text-lg text-maroon/80 sm:text-xl">
            {event.kannadaName}
          </p>
        ) : null}
        <p className="mt-5 max-w-xl text-base leading-relaxed text-text-dark/80">
          {event.description}
        </p>
      </div>
    </section>
  );
}
