import { ContentPlaceholder } from "@/components/experience/ContentPlaceholder";
import { ContentSection } from "@/components/experience/ContentSection";
import { ButtonLink } from "@/components/ui/button";
import { map as defaultContent, type MapContent } from "@/content/map";
import { EXTERNAL_LINK_REL } from "@/lib/security";

/**
 * Temple map section.
 *
 * Offers a link out to an external map provider built from the supplied map reference.
 * The invitation never embeds a third-party map widget or tracks the visitor. While no
 * reference is supplied it shows an honest placeholder; it never invents a location.
 */
export function TempleMapSection({
  content = defaultContent,
}: {
  content?: MapContent;
}) {
  const place = content.place.trim();

  return (
    <ContentSection id="map" heading="Temple map" intro={content.intro}>
      {place ? (
        <div className="mt-8">
          <ButtonLink
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`}
            target="_blank"
            rel={EXTERNAL_LINK_REL}
            size="lg"
          >
            Open the temple map
            <span className="sr-only"> (opens in a new tab)</span>
          </ButtonLink>
        </div>
      ) : (
        <ContentPlaceholder>
          The temple map is being prepared and will be published here once the location
          is confirmed by the temple.
        </ContentPlaceholder>
      )}
    </ContentSection>
  );
}
