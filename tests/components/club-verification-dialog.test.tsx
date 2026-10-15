/**
 * What: Tests for ClubVerificationDialog, where a SUPERADMIN approves or rejects a club.
 * Why: Verification is the defence against someone registering a club they do
 *      not represent, so the dialog must show the club name, the whole crest,
 *      the person who manages it and the document that proves it, and the
 *      document link comes from user input so only http(s) may be clickable.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClubVerificationDialog } from "@/components/admin/clubs/club-verification-dialog";
import type { AdminClubRow } from "@/types/models/admin";

const { setVerification } = vi.hoisted(() => ({ setVerification: vi.fn() }));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

vi.mock("@/hooks/useAdminClubs", () => ({
  useAdminSetClubVerification: () => ({ mutate: setVerification }),
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
    verificationDoc: "https://res.cloudinary.com/demo/proof.pdf",
    isVerified: false,
    membersCount: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    managedBy: { firstName: "Laura", lastName: "Gomez" },
    ...overrides,
  };
}

function renderDialog(club: AdminClubRow | null) {
  return render(<ClubVerificationDialog club={club} open onOpenChange={vi.fn()} />);
}

describe("ClubVerificationDialog", () => {
  beforeEach(() => setVerification.mockReset());

  it("shows the club name and its whole crest", () => {
    renderDialog(makeClub());

    expect(screen.getByText("HC Madrid")).toBeInTheDocument();
    const crest = screen.getByRole("img", { name: "HC Madrid" });
    expect(crest).toHaveClass("object-contain");
    expect(crest.parentElement).not.toHaveClass("rounded-full");
  });

  it("shows who manages the club", () => {
    renderDialog(makeClub());

    expect(screen.getByText("managedBy")).toBeInTheDocument();
    expect(screen.getByText("Laura Gomez")).toBeInTheDocument();
  });

  it("says nothing about a manager that is not on record", () => {
    renderDialog(makeClub({ managedBy: null }));

    expect(screen.queryByText("managedBy")).toBeNull();
  });

  it("links the proof document in a new tab when it is an https url", () => {
    renderDialog(makeClub());

    const link = screen.getByRole("link", { name: /viewDocument/ });
    expect(link).toHaveAttribute("href", "https://res.cloudinary.com/demo/proof.pdf");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("never links a javascript: document", () => {
    renderDialog(makeClub({ verificationDoc: "javascript:alert(1)" }));

    expect(screen.queryByRole("link", { name: /viewDocument/ })).toBeNull();
    expect(screen.getByText("noDocument")).toBeInTheDocument();
  });

  it("asks for confirmation before approving and then verifies the club", async () => {
    const user = userEvent.setup();
    renderDialog(makeClub());

    await user.click(screen.getByRole("button", { name: /approve/ }));
    expect(setVerification).not.toHaveBeenCalled();
    await user.click(await screen.findByRole("button", { name: "confirm" }));

    expect(setVerification).toHaveBeenCalledWith({ clubId: "club-1", status: "VERIFIED" });
  });

  it("renders nothing without a club", () => {
    const { container } = renderDialog(null);

    expect(container).toBeEmptyDOMElement();
  });
});
