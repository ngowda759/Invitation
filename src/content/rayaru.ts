/**
 * Guru Rayaru content.
 *
 * Any account of Guru Rayaru is a historical and religious matter. It is supplied by
 * the product authority and is intentionally empty until then. This module never
 * invents a historical or religious claim; the Guru Rayaru section renders an honest
 * empty state while it is empty.
 */
export type RayaruContent = {
  /** Optional introductory line for the section. */
  intro: string;
  /** Paragraphs of supplied copy, rendered in order. */
  paragraphs: string[];
};

export const rayaru: RayaruContent = {
  intro: "",
  paragraphs: [],
};
