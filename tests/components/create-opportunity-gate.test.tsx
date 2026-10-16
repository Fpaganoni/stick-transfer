/**
 * What: Tests for CreateOpportunityGate, the wrapper of the "post a job" form.
 * Why: Only a VERIFIED club can publish. Telling the club before it fills in the
 *      whole form (and sending it to where it verifies) beats a rejection after
 *      submit. While the status is unknown the form must not show up either.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { CreateOpportunityGate } from "@/components/opportunities/create-opportunity-gate";

const { state, mockUseClub } = vi.hoisted(() => ({
  state: {
    status: "VERIFIED" as string | undefined,
    isLoading: false,
    isError: false,
    userId: "club-1" as string | null,
  },
  mockUseClub: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/hooks/useClubs", () => ({
  useClub: (id: string | null) => {
    mockUseClub(id);
    return {
      data: state.status ? { club: { id: "club-1", verificationStatus: state.status } } : undefined,
      isLoading: state.isLoading,
      isError: state.isError,
    };
  },
}));

vi.mock("@/stores/useAuthStore", () => ({
  useAuthStore: (selector?: (s: { user: { id: string } | null }) => unknown) => {
    const slice = { user: state.userId ? { id: state.userId } : null };
    return selector ? selector(slice) : slice;
  },
}));

vi.mock("@/components/opportunities/create-opportunity-form", () => ({
  CreateOpportunityForm: () => <div>create-form</div>,
}));

describe("CreateOpportunityGate", () => {
  beforeEach(() => {
    state.status = "VERIFIED";
    state.isLoading = false;
    state.isError = false;
    state.userId = "club-1";
    mockUseClub.mockClear();
  });

  it("reads the club of the account (a CLUB account id is its club id)", () => {
    render(<CreateOpportunityGate />);

    expect(mockUseClub).toHaveBeenCalledWith("club-1");
  });

  it("shows the form to a verified club", () => {
    render(<CreateOpportunityGate />);

    expect(screen.getByText("create-form")).toBeInTheDocument();
    expect(screen.queryByText("create.gate.title")).toBeNull();
  });

  it.each(["UNVERIFIED", "REJECTED"])(
    "replaces the form with the reason and a way to verify when the club is %s",
    (status) => {
      state.status = status;

      render(<CreateOpportunityGate />);

      expect(screen.queryByText("create-form")).toBeNull();
      expect(screen.getByText("create.gate.title")).toBeInTheDocument();
      expect(screen.getByText("create.gate.description")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "create.gate.goToProfile" })).toHaveAttribute(
        "href",
        "/profile",
      );
    },
  );

  it("says the document is being reviewed when the club is PENDING, and still hides the form", () => {
    state.status = "PENDING";

    render(<CreateOpportunityGate />);

    expect(screen.queryByText("create-form")).toBeNull();
    expect(screen.getByText("create.gate.pendingDescription")).toBeInTheDocument();
    expect(screen.queryByText("create.gate.description")).toBeNull();
  });

  it("shows neither the form nor the refusal while the status is loading", () => {
    state.status = undefined;
    state.isLoading = true;

    render(<CreateOpportunityGate />);

    expect(screen.queryByText("create-form")).toBeNull();
    expect(screen.queryByText("create.gate.title")).toBeNull();
  });

  it("says the club could not be read instead of opening the form", () => {
    state.status = undefined;
    state.isError = true;

    render(<CreateOpportunityGate />);

    expect(screen.getByRole("alert")).toHaveTextContent("create.gate.loadError");
    expect(screen.queryByText("create-form")).toBeNull();
  });
});
