import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * A quiet, honest placeholder shown while a content module holds no verified copy.
 *
 * It states that the content is supplied by the temple and is pending, so the section
 * never presents unverified temple facts.
 */
export function ContentPlaceholder({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "rounded-card border border-dashed border-maroon/25 bg-paper/50 px-5 py-6 text-sm leading-relaxed text-text-dark/70",
        className,
      )}
    >
      {children}
    </p>
  );
}
