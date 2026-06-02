import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClubListCard } from "@/components/clubs/club-list-card";
import type { Club } from "@/types/models/club";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
}));

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt ?? ""} />
  ),
}));

const mockClub: Club = {
  id: "club-1",
  name: "HC Barcelona",
  city: "Barcelona",
  country: "ES",
  league: "División de Honor",
  isVerified: true,
};

describe("ClubListCard", () => {
  it("renders without errors", () => {
    const { container } = render(<ClubListCard {...mockClub} />);
    expect(container.firstChild).not.toBeNull();
  });

  it("renders club name", () => {
    render(<ClubListCard {...mockClub} />);
    expect(screen.getByText("HC Barcelona")).toBeInTheDocument();
  });

  it("shows initials when no logo", () => {
    render(<ClubListCard {...mockClub} />);
    expect(screen.getByText("HC")).toBeInTheDocument();
  });

  it("renders club logo when provided", () => {
    render(<ClubListCard {...mockClub} logo="https://example.com/logo.png" />);
    const img = screen.getByAltText("HC Barcelona");
    expect(img).toBeInTheDocument();
  });

  it("renders country flag for 2-letter country code", () => {
    render(<ClubListCard {...mockClub} />);
    expect(screen.getByText("🇪🇸")).toBeInTheDocument();
  });

  it("renders type badge when type is provided", () => {
    render(<ClubListCard {...mockClub} type="Team" />);
    expect(screen.getByText("Team")).toBeInTheDocument();
  });

  it("does not render NEW badge when createdAt is old", () => {
    render(<ClubListCard {...mockClub} createdAt="2020-01-01T00:00:00Z" />);
    expect(screen.queryByText("NEW")).not.toBeInTheDocument();
  });

  it("renders NEW badge when createdAt is recent", () => {
    const recent = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    render(<ClubListCard {...mockClub} createdAt={recent} />);
    expect(screen.getByText("NEW")).toBeInTheDocument();
  });
});
