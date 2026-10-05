import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

describe("cn", () => {
  it("joins multiple class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("ignores falsy values", () => {
    expect(cn("a", undefined, null, false, "b")).toBe("a b");
  });

  it("resolves conflicting Tailwind utilities in favour of the last", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});
