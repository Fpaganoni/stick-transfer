/** Backend maximum for `limit` on public list queries (see common/pagination.ts). */
export const LIST_PAGE_SIZE = 100;

/** Safety stop: 50 pages x 100 rows. A runaway loop must never hammer the API. */
const MAX_PAGES = 50;

/**
 * Loads a limit/offset list page by page until a short page arrives.
 * For screens that filter on the client and therefore need the whole list;
 * each request stays within the server-side page cap.
 */
export async function fetchAllPages<T>(
  fetchPage: (limit: number, offset: number) => Promise<T[]>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const items = await fetchPage(LIST_PAGE_SIZE, page * LIST_PAGE_SIZE);
    rows.push(...items);
    if (items.length < LIST_PAGE_SIZE) break;
  }
  return rows;
}
