import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClubsPage } from "@/components/pages/clubs-page";

const { mockUseClubs, mockUser } = vi.hoisted(() => ({
  mockUseClubs: vi.fn(),
  mockUser: { current: { id: "me" } as { id: string } | null },
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/hooks/useClubs", () => ({ useClubs: mockUseClubs }));

vi.mock("@/stores/useAuthStore", () => ({
  useAuthStore: (selector: (s: { user: { id: string } | null }) => unknown) =>
    selector({ user: mockUser.current }),
}));

vi.mock("@/components/clubs/club-list-card", () => ({
  // The page spreads the club onto the card: {...club}
  ClubListCard: ({ name }: { name: string }) => <div data-testid="club-card">{name}</div>,
}));

const member = (userId: string, status: string) => ({
  id: `m-${userId}-${status}`,
  role: "PLAYER",
  status,
  user: { id: userId, username: userId, name: userId },
});

const clubs = [
  { id: "c1", name: "Mine FC", city: "A", country: "ES", members: [member("me", "ACTIVE")] },
  { id: "c2", name: "Invited FC", city: "B", country: "ES", members: [member("me", "PENDING")] },
  { id: "c3", name: "Other FC", city: "C", country: "ES", members: [member("someone", "ACTIVE")] },
  { id: "c4", name: "Empty FC", city: "D", country: "ES", members: [] },
];

describe("ClubsPage - my clubs tab", () => {
  beforeEach(() => {
    mockUser.current = { id: "me" };
    mockUseClubs.mockReturnValue({ data: { clubs }, isLoading: false, error: null });
  });

  it("lists every club in the first tab", () => {
    render(<ClubsPage />);

    expect(screen.getAllByTestId("club-card").map((c) => c.textContent)).toEqual([
      "Mine FC",
      "Invited FC",
      "Other FC",
      "Empty FC",
    ]);
  });

  it("shows only the clubs where the user is an ACTIVE member in 'my clubs'", async () => {
    render(<ClubsPage />);

    await userEvent.click(screen.getByRole("tab", { name: /myClubhouses/ }));

    expect(screen.getAllByTestId("club-card").map((c) => c.textContent)).toEqual(["Mine FC"]);
  });

  it("counts the user's clubs in the tab label", () => {
    render(<ClubsPage />);

    expect(screen.getByRole("tab", { name: /myClubhouses/ })).toHaveTextContent("(1)");
  });

  it("shows no 'my clubs' for a visitor who is not signed in", async () => {
    mockUser.current = null;
    render(<ClubsPage />);

    expect(screen.getByRole("tab", { name: /myClubhouses/ })).toHaveTextContent("(0)");
  });
});
