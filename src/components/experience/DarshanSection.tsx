import { ContentPlaceholder } from "@/components/experience/ContentPlaceholder";
import { ContentSection } from "@/components/experience/ContentSection";
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
        <dl className="mt-8 space-y-5">
          {content.entries.map((entry) => (
            <div key={entry.label}>
              <dt className="font-display text-lg text-maroon">{entry.label}</dt>
              {entry.detail ? (
                <dd className="mt-1 text-sm leading-relaxed text-text-dark/80">
                  {entry.detail}
                </dd>
              ) : null}
            </div>
          ))}
        </dl>
      ) : (
        <ContentPlaceholder className="mt-8">
          The darshan details for this invitation are being prepared and will be
          published here once they are confirmed by the temple.
        </ContentPlaceholder>
      )}
    </ContentSection>
  );
}
