/**
 * Keyboard rule of a horizontal tab list (WAI-ARIA tabs pattern): the arrow keys move
 * between tabs wrapping at both ends, Home/End jump to the first/last one, and every
 * other key is left alone (null) so Tab, typing and browser shortcuts keep working.
 */
export function nextTabIndex(key: string, current: number, count: number): number | null {
  if (count <= 0) return null;

  switch (key) {
    case "ArrowRight":
      return (current + 1) % count;
    case "ArrowLeft":
      return (current - 1 + count) % count;
    case "Home":
      return 0;
    case "End":
      return count - 1;
    default:
      return null;
  }
}
