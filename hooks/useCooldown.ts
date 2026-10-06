import { useCallback, useEffect, useState } from "react";

/** Countdown in seconds; `start(n)` begins it, `seconds > 0` means active. */
export function useCooldown() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  const start = useCallback((total: number) => setSeconds(total), []);

  return { seconds, active: seconds > 0, start };
}
