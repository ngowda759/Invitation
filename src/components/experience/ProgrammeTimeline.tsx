import { ContentPlaceholder } from "@/components/experience/ContentPlaceholder";
import { ContentSection } from "@/components/experience/ContentSection";
import { programme as defaultContent, type ProgrammeContent } from "@/content/schedule";

/**
 * Programme timeline.
 *
 * The supplied programme steps are typeset as a ceremonial schedule: an ordered list
 * threaded on a single gilt line, each step marked with a small lamp-lit bead, so it
 * reads like the programme on a printed invitation rather than a data table. While no
 * steps are supplied it shows an honest placeholder; it never invents dates, timings or
 * claims.
 */
export function ProgrammeTimeline({
  content = defaultContent,
}: {
  content?: ProgrammeContent;
}) {
  return (
    <ContentSection id="programme" heading="Programme" intro={content.intro}>
      {content.entries.length > 0 ? (
        <ol className="relative mt-8 space-y-8 before:absolute before:top-2 before:bottom-2 before:left-[0.3125rem] before:w-px before:bg-gold/45">
          {content.entries.map((entry, index) => (
            <li key={entry.label} className="relative pl-8">
              <span
                aria-hidden="true"
                className="absolute top-1.5 left-0 grid h-[0.7rem] w-[0.7rem] place-items-center rounded-full border border-gold bg-cream"
              >
                <span className="h-[0.28rem] w-[0.28rem] rounded-full bg-saffron" />
              </span>
              <p className="text-[0.7rem] uppercase tracking-[0.28em] text-maroon/80">
                {String(index + 1).padStart(2, "0")}
              </p>
              <p className="mt-1 font-display text-2xl leading-tight text-maroon">
                {entry.label}
              </p>
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
