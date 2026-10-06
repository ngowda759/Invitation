import { ContentPlaceholder } from "@/components/experience/ContentPlaceholder";
import { ContentSection } from "@/components/experience/ContentSection";
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
        <dl className="mt-8 space-y-5">
          {content.highlights.map((highlight) => (
            <div key={highlight.label}>
              <dt className="font-display text-lg text-maroon">{highlight.label}</dt>
              {highlight.detail ? (
                <dd className="mt-1 text-sm leading-relaxed text-text-dark/80">
                  {highlight.detail}
                </dd>
              ) : null}
            </div>
          ))}
        </dl>
      ) : (
        <ContentPlaceholder className="mt-8">
          The festival highlights for this invitation are being prepared and will be
          published here once they are confirmed by the temple.
        </ContentPlaceholder>
      )}
    </ContentSection>
  );
}
