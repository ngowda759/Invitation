/**
 * Festival content.
 *
 * What the festival marks and its highlights are temple facts. They are supplied by
 * the product authority and are intentionally empty until then. This module never
 * invents a date, timing, historical or religious claim; the Festival section renders
 * an honest empty state while it is empty.
 */
export type FestivalHighlight = {
  /** Short label for a festival highlight. */
  label: string;
  /** Optional supporting line supplied by the product authority. */
  detail?: string;
};

export type FestivalContent = {
  /** Optional introductory line for the section. */
  intro: string;
  highlights: FestivalHighlight[];
};

export const festival: FestivalContent = {
  intro: "",
  highlights: [],
};
