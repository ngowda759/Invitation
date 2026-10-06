import { DarshanSection } from "@/components/experience/DarshanSection";
import { EventIdentity } from "@/components/experience/EventIdentity";
import { FestivalSection } from "@/components/experience/FestivalSection";
import { GalleryExperience } from "@/components/experience/GalleryExperience";
import { LocationSection } from "@/components/experience/LocationSection";
import { OpeningExperience } from "@/components/experience/OpeningExperience";
import { ProgrammeTimeline } from "@/components/experience/ProgrammeTimeline";
import { RayaruSection } from "@/components/experience/RayaruSection";
import { SevaSection } from "@/components/experience/SevaSection";
import { ShareExperience } from "@/components/experience/ShareExperience";
import { TempleHero } from "@/components/experience/TempleHero";
import { TempleMapSection } from "@/components/experience/TempleMapSection";

/**
 * Invitation home — Phase 5 (Temple Experience).
 *
 * Composition: an opening threshold, then a temple hero carrying the invocation,
 * event identity and primary calls to action, followed by the event identity panel,
 * the invitation content sections — Darshan, Festival, Programme, Guru Rayaru and
 * Seva — and the temple experience sections: the temple map, the gallery, the
 * location and sharing. Each content section renders only supplied, verified copy and
 * shows an honest placeholder while its content module is empty, so the invitation is
 * complete end to end without inventing a temple fact.
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
        <TempleMapSection />
        <SevaSection />
        <GalleryExperience />
        <LocationSection />
        <ShareExperience />
      </main>

      <footer className="border-t border-maroon/10 bg-brown-deep px-5 pt-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-8">
        <p className="mx-auto max-w-2xl text-center text-xs text-cream/70">
          Digital temple invitation experience.
        </p>
      </footer>
    </>
  );
}
