/**
 * What: Tests for AdminUserRowActions role changes involving UMPIRE.
 * Why: adminChangeUserRole is strict about the enum value, and promoting a
 *      user to UMPIRE leaves them with an empty licence profile. The admin must
 *      be able to pick UMPIRE, be told what happens next, and the mutation must
 *      carry exactly Role.UMPIRE.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminUserRowActions } from "@/components/admin/users/admin-user-row-actions";
import type { AdminUserRow } from "@/types/models/admin";

const { mockChangeRole, mockSetVerified } = vi.hoisted(() => ({
  mockChangeRole: vi.fn(),
  mockSetVerified: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/hooks/useAdminUsers", () => ({
  useAdminChangeUserRole: () => ({ mutate: mockChangeRole }),
  useAdminSetUserActive: () => ({ mutate: vi.fn() }),
  useAdminSetUserVerified: () => ({ mutate: mockSetVerified }),
}));

const player: AdminUserRow = {
  id: "u1",
  name: "Ana Player",
  username: "ana",
  email: "ana@test.com",
  role: "PLAYER",
  isActive: true,
  isVerified: false,
  isEmailVerified: true,
  createdAt: "2026-01-01T00:00:00.000Z",
};

async function openRoleDialog(user: ReturnType<typeof userEvent.setup>, row: AdminUserRow) {
  render(<AdminUserRowActions user={row} />);
  await user.click(screen.getByRole("button", { name: "openMenu" }));
  await user.click(await screen.findByText("changeRole"));
  return screen.findByRole("alertdialog");
}

async function openOptions(user: ReturnType<typeof userEvent.setup>, dialog: HTMLElement) {
  await user.click(within(dialog).getByRole("combobox"));
}

describe("AdminUserRowActions role change", () => {
  beforeEach(() => {
    mockChangeRole.mockReset();
    mockSetVerified.mockReset();
  });

  it("offers UMPIRE next to the other roles", async () => {
    const user = userEvent.setup();
    const dialog = await openRoleDialog(user, player);
    await openOptions(user, dialog);

    for (const role of ["PLAYER", "COACH", "CLUB", "UMPIRE", "SUPERADMIN"]) {
      expect(await screen.findByRole("option", { name: role })).toBeInTheDocument();
    }
  });

  it("does not let an umpire be 'changed' to UMPIRE", async () => {
    const user = userEvent.setup();
    const dialog = await openRoleDialog(user, { ...player, role: "UMPIRE" });
    await openOptions(user, dialog);

    expect(await screen.findByRole("option", { name: "UMPIRE" })).toHaveAttribute("aria-disabled", "true");
  });

  it("sends exactly Role.UMPIRE to the mutation", async () => {
    const user = userEvent.setup();
    const dialog = await openRoleDialog(user, player);
    await openOptions(user, dialog);
    await user.click(await screen.findByRole("option", { name: "UMPIRE" }));
    await user.click(within(dialog).getByRole("button", { name: "confirmRoleChange" }));

    expect(mockChangeRole).toHaveBeenCalledWith({ userId: "u1", role: "UMPIRE" });
  });

  it("tells the admin the user must complete licence data when promoting to UMPIRE", async () => {
    const user = userEvent.setup();
    const dialog = await openRoleDialog(user, player);
    expect(within(dialog).queryByText("changeRoleUmpireNote")).not.toBeInTheDocument();

    await openOptions(user, dialog);
    await user.click(await screen.findByRole("option", { name: "UMPIRE" }));

    expect(within(dialog).getByText("changeRoleUmpireNote")).toBeInTheDocument();
  });

  it("shows no umpire note for other target roles", async () => {
    const user = userEvent.setup();
    const dialog = await openRoleDialog(user, player);
    await openOptions(user, dialog);
    await user.click(await screen.findByRole("option", { name: "COACH" }));

    expect(within(dialog).queryByText("changeRoleUmpireNote")).not.toBeInTheDocument();
  });

  it("keeps the confirm button disabled until a role is chosen", async () => {
    const user = userEvent.setup();
    const dialog = await openRoleDialog(user, player);

    expect(within(dialog).getByRole("button", { name: "confirmRoleChange" })).toBeDisabled();
  });
});

describe("AdminUserRowActions verification", () => {
  beforeEach(() => mockSetVerified.mockReset());

  it("verifies an umpire through the existing verify action", async () => {
    const user = userEvent.setup();
    render(<AdminUserRowActions user={{ ...player, role: "UMPIRE" }} />);

    await user.click(screen.getByRole("button", { name: "openMenu" }));
    await user.click(await screen.findByText("verify"));
    await user.click(await screen.findByRole("button", { name: "confirm" }));

    expect(mockSetVerified).toHaveBeenCalledWith({ userId: "u1", verified: true });
  });
});
