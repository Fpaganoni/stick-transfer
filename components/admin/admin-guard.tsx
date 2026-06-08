"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { Role } from "@/types/enums";
import { Spinner } from "@/components/ui/spinner";

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const { user, isLoggedIn } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }

    if (user?.role !== Role.SUPERADMIN) {
      router.replace("/opportunities");
    }
  }, [hydrated, isLoggedIn, user, router]);

  if (!hydrated || !isLoggedIn || user?.role !== Role.SUPERADMIN) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  return <>{children}</>;
}
