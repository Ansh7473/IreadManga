import { beforeEach, describe, expect, it } from "vitest";
import { getLibrary, isInLibrary, toggleLibrary } from "./library";
import type { MangaCard } from "./types";

const sample: MangaCard = {
  id: "test-id",
  title: "Test Manga",
  description: "",
  status: "ongoing",
  year: 2024,
  tags: [],
  contentRating: "safe",
  coverUrl: null,
  author: null,
  artist: null,
  lastChapter: "1",
};

describe("library storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("toggles saved titles", () => {
    expect(isInLibrary(sample.id)).toBe(false);
    expect(toggleLibrary(sample)).toBe(true);
    expect(isInLibrary(sample.id)).toBe(true);
    expect(getLibrary()).toHaveLength(1);
    expect(toggleLibrary(sample)).toBe(false);
    expect(getLibrary()).toHaveLength(0);
  });
});
