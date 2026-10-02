import { create } from "zustand";

interface UIState {
  isLoginOpen: boolean;
  isRegisterOpen: boolean;
  /** Register role card to preselect (e.g. "umpire"); set by landing CTAs. */
  registerInitialRole: string | null;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  // Several callers pass this straight to onClick, so the argument may be a
  // click event; only a string is treated as a role.
  openRegisterModal: (initialRole?: unknown) => void;
  closeRegisterModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isLoginOpen: false,
  isRegisterOpen: false,
  registerInitialRole: null,
  openLoginModal: () =>
    set({ isLoginOpen: true, isRegisterOpen: false, registerInitialRole: null }),
  closeLoginModal: () => set({ isLoginOpen: false }),
  openRegisterModal: (initialRole) =>
    set({
      isRegisterOpen: true,
      isLoginOpen: false,
      registerInitialRole: typeof initialRole === "string" ? initialRole : null,
    }),
  closeRegisterModal: () => set({ isRegisterOpen: false, registerInitialRole: null }),
}));
