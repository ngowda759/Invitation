import { Button } from "@/components/ui/button";
import { site } from "@/content/site";

/**
 * Foundation placeholder page.
 *
 * This page intentionally contains no hero, no animation and no temple content.
 * It exists so the application foundation can be built, linted, typed, tested and
 * rendered. Product content is added in a later, product-authorised phase.
 */
export default function HomePage() {
  return (
    <>
      <header className="border-b border-maroon/10">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <p className="font-display text-lg text-maroon">{site.projectName}</p>
          <span className="text-xs uppercase tracking-widest text-text-dark/60">
            Foundation
          </span>
        </div>
      </header>

      <main id="main" className="flex flex-1 items-center">
        <section
          aria-labelledby="foundation-heading"
          className="mx-auto w-full max-w-2xl px-4 py-16 text-center sm:px-6 sm:py-24"
        >
          <h1
            id="foundation-heading"
            className="font-display text-3xl leading-tight text-maroon sm:text-4xl"
          >
            {site.projectName}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-text-dark/80">
            {site.description}
          </p>
          <p className="mt-2 text-sm text-text-dark/60">
            The invitation experience is not built yet. This page confirms the
            application foundation runs.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg">Invitation coming soon</Button>
            <Button variant="outline" size="lg">
              Learn more
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-maroon/10">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 text-center text-xs text-text-dark/60 sm:px-6">
          {site.projectName}
        </div>
      </footer>
    </>
  );
}
