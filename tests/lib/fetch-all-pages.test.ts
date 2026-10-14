import { describe, expect, it, vi } from "vitest";
import { fetchAllPages, LIST_PAGE_SIZE } from "@/lib/fetch-all-pages";

const rows = (count: number, from = 0) =>
  Array.from({ length: count }, (_, i) => ({ id: from + i }));

describe("fetchAllPages", () => {
  it("stops after a single short page", async () => {
    const fetchPage = vi.fn().mockResolvedValue(rows(3));

    const result = await fetchAllPages(fetchPage);

    expect(result).toHaveLength(3);
    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(fetchPage).toHaveBeenCalledWith(LIST_PAGE_SIZE, 0);
  });

  it("keeps requesting pages with growing offsets until a short page", async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce(rows(LIST_PAGE_SIZE))
      .mockResolvedValueOnce(rows(LIST_PAGE_SIZE, LIST_PAGE_SIZE))
      .mockResolvedValueOnce(rows(7, 2 * LIST_PAGE_SIZE));

    const result = await fetchAllPages(fetchPage);

    expect(result).toHaveLength(2 * LIST_PAGE_SIZE + 7);
    expect(fetchPage.mock.calls.map(([, offset]) => offset)).toEqual([
      0,
      LIST_PAGE_SIZE,
      2 * LIST_PAGE_SIZE,
    ]);
  });

  it("asks for another page when the last one is exactly full, then stops on empty", async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce(rows(LIST_PAGE_SIZE))
      .mockResolvedValueOnce([]);

    const result = await fetchAllPages(fetchPage);

    expect(result).toHaveLength(LIST_PAGE_SIZE);
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });

  it("never loops forever when the server keeps returning full pages", async () => {
    const fetchPage = vi.fn().mockResolvedValue(rows(LIST_PAGE_SIZE));

    await fetchAllPages(fetchPage);

    expect(fetchPage).toHaveBeenCalledTimes(50);
  });

  it("propagates a failing page instead of returning a partial list", async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce(rows(LIST_PAGE_SIZE))
      .mockRejectedValueOnce(new Error("network"));

    await expect(fetchAllPages(fetchPage)).rejects.toThrow("network");
  });
});
