/**
 * Security helpers (Phase 8).
 *
 * Small, dependency-free guards shared by the render path. They make the safe
 * behaviour the default: external links always carry `rel="noopener noreferrer"`,
 * and gallery images may only be same-origin paths. There is no user input in this
 * application today; these functions exist so a future content edit cannot silently
 * introduce an unsafe link or image source.
 */

/** The exact rel value required on every link that opens a new browsing context. */
export const EXTERNAL_LINK_REL = "noopener noreferrer";

/** True for an http(s) URL that points at another origin. */
export function isExternalHref(href: string): boolean {
  try {
    const url = new URL(href);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    // Relative, in-page (`#id`) and mailto/tel links are not external origins.
    return false;
  }
}

/**
 * True only for a same-origin, public-directory image path.
 *
 * Accepts a path that starts with a single `/` (e.g. `/images/temple.jpg`) and
 * rejects absolute URLs, protocol-relative URLs (`//host`), `data:`/`blob:` values
 * and traversal segments. The gallery content module documents its `src` as a path
 * resolved from the public directory, so anything else is a mistake worth failing
 * closed on rather than passing to the image optimizer.
 */
export function isSafeImageSrc(src: string): boolean {
  if (!src.startsWith("/") || src.startsWith("//")) return false;
  if (src.includes("://")) return false;
  return !src.split("/").includes("..");
}
