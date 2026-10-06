import { DiyaMotif, TempleRule } from "@/components/experience/Ornaments";
import { ButtonLink } from "@/components/ui/button";
import { event } from "@/content/event";

/**
 * Temple hero — the first full screen of the invitation.
 *
 * A full-bleed, darkened maroon field with a warm lamp glow, a restrained grain and
 * an ornamental top border. It carries the invocation, the event identity and the
 * primary calls to action. It is a Server Component; the only motion is a slow CSS
 * glow that respects `prefers-reduced-motion`.
 */
export function TempleHero() {
  return (
    <section
      aria-labelledby="invitation-heading"
      className="hero relative isolate flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-5 py-16 text-center sm:px-8"
    >
      <div aria-hidden="true" className="hero__glow" />
      <div aria-hidden="true" className="hero__grain" />

      <DiyaMotif className="relative h-12 w-12 drop-shadow-[0_0_18px_rgba(230,198,106,0.55)] sm:h-14 sm:w-14" />

      {event.invocation ? (
        <p className="relative mt-5 max-w-xl font-display text-lg italic text-gold-light sm:text-xl">
          {event.invocation}
        </p>
      ) : null}

      <TempleRule className="relative mt-7 opacity-80" />

      <h1
        id="invitation-heading"
        className="relative mt-7 font-display text-4xl leading-tight text-cream sm:text-5xl md:text-6xl"
      >
        {event.name}
      </h1>

      {event.kannadaName ? (
        <p
          lang="kn"
          className="relative mt-3 font-display text-xl text-gold-light sm:text-2xl"
        >
          {event.kannadaName}
        </p>
      ) : null}

      <p className="relative mt-6 max-w-xl text-base leading-relaxed text-cream/80 sm:text-lg">
        {event.description}
      </p>

      <div className="relative mt-10 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center">
        <ButtonLink
          href="#event"
          size="lg"
          className="bg-gold text-brown-deep hover:bg-gold-light focus-visible:ring-gold-light focus-visible:ring-offset-maroon-deep"
        >
          {event.cta.primary}
        </ButtonLink>
        <ButtonLink
          href="#programme"
          variant="outline"
          size="lg"
          className="border-cream/40 text-cream hover:bg-cream/10 focus-visible:ring-gold-light focus-visible:ring-offset-maroon-deep"
        >
          {event.cta.secondary}
        </ButtonLink>
      </div>
    </section>
  );
}
