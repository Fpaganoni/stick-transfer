/**
 * What: Tests for UmpireInfoSection (the "officiating" tab of an umpire profile).
 * Why: This is what clubs read to decide whether to contact an umpire. It must
 *      show licence/experience data, never leak the private licence number to
 *      third parties (the backend sends null for them), and handle profiles
 *      that have not filled anything in yet without printing "null"/"undefined".
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { UmpireInfoSection } from "@/components/profile/umpire-info-section";
import {
  UmpireLicenseLevel,
  TravelAvailability,
  UmpireModality,
  UmpireCategory,
} from "@/types/enums";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const fullInfo = {
  licenseLevel: UmpireLicenseLevel.INTERNACIONAL,
  certifyingBody: "Real Federación Española de Hockey",
  licenseNumber: null,
  certificationYear: 2012,
  matchesOfficiated: 640,
  yearsOfExperience: 14,
  travelAvailability: TravelAvailability.REGIONAL,
  languages: ["Español", "English", "Français"],
  modalities: [UmpireModality.CESPED, UmpireModality.SALA],
  umpireCategories: [UmpireCategory.MAYORES, UmpireCategory.FEMENINO],
  umpireCertifications: [
    {
      id: "c1",
      name: "Licencia de umpire internacional",
      issuer: "Real Federación Española de Hockey",
      issuedAt: "2012-05-31T22:00:00.000Z",
      fileUrl: "https://files.test/licence.pdf",
      order: 0,
    },
    {
      id: "c2",
      name: "Curso de actualización de reglas",
      issuer: "FIH",
      issuedAt: null,
      fileUrl: null,
      order: 1,
    },
  ],
};

describe("UmpireInfoSection", () => {
  it("shows licence, experience and availability data", () => {
    render(<UmpireInfoSection info={fullInfo} />);

    expect(screen.getByText("licenseLevels.INTERNACIONAL")).toBeInTheDocument();
    expect(screen.getByText("Real Federación Española de Hockey", { selector: "dd" })).toBeInTheDocument();
    expect(screen.getByText("2012")).toBeInTheDocument();
    expect(screen.getByText("640")).toBeInTheDocument();
    expect(screen.getByText("14")).toBeInTheDocument();
    expect(screen.getByText("travelAvailability.REGIONAL")).toBeInTheDocument();
  });

  it("lists languages, modalities and categories", () => {
    render(<UmpireInfoSection info={fullInfo} />);

    expect(screen.getByText("Español")).toBeInTheDocument();
    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("Français")).toBeInTheDocument();
    expect(screen.getByText("modalities.CESPED")).toBeInTheDocument();
    expect(screen.getByText("modalities.SALA")).toBeInTheDocument();
    expect(screen.queryByText("modalities.INDOOR")).not.toBeInTheDocument();
    expect(screen.getByText("categories.MAYORES")).toBeInTheDocument();
    expect(screen.getByText("categories.FEMENINO")).toBeInTheDocument();
  });

  it("lists certifications in order, with a document link only when there is a file", () => {
    render(<UmpireInfoSection info={fullInfo} />);

    expect(screen.getByText("Licencia de umpire internacional")).toBeInTheDocument();
    expect(screen.getByText("Curso de actualización de reglas")).toBeInTheDocument();
    expect(screen.getByText("2012-05-31")).toBeInTheDocument();

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "https://files.test/licence.pdf");
  });

  it("does not show the licence number when the backend hid it (third party)", () => {
    render(<UmpireInfoSection info={{ ...fullInfo, licenseNumber: null }} />);

    expect(screen.queryByText("umpire.licenseNumber")).not.toBeInTheDocument();
  });

  it("shows the licence number to its owner", () => {
    render(
      <UmpireInfoSection info={{ ...fullInfo, licenseNumber: "RFEH-001" }} isOwnProfile />,
    );

    expect(screen.getByText("umpire.licenseNumber")).toBeInTheDocument();
    expect(screen.getByText("RFEH-001")).toBeInTheDocument();
  });

  it("omits rows for data the umpire has not filled in, without printing null", () => {
    const { container } = render(
      <UmpireInfoSection
        info={{
          licenseLevel: UmpireLicenseLevel.REGIONAL,
          certifyingBody: null,
          certificationYear: null,
          matchesOfficiated: null,
          yearsOfExperience: null,
          travelAvailability: null,
          languages: [],
          modalities: [],
          umpireCategories: [],
          umpireCertifications: [],
        }}
      />,
    );

    expect(screen.getByText("licenseLevels.REGIONAL")).toBeInTheDocument();
    expect(screen.queryByText("umpire.certifyingBody")).not.toBeInTheDocument();
    expect(screen.queryByText("umpire.matchesOfficiated")).not.toBeInTheDocument();
    expect(screen.queryByText("umpire.languages")).not.toBeInTheDocument();
    expect(container.textContent).not.toMatch(/null|undefined/);
  });

  it("keeps matchesOfficiated = 0 visible (0 is data, not missing)", () => {
    render(<UmpireInfoSection info={{ matchesOfficiated: 0 }} />);

    expect(screen.getByText("umpire.matchesOfficiated")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("shows a neutral empty state to visitors of an empty profile", () => {
    render(<UmpireInfoSection info={{}} />);

    expect(screen.getByText("umpire.noInfo")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("invites the owner of an empty profile to complete it", () => {
    render(<UmpireInfoSection info={{}} isOwnProfile />);

    expect(screen.getByText("umpire.noInfoOwn")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "umpire.completeProfile" })).toHaveAttribute(
      "href",
      "/profile/edit",
    );
  });
});
