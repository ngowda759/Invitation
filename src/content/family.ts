/**
 * Family / hosts content.
 *
 * The people who extend the invitation are a personal matter. They are supplied by the
 * product authority and are intentionally empty until then. This module never invents a
 * name, a relationship or a claim; the Family section renders an honest empty state
 * while it is empty.
 */
export type FamilyMember = {
  /** Name as it should appear on the invitation, supplied by the product authority. */
  label: string;
  /** Optional role or supporting line supplied by the product authority. */
  detail?: string;
};

export type FamilyContent = {
  /** Optional introductory line for the section. */
  intro: string;
  /** Members, rendered in order as warm, framed lines of the invitation. */
  members: FamilyMember[];
};

export const family: FamilyContent = {
  intro: "",
  members: [],
};
