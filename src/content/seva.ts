/**
 * Seva content.
 *
 * Seva opportunities and any supporting text are temple facts. They are supplied by
 * the product authority and are intentionally empty until then. This module never
 * invents a religious claim or an offering detail; the Seva section renders an honest
 * empty state while it is empty.
 */
export type SevaItem = {
  /** Short label for a seva opportunity. */
  label: string;
  /** Optional supporting line supplied by the product authority. */
  detail?: string;
};

export type SevaContent = {
  /** Optional introductory line for the section. */
  intro: string;
  items: SevaItem[];
};

export const seva: SevaContent = {
  intro: "",
  items: [],
};
