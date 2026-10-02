/**
 * What: Tests for the landing RoleTabsSection call to action.
 * Why: The umpires tab promises an officiating profile; its button must open
 *      registration with the umpire role already chosen instead of dropping the
 *      visitor on a blank role picker. Other tabs map to their own roles.
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RoleTabsSection } from "@/components/landing/role-tabs-section";

const { mockOpenRegister } = vi.hoisted(() => ({ mockOpenRegister: vi.fn() }));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt ?? ""} />
  ),
}));

vi.mock("@/stores/useUIStore", () => ({
  useUIStore: () => ({ openRegisterModal: mockOpenRegister }),
}));

vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get:
        (_target, prop) =>
        ({ children, ...rest }: Record<string, unknown> & { children?: React.ReactNode }) => {
          const domProps = Object.fromEntries(
            Object.entries(rest).filter(
              ([key]) =>
                !/^(animate|initial|exit|transition|whileHover|whileTap|whileInView|viewport|layoutId)$/.test(key),
            ),
          );
          return React.createElement(prop as string, domProps, children as React.ReactNode);
        },
    },
  ),
  useScroll: () => ({ scrollYProgress: { on: () => () => undefined, get: () => 0 } }),
}));

beforeEach(() => {
  mockOpenRegister.mockReset();
  // Mobile layout: tabs are clickable and not driven by scroll
  window.matchMedia = vi.fn().mockReturnValue({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }) as unknown as typeof window.matchMedia;
});

describe("RoleTabsSection call to action", () => {
  it("opens registration for players by default", async () => {
    const user = userEvent.setup();
    render(<RoleTabsSection />);

    await user.click(screen.getByRole("button", { name: "cta" }));

    expect(mockOpenRegister).toHaveBeenCalledWith("player");
  });

  it("opens registration with the umpire role on the umpires tab", async () => {
    const user = userEvent.setup();
    render(<RoleTabsSection />);

    await user.click(screen.getByText("umpires.tab"));
    await user.click(screen.getByRole("button", { name: "cta" }));

    expect(mockOpenRegister).toHaveBeenCalledWith("umpire");
  });

  it.each([
    ["coaches.tab", "coach"],
    ["clubs.tab", "clubAdmin"],
  ])("maps the %s tab to the %s register role", async (tab, role) => {
    const user = userEvent.setup();
    render(<RoleTabsSection />);

    await user.click(screen.getByText(tab));
    await user.click(screen.getByRole("button", { name: "cta" }));

    expect(mockOpenRegister).toHaveBeenCalledWith(role);
  });
});
