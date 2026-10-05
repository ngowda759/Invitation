import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import HomePage from "@/app/page";
import { site } from "@/content/site";

describe("HomePage foundation", () => {
  it("renders exactly one top-level heading", () => {
    render(<HomePage />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("exposes a landmark main region", () => {
    render(<HomePage />);
    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  it("shows the project name", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(site.projectName);
  });

  it("does not present fabricated event or timing content", () => {
    render(<HomePage />);
    expect(screen.queryByText(/\b\d{1,2}:\d{2}\s?(am|pm)\b/i)).toBeNull();
    expect(screen.queryByText(/\b(seva|darshan|pooja)\b/i)).toBeNull();
  });
});
