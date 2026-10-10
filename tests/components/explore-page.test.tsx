/**
 * What: Tests for the Explore page filters and pagination.
 * Why: The backend hides umpires from explore unless role=UMPIRE is sent, and
 *      ignores position/level for them (while umpire filters mean nothing for
 *      players). The page must send a consistent filter set when the role
 *      changes, and since the API returns no total, it must infer "is there
 *      more?" from a full page.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExplorePage } from "@/components/pages/explore-page";

const { mockUseExploreUsers, state } = vi.hoisted(() => ({
  mockUseExploreUsers: vi.fn(),
  state: {
    users: [] as { id: string; name: string }[],
    isLoading: false,
    error: null as Error | null,
    isPlaceholderData: false,
    countries: ["NL", "ES", "AR"] as string[],
  },
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

vi.mock("@/hooks/useExplore", () => ({
  useExploreUsers: (filters: unknown) => {
    mockUseExploreUsers(filters);
    return {
      data: { exploreUsers: state.users },
      isLoading: state.isLoading,
      error: state.error,
      isPlaceholderData: state.isPlaceholderData,
    };
  },
  useAvailableCountries: () => ({ data: state.countries }),
}));

vi.mock("@/components/explore/profile-card", () => ({
  ProfileCard: ({ name }: { name: string }) => <div data-testid="card">{name}</div>,
}));

const lastFilters = () =>
  mockUseExploreUsers.mock.calls[mockUseExploreUsers.mock.calls.length - 1][0];

const makeUsers = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ id: `u${i}`, name: `User ${i}` }));

async function pick(user: ReturnType<typeof userEvent.setup>, filter: string, option: string) {
  await user.click(screen.getByRole("button", { name: filter }));
  await user.click(screen.getByRole("button", { name: option }));
}

describe("ExplorePage", () => {
  beforeEach(() => {
    mockUseExploreUsers.mockClear();
    state.users = [];
    state.isLoading = false;
    state.error = null;
    state.isPlaceholderData = false;
    state.countries = ["NL", "ES", "AR"];
  });

  describe("role filter", () => {
    it("offers umpire next to player and coach", async () => {
      const user = userEvent.setup();
      render(<ExplorePage />);

      await user.click(screen.getByRole("button", { name: "filters.role" }));

      expect(screen.getByRole("button", { name: "roles.player" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "roles.coach" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "roles.umpire" })).toBeInTheDocument();
    });

    it("queries role UMPIRE when umpire is selected", async () => {
      const user = userEvent.setup();
      render(<ExplorePage />);

      await pick(user, "filters.role", "roles.umpire");

      expect(lastFilters()).toMatchObject({ role: "UMPIRE" });
    });
  });

  describe("filter sets by role", () => {
    it("shows player filters, and no umpire filters, by default", () => {
      render(<ExplorePage />);

      expect(screen.getByRole("button", { name: "filters.position" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "filters.level" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "filters.licenseLevel" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "filters.modality" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "filters.category" })).not.toBeInTheDocument();
    });

    it("swaps position/level for the umpire filters when umpire is selected", async () => {
      const user = userEvent.setup();
      render(<ExplorePage />);

      await pick(user, "filters.role", "roles.umpire");

      expect(screen.getByRole("button", { name: "filters.licenseLevel" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "filters.modality" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "filters.category" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "filters.position" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "filters.level" })).not.toBeInTheDocument();
    });

    it("keeps the country filter for every role", async () => {
      const user = userEvent.setup();
      render(<ExplorePage />);
      expect(screen.getByRole("button", { name: "filters.country" })).toBeInTheDocument();

      await pick(user, "filters.role", "roles.umpire");
      expect(screen.getByRole("button", { name: "filters.country" })).toBeInTheDocument();
    });

    it("offers only the countries that have users or clubs, by name", async () => {
      const user = userEvent.setup();
      render(<ExplorePage />);

      await user.click(screen.getByRole("button", { name: "filters.country" }));

      const options = (await screen.findAllByRole("option")).map((o) => o.textContent);
      expect(options).toEqual(["🇦🇷Argentina", "🇳🇱Netherlands", "🇪🇸Spain"]);
    });

    it("falls back to the hockey countries when the API has none", async () => {
      state.countries = [];
      const user = userEvent.setup();
      render(<ExplorePage />);

      await user.click(screen.getByRole("button", { name: "filters.country" }));

      expect(await screen.findAllByRole("option")).toHaveLength(28);
    });

    it("shows the picked country on the chip and filters by its code", async () => {
      const user = userEvent.setup();
      render(<ExplorePage />);

      await user.click(screen.getByRole("button", { name: "filters.country" }));
      await user.click(await screen.findByRole("option", { name: /Netherlands/ }));

      expect(screen.getByRole("button", { name: "🇳🇱 Netherlands" })).toBeInTheDocument();
      expect(lastFilters()).toMatchObject({ country: "NL" });
    });

    it("keeps the coach filter set the same as player's", async () => {
      const user = userEvent.setup();
      render(<ExplorePage />);

      await pick(user, "filters.role", "roles.coach");

      expect(screen.getByRole("button", { name: "filters.position" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "filters.licenseLevel" })).not.toBeInTheDocument();
    });
  });

  describe("umpire filters", () => {
    it("sends the licence level as the backend enum value", async () => {
      const user = userEvent.setup();
      render(<ExplorePage />);

      await pick(user, "filters.role", "roles.umpire");
      await pick(user, "filters.licenseLevel", "licenseLevels.NACIONAL");

      expect(lastFilters()).toMatchObject({ role: "UMPIRE", licenseLevel: "NACIONAL" });
    });

    it("sends modality and category as single enum values", async () => {
      const user = userEvent.setup();
      render(<ExplorePage />);

      await pick(user, "filters.role", "roles.umpire");
      await pick(user, "filters.modality", "modalities.OUTDOOR");
      await pick(user, "filters.category", "categories.FEMENINO");

      expect(lastFilters()).toMatchObject({
        role: "UMPIRE",
        modality: "OUTDOOR",
        umpireCategory: "FEMENINO",
      });
    });

    it("combines umpire filters with country", async () => {
      const user = userEvent.setup();
      render(<ExplorePage />);

      await pick(user, "filters.role", "roles.umpire");
      await user.click(screen.getByRole("button", { name: "filters.country" }));
      await user.click(await screen.findByRole("option", { name: /Spain/ }));
      await pick(user, "filters.licenseLevel", "licenseLevels.INTERNACIONAL");

      expect(lastFilters()).toMatchObject({
        role: "UMPIRE",
        country: "ES",
        licenseLevel: "INTERNACIONAL",
      });
    });

    it("drops umpire filters from the query when switching to another role", async () => {
      const user = userEvent.setup();
      render(<ExplorePage />);

      await pick(user, "filters.role", "roles.umpire");
      await pick(user, "filters.licenseLevel", "licenseLevels.NACIONAL");
      await pick(user, "filters.modality", "modalities.INDOOR");
      // The active role button is now labelled with the selected role
      await pick(user, "roles.umpire", "roles.player");

      const filters = lastFilters();
      expect(filters.role).toBe("PLAYER");
      expect(filters.licenseLevel).toBeUndefined();
      expect(filters.modality).toBeUndefined();
      expect(filters.umpireCategory).toBeUndefined();
      expect(screen.queryByRole("button", { name: "filters.licenseLevel" })).not.toBeInTheDocument();
    });

    it("sends the attacker enum value when forward is picked", async () => {
      const user = userEvent.setup();
      render(<ExplorePage />);

      await pick(user, "filters.position", "positions.forward");

      expect(lastFilters()).toMatchObject({ position: "attacker" });
    });

    it("drops position and level from the query when switching to umpire", async () => {
      const user = userEvent.setup();
      render(<ExplorePage />);

      await pick(user, "filters.position", "positions.defender");
      await pick(user, "filters.level", "levels.professional");
      await pick(user, "filters.role", "roles.umpire");

      const filters = lastFilters();
      expect(filters.role).toBe("UMPIRE");
      expect(filters.position).toBeUndefined();
      expect(filters.level).toBeUndefined();
    });

    it("drops umpire filters when the role filter is cleared", async () => {
      const user = userEvent.setup();
      render(<ExplorePage />);

      await pick(user, "filters.role", "roles.umpire");
      await pick(user, "filters.licenseLevel", "licenseLevels.REGIONAL");

      // The active role button shows its label plus a clear (X) icon
      await user.click(screen.getByRole("button", { name: "roles.umpire" }).querySelector("svg")!);

      const filters = lastFilters();
      expect(filters.role).toBeUndefined();
      expect(filters.licenseLevel).toBeUndefined();
    });
  });

  describe("pagination", () => {
    it("requests the first page of 50", () => {
      render(<ExplorePage />);

      expect(lastFilters()).toMatchObject({ limit: 50, offset: 0 });
    });

    it("offers 'load more' only when the page came back full", () => {
      state.users = makeUsers(50);
      render(<ExplorePage />);

      expect(screen.getByRole("button", { name: "loadMore" })).toBeInTheDocument();
    });

    it("hides 'load more' on a partial page (that was the last one)", () => {
      state.users = makeUsers(49);
      render(<ExplorePage />);

      expect(screen.queryByRole("button", { name: "loadMore" })).not.toBeInTheDocument();
    });

    it("hides 'load more' when there are no results", () => {
      render(<ExplorePage />);

      expect(screen.queryByRole("button", { name: "loadMore" })).not.toBeInTheDocument();
    });

    it("asks for the next 50 on 'load more'", async () => {
      state.users = makeUsers(50);
      const user = userEvent.setup();
      render(<ExplorePage />);

      await user.click(screen.getByRole("button", { name: "loadMore" }));

      expect(lastFilters()).toMatchObject({ limit: 100, offset: 0 });
    });

    it("goes back to the first page when a filter changes", async () => {
      state.users = makeUsers(50);
      const user = userEvent.setup();
      render(<ExplorePage />);

      await user.click(screen.getByRole("button", { name: "loadMore" }));
      expect(lastFilters().limit).toBe(100);

      await pick(user, "filters.role", "roles.umpire");

      expect(lastFilters()).toMatchObject({ role: "UMPIRE", limit: 50 });
    });

    it("disables the button while the next page is loading", async () => {
      state.users = makeUsers(50);
      const user = userEvent.setup();
      const { rerender } = render(<ExplorePage />);
      await user.click(screen.getByRole("button", { name: "loadMore" }));

      state.isPlaceholderData = true;
      rerender(<ExplorePage />);

      expect(screen.getByRole("button", { name: "loadingMore" })).toBeDisabled();
    });
  });

  describe("results", () => {
    it("renders a card per user", () => {
      state.users = makeUsers(3);
      render(<ExplorePage />);

      expect(screen.getAllByTestId("card")).toHaveLength(3);
    });

    it("shows the empty message with the active filters", async () => {
      const user = userEvent.setup();
      render(<ExplorePage />);

      await pick(user, "filters.role", "roles.umpire");

      expect(screen.getByText(/noResults/)).toBeInTheDocument();
    });
  });
});
