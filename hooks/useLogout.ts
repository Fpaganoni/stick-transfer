"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { clearClientSession } from "@/lib/session";

const DEFAULT_LOCALE = "en";

/**
 * Logout action shared by the app header and the admin shell. Waits for the
 * session to be fully cleared and then navigates client-side, so the LOGOUT
 * request is never cut off by a page reload.
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const locale = useLocale();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const isRunning = useRef(false);

  const logout = useCallback(async () => {
    if (isRunning.current) return;
    isRunning.current = true;
    setIsLoggingOut(true);

    try {
      await clearClientSession(queryClient);
      router.replace(locale === DEFAULT_LOCALE ? "/" : `/${locale}`);
    } finally {
      isRunning.current = false;
      setIsLoggingOut(false);
    }
  }, [queryClient, router, locale]);

  return { logout, isLoggingOut };
}
