import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClubOnboardingNotice } from "@/components/clubs/club-onboarding-notice";

describe("ClubOnboardingNotice", () => {
  it("renders nothing once the crest and the description are there", () => {
    const { container } = render(
      <ClubOnboardingNotice club={{ logo: "https://img/crest.png", description: "Since 1950" }} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("lists what is missing and links to the profile editor", () => {
    render(<ClubOnboardingNotice club={{ logo: null, description: "" }} />);

    expect(screen.getByText("title")).toBeDefined();
    expect(screen.getByText("missing.crest")).toBeDefined();
    expect(screen.getByText("missing.description")).toBeDefined();
    expect(screen.getByRole("link", { name: "action" }).getAttribute("href")).toBe(
      "/profile/edit",
    );
  });

  it("lists only the missing item", () => {
    render(<ClubOnboardingNotice club={{ logo: "https://img/crest.png", description: "" }} />);

    expect(screen.queryByText("missing.crest")).toBeNull();
    expect(screen.getByText("missing.description")).toBeDefined();
  });

  it("can hide the editor link when it is already shown inside the editor", () => {
    render(<ClubOnboardingNotice club={{}} showAction={false} />);

    expect(screen.getByText("title")).toBeDefined();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("is announced to assistive technology", () => {
    render(<ClubOnboardingNotice club={{}} />);

    expect(screen.getByRole("status")).toBeDefined();
  });
});
