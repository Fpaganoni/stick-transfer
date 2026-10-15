/**
 * What: Tests for AdminClubsTable.
 * Why: A SUPERADMIN reviews clubs to verify them. The club name is unique and
 *      the first one to register it takes it, so the admin must see who manages
 *      the club (the privacy-protected managedBy only a SUPERADMIN receives),
 *      next to the name and the whole crest, to decide whether to verify it.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminClubsTable } from "@/components/admin/clubs/admin-clubs-table";
import type { AdminClubRow } from "@/types/models/admin";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

function makeClub(overrides: Partial<AdminClubRow> = {}): AdminClubRow {
  return {
    id: "club-1",
    name: "HC Madrid",
    logo: "https://res.cloudinary.com/demo/crest.png",
    city: "Madrid",
    country: "ES",
    league: "Primera",
    verificationStatus: "PENDING",
    isVerified: false,
    membersCount: 3,
    createdAt: "2026-01-01T00:00:00.000Z",
    managedBy: { firstName: "Laura", lastName: "Gomez" },
    ...overrides,
  };
}

describe("AdminClubsTable", () => {
  it("shows the club name and links to its page", () => {
    render(<AdminClubsTable clubs={[makeClub()]} onReview={vi.fn()} />);

    expect(screen.getByRole("link", { name: /HC Madrid/ })).toHaveAttribute("href", "/clubs/club-1");
  });

  it("shows the crest whole on a neutral background, not cropped to a circle", () => {
    render(<AdminClubsTable clubs={[makeClub()]} onReview={vi.fn()} />);

    const crest = screen.getByRole("img", { name: "HC Madrid" });
    expect(crest).toHaveClass("object-contain");
    expect(crest.parentElement).not.toHaveClass("rounded-full");
  });

  it("shows the club initial when it has no crest", () => {
    render(<AdminClubsTable clubs={[makeClub({ logo: undefined })]} onReview={vi.fn()} />);

    expect(screen.getByRole("img", { name: "HC Madrid" })).toHaveTextContent("H");
  });

  it("shows who manages the club", () => {
    render(<AdminClubsTable clubs={[makeClub()]} onReview={vi.fn()} />);

    expect(screen.getByRole("columnheader", { name: "table.manager" })).toBeInTheDocument();
    expect(screen.getByText("Laura Gomez")).toBeInTheDocument();
  });

  it("shows a dash when the club has no manager on record", () => {
    render(<AdminClubsTable clubs={[makeClub({ managedBy: null })]} onReview={vi.fn()} />);

    const row = screen.getByRole("row", { name: /HC Madrid/ });
    expect(within(row).queryByText(/Laura/)).toBeNull();
    expect(within(row).getAllByText("—").length).toBeGreaterThan(0);
  });

  it("lets the admin review the club", async () => {
    const onReview = vi.fn();
    const club = makeClub();
    const user = userEvent.setup();
    render(<AdminClubsTable clubs={[club]} onReview={onReview} />);

    await user.click(screen.getByRole("button", { name: /table.review/ }));

    expect(onReview).toHaveBeenCalledWith(club);
  });
});
