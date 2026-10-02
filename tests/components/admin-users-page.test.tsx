/**
 * What: Tests for the admin users page role filter.
 * Why: Admins need to list umpires on their own, so UMPIRE must be a role
 *      filter option and be forwarded to the (client-side) filtering hook.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminUsersPage from "@/app/[locale]/admin/users/page";

const { mockUseAdminUsers } = vi.hoisted(() => ({ mockUseAdminUsers: vi.fn() }));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

vi.mock("@/hooks/useAdminUsers", () => ({
  useAdminUsers: (...args: unknown[]) => {
    mockUseAdminUsers(...args);
    return { data: { adminUsers: { items: [], total: 0, hasMore: false } }, isLoading: false };
  },
}));

vi.mock("@/components/admin/users/admin-users-table", () => ({
  AdminUsersTable: () => null,
}));
vi.mock("@/components/admin/admin-pagination", () => ({
  AdminPagination: () => null,
}));

const lastFilters = () =>
  mockUseAdminUsers.mock.calls[mockUseAdminUsers.mock.calls.length - 1][0];

describe("AdminUsersPage role filter", () => {
  beforeEach(() => mockUseAdminUsers.mockClear());

  it("offers UMPIRE alongside the other roles", async () => {
    const user = userEvent.setup();
    render(<AdminUsersPage />);

    await user.click(screen.getAllByRole("combobox")[0]);

    for (const role of ["PLAYER", "COACH", "CLUB", "UMPIRE", "SUPERADMIN"]) {
      expect(await screen.findByRole("option", { name: role })).toBeInTheDocument();
    }
  });

  it("filters by UMPIRE", async () => {
    const user = userEvent.setup();
    render(<AdminUsersPage />);

    await user.click(screen.getAllByRole("combobox")[0]);
    await user.click(await screen.findByRole("option", { name: "UMPIRE" }));

    expect(lastFilters()).toMatchObject({ role: "UMPIRE" });
  });

  it("starts without a role filter", () => {
    render(<AdminUsersPage />);

    expect(lastFilters().role).toBeUndefined();
  });
});
