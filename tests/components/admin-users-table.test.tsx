/**
 * What: Tests for AdminUsersTable role presentation.
 * Why: An admin verifies umpires by their licence, so the row must show the
 *      licence level, certifying body and licence number (admins are allowed
 *      to see it), while other roles keep their plain row.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminUsersTable } from "@/components/admin/users/admin-users-table";
import type { AdminUserRow } from "@/types/models/admin";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/components/admin/users/admin-user-row-actions", () => ({
  AdminUserRowActions: () => null,
}));

const base: AdminUserRow = {
  id: "u1",
  name: "Javier García",
  username: "umpire_garcia",
  email: "garcia@test.com",
  role: "UMPIRE",
  isActive: true,
  isVerified: true,
  isEmailVerified: true,
  createdAt: "2026-01-01T00:00:00.000Z",
};

const umpire: AdminUserRow = {
  ...base,
  licenseLevel: "INTERNACIONAL",
  certifyingBody: "Real Federación Española de Hockey",
  licenseNumber: "RFEH-001",
};

const player: AdminUserRow = {
  ...base,
  id: "u2",
  name: "Ana Player",
  username: "ana",
  role: "PLAYER",
};

describe("AdminUsersTable umpires", () => {
  it("shows the role badge", () => {
    render(<AdminUsersTable users={[umpire]} />);

    expect(screen.getByText("UMPIRE")).toBeInTheDocument();
  });

  it("shows licence level, certifying body and licence number", () => {
    render(<AdminUsersTable users={[umpire]} />);

    expect(screen.getByText("licenseLevels.INTERNACIONAL")).toBeInTheDocument();
    expect(screen.getByText("Real Federación Española de Hockey")).toBeInTheDocument();
    expect(screen.getByText(/RFEH-001/)).toBeInTheDocument();
  });

  it("copes with an umpire who has not filled in licence data", () => {
    const { container } = render(<AdminUsersTable users={[base]} />);

    expect(screen.getByText("UMPIRE")).toBeInTheDocument();
    expect(screen.queryByText(/licenseLevels\./)).not.toBeInTheDocument();
    expect(container.textContent).not.toMatch(/null|undefined/);
  });

  it("shows only the licence data that exists", () => {
    render(<AdminUsersTable users={[{ ...base, licenseLevel: "REGIONAL" }]} />);

    expect(screen.getByText("licenseLevels.REGIONAL")).toBeInTheDocument();
    expect(screen.queryByText(/RFEH/)).not.toBeInTheDocument();
  });

  it("keeps other roles' rows free of licence information", () => {
    render(<AdminUsersTable users={[player]} />);

    expect(screen.getByText("PLAYER")).toBeInTheDocument();
    expect(screen.queryByText(/licenseLevels\./)).not.toBeInTheDocument();
  });

  it("renders umpires and other roles side by side", () => {
    render(<AdminUsersTable users={[umpire, player]} />);

    expect(screen.getByText("Javier García")).toBeInTheDocument();
    expect(screen.getByText("Ana Player")).toBeInTheDocument();
    expect(screen.getAllByText(/licenseLevels\./)).toHaveLength(1);
  });
});
