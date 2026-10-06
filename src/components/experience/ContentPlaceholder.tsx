import type { ReactNode } from "react";

/**
 * A quiet, honest placeholder shown while a content module holds no verified copy.
 *
 * It states that the content is supplied by the temple and is pending, so the section
 * never presents unverified temple facts. It owns its top margin so every section
 * spaces its empty state identically.
 */
export function ContentPlaceholder({ children }: { children: ReactNode }) {
  return (
    <p className="mt-8 rounded-card border border-dashed border-maroon/25 bg-paper/50 px-5 py-6 text-sm leading-relaxed text-text-dark/70">
      {children}
    </p>
  );
}
