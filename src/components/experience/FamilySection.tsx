import { ContentPlaceholder } from "@/components/experience/ContentPlaceholder";
import { ContentSection } from "@/components/experience/ContentSection";
import { CornerFlourish } from "@/components/experience/Ornaments";
import { family as defaultContent, type FamilyContent } from "@/content/family";

/**
 * Family section.
 *
 * Renders the people who extend the invitation as warm, individually framed names with
 * a short contextual line, in the manner of the hosts named on a printed invitation —
 * never as generic profile cards. While none are supplied it shows an honest
 * placeholder; it never invents a name, a relationship or a claim.
 */
export function FamilySection({
  content = defaultContent,
}: {
  content?: FamilyContent;
}) {
  return (
    <ContentSection id="family" heading="With warm regards" intro={content.intro}>
      {content.members.length > 0 ? (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2">
          {content.members.map((member) => (
            <li
              key={member.label}
              className="relative border border-gold/30 bg-paper/40 px-6 py-7 text-center"
            >
              <CornerFlourish className="absolute top-1.5 left-1.5 h-5 w-5 opacity-70" />
              <CornerFlourish className="absolute top-1.5 right-1.5 h-5 w-5 rotate-90 opacity-70" />
              <p className="font-display text-2xl leading-tight text-maroon">
                {member.label}
              </p>
              {member.detail ? (
                <p className="mt-2 text-sm leading-relaxed text-text-dark/75">
                  {member.detail}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <ContentPlaceholder>
          The names of those extending this invitation are being gathered and will be
          published here once they are confirmed.
        </ContentPlaceholder>
      )}
    </ContentSection>
  );
}
