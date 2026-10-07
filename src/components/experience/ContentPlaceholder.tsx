import type { ReactNode } from "react";

/**
 * A quiet, honest note shown while a content module holds no verified copy.
 *
 * It states that the content is supplied by the temple and is pending, so the section
 * never presents unverified temple facts. It is typeset as a line of the invitation —
 * a gilt margin mark beside a short note — rather than a generic card, and it owns its
 * top margin so every section spaces its empty state identically.
 */
export function ContentPlaceholder({ children }: { children: ReactNode }) {
  return (
    <p className="mt-8 border-l border-gold/50 pl-5 text-sm leading-relaxed text-text-dark/80 italic">
      {children}
    </p>
  );
}
