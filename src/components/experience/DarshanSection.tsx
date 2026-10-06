import { ContentPlaceholder } from "@/components/experience/ContentPlaceholder";
import { ContentSection } from "@/components/experience/ContentSection";
import { EntryList } from "@/components/experience/EntryList";
import { darshan as defaultContent, type DarshanContent } from "@/content/darshan";

/**
 * Darshan section.
 *
 * Renders the supplied darshan occasions. While none are supplied it shows an honest
 * placeholder; it never invents timings or claims.
 */
export function DarshanSection({
  content = defaultContent,
}: {
  content?: DarshanContent;
}) {
  return (
    <ContentSection id="darshan" heading="Darshan" intro={content.intro}>
      {content.entries.length > 0 ? (
        <EntryList entries={content.entries} />
      ) : (
        <ContentPlaceholder>
          The darshan details for this invitation are being prepared and will be
          published here once they are confirmed by the temple.
        </ContentPlaceholder>
      )}
    </ContentSection>
  );
}
