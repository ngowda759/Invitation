import type { ReactNode } from "react";

import { TempleRule } from "@/components/experience/Ornaments";

/**
 * Shared shell for an invitation content section.
 *
 * It provides the landmark region and a consistent heading treatment. Section bodies
 * render only verified, supplied content; nothing here invents temple facts.
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
      className="scroll-mt-8 border-t border-maroon/10 px-5 py-16 sm:px-8 sm:py-24"
    >
      <div className="mx-auto max-w-2xl">
        <TempleRule className="opacity-60" />
        <h2
          id={headingId}
          className="mt-5 font-display text-2xl leading-tight text-maroon sm:text-3xl"
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
