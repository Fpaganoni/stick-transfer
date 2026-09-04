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
  login: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
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

      login: async (user: User, token: string) => {
        if (typeof window !== "undefined") {
          // Must be awaited: the proxy gates protected routes (e.g.
          // /opportunities) on this cookie. Pushing to a protected route
          // before it lands races the middleware and bounces back to "/".
          await fetch("/api/auth/session", { method: "POST" }).catch(() => {});
        }
        set({ user, token, isLoggedIn: true });
      },

      logout: async () => {
        if (typeof window !== "undefined") {
          await fetch("/api/auth/session", { method: "DELETE" }).catch(() => {});
        }
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
