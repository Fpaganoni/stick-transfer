import { create } from "zustand";

interface UIState {
  isLoginOpen: boolean;
  isRegisterOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  openRegisterModal: () => void;
  closeRegisterModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isLoginOpen: false,
  isRegisterOpen: false,
  openLoginModal: () => set({ isLoginOpen: true, isRegisterOpen: false }),
  closeLoginModal: () => set({ isLoginOpen: false }),
  openRegisterModal: () => set({ isRegisterOpen: true, isLoginOpen: false }),
  closeRegisterModal: () => set({ isRegisterOpen: false }),
}));
