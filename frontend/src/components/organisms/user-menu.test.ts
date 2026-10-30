import { describe, expect, it } from "vitest";
import { initials } from "./user-menu";

describe("initials", () => {
  it("uses first and last name initials", () => {
    expect(initials("Hana Mei HR")).toBe("HH");
    expect(initials("asha rao")).toBe("AR");
  });

  it("handles single names and blanks", () => {
    expect(initials("Cher")).toBe("CH");
    expect(initials("  ")).toBe("?");
  });
});
