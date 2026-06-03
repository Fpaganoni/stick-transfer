import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SavedJobsStore {
  savedIds: string[];
  toggleSave: (id: string) => void;
  isSaved: (id: string) => boolean;
}

export const useSavedJobsStore = create<SavedJobsStore>()(
  persist(
    (set, get) => ({
      savedIds: [],
      toggleSave: (id) =>
        set((state) => ({
          savedIds: state.savedIds.includes(id)
            ? state.savedIds.filter((x) => x !== id)
            : [...state.savedIds, id],
        })),
      isSaved: (id) => get().savedIds.includes(id),
    }),
    { name: "saved-jobs" }
  )
);
