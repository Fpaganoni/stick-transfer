import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RegisterPage } from "@/components/pages/register-page";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/hooks/useUsers", () => ({
  useUserRegister: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateUser: () => ({ mutate: vi.fn() }),
}));

vi.mock("@/stores/useAuthStore", () => ({
  useAuthStore: () => ({ login: vi.fn() }),
}));

vi.mock("@/stores/useUIStore", () => ({
  useUIStore: () => ({
    openLoginModal: vi.fn(),
    openRegisterModal: vi.fn(),
  }),
}));

vi.mock("@/lib/graphql-client", () => ({
  graphqlClient: { request: vi.fn() },
  setAuthToken: vi.fn(),
}));

vi.mock("jwt-decode", () => ({
  jwtDecode: () => ({ sub: "test-user-id" }),
}));

vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get: (_target, prop) =>
        ({ children, ...rest }: React.HTMLAttributes<HTMLElement>) =>
          React.createElement(
            prop as keyof React.JSX.IntrinsicElements,
            rest,
            children,
          ),
    },
  ),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

describe("RegisterPage", () => {
  it("step 1 renders 6 role cards", () => {
    render(<RegisterPage />);

    const roleCards = [
      "role-card-player",
      "role-card-goalkeeper",
      "role-card-coach",
      "role-card-clubAdmin",
      "role-card-scout",
      "role-card-agent",
    ];

    roleCards.forEach((testId) => {
      expect(screen.getByTestId(testId)).toBeDefined();
    });
  });

  it("step 1 shows next button", () => {
    render(<RegisterPage />);
    expect(screen.getByText("next")).toBeDefined();
  });

  it("step indicator renders on mount", () => {
    const { container } = render(<RegisterPage />);
    expect(container.firstChild).not.toBeNull();
  });
});
