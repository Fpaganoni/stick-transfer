/**
 * What: Tests for the explore ProfileCard, player and umpire variants.
 * Why: Umpires have no position or playing level, so their card must show
 *      licence level, experience and what they officiate instead, without
 *      printing "undefined"/"null". Player and coach cards must stay as they were.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfileCard } from "@/components/explore/profile-card";
import {
  Role,
  Level,
  UmpireLicenseLevel,
  UmpireModality,
  UmpireCategory,
} from "@/types/enums";

const { mockPush } = vi.hoisted(() => ({ mockPush: vi.fn() }));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key}:${JSON.stringify(values)}` : key,
  useLocale: () => "en",
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt ?? ""} />
  ),
}));

const base = {
  id: "1",
  name: "Javier García",
  username: "umpire_garcia",
  avatar: "/a.png",
  country: "ES",
  city: "Madrid",
  bio: "Fair play first",
};

const umpire = {
  ...base,
  role: Role.UMPIRE,
  isVerified: true,
  licenseLevel: UmpireLicenseLevel.INTERNACIONAL,
  matchesOfficiated: 640,
  modalities: [UmpireModality.CESPED, UmpireModality.SALA],
  umpireCategories: [UmpireCategory.MAYORES],
};

const player = {
  ...base,
  name: "Ana Player",
  username: "ana",
  role: Role.PLAYER,
  position: "defender" as never,
  level: Level.PROFESSIONAL,
};

describe("ProfileCard", () => {
  describe("umpire", () => {
    it("shows the licence level, the role and the match count", () => {
      render(<ProfileCard {...umpire} />);

      expect(screen.getByText("UMPIRE")).toBeInTheDocument();
      expect(screen.getByText("licenseLevels.INTERNACIONAL")).toBeInTheDocument();
      expect(screen.getByText('matchesCount:{"count":640}')).toBeInTheDocument();
    });

    it("lists modalities and categories", () => {
      render(<ProfileCard {...umpire} />);

      expect(screen.getByText("modalities.CESPED")).toBeInTheDocument();
      expect(screen.getByText("modalities.SALA")).toBeInTheDocument();
      expect(screen.getByText("categories.MAYORES")).toBeInTheDocument();
    });

    it("shows the verified badge only when verified", () => {
      const { rerender } = render(<ProfileCard {...umpire} />);
      expect(screen.getByTestId("verified-badge")).toBeInTheDocument();

      rerender(<ProfileCard {...umpire} isVerified={false} />);
      expect(screen.queryByTestId("verified-badge")).not.toBeInTheDocument();
    });

    it("does not show player-only information", () => {
      const { container } = render(<ProfileCard {...umpire} />);

      expect(screen.queryByText(/level$/)).not.toBeInTheDocument();
      expect(container.textContent).not.toMatch(/undefined|null/);
    });

    it("copes with an umpire who has filled in nothing yet", () => {
      const { container } = render(
        <ProfileCard
          {...base}
          role={Role.UMPIRE}
          isVerified={false}
          licenseLevel={null}
          matchesOfficiated={null}
          modalities={[]}
          umpireCategories={[]}
        />,
      );

      expect(screen.getByText("UMPIRE")).toBeInTheDocument();
      expect(screen.queryByText(/matchesCount/)).not.toBeInTheDocument();
      expect(container.textContent).not.toMatch(/undefined|null/);
    });

    it("shows 0 matches officiated as data", () => {
      render(<ProfileCard {...umpire} matchesOfficiated={0} />);

      expect(screen.getByText('matchesCount:{"count":0}')).toBeInTheDocument();
    });

    it("opens the umpire's profile", async () => {
      mockPush.mockReset();
      const user = userEvent.setup();
      render(<ProfileCard {...umpire} />);

      await user.click(screen.getByRole("button", { name: /viewProfile/ }));

      expect(mockPush).toHaveBeenCalledWith("/en/profile/umpire_garcia");
    });
  });

  describe("player (unchanged)", () => {
    it("shows position and level", () => {
      render(<ProfileCard {...player} />);

      expect(screen.getByText("defender")).toBeInTheDocument();
      expect(screen.getByText(/PROFESSIONAL level/)).toBeInTheDocument();
    });

    it("shows no umpire information or verified badge", () => {
      render(<ProfileCard {...player} />);

      expect(screen.queryByText(/licenseLevels\./)).not.toBeInTheDocument();
      expect(screen.queryByTestId("verified-badge")).not.toBeInTheDocument();
    });
  });
});
