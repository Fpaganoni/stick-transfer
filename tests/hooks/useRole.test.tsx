/**
 * What: Unit tests for useRole.
 * Why: Every role-gated button/route in the app (contact, post job, admin nav)
 *      reads its role from this hook, which wraps the live `me` query. A wrong
 *      boolean here would silently show or hide the wrong actions for a role.
 */
import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useRole } from "@/hooks/useRole";
import { Role } from "@/types/enums";

const { mockUseMe } = vi.hoisted(() => ({
  mockUseMe: vi.fn(),
}));

vi.mock("@/hooks/useUsers", () => ({
  useMe: () => mockUseMe(),
}));

describe("useRole", () => {
  it("exposes isClub=true and the other role flags false for a CLUB user", () => {
    mockUseMe.mockReturnValue({ data: { me: { role: Role.CLUB } }, isLoading: false });

    const { result } = renderHook(() => useRole());

    expect(result.current.role).toBe(Role.CLUB);
    expect(result.current.isClub).toBe(true);
    expect(result.current.isPlayer).toBe(false);
    expect(result.current.isCoach).toBe(false);
    expect(result.current.isSuperAdmin).toBe(false);
  });

  it("exposes isPlayer=true for a PLAYER user", () => {
    mockUseMe.mockReturnValue({ data: { me: { role: Role.PLAYER } }, isLoading: false });

    const { result } = renderHook(() => useRole());

    expect(result.current.isPlayer).toBe(true);
    expect(result.current.isClub).toBe(false);
  });

  it("exposes isUmpire=true and the other role flags false for an UMPIRE user", () => {
    mockUseMe.mockReturnValue({ data: { me: { role: Role.UMPIRE } }, isLoading: false });

    const { result } = renderHook(() => useRole());

    expect(result.current.role).toBe(Role.UMPIRE);
    expect(result.current.isUmpire).toBe(true);
    expect(result.current.isPlayer).toBe(false);
    expect(result.current.isCoach).toBe(false);
    expect(result.current.isClub).toBe(false);
    expect(result.current.isSuperAdmin).toBe(false);
    expect(result.current.hasRole([Role.UMPIRE])).toBe(true);
  });

  it("returns all flags false and role undefined when logged out", () => {
    mockUseMe.mockReturnValue({ data: undefined, isLoading: false });

    const { result } = renderHook(() => useRole());

    expect(result.current.role).toBeUndefined();
    expect(result.current.isPlayer).toBe(false);
    expect(result.current.isCoach).toBe(false);
    expect(result.current.isClub).toBe(false);
    expect(result.current.isUmpire).toBe(false);
    expect(result.current.isSuperAdmin).toBe(false);
    expect(result.current.hasRole([Role.CLUB, Role.SUPERADMIN])).toBe(false);
  });

  it("hasRole checks membership in the given list", () => {
    mockUseMe.mockReturnValue({ data: { me: { role: Role.SUPERADMIN } }, isLoading: false });

    const { result } = renderHook(() => useRole());

    expect(result.current.hasRole([Role.CLUB, Role.SUPERADMIN])).toBe(true);
    expect(result.current.hasRole([Role.PLAYER, Role.COACH])).toBe(false);
  });

  it("forwards isLoading from useMe", () => {
    mockUseMe.mockReturnValue({ data: undefined, isLoading: true });

    const { result } = renderHook(() => useRole());

    expect(result.current.isLoading).toBe(true);
  });
});
