import { DarshanSection } from "@/components/experience/DarshanSection";
import { EventIdentity } from "@/components/experience/EventIdentity";
import { FestivalSection } from "@/components/experience/FestivalSection";
import { OpeningExperience } from "@/components/experience/OpeningExperience";
import { ProgrammeTimeline } from "@/components/experience/ProgrammeTimeline";
import { RayaruSection } from "@/components/experience/RayaruSection";
import { SevaSection } from "@/components/experience/SevaSection";
import { TempleHero } from "@/components/experience/TempleHero";

/**
 * Invitation home — Phase 4 (Invitation Content).
 *
 * Composition: an opening threshold, then a temple hero carrying the invocation,
 * event identity and primary calls to action, followed by the event identity panel
 * and the invitation content sections — Darshan, Festival, Programme, Guru Rayaru
 * and Seva. Each content section renders only supplied, verified copy and shows an
 * honest placeholder while its content module is empty.
 */
export default function HomePage() {
  return (
    <>
      <OpeningExperience />

      <main id="main" className="flex flex-1 flex-col">
        <TempleHero />
        <EventIdentity />
        <DarshanSection />
        <FestivalSection />
        <ProgrammeTimeline />
        <RayaruSection />
        <SevaSection />
      </main>

      <footer className="border-t border-maroon/10 bg-brown-deep px-5 py-8 sm:px-8">
        <p className="mx-auto max-w-2xl text-center text-xs text-cream/60">
          Digital temple invitation experience.
        </p>
      </footer>
    </>
  );
}
