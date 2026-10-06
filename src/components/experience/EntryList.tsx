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
 * duplicated markup the AntiSlop gate flags as duplicate components.
 */
export function EntryList({ entries, className }: { entries: Entry[]; className?: string }) {
  return (
    <dl className={cn("mt-8 space-y-5", className)}>
      {entries.map((entry) => (
        <div key={entry.label}>
          <dt className="font-display text-lg text-maroon">{entry.label}</dt>
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
