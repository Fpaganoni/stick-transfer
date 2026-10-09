/**
 * What: Tests for ProfileTabs role behaviour.
 * Why: Umpires get an extra "officiating" tab and may have a CV, while other
 *      roles must keep the exact tabs they had. A wrong tab list would hide an
 *      umpire's licence data or show an empty umpire tab on a player.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfileTabs } from "@/components/profile/profile-tabs";
import { UmpireLicenseLevel } from "@/types/enums";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/components/ui/youtube-widget", () => ({
  YoutubeWidget: () => <div>youtube</div>,
}));
vi.mock("@/components/profile/user-applications", () => ({
  UserApplications: () => <div>applications-content</div>,
}));
vi.mock("@/components/profile/user-saved-jobs", () => ({
  UserSavedJobs: () => <div>saved-jobs-content</div>,
}));

const umpireData = {
  id: "u1",
  role: "UMPIRE",
  trajectories: [],
  multimedia: [],
  umpire: { licenseLevel: UmpireLicenseLevel.NACIONAL, matchesOfficiated: 120 },
};

const playerData = { id: "p1", role: "PLAYER", trajectories: [], multimedia: [] };

const tabLabels = () =>
  screen.getAllByRole("button").map((b) => b.textContent);

describe("ProfileTabs", () => {
  it("gives an umpire the officiating tab first, then trajectory and CV (no multimedia)", () => {
    render(
      <ProfileTabs activeTab="umpire" setActiveTab={vi.fn()} userData={umpireData} />,
    );

    expect(tabLabels()).toEqual(["tabs.umpire", "tabs.trajectory", "tabs.cv"]);
  });

  it("adds applications and saved jobs on an umpire's own profile", () => {
    render(
      <ProfileTabs
        activeTab="umpire"
        setActiveTab={vi.fn()}
        userData={umpireData}
        isOwnProfile
      />,
    );

    expect(tabLabels()).toEqual([
      "tabs.umpire",
      "tabs.trajectory",
      "tabs.cv",
      "tabs.applications",
      "tabs.savedJobs",
    ]);
  });

  it("does not add the umpire tab to other roles", () => {
    render(
      <ProfileTabs activeTab="trajectory" setActiveTab={vi.fn()} userData={playerData} />,
    );

    expect(tabLabels()).toEqual(["tabs.trajectory", "tabs.multimedia", "tabs.cv"]);
  });

  it("renders the umpire data when the officiating tab is active", () => {
    render(
      <ProfileTabs activeTab="umpire" setActiveTab={vi.fn()} userData={umpireData} />,
    );

    expect(screen.getByText("licenseLevels.NACIONAL")).toBeInTheDocument();
    expect(screen.getByText("120")).toBeInTheDocument();
  });

  it("does not render umpire data on the other tabs", () => {
    render(
      <ProfileTabs activeTab="trajectory" setActiveTab={vi.fn()} userData={umpireData} />,
    );

    expect(screen.queryByText("licenseLevels.NACIONAL")).not.toBeInTheDocument();
    expect(screen.getByText("noTrajectory")).toBeInTheDocument();
  });

  it.each([false, true])(
    "never renders multimedia for an umpire, even with stored videos (own profile: %s)",
    (isOwnProfile) => {
      render(
        <ProfileTabs
          activeTab="multimedia"
          setActiveTab={vi.fn()}
          userData={{ ...umpireData, multimedia: ["https://youtu.be/legacy"] }}
          isOwnProfile={isOwnProfile}
        />,
      );

      expect(screen.queryByText("tabs.multimedia")).not.toBeInTheDocument();
      expect(screen.queryByText("youtube")).not.toBeInTheDocument();
      expect(screen.queryByText("noMultimedia")).not.toBeInTheDocument();
    },
  );

  it("shows a translated empty state when a player has no multimedia", () => {
    render(
      <ProfileTabs activeTab="multimedia" setActiveTab={vi.fn()} userData={playerData} />,
    );

    expect(screen.getByText("noMultimedia")).toBeInTheDocument();
  });

  it("reports the clicked tab", async () => {
    const setActiveTab = vi.fn();
    const user = userEvent.setup();
    render(
      <ProfileTabs activeTab="umpire" setActiveTab={setActiveTab} userData={umpireData} />,
    );

    await user.click(screen.getByText("tabs.cv"));

    expect(setActiveTab).toHaveBeenCalledWith("cv");
  });
});
