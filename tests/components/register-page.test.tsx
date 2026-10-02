import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegisterPage } from "@/components/pages/register-page";
import { renderWithProviders } from "../test-utils";

const { mockRegister, mockPush, mockLogin, mockRequest, uiState } = vi.hoisted(() => ({
  uiState: { registerInitialRole: null as string | null },
  mockRegister: vi.fn(),
  mockPush: vi.fn(),
  mockLogin: vi.fn(),
  mockRequest: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/hooks/useUsers", () => ({
  useUserRegister: () => ({ mutate: mockRegister, isPending: false }),
  useUpdateUser: () => ({ mutate: vi.fn() }),
}));

vi.mock("@/stores/useAuthStore", () => ({
  useAuthStore: () => ({ login: mockLogin }),
}));

vi.mock("@/stores/useUIStore", () => ({
  useUIStore: () => ({
    openLoginModal: vi.fn(),
    openRegisterModal: vi.fn(),
    closeRegisterModal: vi.fn(),
    registerInitialRole: uiState.registerInitialRole,
  }),
}));

vi.mock("@/lib/graphql-client", () => ({
  graphqlClient: { request: (...args: unknown[]) => mockRequest(...args) },
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

/** Walks steps 1 and 2 with valid data for the given role card. */
async function fillUntilStep3(user: ReturnType<typeof userEvent.setup>, roleCardId: string) {
  await user.click(screen.getByTestId(`role-card-${roleCardId}`));
  await user.click(screen.getByText("next"));

  await user.type(screen.getByLabelText("firstName"), "Ana");
  await user.type(screen.getByLabelText("lastName"), "Referee");
  await user.type(screen.getByLabelText("username"), "ana_ref");
  await user.type(screen.getByLabelText("email"), "ana@x.com");
  await user.type(screen.getByLabelText("password"), "Password1!");
  await user.type(screen.getByLabelText("confirmPassword"), "Password1!");
  await user.selectOptions(screen.getByLabelText("country"), "Spain");
  await user.click(screen.getByLabelText("termsAndConditions"));
  await user.click(screen.getByText("next"));
}

describe("RegisterPage", () => {
  beforeEach(() => {
    mockRegister.mockReset();
    mockPush.mockReset();
    mockLogin.mockReset();
    mockRequest.mockReset();
    uiState.registerInitialRole = null;
  });

  it("step 1 renders the role cards including umpire", () => {
    renderWithProviders(<RegisterPage />);

    const roleCards = [
      "role-card-player",
      "role-card-coach",
      "role-card-umpire",
      "role-card-clubAdmin",
    ];

    roleCards.forEach((testId) => {
      expect(screen.getByTestId(testId)).toBeDefined();
    });
  });

  it("step 1 shows next button", () => {
    renderWithProviders(<RegisterPage />);
    expect(screen.getByText("next")).toBeDefined();
  });

  it("step indicator renders on mount", () => {
    const { container } = renderWithProviders(<RegisterPage />);
    expect(container.firstChild).not.toBeNull();
  });

  describe("umpire flow", () => {
    it("step 3 asks for city and date of birth, not position or club data", async () => {
      const user = userEvent.setup();
      renderWithProviders(<RegisterPage />);

      await fillUntilStep3(user, "umpire");

      expect(await screen.findByLabelText("city")).toBeDefined();
      expect(screen.getByLabelText("dateOfBirth")).toBeDefined();
      expect(screen.queryByLabelText("preferredPosition")).toBeNull();
      expect(screen.queryByLabelText("clubName")).toBeNull();
    });

    it("requires a city before registering", async () => {
      const user = userEvent.setup();
      renderWithProviders(<RegisterPage />);

      await fillUntilStep3(user, "umpire");
      await user.click(await screen.findByText("createProfile"));

      expect(await screen.findByText("cityRequired")).toBeDefined();
      expect(mockRegister).not.toHaveBeenCalled();
    });

    it("registers with role UMPIRE and only the fields the backend accepts", async () => {
      const user = userEvent.setup();
      renderWithProviders(<RegisterPage />);

      await fillUntilStep3(user, "umpire");
      await user.type(await screen.findByLabelText("city"), "Madrid");
      await user.type(screen.getByLabelText("dateOfBirth"), "1990-05-20");
      await user.click(screen.getByText("createProfile"));

      await waitFor(() => expect(mockRegister).toHaveBeenCalledTimes(1));
      const variables = mockRegister.mock.calls[0][0];
      expect(variables).toMatchObject({
        email: "ana@x.com",
        name: "Ana Referee",
        username: "ana_ref",
        role: "UMPIRE",
        country: "Spain",
        city: "Madrid",
        dateOfBirth: "1990-05-20",
      });
      expect(variables).not.toHaveProperty("position");
      expect(variables).not.toHaveProperty("clubName");
    });

    it("sends the new umpire to the profile editor to fill in licence data", async () => {
      mockRegister.mockImplementation((_vars, opts) => opts.onSuccess());
      mockRequest.mockResolvedValue({ me: { id: "u1", role: "UMPIRE" } });
      const user = userEvent.setup();
      renderWithProviders(<RegisterPage />);

      await fillUntilStep3(user, "umpire");
      await user.type(await screen.findByLabelText("city"), "Madrid");
      await user.click(screen.getByText("createProfile"));

      await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/en/profile/edit"));
      expect(mockLogin).toHaveBeenCalledWith({ id: "u1", role: "UMPIRE" });
    });
  });

  describe("player flow (regression)", () => {
    it("still registers with position and sends players to opportunities", async () => {
      mockRegister.mockImplementation((_vars, opts) => opts.onSuccess());
      mockRequest.mockResolvedValue({ me: { id: "u2", role: "PLAYER" } });
      const user = userEvent.setup();
      renderWithProviders(<RegisterPage />);

      await fillUntilStep3(user, "player");
      await user.selectOptions(await screen.findByLabelText("preferredPosition"), "defender");
      await user.click(screen.getByText("createProfile"));

      await waitFor(() => expect(mockRegister).toHaveBeenCalledTimes(1));
      const variables = mockRegister.mock.calls[0][0];
      expect(variables).toMatchObject({ role: "PLAYER", position: "defender" });
      expect(variables).not.toHaveProperty("city");
      await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/en/opportunities"));
    });
  });
});

describe("RegisterPage with a preselected role", () => {
  beforeEach(() => {
    mockRegister.mockReset();
    uiState.registerInitialRole = null;
  });

  it("starts on step 1 when no role was preselected", () => {
    renderWithProviders(<RegisterPage />);

    expect(screen.getByTestId("role-card-umpire")).toBeDefined();
  });

  it("skips the role picker and goes straight to the basic data step", () => {
    uiState.registerInitialRole = "umpire";
    renderWithProviders(<RegisterPage />);

    expect(screen.queryByTestId("role-card-umpire")).toBeNull();
    expect(screen.getByLabelText("firstName")).toBeDefined();
  });

  it("goes on to the umpire step 3 and registers with role UMPIRE", async () => {
    uiState.registerInitialRole = "umpire";
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await user.type(screen.getByLabelText("firstName"), "Ana");
    await user.type(screen.getByLabelText("lastName"), "Referee");
    await user.type(screen.getByLabelText("username"), "ana_ref");
    await user.type(screen.getByLabelText("email"), "ana@x.com");
    await user.type(screen.getByLabelText("password"), "Password1!");
    await user.type(screen.getByLabelText("confirmPassword"), "Password1!");
    await user.selectOptions(screen.getByLabelText("country"), "Spain");
    await user.click(screen.getByLabelText("termsAndConditions"));
    await user.click(screen.getByText("next"));
    await user.type(await screen.findByLabelText("city"), "Madrid");
    await user.click(screen.getByText("createProfile"));

    await waitFor(() => expect(mockRegister).toHaveBeenCalledTimes(1));
    expect(mockRegister.mock.calls[0][0]).toMatchObject({ role: "UMPIRE", city: "Madrid" });
  });

  it("lets the visitor go back and pick another role", async () => {
    uiState.registerInitialRole = "umpire";
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await user.click(screen.getByText("back"));

    expect(screen.getByTestId("role-card-player")).toBeDefined();
  });

  it("ignores a preselected role that is not one of the cards", () => {
    uiState.registerInitialRole = "scout";
    renderWithProviders(<RegisterPage />);

    expect(screen.getByTestId("role-card-umpire")).toBeDefined();
  });
});
