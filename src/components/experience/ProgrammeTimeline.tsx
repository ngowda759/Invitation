import { ContentPlaceholder } from "@/components/experience/ContentPlaceholder";
import { ContentSection } from "@/components/experience/ContentSection";
import { programme as defaultContent, type ProgrammeContent } from "@/content/schedule";

/**
 * Programme timeline.
 *
 * Renders the supplied programme steps as an ordered list. While none are supplied it
 * shows an honest placeholder; it never invents dates, timings or claims.
 */
export function ProgrammeTimeline({
  content = defaultContent,
}: {
  content?: ProgrammeContent;
}) {
  return (
    <ContentSection id="programme" heading="Programme" intro={content.intro}>
      {content.entries.length > 0 ? (
        <ol className="mt-8 space-y-6">
          {content.entries.map((entry) => (
            <li key={entry.label} className="border-l border-gold/50 pl-4">
              <p className="font-display text-lg text-maroon">{entry.label}</p>
              {entry.detail ? (
                <p className="mt-1 text-sm leading-relaxed text-text-dark/80">
                  {entry.detail}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      ) : (
        <ContentPlaceholder>
          The programme for this invitation is being prepared and will be published
          here once it is confirmed by the temple.
        </ContentPlaceholder>
      )}
    </ContentSection>
  );
}
