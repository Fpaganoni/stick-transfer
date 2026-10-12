/**
 * What: Tests for the public club page (contact/socials, crest, owner banner).
 * Why: A CLUB account is the club itself (backend checks userId === clubId), so
 *      the verification banner must reach that owner (and SUPERADMIN) and nobody
 *      else; the old check looked for an "ADMIN" member and never matched.
 *      Socials saved as handles (or legacy full URLs) must become working links,
 *      and a club without a crest still needs a visible placeholder.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { ClubDetailPage } from "@/components/pages/club-detail-page";
import { Role } from "@/types/enums";
import type { Club } from "@/types/models/club";

const { state } = vi.hoisted(() => ({
  state: {
    club: null as Club | null,
    user: null as { id: string; role: string } | null,
  },
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

vi.mock("@/hooks/useClubs", () => ({
  useClub: () => ({ data: { club: state.club }, isLoading: false, error: null }),
}));

vi.mock("@/hooks/useJobOpportunities", () => ({
  useJobOpportunities: () => ({ data: { jobOpportunities: [] }, isLoading: false }),
}));

vi.mock("@/stores/useAuthStore", () => ({
  useAuthStore: (selector?: (s: { user: typeof state.user }) => unknown) =>
    selector ? selector({ user: state.user }) : { user: state.user },
}));

vi.mock("@/components/opportunities/opportunity-detail-modal", () => ({
  OpportunityDetailModal: () => null,
}));

const baseClub: Club = {
  id: "club-1",
  name: "San Isidro Club",
  city: "Buenos Aires",
  country: "AR",
  verificationStatus: "UNVERIFIED",
  website: "https://sanisidroclub.com.ar",
  email: "contacto@sanisidroclub.com.ar",
  instagram: "sanisidroclub",
  twitter: "https://twitter.com/sanisidroclub",
};

describe("ClubDetailPage", () => {
  beforeEach(() => {
    state.club = { ...baseClub };
    state.user = null;
  });

  it("renders the contact and social links with working hrefs", () => {
    render(<ClubDetailPage clubId="club-1" />);

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
    state.club = { ...baseClub, website: "javascript:alert(1)", email: undefined };
    render(<ClubDetailPage clubId="club-1" />);

    expect(screen.queryByRole("link", { name: /website/ })).not.toBeInTheDocument();
  });

  it("skips legacy email and phone values that cannot make a valid link", () => {
    state.club = {
      ...baseClub,
      website: undefined,
      email: "a@b.com?bcc=spam@x.com",
      phone: "ask at the bar",
      instagram: undefined,
      twitter: undefined,
    };
    render(<ClubDetailPage clubId="club-1" />);

    expect(screen.queryByRole("link", { name: /email/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /phone/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "contactAndSocial" })).not.toBeInTheDocument();
  });

  it("shows the verification banner to the club owner", () => {
    state.user = { id: "club-1", role: Role.CLUB };
    render(<ClubDetailPage clubId="club-1" />);

    expect(screen.getByText("unverifiedTitle")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "verifyButton" })).toBeInTheDocument();
  });

  it("shows the verification banner to a SUPERADMIN", () => {
    state.user = { id: "admin-1", role: Role.SUPERADMIN };
    render(<ClubDetailPage clubId="club-1" />);

    expect(screen.getByText("unverifiedTitle")).toBeInTheDocument();
  });

  it("hides the verification banner from other users and visitors", () => {
    state.user = { id: "player-1", role: Role.PLAYER };
    const { unmount } = render(<ClubDetailPage clubId="club-1" />);
    expect(screen.queryByText("unverifiedTitle")).not.toBeInTheDocument();
    unmount();

    state.user = null;
    render(<ClubDetailPage clubId="club-1" />);
    expect(screen.queryByText("unverifiedTitle")).not.toBeInTheDocument();
  });

  it("renders the crest uncropped when the club has a logo", () => {
    state.club = { ...baseClub, logo: "https://res.cloudinary.com/demo/crest.png" };
    render(<ClubDetailPage clubId="club-1" />);

    const crest = screen.getByRole("img", { name: "San Isidro Club" });
    expect(crest).toHaveClass("object-contain");
    expect(crest).not.toHaveClass("rounded-full");
  });

  it("renders the club initial when there is no logo", () => {
    render(<ClubDetailPage clubId="club-1" />);

    expect(screen.getByRole("img", { name: "San Isidro Club" })).toHaveTextContent("S");
  });
});
