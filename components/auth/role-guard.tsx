"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useAuthStore } from "@/stores/useAuthStore";
import { useMe } from "@/hooks/useUsers";
import { Role } from "@/types/enums";
import { Spinner } from "@/components/ui/spinner";

interface RoleGuardProps {
  allowedRoles: Role[];
  children: React.ReactNode;
  /** Path (without locale prefix) to redirect to when the role check fails. Defaults to /opportunities. */
  redirectTo?: string;
}

// Role check must come from a live `me` query, not the persisted auth
// store: `user.role` in localStorage can be edited client-side, but `me`
// is resolved server-side from the JWT and can't be forged that way.
// See components/admin/admin-guard.tsx for the SUPERADMIN-only variant.
export function RoleGuard({ allowedRoles, children, redirectTo = "/opportunities" }: RoleGuardProps) {
  const router = useRouter();
  const locale = useLocale();
  const { isLoggedIn } = useAuthStore();
  const { data, isLoading, isError } = useMe();
  const [hydrated, setHydrated] = useState(false);
  const localePrefix = locale === "en" ? "" : `/${locale}`;

  const hasAccess = !!data?.me?.role && allowedRoles.includes(data.me.role);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);

    if (!isLoggedIn) {
      router.replace(localePrefix || "/");
      return;
    }

    if (isLoading) return;

    if (isError || !hasAccess) {
      router.replace(`${localePrefix}${redirectTo}`);
    }
  }, [isLoggedIn, isLoading, isError, hasAccess, router, localePrefix, redirectTo]);

  if (!hydrated || !isLoggedIn || isLoading || isError || !hasAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  return <>{children}</>;
}
