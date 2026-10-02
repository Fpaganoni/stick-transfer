/**
 * What: Tests for the public profile page's data wiring and default tab.
 * Why: The umpire fields come from getUserByUsername and must reach the header
 *      and tabs; and an umpire profile has to open on the officiating tab (the
 *      reason people visit it) while other roles keep opening on trajectory.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { PublicUserProfilePage } from "@/components/pages/public-user-profile-page";

const { state } = vi.hoisted(() => ({
  state: { user: null as Record<string, unknown> | null },
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/hooks/useUsers", () => ({
  useUserByUsername: () => ({
    data: { getUserByUsername: state.user },
    isLoading: false,
    error: null,
  }),
}));

vi.mock("@/components/profile/profile-header", () => ({
  ProfileHeader: (props: Record<string, unknown>) => (
    <div data-testid="header">
      {String(props.role)}|{String(props.isVerified)}|{String(props.licenseLevel)}
    </div>
  ),
}));

vi.mock("@/components/profile/profile-tabs", () => ({
  ProfileTabs: ({
    activeTab,
    userData,
  }: {
    activeTab: string;
    userData: { umpire?: { matchesOfficiated?: number } };
  }) => (
    <div data-testid="tabs">
      {activeTab}|{userData.umpire?.matchesOfficiated ?? "none"}
    </div>
  ),
}));

const umpireUser = {
  id: "u1",
  name: "Javier García",
  username: "umpire_garcia",
  role: "UMPIRE",
  country: "ES",
  isVerified: true,
  licenseLevel: "INTERNACIONAL",
  matchesOfficiated: 640,
  trajectories: [],
  multimedia: [],
  followers: [],
  following: [],
};

describe("PublicUserProfilePage", () => {
  beforeEach(() => {
    state.user = null;
  });

  it("opens an umpire profile on the officiating tab", () => {
    state.user = umpireUser;
    render(<PublicUserProfilePage username="umpire_garcia" />);

    expect(screen.getByTestId("tabs").textContent).toMatch(/^umpire\|/);
  });

  it("opens a player profile on the trajectory tab", () => {
    state.user = { ...umpireUser, role: "PLAYER" };
    render(<PublicUserProfilePage username="umpire_garcia" />);

    expect(screen.getByTestId("tabs").textContent).toMatch(/^trajectory\|/);
  });

  it("passes verification and licence level to the header", () => {
    state.user = umpireUser;
    render(<PublicUserProfilePage username="umpire_garcia" />);

    expect(screen.getByTestId("header").textContent).toBe("UMPIRE|true|INTERNACIONAL");
  });

  it("passes the umpire data to the tabs", () => {
    state.user = umpireUser;
    render(<PublicUserProfilePage username="umpire_garcia" />);

    expect(screen.getByTestId("tabs").textContent).toBe("umpire|640");
  });
});
