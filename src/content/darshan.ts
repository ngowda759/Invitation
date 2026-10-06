/**
 * Darshan content.
 *
 * Darshan occasions and any supporting text are temple facts. They are supplied by
 * the product authority and are intentionally empty until then. This module never
 * invents a timing, date or religious claim; the Darshan section renders an honest
 * empty state while it is empty.
 */
export type DarshanEntry = {
  /** Short label for a darshan occasion. */
  label: string;
  /** Optional supporting line supplied by the product authority. */
  detail?: string;
};

export type DarshanContent = {
  /** Optional introductory line for the section. */
  intro: string;
  entries: DarshanEntry[];
};

export const darshan: DarshanContent = {
  intro: "",
  entries: [],
};
