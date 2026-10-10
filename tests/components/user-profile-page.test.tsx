/**
 * What: Tests for the own profile page (UserProfilePage).
 * Why: It painted the user from localStorage and then replaced it with the
 *      `me` response, so the layout jumped. It now renders `me` with the stored
 *      user as placeholder data. The follower counters come from their own
 *      query (they slow `me` down) and stay as placeholders until it answers.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { UserProfilePage } from "@/components/pages/user-profile-page";
import { Role } from "@/types/enums";

const { meState, countsState, useMeMock } = vi.hoisted(() => ({
  meState: {
    data: undefined as { me: Record<string, unknown> } | undefined,
    isPlaceholderData: false,
  },
  countsState: {
    data: undefined as { me: { followersCount: number; followingCount: number } } | undefined,
  },
  useMeMock: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/hooks/useUsers", () => ({
  useMe: (options: unknown) => {
    useMeMock(options);
    return meState;
  },
  useMyFollowCounts: () => countsState,
}));

vi.mock("@/components/profile/profile-header", () => ({
  ProfileHeader: (props: Record<string, unknown>) => (
    <div data-testid="header">
      {String(props.name)}|{String(props.followersCount)}|{String(props.followingCount)}
    </div>
  ),
}));

vi.mock("@/components/profile/profile-tabs", () => ({
  ProfileTabs: ({ activeTab }: { activeTab: string }) => <div data-testid="tabs">{activeTab}</div>,
}));

const storedUser = {
  id: "u1",
  name: "Lucia Jimenez",
  role: Role.PLAYER,
  trajectories: [],
};

describe("UserProfilePage", () => {
  beforeEach(() => {
    meState.data = undefined;
    meState.isPlaceholderData = false;
    countsState.data = undefined;
    useMeMock.mockReset();
  });

  it("asks useMe for the stored user as placeholder data", () => {
    meState.data = { me: storedUser };
    meState.isPlaceholderData = true;

    render(<UserProfilePage isOwnProfile />);

    expect(useMeMock).toHaveBeenCalledWith({ placeholderFromStore: true });
    expect(screen.getByTestId("header")).toHaveTextContent("Lucia Jimenez");
  });

  it("keeps the counters as placeholders until their query answers", () => {
    meState.data = { me: { ...storedUser, followersCount: 99, followingCount: 99 } };
    meState.isPlaceholderData = true;

    render(<UserProfilePage isOwnProfile />);

    expect(screen.getByTestId("header")).toHaveTextContent("Lucia Jimenez|undefined|undefined");
  });

  it("shows the counters from their own query", () => {
    meState.data = { me: storedUser };
    countsState.data = { me: { followersCount: 4, followingCount: 2 } };

    render(<UserProfilePage isOwnProfile />);

    expect(screen.getByTestId("header")).toHaveTextContent("Lucia Jimenez|4|2");
  });

  it("shows a profile skeleton instead of a login message when there is no user yet", () => {
    render(<UserProfilePage isOwnProfile />);

    expect(screen.getByLabelText("loadingProfile")).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByText(/PLEASE LOGIN/i)).not.toBeInTheDocument();
  });
});
