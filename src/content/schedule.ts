/**
 * Programme timeline content.
 *
 * Programme steps and any supporting text are temple facts. They are supplied by the
 * product authority and are intentionally empty until then. This module never invents
 * a date, timing, historical or religious claim; the Programme section renders an
 * honest empty state while it is empty.
 */
export type ProgrammeEntry = {
  /** Short label for a programme step. */
  label: string;
  /** Optional supporting line supplied by the product authority. */
  detail?: string;
};

export type ProgrammeContent = {
  /** Optional introductory line for the section. */
  intro: string;
  entries: ProgrammeEntry[];
};

export const programme: ProgrammeContent = {
  intro: "",
  entries: [],
};
