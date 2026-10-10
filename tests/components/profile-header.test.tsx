/**
 * What: Tests for ProfileHeader contact rules, umpire presentation and the
 *       follow counters / button.
 * Why: Messaging is limited to clubs/admins for players and coaches, but
 *      umpires are contactable by everyone. Umpires also have no playing
 *      position, so the header must show licence level and verification
 *      instead of "position not set". Counters and the follow state come from
 *      followersCount / followingCount / isFollowedByCurrentUser, never from
 *      walking a followers list.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfileHeader } from "@/components/profile/profile-header";
import { Role, UmpireLicenseLevel } from "@/types/enums";

const { mockPush, roleState, followMock, unfollowMock, modalProps } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  roleState: { isClub: false, isSuperAdmin: false },
  followMock: vi.fn(),
  unfollowMock: vi.fn(),
  modalProps: [] as Array<{ isOpen: boolean; mode: string; userId: string; totalCount: number }>,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

vi.mock("@/hooks/useRole", () => ({
  useRole: () => roleState,
}));

vi.mock("@/stores/useAuthStore", () => ({
  useAuthStore: () => ({ user: { id: "viewer-1" } }),
}));

vi.mock("@/hooks/useUsers", () => ({
  useUpdateUser: () => ({ mutate: vi.fn(), isPending: false }),
  useFollow: () => ({ mutate: followMock, isPending: false }),
  useUnfollow: () => ({ mutate: unfollowMock, isPending: false }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt ?? ""} />
  ),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/components/profile/followers-following-modal", () => ({
  FollowersFollowingModal: (props: (typeof modalProps)[number]) => {
    modalProps.push(props);
    return null;
  },
}));
vi.mock("@/components/profile/report-modal", () => ({ ReportModal: () => null }));
vi.mock("@/components/ui/avatar-photo-modal", () => ({ AvatarPhotoModal: () => null }));

const base = {
  id: "target-1",
  name: "Javier García",
  avatar: "/a.png",
  coverImage: "/c.png",
  bio: "Bio",
  country: "ES",
};

const umpire = {
  ...base,
  role: Role.UMPIRE,
  licenseLevel: UmpireLicenseLevel.INTERNACIONAL,
  isVerified: true,
};
const player = { ...base, role: Role.PLAYER, position: "defender" as never };

describe("ProfileHeader", () => {
  beforeEach(() => {
    mockPush.mockReset();
    roleState.isClub = false;
    roleState.isSuperAdmin = false;
    followMock.mockReset();
    unfollowMock.mockReset();
    modalProps.length = 0;
  });

  describe("follow counters", () => {
    const lastModal = (mode: string) => modalProps.filter((p) => p.mode === mode).at(-1);

    it("shows the counters of the own profile", () => {
      render(<ProfileHeader {...player} isOwnProfile followersCount={12} followingCount={3} />);

      expect(screen.getByRole("button", { name: "12 followers" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "3 following" })).toBeInTheDocument();
    });

    it("shows the counters of another profile", () => {
      render(<ProfileHeader {...player} followersCount={7} followingCount={0} />);

      expect(screen.getByRole("button", { name: "7 followers" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "0 following" })).toBeInTheDocument();
    });

    it("shows placeholders while the counters are unknown", () => {
      render(<ProfileHeader {...player} isOwnProfile />);

      expect(screen.queryByRole("button", { name: /followers/ })).not.toBeInTheDocument();
      expect(screen.getByLabelText("followList.loadingCounts")).toHaveAttribute(
        "aria-busy",
        "true",
      );
    });

    it("opens the followers list for this user, which loads lazily", async () => {
      const user = userEvent.setup();
      render(<ProfileHeader {...player} followersCount={7} followingCount={1} />);

      expect(lastModal("followers")).toMatchObject({ isOpen: false, userId: "target-1" });

      await user.click(screen.getByRole("button", { name: "7 followers" }));

      expect(lastModal("followers")).toMatchObject({
        isOpen: true,
        userId: "target-1",
        totalCount: 7,
      });
      expect(lastModal("following")).toMatchObject({ isOpen: false });
    });
  });

  describe("follow button", () => {
    const vars = {
      followerType: "USER",
      followerId: "viewer-1",
      followingType: "USER",
      followingId: "target-1",
    };

    it("follows when the backend says the viewer does not follow yet", async () => {
      const user = userEvent.setup();
      render(<ProfileHeader {...player} followersCount={7} isFollowedByCurrentUser={false} />);

      await user.click(screen.getByTitle("follow"));

      expect(followMock).toHaveBeenCalledWith(vars, expect.anything());
      expect(unfollowMock).not.toHaveBeenCalled();
    });

    it("unfollows when the backend says the viewer already follows", async () => {
      const user = userEvent.setup();
      render(<ProfileHeader {...player} followersCount={7} isFollowedByCurrentUser />);

      await user.click(screen.getByTitle("unfollow"));

      expect(unfollowMock).toHaveBeenCalledWith(vars, expect.anything());
      expect(followMock).not.toHaveBeenCalled();
    });
  });

  describe("contact button", () => {
    it("lets any user message an umpire", () => {
      render(<ProfileHeader {...umpire} />);

      expect(screen.getByTitle("message")).toBeInTheDocument();
    });

    it("opens the conversation with the umpire", async () => {
      const user = userEvent.setup();
      render(<ProfileHeader {...umpire} />);

      await user.click(screen.getByTitle("message"));

      expect(mockPush).toHaveBeenCalledWith(
        `/messages?userId=target-1&name=${encodeURIComponent("Javier García")}`,
      );
    });

    it("still hides messaging on a player profile for non-club viewers", () => {
      render(<ProfileHeader {...player} />);

      expect(screen.queryByTitle("message")).not.toBeInTheDocument();
    });

    it("still lets clubs message players", () => {
      roleState.isClub = true;
      render(<ProfileHeader {...player} />);

      expect(screen.getByTitle("message")).toBeInTheDocument();
    });

    it("still lets admins message players", () => {
      roleState.isSuperAdmin = true;
      render(<ProfileHeader {...player} />);

      expect(screen.getByTitle("message")).toBeInTheDocument();
    });

    it("does not show a message button on the owner's own profile", () => {
      render(<ProfileHeader {...umpire} isOwnProfile />);

      expect(screen.queryByTitle("message")).not.toBeInTheDocument();
    });
  });

  describe("umpire presentation", () => {
    it("shows the licence level instead of 'position not set'", () => {
      render(<ProfileHeader {...umpire} />);

      expect(screen.getByText("licenseLevels.INTERNACIONAL")).toBeInTheDocument();
      expect(screen.queryByText("positionNotSet")).not.toBeInTheDocument();
    });

    it("shows nothing in that slot when the umpire has no licence level yet", () => {
      render(<ProfileHeader {...umpire} licenseLevel={null} />);

      expect(screen.queryByText("positionNotSet")).not.toBeInTheDocument();
      expect(screen.queryByText(/licenseLevels\./)).not.toBeInTheDocument();
    });

    it("shows the verified badge for a verified umpire", () => {
      render(<ProfileHeader {...umpire} />);

      expect(screen.getByTestId("verified-badge")).toBeInTheDocument();
    });

    it("hides the verified badge for an unverified umpire", () => {
      render(<ProfileHeader {...umpire} isVerified={false} />);

      expect(screen.queryByTestId("verified-badge")).not.toBeInTheDocument();
    });

    it("shows the role badge", () => {
      render(<ProfileHeader {...umpire} />);

      expect(screen.getByText("UMPIRE")).toBeInTheDocument();
    });
  });

  describe("other roles are unchanged", () => {
    it("shows 'position not set' for a player without position", () => {
      render(<ProfileHeader {...base} role={Role.PLAYER} />);

      expect(screen.getByText("positionNotSet")).toBeInTheDocument();
    });

    it("shows the position for a player", () => {
      render(<ProfileHeader {...player} />);

      expect(screen.getByText("defender")).toBeInTheDocument();
    });

    it("never shows a verified badge for a player", () => {
      render(<ProfileHeader {...player} />);

      expect(screen.queryByTestId("verified-badge")).not.toBeInTheDocument();
    });
  });
});
