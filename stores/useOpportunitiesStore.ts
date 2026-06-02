import { create } from "zustand";
import { JobOpportunity } from "@/types/models/job-opportunity";

interface OpportunitiesStore {
  selectedOpportunity: JobOpportunity | null;
  isModalOpen: boolean;
  searchQuery: string;
  filters: {
    level: string | null;
    status: string | null;
    country: string | null;
    positionType: string | null;
  };

  setSelectedOpportunity: (opportunity: JobOpportunity | null) => void;
  setIsModalOpen: (isOpen: boolean) => void;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Partial<OpportunitiesStore["filters"]>) => void;
  resetFilters: () => void;
  closeModal: () => void;
}

export const useOpportunitiesStore = create<OpportunitiesStore>((set) => ({
  selectedOpportunity: null,
  isModalOpen: false,
  searchQuery: "",
  filters: {
    level: null,
    status: null,
    country: null,
    positionType: null,
  },

  setSelectedOpportunity: (opportunity) =>
    set({ selectedOpportunity: opportunity }),
  setIsModalOpen: (isOpen) => set({ isModalOpen: isOpen }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),
  resetFilters: () =>
    set({
      searchQuery: "",
      filters: {
        level: null,
        status: null,
        country: null,
        positionType: null,
      },
    }),
  closeModal: () => set({ isModalOpen: false, selectedOpportunity: null }),
}));
