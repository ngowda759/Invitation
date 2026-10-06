import { ContentPlaceholder } from "@/components/experience/ContentPlaceholder";
import { ContentSection } from "@/components/experience/ContentSection";
import { rayaru as defaultContent, type RayaruContent } from "@/content/rayaru";

/**
 * Guru Rayaru section.
 *
 * Renders the supplied copy. While none is supplied it shows an honest placeholder;
 * it never invents historical or religious claims.
 */
export function RayaruSection({
  content = defaultContent,
}: {
  content?: RayaruContent;
}) {
  return (
    <ContentSection id="rayaru" heading="Guru Rayaru" intro={content.intro}>
      {content.paragraphs.length > 0 ? (
        <div className="mt-8 space-y-4">
          {content.paragraphs.map((paragraph, index) => (
            <p key={index} className="text-base leading-relaxed text-text-dark/80">
              {paragraph}
            </p>
          ))}
        </div>
      ) : (
        <ContentPlaceholder>
          An introduction to Guru Rayaru is being prepared and will be published here
          once it is confirmed by the temple.
        </ContentPlaceholder>
      )}
    </ContentSection>
  );
}
