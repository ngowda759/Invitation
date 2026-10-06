import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { Invocation } from "@/components/experience/OpeningExperience";
import { TempleHero } from "@/components/experience/TempleHero";
import { event } from "@/content/event";

describe("Invocation", () => {
  it("renders only the lamp motif while no invocation line is supplied", () => {
    const { container } = render(<Invocation invocation="" />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.querySelector("p")).toBeNull();
  });

  it("renders the invocation line when one is supplied", () => {
    render(<Invocation invocation="A supplied invocation line." />);
    expect(screen.getByText("A supplied invocation line.")).toBeInTheDocument();
  });
});

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
});
