/**
 * What: Tests for useUpdateClub.
 * Why: Saving the club changes what the whole app shows for the account: the
 *      session (name, crest), the club page, the lists of clubs and every
 *      vacancy that carries the club name and crest. The caches must refresh.
 */
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useUpdateClub } from "@/hooks/useClubs";
import { graphqlClient } from "@/lib/graphql-client";
import { UPDATE_CLUB } from "@/graphql";

vi.mock("@/lib/graphql-client");

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

describe("useUpdateClub", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(graphqlClient).request = vi
      .fn()
      .mockResolvedValue({ updateClub: { id: "club-1", name: "HC Barcelona" } });
  });

  it("sends the variables untouched in one request", async () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useUpdateClub(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: "club-1", name: "HC Barcelona", logo: "" });
    });

    expect(graphqlClient.request).toHaveBeenCalledTimes(1);
    expect(graphqlClient.request).toHaveBeenCalledWith(UPDATE_CLUB, {
      id: "club-1",
      name: "HC Barcelona",
      logo: "",
    });
  });

  it("refreshes the club, the lists, the session and the vacancies", async () => {
    const { queryClient, wrapper } = setup();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useUpdateClub(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: "club-1", name: "HC Barcelona" });
    });

    await waitFor(() => {
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ["club", "club-1"] });
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ["clubs"] });
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ["me"] });
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ["jobOpportunities"] });
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ["user"] });
    });
  });

  it("refreshes nothing when the backend refuses", async () => {
    vi.mocked(graphqlClient).request = vi.fn().mockRejectedValue(new Error("boom"));
    const { queryClient, wrapper } = setup();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useUpdateClub(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: "club-1", name: "x" }).catch(() => {});
    });

    expect(invalidate).not.toHaveBeenCalled();
  });
});
