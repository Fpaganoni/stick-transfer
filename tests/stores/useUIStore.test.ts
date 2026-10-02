/**
 * What: Tests for the register modal role preselection in useUIStore.
 * Why: Landing CTAs open the register modal for a specific role (e.g. umpire).
 *      Several callers still pass `openRegisterModal` straight to onClick, so
 *      it receives a click event; that must never be mistaken for a role.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "@/stores/useUIStore";

const reset = () =>
  useUIStore.setState({
    isLoginOpen: false,
    isRegisterOpen: false,
    registerInitialRole: null,
  });

describe("useUIStore register modal", () => {
  beforeEach(reset);

  it("opens without a preselected role", () => {
    useUIStore.getState().openRegisterModal();

    const state = useUIStore.getState();
    expect(state.isRegisterOpen).toBe(true);
    expect(state.registerInitialRole).toBeNull();
  });

  it("opens with a preselected role", () => {
    useUIStore.getState().openRegisterModal("umpire");

    const state = useUIStore.getState();
    expect(state.isRegisterOpen).toBe(true);
    expect(state.registerInitialRole).toBe("umpire");
  });

  it("ignores a click event passed as the first argument", () => {
    const openFromOnClick = useUIStore.getState().openRegisterModal as (arg: unknown) => void;
    openFromOnClick({ type: "click", target: {} });

    const state = useUIStore.getState();
    expect(state.isRegisterOpen).toBe(true);
    expect(state.registerInitialRole).toBeNull();
  });

  it("replaces a previous preselection", () => {
    const { openRegisterModal, closeRegisterModal } = useUIStore.getState();
    openRegisterModal("umpire");
    closeRegisterModal();
    openRegisterModal("coach");

    expect(useUIStore.getState().registerInitialRole).toBe("coach");
  });

  it("forgets the preselection when the modal closes", () => {
    const { openRegisterModal, closeRegisterModal } = useUIStore.getState();
    openRegisterModal("umpire");

    closeRegisterModal();

    const state = useUIStore.getState();
    expect(state.isRegisterOpen).toBe(false);
    expect(state.registerInitialRole).toBeNull();
  });

  it("forgets the preselection when switching to login", () => {
    const { openRegisterModal, openLoginModal } = useUIStore.getState();
    openRegisterModal("umpire");

    openLoginModal();

    const state = useUIStore.getState();
    expect(state.isLoginOpen).toBe(true);
    expect(state.isRegisterOpen).toBe(false);
    expect(state.registerInitialRole).toBeNull();
  });

  it("closes login when opening register", () => {
    useUIStore.getState().openLoginModal();
    useUIStore.getState().openRegisterModal("player");

    expect(useUIStore.getState().isLoginOpen).toBe(false);
  });
});
