/**
 * Location content.
 *
 * The temple address is a temple fact. It is supplied by the product authority and is
 * intentionally empty until then. This module never invents an address or a landmark;
 * the Location section renders an honest empty state while it is empty.
 */
export type LocationContent = {
  /** Optional introductory line for the section. */
  intro: string;
  /** Address lines, supplied by the product authority, rendered in order. */
  lines: string[];
};

export const location: LocationContent = {
  intro: "",
  lines: [],
};
