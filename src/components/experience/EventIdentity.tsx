import {
  CornerFlourish,
  LotusDivider,
  TempleRule,
} from "@/components/experience/Ornaments";
import { event } from "@/content/event";

/**
 * Invitation panel — a framed restatement of what this invitation is for.
 *
 * A parchment panel with gilt corner flourishes and a lotus divider, in the manner of
 * the front of a printed invitation. It states the event name and, when the product
 * authority supplies one, the Kannada identity line. It deliberately contains no dates,
 * timings or claims; those arrive with the invitation content.
 */
export function EventIdentity() {
  return (
    <section
      id="event"
      aria-label="Invitation details"
      className="section-reveal scroll-mt-8 bg-background px-5 py-16 sm:px-8 sm:py-24"
    >
      <div className="mx-auto max-w-2xl">
        <div className="relative border border-gold/35 bg-paper/50 px-6 py-12 text-center sm:px-14 sm:py-16">
          <CornerFlourish className="absolute top-2 left-2 h-7 w-7" />
          <CornerFlourish className="absolute top-2 right-2 h-7 w-7 rotate-90" />
          <CornerFlourish className="absolute bottom-2 left-2 h-7 w-7 -rotate-90" />
          <CornerFlourish className="absolute right-2 bottom-2 h-7 w-7 rotate-180" />

          <LotusDivider className="mx-auto" />
          <p className="mt-5 text-xs uppercase tracking-[0.34em] text-maroon/80">
            Invitation
          </p>
          <h2 className="mt-4 font-display text-4xl leading-tight font-medium text-maroon sm:text-5xl">
            {event.name}
          </h2>
          {event.kannadaName ? (
            <p lang="kn" className="mt-3 font-kannada text-lg text-maroon/80 sm:text-xl">
              {event.kannadaName}
            </p>
          ) : null}
          <TempleRule className="mx-auto mt-6 opacity-70" />
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-text-dark/80">
            {event.description}
          </p>
        </div>
      </div>
    </section>
  );
}
