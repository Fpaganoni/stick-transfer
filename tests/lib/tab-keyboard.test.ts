/**
 * What: Tests for nextTabIndex, the keyboard rule of a horizontal tab list.
 * Why: The WAI-ARIA tabs pattern moves between tabs with the arrow keys (wrapping at
 *      both ends) and Home/End, while Tab leaves the list. Any other key must be left
 *      alone so typing and browser shortcuts keep working.
 */
import { describe, it, expect } from "vitest";
import { nextTabIndex } from "@/lib/tab-keyboard";

describe("nextTabIndex", () => {
  it("moves to the next tab with ArrowRight and wraps from the last to the first", () => {
    expect(nextTabIndex("ArrowRight", 0, 3)).toBe(1);
    expect(nextTabIndex("ArrowRight", 2, 3)).toBe(0);
  });

  it("moves to the previous tab with ArrowLeft and wraps from the first to the last", () => {
    expect(nextTabIndex("ArrowLeft", 2, 3)).toBe(1);
    expect(nextTabIndex("ArrowLeft", 0, 3)).toBe(2);
  });

  it("jumps to the first tab with Home and to the last with End", () => {
    expect(nextTabIndex("Home", 2, 3)).toBe(0);
    expect(nextTabIndex("End", 0, 3)).toBe(2);
  });

  it("leaves every other key alone", () => {
    for (const key of ["Tab", "Enter", " ", "ArrowDown", "ArrowUp", "a", "Escape"]) {
      expect(nextTabIndex(key, 1, 3)).toBeNull();
    }
  });

  it("has nowhere to go when there is a single tab", () => {
    expect(nextTabIndex("ArrowRight", 0, 1)).toBe(0);
    expect(nextTabIndex("End", 0, 1)).toBe(0);
  });

  it("does nothing without tabs", () => {
    expect(nextTabIndex("ArrowRight", 0, 0)).toBeNull();
  });
});
