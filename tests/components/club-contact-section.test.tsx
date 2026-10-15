/**
 * What: Tests for ClubContactSection (contact details and socials of a club).
 * Why: Stored values become links. Socials saved as handles (or legacy full URLs)
 *      must turn into working links, and anything that cannot make a safe link
 *      (javascript: schemes, mailto parameter injection, free text as a phone)
 *      must be dropped instead of rendered.
 */
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { ClubContactSection } from "@/components/clubs/club-contact-section";
import type { Club } from "@/types/models/club";

const baseClub: Club = {
  id: "club-1",
  name: "San Isidro Club",
  website: "https://sanisidroclub.com.ar",
  email: "contacto@sanisidroclub.com.ar",
  instagram: "sanisidroclub",
  twitter: "https://twitter.com/sanisidroclub",
};

describe("ClubContactSection", () => {
  it("renders the contact and social links with working hrefs", () => {
    render(<ClubContactSection club={baseClub} />);

    const section = screen.getByRole("region", { name: "contactAndSocial" });
    expect(within(section).getByRole("link", { name: /website/ })).toHaveAttribute(
      "href",
      "https://sanisidroclub.com.ar",
    );
    expect(within(section).getByRole("link", { name: /email/ })).toHaveAttribute(
      "href",
      "mailto:contacto@sanisidroclub.com.ar",
    );
    expect(within(section).getByRole("link", { name: /Instagram/ })).toHaveAttribute(
      "href",
      "https://instagram.com/sanisidroclub",
    );
    expect(within(section).getByRole("link", { name: /X \(Twitter\)/ })).toHaveAttribute(
      "href",
      "https://x.com/sanisidroclub",
    );
    expect(within(section).queryByRole("link", { name: /TikTok/ })).not.toBeInTheDocument();
  });

  it("drops a website with a non-http scheme instead of linking it", () => {
    render(<ClubContactSection club={{ ...baseClub, website: "javascript:alert(1)", email: undefined }} />);

    expect(screen.queryByRole("link", { name: /website/ })).not.toBeInTheDocument();
  });

  it("skips legacy email and phone values that cannot make a valid link", () => {
    render(
      <ClubContactSection
        club={{
          ...baseClub,
          website: undefined,
          email: "a@b.com?bcc=spam@x.com",
          phone: "ask at the bar",
          instagram: undefined,
          twitter: undefined,
        }}
      />,
    );

    expect(screen.queryByRole("link", { name: /email/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /phone/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "contactAndSocial" })).not.toBeInTheDocument();
  });
});
