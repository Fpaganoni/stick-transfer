/**
 * What: Component tests for CountryLabel.
 * Why: Cards, headers, modals and admin tables show countries through this
 *      label. Codes must read as flag + translated name, legacy free text must
 *      still show, and an empty country must fall back cleanly.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import fr from "@/messages/fr.json";
import { CountryLabel } from "@/components/ui/country-label";

const renderFr = (ui: React.ReactElement) =>
  render(
    <NextIntlClientProvider locale="fr" messages={fr}>
      {ui}
    </NextIntlClientProvider>,
  );

describe("CountryLabel", () => {
  it("shows the flag and the name in the active language", () => {
    const { container } = renderFr(<CountryLabel value="AR" />);
    expect(container).toHaveTextContent("🇦🇷 Argentine");
  });

  it("names UK home nations from the message files", () => {
    renderFr(<CountryLabel value="gb-wls" />);
    expect(screen.getByText("Pays de Galles")).toBeInTheDocument();
  });

  it("prefixes the city", () => {
    const { container } = renderFr(<CountryLabel value="ES" city="Madrid" />);
    expect(container).toHaveTextContent("🇪🇸 Madrid, Espagne");
  });

  it("shows a legacy value as it is, without a flag", () => {
    const { container } = renderFr(<CountryLabel value="Argentina" city="Rosario" />);
    expect(container).toHaveTextContent(/^Rosario, Argentina$/);
  });

  it("renders the fallback when there is neither city nor country", () => {
    const { container } = renderFr(<CountryLabel value={null} fallback="—" />);
    expect(container).toHaveTextContent(/^—$/);
  });

  it("can show only the flag, keeping the name for screen readers", () => {
    renderFr(<CountryLabel value="AR" showName={false} />);
    expect(screen.getByLabelText("Argentine")).toHaveTextContent(/^🇦🇷$/);
  });

  it("falls back to the text when only the flag is asked for a legacy value", () => {
    const { container } = renderFr(<CountryLabel value="Argentina" showName={false} />);
    expect(container).toHaveTextContent(/^Argentina$/);
  });
});
