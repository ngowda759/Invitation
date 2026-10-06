import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import HomePage from "@/app/page";
import { GalleryExperience } from "@/components/experience/GalleryExperience";
import { LocationSection } from "@/components/experience/LocationSection";
import { ShareExperience } from "@/components/experience/ShareExperience";
import { TempleMapSection } from "@/components/experience/TempleMapSection";
import { gallery } from "@/content/gallery";
import { location } from "@/content/location";
import { map } from "@/content/map";

/**
 * Phase 5 — Temple Experience.
 *
 * The supplied content modules are intentionally empty until the product authority
 * provides verified copy, so the default render must show an honest placeholder and
 * must never fabricate a temple fact. The populated path is exercised by passing
 * supplied content explicitly, which is the same path real content will take.
 */
describe("Temple experience content modules", () => {
  it("keeps every supplied module empty until verified copy arrives", () => {
    expect(gallery.images).toEqual([]);
    expect(map.place).toBe("");
    expect(location.lines).toEqual([]);
  });
});

describe("TempleMapSection", () => {
  it("renders as a landmark with an honest empty state", () => {
    render(<TempleMapSection />);
    const region = screen.getByRole("region", { name: "Temple map" });
    expect(within(region).getByText(/being prepared/i)).toBeInTheDocument();
    expect(within(region).queryByRole("link")).toBeNull();
  });

  it("links out to an external map without embedding a widget", () => {
    render(<TempleMapSection content={{ intro: "", place: "Supplied place" }} />);
    const region = screen.getByRole("region", { name: "Temple map" });
    const link = within(region).getByRole("link");
    expect(link).toHaveAttribute(
      "href",
      "https://www.google.com/maps/search/?api=1&query=Supplied%20place",
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
    // No third-party iframe/embed is introduced.
    expect(region.querySelector("iframe")).toBeNull();
  });
});

describe("GalleryExperience", () => {
  it("renders as a landmark with an honest empty state", () => {
    render(<GalleryExperience />);
    const region = screen.getByRole("region", { name: "Gallery" });
    expect(within(region).getByText(/being gathered/i)).toBeInTheDocument();
  });

  it("renders supplied photographs with alt text and a CSS-only enlargement link", () => {
    render(
      <GalleryExperience
        content={{
          intro: "",
          images: [{ src: "/images/supplied.jpg", alt: "Supplied photograph" }],
        }}
      />,
    );
    const region = screen.getByRole("region", { name: "Gallery" });
    // One thumbnail and one full-view image, both carrying the supplied alt text.
    expect(within(region).getAllByAltText("Supplied photograph")).toHaveLength(2);
    expect(region.querySelector('a[href="#gallery-photo-0"]')).not.toBeNull();
    // The full-view panel is revealed by CSS `:target`, so it needs no client JS.
    expect(region.querySelector("#gallery-photo-0")).not.toBeNull();
  });
});

describe("LocationSection", () => {
  it("renders as a landmark with an honest empty state", () => {
    render(<LocationSection />);
    const region = screen.getByRole("region", { name: "Location" });
    expect(within(region).getByText(/being prepared/i)).toBeInTheDocument();
  });

  it("renders supplied address lines", () => {
    render(
      <LocationSection content={{ intro: "", lines: ["Supplied line one", "Supplied line two"] }} />,
    );
    const region = screen.getByRole("region", { name: "Location" });
    expect(within(region).getByText("Supplied line one")).toBeInTheDocument();
    expect(within(region).getByText("Supplied line two")).toBeInTheDocument();
  });
});

describe("ShareExperience", () => {
  it("renders as a landmark with a WhatsApp share link and a share control", () => {
    render(<ShareExperience content={{ intro: "", message: "Supplied message" }} />);
    const region = screen.getByRole("region", { name: "Share" });
    const whatsapp = within(region).getByRole("link", { name: /whatsapp/i });
    expect(whatsapp).toHaveAttribute("href", expect.stringContaining("https://wa.me/?text="));
    expect(whatsapp.getAttribute("href")).toContain(encodeURIComponent("Supplied message"));
    expect(whatsapp).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(
      within(region).getByRole("button", { name: /share this invitation/i }),
    ).toBeInTheDocument();
  });

  it("falls back to copying the link when no native share sheet is available", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    Object.defineProperty(navigator, "share", { configurable: true, value: undefined });

    render(<ShareExperience content={{ intro: "", message: "Supplied message" }} />);
    const region = screen.getByRole("region", { name: "Share" });
    const button = within(region).getByRole("button", { name: /share this invitation/i });
    fireEvent.click(button);

    expect(writeText).toHaveBeenCalledWith(window.location.href);
    // The button keeps a stable accessible name; the outcome is announced separately.
    await waitFor(() =>
      expect(within(region).getByRole("status")).toHaveTextContent(/copied/i),
    );
    expect(button).toHaveAccessibleName(/share this invitation/i);
  });
});

describe("Temple experience journey", () => {
  it("composes the temple experience sections as landmarks", () => {
    render(<HomePage />);
    for (const id of ["map", "gallery", "location", "share"]) {
      expect(document.getElementById(id)).not.toBeNull();
    }
  });

  it("keeps a single h1 and the primary anchors resolvable", () => {
    render(<HomePage />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.getElementById("event")).not.toBeNull();
    expect(document.getElementById("programme")).not.toBeNull();
  });
});
