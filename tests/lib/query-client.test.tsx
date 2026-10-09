/**
 * What: Tests for QueryProvider.
 * Why: Code outside React (the UNAUTHENTICATED interceptor, the auth store)
 *      clears the cache through the registry, so the registered client must be
 *      the very one the app renders with.
 */
import { render } from "@testing-library/react";
import { useQueryClient } from "@tanstack/react-query";
import { vi, describe, it, expect } from "vitest";
import { QueryProvider } from "@/lib/query-client";
import { getRegisteredQueryClient } from "@/lib/query-client-registry";

vi.mock("@tanstack/react-query-devtools", () => ({
  ReactQueryDevtools: () => null,
}));

describe("QueryProvider", () => {
  it("registers the client it provides so non-React code can clear it", () => {
    let providedClient: ReturnType<typeof useQueryClient> | null = null;
    function Probe() {
      providedClient = useQueryClient();
      return null;
    }

    render(
      <QueryProvider>
        <Probe />
      </QueryProvider>,
    );

    expect(providedClient).not.toBeNull();
    expect(getRegisteredQueryClient()).toBe(providedClient);
  });
});
