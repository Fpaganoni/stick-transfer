import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/types/models/user";

type UpdateUserInput = Partial<User>;

interface AuthState {
  // STATES
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;

  // ACTIONS
  login: (user: User, token: string) => void;
  logout: () => void;
  register: (user: User, token: string) => void;
  updateUser: (data: UpdateUserInput) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // INITIAL STATE
      user: null,
      token: null,
      isLoggedIn: false,

      //ACTIONS

      login: (user: User, token: string) => {
        set({ user, token, isLoggedIn: true });
      },

      logout: () => {
        set({ user: null, token: null, isLoggedIn: false });
      },

      register: (user: User, token: string) => {
        // El registro guarda el usuario pero NO inicia sesión automáticamente.
        // La página de registro llama a login() explícitamente tras verificar el token.
        set({ user, token, isLoggedIn: false });
      },

      updateUser: (data: UpdateUserInput) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        }));
      },
    }),
    {
      name: "auth-storage",
    },
  ),
);
