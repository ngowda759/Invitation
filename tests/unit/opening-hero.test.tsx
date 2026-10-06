import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { TempleHero } from "@/components/experience/TempleHero";
import { event } from "@/content/event";

describe("TempleHero", () => {
  it("exposes exactly one h1 carrying the event name", () => {
    render(<TempleHero />);
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent(event.name);
  });

  it("renders the primary and secondary calls to action", () => {
    render(<TempleHero />);
    expect(
      screen.getByRole("link", { name: event.cta.primary }),
    ).toHaveAttribute("href", "#event");
    expect(
      screen.getByRole("link", { name: event.cta.secondary }),
    ).toHaveAttribute("href", "#programme");
  });

  it("omits the Kannada identity line while none is supplied", () => {
    const { container } = render(<TempleHero />);
    // No unverified Kannada copy is rendered when the content module is empty.
    expect(event.kannadaName).toBe("");
    expect(container.querySelector('[lang="kn"]')).toBeNull();
  });

  it("renders no fabricated timing content", () => {
    render(<TempleHero />);
    expect(screen.queryByText(/\b\d{1,2}:\d{2}\s?(am|pm)\b/i)).toBeNull();
  });

  it("keeps the hero free of constant looping animation", () => {
    // Phase 9: the design system bans constant looping motion. The hero glow is a
    // still highlight, so no `infinite` animation may appear in the stylesheet.
    const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
    expect(css).not.toMatch(/animation[^;{}]*\binfinite\b/);
  });
});
