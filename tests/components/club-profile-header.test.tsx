import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClubProfileHeader } from "@/components/profile/club-profile-header";
import { Role } from "@/types/enums";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt ?? ""} />
  ),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

const baseProps = {
  id: "club-1",
  name: "HC Barcelona",
  role: "Club" as Role,
  avatar: "/logo.png",
  coverImage: "/cover.png",
  bio: "A great club",
  country: "ES",
};

describe("ClubProfileHeader", () => {
  it("renders club name", () => {
    render(<ClubProfileHeader {...baseProps} />);
    expect(screen.getByText("HC Barcelona")).toBeInTheDocument();
  });

  it("renders BadgeCheck when isVerified=true", () => {
    render(<ClubProfileHeader {...baseProps} isVerified={true} />);
    expect(screen.getByTestId("verified-badge")).toBeInTheDocument();
  });

  it("does NOT render BadgeCheck when isVerified=false", () => {
    render(<ClubProfileHeader {...baseProps} isVerified={false} />);
    expect(screen.queryByTestId("verified-badge")).not.toBeInTheDocument();
  });

  it("does NOT render BadgeCheck when isVerified is omitted", () => {
    render(<ClubProfileHeader {...baseProps} />);
    expect(screen.queryByTestId("verified-badge")).not.toBeInTheDocument();
  });
});
