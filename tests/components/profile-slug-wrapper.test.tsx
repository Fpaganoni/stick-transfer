/**
 * What: Tests for ProfileSlugWrapper (/profile/[...slug]).
 * Why: It rendered the user profile while getUserByUsername was loading and
 *      then switched to the club profile once the role arrived, so club pages
 *      flashed a user layout first. It now waits for the role with a skeleton,
 *      and the own profile renders straight away without that request.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProfileSlugWrapper } from "@/components/profile/profile-slug-wrapper";
import { Role } from "@/types/enums";

const { authState, query, useUserByUsernameMock } = vi.hoisted(() => ({
  authState: { user: { username: "lucia", role: "PLAYER" } as { username: string; role: string } | null },
  query: { data: undefined as unknown, isLoading: false },
  useUserByUsernameMock: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/stores/useAuthStore", () => ({
  useAuthStore: (selector: (state: { user: typeof authState.user }) => unknown) =>
    selector({ user: authState.user }),
}));

vi.mock("@/hooks/useUsers", () => ({
  useUserByUsername: (username: string | null) => {
    useUserByUsernameMock(username);
    return query;
  },
}));

vi.mock("@/components/pages/public-user-profile-page", () => ({
  PublicUserProfilePage: () => <div>public-user-page</div>,
}));
vi.mock("@/components/pages/public-club-profile-page", () => ({
  PublicClubProfilePage: () => <div>public-club-page</div>,
}));
vi.mock("@/components/pages/user-profile-page", () => ({
  UserProfilePage: () => <div>own-user-page</div>,
}));
vi.mock("@/components/pages/club-profile-page", () => ({
  ClubProfilePage: () => <div>own-club-page</div>,
}));

describe("ProfileSlugWrapper", () => {
  beforeEach(() => {
    authState.user = { username: "lucia", role: Role.PLAYER };
    query.data = undefined;
    query.isLoading = false;
    useUserByUsernameMock.mockReset();
  });

  it("shows a skeleton, not the user profile, while the role is unknown", () => {
    query.isLoading = true;

    render(<ProfileSlugWrapper username="hc_norte" />);

    expect(screen.getByLabelText("loadingProfile")).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByText("public-user-page")).not.toBeInTheDocument();
    expect(screen.queryByText("public-club-page")).not.toBeInTheDocument();
  });

  it("renders the club profile once the role is CLUB", () => {
    query.data = { getUserByUsername: { role: Role.CLUB } };

    render(<ProfileSlugWrapper username="hc_norte" />);

    expect(screen.getByText("public-club-page")).toBeInTheDocument();
  });

  it("renders the user profile for any other role", () => {
    query.data = { getUserByUsername: { role: Role.UMPIRE } };

    render(<ProfileSlugWrapper username="javier" />);

    expect(screen.getByText("public-user-page")).toBeInTheDocument();
  });

  it("leaves not-found handling to the public profile page", () => {
    query.data = { getUserByUsername: null };

    render(<ProfileSlugWrapper username="ghost" />);

    expect(screen.getByText("public-user-page")).toBeInTheDocument();
  });

  it("renders the own profile without requesting it by username", () => {
    render(<ProfileSlugWrapper username="lucia" />);

    expect(screen.getByText("own-user-page")).toBeInTheDocument();
    expect(useUserByUsernameMock).toHaveBeenCalledWith(null);
  });

  it("renders the own club profile for a club account", () => {
    authState.user = { username: "hc_norte", role: Role.CLUB };

    render(<ProfileSlugWrapper username="hc_norte" />);

    expect(screen.getByText("own-club-page")).toBeInTheDocument();
  });
});
