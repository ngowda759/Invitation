import { cn } from "@/lib/utils";

/** A labelled entry with optional supporting copy, as supplied by a content module. */
export type Entry = {
  label: string;
  detail?: string;
};

/**
 * A shared definition list for invitation content that is a set of labelled entries.
 *
 * Darshan and Festival both render this exact shape. Keeping one component means the
 * two sections cannot drift apart in spacing or typography, and it removes the
 * duplicated markup the AntiSlop gate flags as duplicate components. Each entry is set
 * as a line of the invitation: a display-face label over a warm support line, separated
 * by a thin gilt rule.
 */
export function EntryList({ entries, className }: { entries: Entry[]; className?: string }) {
  return (
    <dl className={cn("mt-8 divide-y divide-gold/25", className)}>
      {entries.map((entry) => (
        <div key={entry.label} className="py-5 first:pt-0 last:pb-0">
          <dt className="font-display text-xl text-maroon">{entry.label}</dt>
          {entry.detail ? (
            <dd className="mt-1 text-sm leading-relaxed text-text-dark/80">
              {entry.detail}
            </dd>
          ) : null}
        </div>
      ))}
    </dl>
  );
}
