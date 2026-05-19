import { render, screen } from "@testing-library/react";
import { VerificationBanner } from "@/components/clubs/verification-banner";
import { Club } from "@/types/models/club";
import { NextIntlClientProvider } from "next-intl";
import { describe, it, expect, vi } from "vitest";

const mockMessages = {
  clubs: {
    verification: {
      unverifiedTitle: "Club Not Verified",
      unverifiedDescription: "Your club is not verified.",
      pendingTitle: "Verification Pending",
      pendingDescription: "Your verification request is being reviewed.",
      verifyButton: "Verify Club",
    },
  },
};

const mockClub: Club = {
  id: "1",
  name: "Test Club",
  verificationStatus: "UNVERIFIED",
};

describe("VerificationBanner", () => {
  it("renders unverified banner", () => {
    const onVerifyClick = vi.fn();
    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <VerificationBanner club={mockClub} onVerifyClick={onVerifyClick} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText("Club Not Verified")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /verify club/i }),
    ).toBeInTheDocument();
  });

  it("renders pending banner", () => {
    const pendingClub = { ...mockClub, verificationStatus: "PENDING" as const };
    const onVerifyClick = vi.fn();
    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <VerificationBanner club={pendingClub} onVerifyClick={onVerifyClick} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText("Verification Pending")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("does not render when verified", () => {
    const verifiedClub = {
      ...mockClub,
      verificationStatus: "VERIFIED" as const,
    };
    const onVerifyClick = vi.fn();
    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <VerificationBanner club={verifiedClub} onVerifyClick={onVerifyClick} />
      </NextIntlClientProvider>,
    );

    // El componente retorna null → no hay botón ni texto de verificación en el DOM
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByText("Club Not Verified")).not.toBeInTheDocument();
  });
});
