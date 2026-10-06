import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";

import HomePage from "@/app/page";
import { GalleryExperience } from "@/components/experience/GalleryExperience";
import { SevaSection } from "@/components/experience/SevaSection";
import { ShareExperience } from "@/components/experience/ShareExperience";
import { TempleMapSection } from "@/components/experience/TempleMapSection";

/**
 * Phase 6 — Mobile / Accessibility.
 *
 * These checks exercise the assembled page and the sections with supplied content so
 * the semantic structure, keyboard route and screen-reader affordances are verified
 * against real rendered output, not mocks.
 */

function accessibleName(el: Element): string {
  const label = el.getAttribute("aria-label");
  if (label?.trim()) return label.trim();
  const labelledby = el.getAttribute("aria-labelledby");
  if (labelledby) {
    return labelledby
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent?.trim() ?? "")
      .join(" ")
      .trim();
  }
  // Fall back to the element's own content, which is the accessible name for a link
  // or button with visible text.
  return el.textContent?.trim() ?? "";
}

describe("Semantic structure", () => {
  it("keeps a single level-one heading and a main landmark", () => {
    render(<HomePage />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getAllByRole("main")).toHaveLength(1);
  });

  it("gives every region a unique, non-empty accessible name", () => {
    render(<HomePage />);
    const regions = screen.getAllByRole("region");
    const names = regions.map(accessibleName);
    expect(regions.length).toBeGreaterThan(0);
    expect(names.every((name) => name.length > 0)).toBe(true);
    expect(new Set(names).size).toBe(names.length);
  });

  it("has no duplicate element ids", () => {
    const { container } = render(<HomePage />);
    const ids = Array.from(container.querySelectorAll("[id]")).map((el) => el.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("names every content section by its own heading", () => {
    render(<HomePage />);
    for (const id of [
      "darshan",
      "festival",
      "programme",
      "rayaru",
      "map",
      "seva",
      "gallery",
      "location",
      "share",
    ]) {
      const region = document.getElementById(id);
      expect(region).not.toBeNull();
      expect(region).toHaveAttribute("aria-labelledby", `${id}-heading`);
      expect(document.getElementById(`${id}-heading`)).not.toBeNull();
    }
  });
});

describe("Keyboard navigation", () => {
  it("keeps the main region a valid, focusable skip target", () => {
    render(<HomePage />);
    // The skip link itself lives in the root layout (asserted end to end); here the
    // invariant is that its target exists and no control is a positive-tabindex trap.
    expect(document.getElementById("main")).not.toBeNull();
    const positiveTabindex = document.querySelector('[tabindex]:not([tabindex="0"]):not([tabindex="-1"])');
    expect(positiveTabindex).toBeNull();
  });

  it("keeps the gallery enlargement reachable and its backdrop out of the tab order", () => {
    render(
      <GalleryExperience
        content={{
          intro: "",
          images: [{ src: "/images/supplied.jpg", alt: "Supplied photograph" }],
        }}
      />,
    );
    const region = screen.getByRole("region", { name: "Gallery" });
    // The thumbnail and the Close control are the keyboard route in and out.
    expect(region.querySelector('a[href="#gallery-photo-0"]')).not.toBeNull();
    const backdrop = region.querySelector(".gallery-lightbox__backdrop");
    expect(backdrop).not.toBeNull();
    expect(backdrop).toHaveAttribute("tabindex", "-1");
    expect(backdrop).toHaveAttribute("aria-hidden", "true");
    // The Close control remains the keyboard exit from the overlay.
    expect(within(region).getByRole("link", { name: /^close$/i })).toHaveAttribute(
      "href",
      "#gallery",
    );
  });

  it("exposes the seva disclosure as a native, keyboard-operable control", () => {
    render(
      <SevaSection
        content={{ intro: "", items: [{ label: "Supplied seva", detail: "Supplied detail" }] }}
      />,
    );
    const region = screen.getByRole("region", { name: "Seva" });
    expect(region.querySelector("details")).not.toBeNull();
    expect(within(region).getByText("Supplied seva")).toBeInTheDocument();
  });
});

describe("Screen-reader sanity", () => {
  it("hides decorative overlays from assistive technology", () => {
    const { container } = render(<HomePage />);
    const veil = container.querySelector(".opening-veil");
    expect(veil).toHaveAttribute("aria-hidden", "true");
    // Ornamental SVGs must not be announced.
    for (const svg of Array.from(container.querySelectorAll("svg"))) {
      expect(svg).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("gives every interactive control a non-empty accessible name", () => {
    render(<HomePage />);
    for (const el of [
      ...screen.getAllByRole("link"),
      ...screen.getAllByRole("button"),
    ]) {
      expect(accessibleName(el)).not.toBe("");
    }
  });

  it("announces the share outcome through a polite status region", () => {
    render(<ShareExperience content={{ intro: "", message: "Supplied message" }} />);
    const region = screen.getByRole("region", { name: "Share" });
    const status = within(region).getByRole("status");
    // The status region is present (and empty) before any interaction.
    expect(status).toHaveTextContent("");
    // The button keeps a stable accessible name; the outcome is not the label.
    expect(
      within(region).getByRole("button", { name: /share this invitation/i }),
    ).toBeInTheDocument();
  });

  it("marks external links with a new-tab hint and a safe rel", () => {
    render(<ShareExperience content={{ intro: "", message: "Supplied message" }} />);
    render(<TempleMapSection content={{ intro: "", place: "Supplied place" }} />);

    const whatsapp = screen.getByRole("link", { name: /whatsapp/i });
    const map = screen.getByRole("link", { name: /open the temple map/i });

    for (const link of [whatsapp, map]) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
      expect(link.textContent).toMatch(/opens in a new tab/i);
    }
  });
});
