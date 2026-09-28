/**
 * What: Unit tests for AdminGuard route protection.
 * Why: Verifies the three access outcomes — no session, wrong role, SUPERADMIN —
 *      redirect (or render) correctly. A regression here would expose /admin to
 *      unauthenticated or non-superadmin users.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { AdminGuard } from "@/components/admin/admin-guard";
import { Role } from "@/types/enums";
import { renderWithProviders } from "../test-utils";

const { mockReplace, authState } = vi.hoisted(() => ({
  mockReplace: vi.fn(),
  authState: { isLoggedIn: false, user: null as { role: string } | null },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: vi.fn(), back: vi.fn() }),
  usePathname: () => "/en/admin",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

vi.mock("@/stores/useAuthStore", () => ({
  useAuthStore: (selector?: (state: typeof authState) => unknown) =>
    selector ? selector(authState) : authState,
}));

vi.mock("@/lib/graphql-client", () => ({
  graphqlClient: {
    request: vi.fn(() =>
      Promise.resolve({ me: { role: authState.user?.role } })
    ),
  },
}));

describe("AdminGuard", () => {
  beforeEach(() => {
    mockReplace.mockClear();
    authState.isLoggedIn = false;
    authState.user = null;
  });

  it("redirects to locale home when there is no session", async () => {
    renderWithProviders(
      <AdminGuard>
        <div>secret content</div>
      </AdminGuard>
    );

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/"));
    expect(screen.queryByText("secret content")).not.toBeInTheDocument();
  });

  it("redirects to /opportunities when logged in but not SUPERADMIN", async () => {
    authState.isLoggedIn = true;
    authState.user = { role: Role.PLAYER };

    renderWithProviders(
      <AdminGuard>
        <div>secret content</div>
      </AdminGuard>
    );

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/opportunities"));
    expect(screen.queryByText("secret content")).not.toBeInTheDocument();
  });

  it("renders children for a SUPERADMIN session", async () => {
    authState.isLoggedIn = true;
    authState.user = { role: Role.SUPERADMIN };

    renderWithProviders(
      <AdminGuard>
        <div>secret content</div>
      </AdminGuard>
    );

    await waitFor(() => expect(screen.getByText("secret content")).toBeInTheDocument());
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
