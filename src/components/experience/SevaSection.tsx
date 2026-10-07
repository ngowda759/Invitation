import { ContentPlaceholder } from "@/components/experience/ContentPlaceholder";
import { ContentSection } from "@/components/experience/ContentSection";
import { seva as defaultContent, type SevaContent } from "@/content/seva";

/**
 * Seva section.
 *
 * Renders the supplied seva opportunities as a native disclosure list. While none are
 * supplied it shows an honest placeholder; it never invents religious claims or
 * offering details.
 */
export function SevaSection({
  content = defaultContent,
}: {
  content?: SevaContent;
}) {
  return (
    <ContentSection id="seva" heading="Seva" intro={content.intro}>
      {content.items.length > 0 ? (
        <ul className="mt-8 divide-y divide-gold/25">
          {content.items.map((item) => (
            <li key={item.label}>
              {item.detail ? (
                <details className="group">
                  <summary className="flex cursor-pointer items-center justify-between gap-3 py-5 font-display text-xl text-maroon marker:content-none">
                    <span>{item.label}</span>
                    <span
                      aria-hidden="true"
                      className="text-sm text-maroon transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="pb-5 text-sm leading-relaxed text-text-dark/80">
                    {item.detail}
                  </p>
                </details>
              ) : (
                <p className="py-5 font-display text-xl text-maroon">
                  {item.label}
                </p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <ContentPlaceholder>
          Seva opportunities are being prepared and will be published here once they
          are confirmed by the temple.
        </ContentPlaceholder>
      )}
    </ContentSection>
  );
}
