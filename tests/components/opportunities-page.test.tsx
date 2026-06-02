/**
 * What: Integration tests for OpportunitiesPage component.
 * Why: OpportunitiesPage is a layout container with sidebar + auth-aware state.
 *      Tests verify the main content area and sidebar render without errors.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { OpportunitiesPage } from "@/components/pages/opportunities-page";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

vi.mock("@/components/opportunities/job-opportunities", () => ({
  JobOpportunities: () => <div data-testid="job-list">Job List</div>,
}));

vi.mock("@/hooks/useJobOpportunities", () => ({
  useJobOpportunities: () => ({
    data: { jobOpportunities: [] },
    isLoading: false,
    isError: false,
    error: null,
  }),
}));

vi.mock("@/stores/useAuthStore", () => ({
  useAuthStore: () => ({ isLoggedIn: false, user: null }),
}));

vi.mock("@/stores/useUIStore", () => ({
  useUIStore: () => ({
    openRegisterModal: vi.fn(),
    isLoginOpen: false,
    isRegisterOpen: false,
    openLoginModal: vi.fn(),
    closeLoginModal: vi.fn(),
    closeRegisterModal: vi.fn(),
  }),
}));

vi.mock("@/components/pages/login-page", () => ({
  LoginPage: () => <div>Login</div>,
}));

vi.mock("@/components/pages/register-page", () => ({
  RegisterPage: () => <div>Register</div>,
}));

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt ?? ""} />
  ),
}));

describe("OpportunitiesPage", () => {
  it("renders without errors", () => {
    const { container } = render(<OpportunitiesPage />);
    expect(container.firstChild).not.toBeNull();
  });

  it("renders the job list", () => {
    render(<OpportunitiesPage />);
    expect(screen.getByTestId("job-list")).toBeInTheDocument();
  });

  it("shows visitor state when not authenticated", () => {
    render(<OpportunitiesPage />);
    expect(screen.getByText("visitor")).toBeInTheDocument();
  });
});
