import { DiyaMotif, Mandala, TempleArch, TempleRule } from "@/components/experience/Ornaments";
import { ButtonLink } from "@/components/ui/button";
import { event } from "@/content/event";

/**
 * Temple hero — the devotional opening of the invitation.
 *
 * A full-bleed, darkened maroon field lit by a warm lamp glow and a restrained grain,
 * framed by a faint gopura arch and centred on a gilt mandala. It carries the
 * invocation, the event identity and the primary calls to action, giving the important
 * words room to breathe. It is a Server Component with no motion of its own: the lamp
 * glow is a still highlight, honouring the design system's ban on constant looping
 * animation.
 */
export function TempleHero() {
  return (
    <section
      aria-labelledby="invitation-heading"
      className="hero relative isolate flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-5 py-16 text-center sm:px-8"
    >
      <div aria-hidden="true" className="hero__glow" />
      <div aria-hidden="true" className="hero__grain" />
      <div aria-hidden="true" className="hero__mandala-halo" />
      <TempleArch
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1/2 mx-auto h-[112%] w-[26rem] max-w-[94vw] -translate-y-[54%] opacity-[0.22]"
      />
      <Mandala
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 h-[22rem] w-[22rem] max-w-[92vw] -translate-x-1/2 -translate-y-[58%] opacity-[0.14] sm:h-[30rem] sm:w-[30rem]"
      />

      <DiyaMotif className="relative h-12 w-12 drop-shadow-[0_0_18px_rgba(226,192,121,0.55)] sm:h-14 sm:w-14" />

      {event.invocation ? (
        <p className="relative mt-5 max-w-xl font-display text-lg italic text-gold-light sm:text-xl">
          {event.invocation}
        </p>
      ) : null}

      <TempleRule className="relative mt-7 opacity-80" />

      <h1
        id="invitation-heading"
        className="relative mt-7 font-display text-[2.6rem] leading-[1.05] font-medium text-cream sm:text-5xl md:text-6xl"
      >
        {event.name}
      </h1>

      {event.kannadaName ? (
        <p
          lang="kn"
          className="relative mt-3 font-kannada text-xl text-gold-light sm:text-2xl"
        >
          {event.kannadaName}
        </p>
      ) : null}

      <p className="relative mt-6 max-w-xl text-base leading-relaxed text-cream/80 sm:text-lg">
        {event.description}
      </p>

      <div className="relative mt-10 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row sm:items-center">
        <ButtonLink
          href="#event"
          size="lg"
          className="bg-gold text-brown-deep hover:bg-gold-light focus-visible:ring-cream focus-visible:ring-offset-maroon-deep"
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
