import { DarshanSection } from "@/components/experience/DarshanSection";
import { EventIdentity } from "@/components/experience/EventIdentity";
import { FamilySection } from "@/components/experience/FamilySection";
import { FestivalSection } from "@/components/experience/FestivalSection";
import { GalleryExperience } from "@/components/experience/GalleryExperience";
import { InvitationNav } from "@/components/experience/InvitationNav";
import { LocationSection } from "@/components/experience/LocationSection";
import { OpeningExperience } from "@/components/experience/OpeningExperience";
import { LotusDivider } from "@/components/experience/Ornaments";
import { ProgrammeTimeline } from "@/components/experience/ProgrammeTimeline";
import { RayaruSection } from "@/components/experience/RayaruSection";
import { SevaSection } from "@/components/experience/SevaSection";
import { ShareExperience } from "@/components/experience/ShareExperience";
import { TempleHero } from "@/components/experience/TempleHero";
import { TempleMapSection } from "@/components/experience/TempleMapSection";

/**
 * Invitation home — the invitation story.
 *
 * The visitor's journey is: a ceremonial cover that opens into a devotional hero, a
 * framed invitation panel, a quiet contents band, then the movements of the invitation
 * — Darshan, Festival, Programme, Guru Rayaru, the temple map, Seva, the gallery, the
 * location — closing with sharing. Each content section renders only supplied, verified
 * copy and shows an honest placeholder while its content module is empty, so the
 * invitation is complete end to end without inventing a temple fact.
 */
export default function HomePage() {
  return (
    <>
      <OpeningExperience />

      <main id="main" className="flex flex-1 flex-col">
        <TempleHero />
        <EventIdentity />
        <InvitationNav />
        <DarshanSection />
        <FestivalSection />
        <ProgrammeTimeline />
        <RayaruSection />
        <TempleMapSection />
        <SevaSection />
        <FamilySection />
        <GalleryExperience />
        <LocationSection />
        <ShareExperience />
      </main>

      <footer className="border-t border-maroon/10 bg-brown-deep px-5 pt-10 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <LotusDivider className="mx-auto opacity-70" />
          <p className="mt-4 font-display text-lg text-cream/85">
            We look forward to welcoming you.
          </p>
          <p className="mt-2 text-xs text-cream/60">
            Digital temple invitation experience.
          </p>
        </div>
      </footer>
    </>
  );
}
