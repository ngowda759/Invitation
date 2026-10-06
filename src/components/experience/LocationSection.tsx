import { ContentPlaceholder } from "@/components/experience/ContentPlaceholder";
import { ContentSection } from "@/components/experience/ContentSection";
import { location as defaultContent, type LocationContent } from "@/content/location";

/**
 * Location section.
 *
 * Renders the supplied address lines. While no address is supplied it shows an honest
 * placeholder; it never invents a location. The external map affordance lives in the
 * separate Temple map section.
 */
export function LocationSection({
  content = defaultContent,
}: {
  content?: LocationContent;
}) {
  const hasAddress = content.lines.length > 0;

  return (
    <ContentSection id="location" heading="Location" intro={content.intro}>
      {hasAddress ? (
        <address className="mt-8 not-italic text-base leading-relaxed text-text-dark/80">
          {content.lines.map((line, index) => (
            <span key={index} className="block">
              {line}
            </span>
          ))}
        </address>
      ) : (
        <ContentPlaceholder>
          The temple address for this invitation is being prepared and will be
          published here once it is confirmed by the temple.
        </ContentPlaceholder>
      )}
    </ContentSection>
  );
}
