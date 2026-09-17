"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useAuthStore } from "@/stores/useAuthStore";
import { useMe } from "@/hooks/useUsers";
import { Role } from "@/types/enums";
import { Spinner } from "@/components/ui/spinner";

interface AdminGuardProps {
  children: React.ReactNode;
}

// Role check must come from a live `me` query, not the persisted auth
// store: `user.role` in localStorage can be edited client-side, but `me`
// is resolved server-side from the JWT and can't be forged that way.
export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const locale = useLocale();
  const { isLoggedIn } = useAuthStore();
  const { data, isLoading, isError } = useMe();
  const [hydrated, setHydrated] = useState(false);
  const localePrefix = locale === "en" ? "" : `/${locale}`;

  const isAdmin = data?.me?.role === Role.SUPERADMIN;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);

    if (!isLoggedIn) {
      router.replace(localePrefix || "/");
      return;
    }

    if (isLoading) return;

    if (isError || !isAdmin) {
      router.replace("/opportunities");
    }
  }, [isLoggedIn, isLoading, isError, isAdmin, router, localePrefix]);

  if (!hydrated || !isLoggedIn || isLoading || isError || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  return <>{children}</>;
}
