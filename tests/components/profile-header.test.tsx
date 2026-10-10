/**
 * What: Tests for ProfileHeader contact rules and umpire presentation.
 * Why: Messaging is limited to clubs/admins for players and coaches, but
 *      umpires are contactable by everyone. Umpires also have no playing
 *      position, so the header must show licence level and verification
 *      instead of "position not set".
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfileHeader } from "@/components/profile/profile-header";
import { Role, UmpireLicenseLevel } from "@/types/enums";

const { mockPush, roleState } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  roleState: { isClub: false, isSuperAdmin: false },
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
  useFollow: () => ({ mutate: vi.fn(), isPending: false }),
  useUnfollow: () => ({ mutate: vi.fn(), isPending: false }),
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
  FollowersFollowingModal: () => null,
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
