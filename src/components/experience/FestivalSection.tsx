import { ContentPlaceholder } from "@/components/experience/ContentPlaceholder";
import { ContentSection } from "@/components/experience/ContentSection";
import { EntryList } from "@/components/experience/EntryList";
import { festival as defaultContent, type FestivalContent } from "@/content/festival";

/**
 * Festival section.
 *
 * Renders the supplied festival highlights. While none are supplied it shows an
 * honest placeholder; it never invents dates, timings or claims.
 */
export function FestivalSection({
  content = defaultContent,
}: {
  content?: FestivalContent;
}) {
  return (
    <ContentSection id="festival" heading="Festival" intro={content.intro}>
      {content.highlights.length > 0 ? (
        <EntryList entries={content.highlights} />
      ) : (
        <ContentPlaceholder>
          The festival highlights for this invitation are being prepared and will be
          published here once they are confirmed by the temple.
        </ContentPlaceholder>
      )}
    </ContentSection>
  );
}
