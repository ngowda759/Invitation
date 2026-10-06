/**
 * Temple map content.
 *
 * The map reference — a place name or a coordinate pair — is a temple fact. It is
 * supplied by the product authority and is intentionally empty until then. This module
 * never invents a place or a coordinate; the Temple map section renders an honest empty
 * state while it is empty.
 */
export type MapContent = {
  /** Optional introductory line for the section. */
  intro: string;
  /**
   * Map reference supplied by the product authority: a place name or a coordinate
   * pair. It is used only to build an external map link; the invitation never embeds a
   * third-party map widget.
   */
  place: string;
};

export const map: MapContent = {
  intro: "",
  place: "",
};
