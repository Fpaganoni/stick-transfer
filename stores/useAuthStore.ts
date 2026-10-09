import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/types/models/user";
import { getRegisteredQueryClient } from "@/lib/query-client-registry";

type UpdateUserInput = Partial<User>;

interface AuthState {
  // STATES
  user: User | null;
  isLoggedIn: boolean;

  // ACTIONS
  login: (user: User) => Promise<void>;
  /**
   * Resets this store and its persisted entry only. To end a session use
   * clearClientSession (lib/session.ts), which also calls the server and wipes
   * the query cache and the other user stores.
   */
  logout: () => void;
  register: (user: User) => void;
  updateUser: (data: UpdateUserInput) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // INITIAL STATE
      user: null,
      isLoggedIn: false,

      //ACTIONS

      login: async (user: User) => {
        // Whatever is cached belongs to someone else: another account that was
        // never logged out, or a visitor whose per-user fields (e.g. saved
        // flags) are all false. Cancel first so a request of the old identity
        // cannot land in the cache after it is cleared.
        if (get().user?.id !== user.id) {
          const queryClient = getRegisteredQueryClient();
          await queryClient?.cancelQueries();
          queryClient?.clear();
        }

        if (typeof window !== "undefined") {
          // Must be awaited: the proxy gates protected routes (e.g.
          // /opportunities) on this cookie. Pushing to a protected route
          // before it lands races the middleware and bounces back to "/".
          await fetch("/api/auth/session", { method: "POST" }).catch(() => {});
        }
        set({ user, isLoggedIn: true });
      },

      logout: () => {
        set({ user: null, isLoggedIn: false });
        // set() just wrote the empty state back to localStorage; drop the entry itself.
        useAuthStore.persist.clearStorage();
      },

      register: (user: User) => {
        // El registro guarda el usuario pero NO inicia sesión automáticamente.
        // La página de registro llama a login() explícitamente tras verificar el token.
        set({ user, isLoggedIn: false });
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
