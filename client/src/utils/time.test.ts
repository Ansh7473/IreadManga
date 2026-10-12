import { describe, expect, it, vi, afterEach } from "vitest";
import { timeAgo } from "./time";

describe("timeAgo", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns empty for null", () => {
    expect(timeAgo(null)).toBe("");
  });

  it("returns just now under 1 minute", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00Z"));
    expect(timeAgo("2026-01-01T11:59:30Z")).toBe("just now");
  });

  it("returns hours for same day", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00Z"));
    expect(timeAgo("2026-01-01T09:00:00Z")).toBe("3h ago");
  });
});
