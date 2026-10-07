import { KolamRule } from "@/components/experience/Ornaments";

/**
 * Invitation contents — the invitation's table of contents.
 *
 * It is a single, unobtrusive band placed after the opening so the first screen stays
 * calm; it lets a visitor move between the movements of the invitation without
 * scrolling the whole page. It is a plain set of in-page anchors (no client
 * JavaScript), keyboard reachable, and it scrolls horizontally on the narrowest
 * phones rather than wrapping into a wall of links.
 *
 * The labels describe the movements of the invitation; the anchors resolve to the
 * sections that own those headings.
 */
const items = [
  { href: "#event", label: "Invitation" },
  { href: "#darshan", label: "Darshan" },
  { href: "#festival", label: "Festival" },
  { href: "#programme", label: "Programme" },
  { href: "#rayaru", label: "Guru Rayaru" },
  { href: "#map", label: "Temple" },
  { href: "#seva", label: "Seva" },
  { href: "#family", label: "Family" },
  { href: "#gallery", label: "Gallery" },
  { href: "#location", label: "Location" },
  { href: "#share", label: "Share" },
] as const;

export function InvitationNav() {
  return (
    <nav
      aria-label="Invitation contents"
      className="border-t border-maroon/10 bg-paper/40 px-5 py-5 sm:px-8"
    >
      <div className="mx-auto max-w-3xl">
        <KolamRule className="opacity-60" />
        <p className="mt-4 text-center text-[0.65rem] uppercase tracking-[0.32em] text-maroon/80">
          Contents
        </p>
        <ul className="mt-2 flex items-center gap-x-5 gap-y-1 overflow-x-auto pb-1 text-sm sm:flex-wrap sm:justify-center sm:overflow-visible">
          {items.map((item) => (
            <li key={item.href} className="shrink-0">
              <a
                href={item.href}
                className="inline-block py-2 whitespace-nowrap text-text-dark/80 underline-offset-4 transition-colors hover:text-maroon hover:underline"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
