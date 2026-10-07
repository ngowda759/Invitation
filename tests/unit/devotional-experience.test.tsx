import { readFileSync } from "node:fs";
import { join } from "node:path";

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HomePage from "@/app/page";
import { ContentSection } from "@/components/experience/ContentSection";
import { FamilySection } from "@/components/experience/FamilySection";
import { InvitationNav } from "@/components/experience/InvitationNav";
import { OpeningExperience } from "@/components/experience/OpeningExperience";
import { family } from "@/content/family";

/**
 * Phase 11 — Devotional Invitation Experience.
 *
 * Guards the invitation journey: a decorative, text-free cover; a framed invitation
 * panel; a quiet contents band that resolves to real sections; an honest people/family
 * movement; and a shared section shell that every movement reuses. It also locks the
 * ornament vocabulary to the approved palette and keeps the story's section order
 * stable, so a later change cannot silently drop a movement of the invitation.
 */
const experienceDir = join(process.cwd(), "src/components/experience");

describe("the invitation journey", () => {
  it("keeps the cover decorative: no text, no interactive controls, hidden from AT", () => {
    const { container } = render(<OpeningExperience />);
    const veil = container.querySelector(".opening-veil");
    expect(veil).not.toBeNull();
    expect(veil).toHaveAttribute("aria-hidden", "true");
    expect(veil).toHaveTextContent("");
    expect(within(veil as HTMLElement).queryByRole("button")).toBeNull();
    expect(within(veil as HTMLElement).queryByRole("link")).toBeNull();
    // Every ornament inside the cover is itself hidden from assistive technology.
    for (const svg of Array.from(veil?.querySelectorAll("svg") ?? [])) {
      expect(svg).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("orders the story from welcome to sharing", () => {
    render(<HomePage />);
    const order = [
      "invitation-heading",
      "Invitation details",
      "darshan-heading",
      "festival-heading",
      "programme-heading",
      "rayaru-heading",
      "map-heading",
      "seva-heading",
      "family-heading",
      "gallery-heading",
      "location-heading",
      "share-heading",
    ];
    const sections = Array.from(document.querySelectorAll("main section"));
    const rendered = sections.map(
      (section) =>
        section.getAttribute("aria-label") ??
        section.getAttribute("aria-labelledby") ??
        "",
    );
    expect(rendered).toEqual(order);
  });

  it("offers a contents band whose every anchor resolves to a section", () => {
    const { container } = render(<InvitationNav />);
    const nav = screen.getByRole("navigation", { name: "Invitation contents" });
    expect(nav).toBeInTheDocument();

    // Resolve against the assembled page so each target id really exists.
    render(<HomePage />);
    const links = Array.from(
      container.querySelectorAll('a[href^="#"]'),
    ) as HTMLAnchorElement[];
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      const id = link.getAttribute("href")?.slice(1) ?? "";
      expect(document.getElementById(id), `${link.textContent} -> #${id}`).not.toBeNull();
    }
  });

  it("keeps the family content empty until verified names arrive", () => {
    expect(family.members).toEqual([]);
    render(<FamilySection />);
    const region = screen.getByRole("region", { name: "With warm regards" });
    expect(within(region).getByText(/being gathered/i)).toBeInTheDocument();
  });

  it("presents supplied family names warmly without inventing any", () => {
    render(
      <FamilySection
        content={{ intro: "", members: [{ label: "Supplied host" }] }}
      />,
    );
    const region = screen.getByRole("region", { name: "With warm regards" });
    expect(within(region).getByText("Supplied host")).toBeInTheDocument();
  });
});

describe("the shared section shell", () => {
  it("is the single owner of the revealed invitation region", () => {
    const source = readFileSync(join(experienceDir, "ContentSection.tsx"), "utf8");
    expect(source).toMatch(/className="section-reveal/);

    // The content sections must delegate to the shell rather than each rolling their
    // own revealed region, so the entrance stays identical across the story.
    const sections = [
      "DarshanSection.tsx",
      "FestivalSection.tsx",
      "ProgrammeTimeline.tsx",
      "RayaruSection.tsx",
      "SevaSection.tsx",
      "TempleMapSection.tsx",
      "GalleryExperience.tsx",
      "LocationSection.tsx",
      "ShareExperience.tsx",
      "FamilySection.tsx",
    ];
    for (const name of sections) {
      const text = readFileSync(join(experienceDir, name), "utf8");
      expect(text, `${name} rolls its own revealed region`).not.toMatch(
        /className="section-reveal/,
      );
      expect(text, `${name} does not reuse the shared shell`).toMatch(/ContentSection/);
    }
  });

  it("names its region from the heading it renders", () => {
    render(
      <ContentSection id="probe" heading="Probe heading">
        <p>Body</p>
      </ContentSection>,
    );
    const region = screen.getByRole("region", { name: "Probe heading" });
    expect(within(region).getByRole("heading", { level: 2 })).toHaveTextContent(
      "Probe heading",
    );
  });
});

describe("the ornament vocabulary", () => {
  const palette = [
    "gold",
    "gold-light",
    "saffron",
    "cream",
    "maroon",
    "brown",
    "paper",
    "text-dark",
  ];

  it("draws every ornament from the approved palette", () => {
    const source = readFileSync(join(experienceDir, "Ornaments.tsx"), "utf8");
    // Each `fill-*` / `stroke-*` class must reference an approved palette token.
    const utilities = source.match(/\b(?:fill|stroke)-[a-z-]+/g) ?? [];
    expect(utilities.length).toBeGreaterThan(0);
    for (const utility of utilities) {
      const token = utility.replace(/^(?:fill|stroke)-/, "").replace(/\/\d+$/, "");
      expect(palette, `${utility} is off-palette`).toContain(token);
    }
  });

  it("ships no external image or font dependency for the ornaments", () => {
    const source = readFileSync(join(experienceDir, "Ornaments.tsx"), "utf8");
    expect(source).not.toMatch(/https?:\/\//);
    expect(source).not.toMatch(/<image\b/);
  });
});
