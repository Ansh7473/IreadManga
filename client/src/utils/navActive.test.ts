import { describe, expect, it } from "vitest";
import { isBrowseNavActive, isLibraryNavActive } from "./navActive";

describe("isBrowseNavActive", () => {
  it("highlights only latest when sort=updated", () => {
    expect(isBrowseNavActive("search", "/browse", "?sort=updated")).toBe(false);
    expect(isBrowseNavActive("updated", "/browse", "?sort=updated")).toBe(true);
    expect(isBrowseNavActive("recent", "/browse", "?sort=updated")).toBe(false);
  });

  it("highlights advanced search for default browse", () => {
    expect(isBrowseNavActive("search", "/browse", "")).toBe(true);
    expect(isBrowseNavActive("search", "/browse", "?sort=popular")).toBe(true);
    expect(isBrowseNavActive("updated", "/browse", "")).toBe(false);
  });

  it("treats title search as advanced search", () => {
    expect(isBrowseNavActive("search", "/browse", "?q=berserk")).toBe(true);
    expect(isBrowseNavActive("updated", "/browse", "?q=berserk")).toBe(false);
  });
});

describe("isLibraryNavActive", () => {
  it("splits library vs history", () => {
    expect(isLibraryNavActive("library", "/library", "")).toBe(true);
    expect(isLibraryNavActive("history", "/library", "")).toBe(false);
    expect(isLibraryNavActive("history", "/library", "?tab=history")).toBe(true);
    expect(isLibraryNavActive("library", "/library", "?tab=history")).toBe(false);
  });
});
