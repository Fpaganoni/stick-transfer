"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useAuthStore } from "@/stores/useAuthStore";
import { Role } from "@/types/enums";
import { Spinner } from "@/components/ui/spinner";

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const locale = useLocale();
  const { user, isLoggedIn } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  const localePrefix = locale === "en" ? "" : `/${locale}`;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    if (!isLoggedIn) {
      router.replace(localePrefix || "/");
      return;
    }

    if (user?.role !== Role.SUPERADMIN) {
      router.replace("/opportunities");
    }
  }, [hydrated, isLoggedIn, user, router, localePrefix]);

  if (!hydrated || !isLoggedIn || user?.role !== Role.SUPERADMIN) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  return <>{children}</>;
}
