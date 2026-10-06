import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";

import HomePage from "@/app/page";
import { event } from "@/content/event";

describe("Invitation home (Opening + Hero)", () => {
  it("renders exactly one top-level heading", () => {
    render(<HomePage />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("exposes a landmark main region", () => {
    render(<HomePage />);
    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  it("shows the event name as the single h1", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(event.name);
  });

  it("renders the opening experience as purely presentational", () => {
    const { container } = render(<HomePage />);
    const veil = container.querySelector(".opening-veil");
    expect(veil).not.toBeNull();
    expect(veil).toHaveAttribute("aria-hidden", "true");
    // A decorative overlay must carry no text and no interactive controls.
    expect(veil).toHaveTextContent("");
    expect(within(veil as HTMLElement).queryByRole("button")).toBeNull();
    expect(within(veil as HTMLElement).queryByRole("link")).toBeNull();
  });

  it("offers primary and secondary calls to action that resolve in-page", () => {
    render(<HomePage />);
    const primary = screen.getByRole("link", { name: event.cta.primary });
    const secondary = screen.getByRole("link", { name: event.cta.secondary });

    expect(primary).toHaveAttribute("href", "#event");
    expect(secondary).toHaveAttribute("href", "#programme");

    // Each anchor must point at an element that actually exists on the page.
    expect(document.getElementById("event")).not.toBeNull();
    expect(document.getElementById("programme")).not.toBeNull();
  });

  it("restates the event identity in its own panel", () => {
    render(<HomePage />);
    const panel = document.getElementById("event");
    expect(panel).not.toBeNull();
    expect(
      within(panel as HTMLElement).getByRole("heading", { level: 2 }),
    ).toHaveTextContent(event.name);
  });

  it("does not present fabricated timing content", () => {
    render(<HomePage />);
    expect(screen.queryByText(/\b\d{1,2}:\d{2}\s?(am|pm)\b/i)).toBeNull();
  });

  it("composes the five invitation content sections as landmarks", () => {
    render(<HomePage />);
    for (const id of ["darshan", "festival", "programme", "rayaru", "seva"]) {
      expect(document.getElementById(id)).not.toBeNull();
    }
  });
});
