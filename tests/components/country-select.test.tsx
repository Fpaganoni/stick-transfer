/**
 * What: Component tests for CountrySelect (searchable country combobox).
 * Why: Register, profile edit, job creation and the job/explore filters all
 *      pick countries here. It must send ISO codes (the API answers anything
 *      else with COUNTRY_INVALID), name them in the active language, keep the
 *      hockey countries on top and be usable from the keyboard.
 */
import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import es from "@/messages/es.json";
import { CountrySelect, type CountrySelectProps } from "@/components/ui/country-select";

type HarnessProps = Partial<CountrySelectProps> & { initial?: string | null };

function Harness({ initial = null, onChange = vi.fn(), ...props }: HarnessProps) {
  const [value, setValue] = useState<string | null>(initial);
  return (
    <NextIntlClientProvider locale="es" messages={es}>
      <label htmlFor="country">País</label>
      <CountrySelect
        id="country"
        value={value}
        onChange={(code) => {
          setValue(code);
          onChange(code);
        }}
        {...props}
      />
    </NextIntlClientProvider>
  );
}

const trigger = () => screen.getByRole("combobox", { name: "País" });
const optionNames = () =>
  within(screen.getByRole("listbox")).getAllByRole("option").map((o) => o.textContent?.trim());

describe("CountrySelect", () => {
  describe("trigger", () => {
    it("shows the placeholder when no country is set", () => {
      render(<Harness />);
      expect(trigger()).toHaveTextContent("Selecciona un país");
    });

    it("shows the flag and the translated name of the selected code, in any case", () => {
      render(<Harness initial="fr" />);
      expect(trigger()).toHaveTextContent("🇫🇷");
      expect(trigger()).toHaveTextContent("Francia");
    });

    it("shows a legacy value that is not a known code as it is", () => {
      render(<Harness initial="Argentina " />);
      expect(trigger()).toHaveTextContent(/^Argentina$/);
    });
  });

  describe("list", () => {
    it("lists the 28 hockey countries first, then the rest, by translated name", async () => {
      const user = userEvent.setup();
      render(<Harness />);

      await user.click(trigger());

      const names = optionNames();
      expect(names).toHaveLength(252);
      expect(names[0]).toContain("Alemania");
      expect(names.slice(0, 28).join()).toContain("Inglaterra");
      expect(names[28]).toContain("Afganistán");
      expect(screen.getByText("Países de hockey")).toBeInTheDocument();
      expect(screen.getByText("Otros países")).toBeInTheDocument();
    });

    it("only offers the given options when a list is passed", async () => {
      const user = userEvent.setup();
      render(<Harness options={["FR", "ES", "AR"]} />);

      await user.click(trigger());

      expect(optionNames()).toEqual(["🇦🇷Argentina", "🇪🇸España", "🇫🇷Francia"]);
    });
  });

  describe("search", () => {
    it("filters by name ignoring accents and case", async () => {
      const user = userEvent.setup();
      render(<Harness />);

      await user.click(trigger());
      await user.type(screen.getByPlaceholderText("Buscar país..."), "ESPANA");

      expect(optionNames()).toEqual(["🇪🇸España"]);
    });

    it("finds a country by its code", async () => {
      const user = userEvent.setup();
      render(<Harness />);

      await user.click(trigger());
      await user.type(screen.getByPlaceholderText("Buscar país..."), "gb-sct");

      expect(optionNames()).toHaveLength(1);
      expect(optionNames()[0]).toContain("Escocia");
    });

    it("tells the user when nothing matches", async () => {
      const user = userEvent.setup();
      render(<Harness />);

      await user.click(trigger());
      await user.type(screen.getByPlaceholderText("Buscar país..."), "zzzz");

      expect(screen.getByText("No se encontró ningún país")).toBeInTheDocument();
    });
  });

  describe("keyboard", () => {
    it("opens with Enter, moves with the arrows and selects the code with Enter", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<Harness onChange={onChange} />);

      trigger().focus();
      await user.keyboard("{Enter}");
      await user.keyboard("arg");
      // Argentina (hockey country) first, then Argelia
      await user.keyboard("{ArrowDown}{Enter}");

      expect(onChange).toHaveBeenCalledWith("DZ");
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
      expect(trigger()).toHaveTextContent("Argelia");
      expect(trigger()).toHaveFocus();
    });

    it("closes with Escape and keeps the value", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<Harness initial="AR" onChange={onChange} />);

      await user.click(trigger());
      await user.keyboard("{Escape}");

      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
      expect(onChange).not.toHaveBeenCalled();
      expect(trigger()).toHaveTextContent("Argentina");
    });
  });

  describe("filter mode", () => {
    it("offers an 'all countries' option first that clears the value", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<Harness initial="AR" allLabel="Todos los países" onChange={onChange} options={["AR", "ES"]} />);

      await user.click(trigger());
      expect(optionNames()[0]).toBe("Todos los países");
      await user.click(screen.getByRole("option", { name: "Todos los países" }));

      expect(onChange).toHaveBeenCalledWith(null);
      expect(trigger()).toHaveTextContent("Todos los países");
    });

    it("hides the 'all countries' option while searching", async () => {
      const user = userEvent.setup();
      render(<Harness allLabel="Todos los países" options={["AR", "ES"]} />);

      await user.click(trigger());
      await user.type(screen.getByPlaceholderText("Buscar país..."), "es");

      expect(optionNames()).toEqual(["🇪🇸España"]);
    });
  });
});
