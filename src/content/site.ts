/**
 * Placeholder project identity.
 *
 * IMPORTANT: every field marked "placeholder" is intentionally neutral scaffolding.
 * No temple facts, event dates, timings, or religious claims may be invented.
 * Real, verified content is supplied by the product authority in a later phase.
 */
export const site = {
  /** Working project name. Not a claim about the temple; subject to product approval. */
  projectName: "Rayara Anubhava",
  /** Neutral, accurate description of what this repository currently is. */
  description:
    "Digital temple invitation experience. Foundation build; content and design arrive in later phases.",
  locale: "en-IN",
  /** Placeholder canonical origin; replaced with the production domain at release. */
  placeholderUrl: "https://example.invalid",
} as const;

export type Site = typeof site;
