import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClubProfileTabs } from "@/components/profile/club-profile-tabs";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt ?? ""} />
  ),
}));

vi.mock("@/hooks/useJobOpportunities", () => ({
  useJobOpportunities: () => ({
    data: { jobOpportunities: [] },
    isLoading: false,
  }),
}));

vi.mock("@/stores/useOpportunitiesStore", () => ({
  useOpportunitiesStore: () => ({
    setSelectedOpportunity: vi.fn(),
    setIsModalOpen: vi.fn(),
  }),
}));

vi.mock("@/hooks/useJobApplications", () => ({
  useUserApplications: () => ({ hasAppliedTo: () => false }),
}));

vi.mock("@/stores/useAuthStore", () => ({
  useAuthStore: () => ({ isLoggedIn: false }),
}));

vi.mock("@/stores/useUIStore", () => ({
  useUIStore: () => ({ openLoginModal: vi.fn() }),
}));

const baseClubData = {
  id: "club-1",
  bio: "Test club",
  city: "Barcelona",
  country: "ES",
  isAdmin: false,
};

describe("ClubProfileTabs — videos tab", () => {
  it("shows YoutubeWidget for each URL in club.videos", () => {
    const videos = [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://www.youtube.com/watch?v=abc1234abcd",
    ];
    render(
      <ClubProfileTabs
        activeTab="videos"
        setActiveTab={vi.fn()}
        clubData={{ ...baseClubData, videos }}
      />
    );
    // Each video renders a thumbnail img from youtube
    const imgs = document.querySelectorAll('img[src*="img.youtube.com"]');
    expect(imgs).toHaveLength(videos.length);
  });

  it("shows empty state when club.videos is empty", () => {
    render(
      <ClubProfileTabs
        activeTab="videos"
        setActiveTab={vi.fn()}
        clubData={{ ...baseClubData, videos: [] }}
      />
    );
    expect(screen.getByText("videos.noVideos")).toBeInTheDocument();
  });

  it("shows empty state when club.videos is undefined", () => {
    render(
      <ClubProfileTabs
        activeTab="videos"
        setActiveTab={vi.fn()}
        clubData={{ ...baseClubData }}
      />
    );
    expect(screen.getByText("videos.noVideos")).toBeInTheDocument();
  });

  it("shows Add Video button when isAdmin=true", () => {
    render(
      <ClubProfileTabs
        activeTab="videos"
        setActiveTab={vi.fn()}
        clubData={{ ...baseClubData, isAdmin: true }}
      />
    );
    expect(screen.getByText("videos.addVideo")).toBeInTheDocument();
  });

  it("hides Add Video button when isAdmin=false", () => {
    render(
      <ClubProfileTabs
        activeTab="videos"
        setActiveTab={vi.fn()}
        clubData={{ ...baseClubData, isAdmin: false }}
      />
    );
    expect(screen.queryByText("videos.addVideo")).not.toBeInTheDocument();
  });
});
