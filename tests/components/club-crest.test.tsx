/**
 * What: Tests for ClubCrest, the one way the app draws a club crest.
 * Why: A crest is a logo, not a photo. Cropping it to a circle or with
 *      object-cover cuts off the shield, so every list, card and modal draws it
 *      whole on a neutral background, with the club initial when there is none.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClubCrest } from "@/components/clubs/club-crest";

const CREST = "https://res.cloudinary.com/demo/crest.png";

describe("ClubCrest", () => {
  it("draws the crest whole on a neutral background", () => {
    render(<ClubCrest name="HC Madrid" logo={CREST} size={60} className="size-15" />);

    const image = screen.getByRole("img", { name: "HC Madrid" });
    expect(image).toHaveClass("object-contain");
    expect(image).not.toHaveClass("object-cover");
    expect(image.parentElement).toHaveClass("bg-background", "border");
  });

  it("never crops the crest to a circle", () => {
    render(<ClubCrest name="HC Madrid" logo={CREST} size={60} />);

    const image = screen.getByRole("img", { name: "HC Madrid" });
    expect(image).not.toHaveClass("rounded-full");
    expect(image.parentElement).not.toHaveClass("rounded-full");
  });

  it("lets the caller size the box", () => {
    render(<ClubCrest name="HC Madrid" logo={CREST} size={60} className="w-14 h-14" />);

    expect(screen.getByRole("img", { name: "HC Madrid" }).parentElement).toHaveClass(
      "w-14",
      "h-14",
    );
  });

  it("shows the club initial when there is no crest", () => {
    render(<ClubCrest name="hc madrid" size={60} />);

    expect(screen.getByRole("img", { name: "hc madrid" })).toHaveTextContent("H");
  });

  it.each([null, undefined, ""])("treats a %s crest as missing", (logo) => {
    render(<ClubCrest name="Atlético" logo={logo} size={60} />);

    expect(screen.getByRole("img", { name: "Atlético" })).toHaveTextContent("A");
  });

  it("can show more than one letter", () => {
    render(<ClubCrest name="HC Madrid" size={60} initials="HC" />);

    expect(screen.getByText("HC")).toBeInTheDocument();
  });

  it("falls back to a question mark for an empty name", () => {
    render(<ClubCrest name="  " size={60} />);

    expect(screen.getByText("?")).toBeInTheDocument();
  });
});
