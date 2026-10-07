import type { ReactNode } from "react";

import { LotusDivider } from "@/components/experience/Ornaments";

/**
 * Shared shell for an invitation section.
 *
 * It provides the landmark region, a consistent ceremonial heading treatment and the
 * scroll-driven reveal that gives each movement of the invitation a sense of arrival.
 * Section bodies render only verified, supplied content; nothing here invents temple
 * facts. The reveal is CSS-only (`.section-reveal`) and collapses under
 * `prefers-reduced-motion`.
 */
export function ContentSection({
  id,
  heading,
  intro,
  children,
}: {
  id: string;
  heading: string;
  intro?: string;
  children: ReactNode;
}) {
  const headingId = `${id}-heading`;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="section-reveal scroll-mt-8 border-t border-maroon/10 px-5 py-16 sm:px-8 sm:py-24"
    >
      <div className="mx-auto max-w-2xl">
        <LotusDivider className="mx-auto opacity-80" />
        <h2
          id={headingId}
          className="mt-5 font-display text-3xl leading-tight font-medium text-maroon sm:text-4xl"
        >
          {heading}
        </h2>
        {intro ? (
          <p className="mt-4 text-base leading-relaxed text-text-dark/80">{intro}</p>
        ) : null}
        {children}
      </div>
    </section>
  );
}
