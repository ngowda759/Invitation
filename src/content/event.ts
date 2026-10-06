import { site } from "@/content/site";

/**
 * Event identity for the invitation.
 *
 * IMPORTANT: This module must never invent temple facts. Dates, timings, historical
 * claims and religious assertions are supplied by the product authority and are not
 * present in this phase. The optional fields below are intentionally empty until the
 * product authority provides verified content; the UI omits them while they are empty.
 *
 * The event name reuses the working project name established in Phase 1, not a claim
 * about the temple. It is subject to product approval.
 */
export const event = {
  /** Event name. Reuses the Phase 1 working name; subject to product approval. */
  name: site.projectName,
  /**
   * Kannada identity line. Empty until the product authority supplies verified copy;
   * the UI renders it only when it is non-empty.
   */
  kannadaName: "",
  /**
   * Devotional invocation. Empty until the product authority supplies verified copy;
   * the UI renders the lamp motif only while it is empty.
   */
  invocation: "",
  /**
   * Honest, neutral description of the artifact. Not a temple fact, date or timing.
   */
  description:
    "A digital temple invitation experience, composed for mobile first and opened like a doorway.",
  /** Labels for the primary calls to action. */
  cta: {
    primary: "Enter the invitation",
    secondary: "View programme",
  },
} as const;

export type Event = typeof event;

