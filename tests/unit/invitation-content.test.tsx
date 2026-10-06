import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";

import { DarshanSection } from "@/components/experience/DarshanSection";
import { FestivalSection } from "@/components/experience/FestivalSection";
import { ProgrammeTimeline } from "@/components/experience/ProgrammeTimeline";
import { RayaruSection } from "@/components/experience/RayaruSection";
import { SevaSection } from "@/components/experience/SevaSection";
import { darshan } from "@/content/darshan";
import { festival } from "@/content/festival";
import { programme } from "@/content/schedule";
import { rayaru } from "@/content/rayaru";
import { seva } from "@/content/seva";

/**
 * Phase 4 — Invitation Content.
 *
 * The supplied content modules are intentionally empty until the product authority
 * provides verified copy, so the default render must show an honest placeholder and
 * must never fabricate a temple fact. The populated path is exercised by passing
 * supplied content explicitly, which is the same path real content will take.
 */
describe("Invitation content sections", () => {
  it("keeps every supplied content module empty until verified copy arrives", () => {
    expect(darshan.entries).toEqual([]);
    expect(festival.highlights).toEqual([]);
    expect(programme.entries).toEqual([]);
    expect(rayaru.paragraphs).toEqual([]);
    expect(seva.items).toEqual([]);
  });

  it("renders Darshan as a landmark with an honest empty state", () => {
    render(<DarshanSection />);
    const region = screen.getByRole("region", { name: "Darshan" });
    expect(within(region).getByText(/being prepared/i)).toBeInTheDocument();
  });

  it("renders supplied darshan occasions", () => {
    render(
      <DarshanSection
        content={{ intro: "", entries: [{ label: "Supplied darshan line" }] }}
      />,
    );
    const region = screen.getByRole("region", { name: "Darshan" });
    expect(within(region).getByText("Supplied darshan line")).toBeInTheDocument();
  });

  it("renders Festival as a landmark with an honest empty state", () => {
    render(<FestivalSection />);
    const region = screen.getByRole("region", { name: "Festival" });
    expect(within(region).getByText(/being prepared/i)).toBeInTheDocument();
  });

  it("renders supplied festival highlights", () => {
    render(
      <FestivalSection
        content={{ intro: "", highlights: [{ label: "Supplied highlight" }] }}
      />,
    );
    const region = screen.getByRole("region", { name: "Festival" });
    expect(within(region).getByText("Supplied highlight")).toBeInTheDocument();
  });

  it("renders the programme timeline as an ordered list of supplied steps", () => {
    render(
      <ProgrammeTimeline
        content={{ intro: "", entries: [{ label: "Step one" }, { label: "Step two" }] }}
      />,
    );
    const region = screen.getByRole("region", { name: "Programme" });
    const list = within(region).getByRole("list");
    expect(list.tagName).toBe("OL");
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
  });

  it("shows an honest empty state for the programme timeline", () => {
    render(<ProgrammeTimeline />);
    const region = screen.getByRole("region", { name: "Programme" });
    expect(within(region).getByText(/being prepared/i)).toBeInTheDocument();
  });

  it("renders Guru Rayaru copy when supplied", () => {
    render(<RayaruSection content={{ intro: "", paragraphs: ["Supplied paragraph."] }} />);
    const region = screen.getByRole("region", { name: "Guru Rayaru" });
    expect(within(region).getByText("Supplied paragraph.")).toBeInTheDocument();
  });

  it("shows an honest empty state for Guru Rayaru", () => {
    render(<RayaruSection />);
    const region = screen.getByRole("region", { name: "Guru Rayaru" });
    expect(within(region).getByText(/being prepared/i)).toBeInTheDocument();
  });

  it("uses a native disclosure for seva details so it works without JavaScript", () => {
    render(
      <SevaSection
        content={{
          intro: "",
          items: [{ label: "Supplied seva", detail: "Supplied detail." }],
        }}
      />,
    );
    const region = screen.getByRole("region", { name: "Seva" });
    // A native <details>/<summary> disclosure needs no client component.
    const disclosure = region.querySelector("details");
    expect(disclosure).not.toBeNull();
    expect(within(region).getByText("Supplied seva")).toBeInTheDocument();
    expect(within(region).getByText("Supplied detail.")).toBeInTheDocument();
  });

  it("shows an honest empty state for Seva", () => {
    render(<SevaSection />);
    const region = screen.getByRole("region", { name: "Seva" });
    expect(within(region).getByText(/being prepared/i)).toBeInTheDocument();
  });

  it("never renders a fabricated time literal", () => {
    const { container } = render(
      <>
        <DarshanSection />
        <FestivalSection />
        <ProgrammeTimeline />
        <RayaruSection />
        <SevaSection />
      </>,
    );
    expect(container.textContent ?? "").not.toMatch(/\b\d{1,2}:\d{2}\s?(am|pm)\b/i);
  });
});
