/**
 * Gallery content.
 *
 * Photographs of the temple are temple content. They are supplied by the product
 * authority and are intentionally empty until then. This module never invents an
 * image, a caption or a claim; the Gallery section renders an honest empty state
 * while it is empty.
 */
export type GalleryImage = {
  /** Image path resolved from the public directory, supplied by the product authority. */
  src: string;
  /** Required alternative text describing the image, supplied by the product authority. */
  alt: string;
  /** Optional caption shown beneath the image. */
  caption?: string;
};

export type GalleryContent = {
  /** Optional introductory line for the section. */
  intro: string;
  images: GalleryImage[];
};

export const gallery: GalleryContent = {
  intro: "",
  images: [],
};
