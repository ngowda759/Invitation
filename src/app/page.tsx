import { EventIdentity } from "@/components/experience/EventIdentity";
import { OpeningExperience } from "@/components/experience/OpeningExperience";
import { ProgrammeNote } from "@/components/experience/ProgrammeNote";
import { TempleHero } from "@/components/experience/TempleHero";

/**
 * Invitation home — Phase 3 (Opening + Hero).
 *
 * Composition: an opening threshold, then a temple hero carrying the invocation,
 * event identity and primary calls to action, followed by a compact event identity
 * panel and an honest programme boundary note. Later phases add the invitation
 * content beneath this.
 */
export default function HomePage() {
  return (
    <>
      <OpeningExperience />

      <main id="main" className="flex flex-1 flex-col">
        <TempleHero />
        <EventIdentity />
        <ProgrammeNote />
      </main>

      <footer className="border-t border-maroon/10 bg-brown-deep px-5 py-8 sm:px-8">
        <p className="mx-auto max-w-2xl text-center text-xs text-cream/60">
          Digital temple invitation experience.
        </p>
      </footer>
    </>
  );
}
