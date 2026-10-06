import Image from "next/image";

import { ContentPlaceholder } from "@/components/experience/ContentPlaceholder";
import { ContentSection } from "@/components/experience/ContentSection";
import { gallery as defaultContent, type GalleryContent } from "@/content/gallery";

/**
 * Gallery.
 *
 * Renders the supplied photographs as a responsive grid. Each thumbnail links to a
 * full-view overlay that is shown with CSS `:target` only, so the gallery needs no
 * client JavaScript and still works with JavaScript disabled. Images use the Next.js
 * image component for optimization and lazy loading. While no photographs are supplied
 * it shows an honest placeholder; it never invents an image or a caption.
 */
export function GalleryExperience({
  content = defaultContent,
}: {
  content?: GalleryContent;
}) {
  const { images } = content;

  return (
    <ContentSection id="gallery" heading="Gallery" intro={content.intro}>
      {images.length > 0 ? (
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image, index) => (
            <li key={image.src}>
              <a
                href={`#gallery-photo-${index}`}
                className="group relative block aspect-square overflow-hidden rounded-card border border-maroon/15 bg-paper/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-deep"
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(max-width: 640px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transform-none"
                />
              </a>
              {image.caption ? (
                <p className="mt-2 text-xs leading-relaxed text-text-dark/70">
                  {image.caption}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <ContentPlaceholder className="mt-8">
          Photographs of the temple are being gathered and will be published here once
          they are confirmed by the temple.
        </ContentPlaceholder>
      )}

      {images.map((image, index) => (
        <div
          key={image.src}
          id={`gallery-photo-${index}`}
          role="dialog"
          aria-label={`Enlarged photograph: ${image.alt}`}
          className="gallery-lightbox"
        >
          <a
            href="#gallery"
            aria-hidden="true"
            tabIndex={-1}
            className="gallery-lightbox__backdrop"
          />
          <figure className="gallery-lightbox__figure">
            <div className="gallery-lightbox__media">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="90vw"
                className="object-contain"
              />
            </div>
            {image.caption ? (
              <figcaption className="mt-4 text-sm text-cream/80">
                {image.caption}
              </figcaption>
            ) : null}
            <a
              href="#gallery"
              className="mt-5 inline-flex items-center justify-center rounded-full border border-cream/40 px-6 py-2 text-sm font-medium text-cream hover:bg-cream/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-light"
            >
              Close
            </a>
          </figure>
        </div>
      ))}
    </ContentSection>
  );
}
