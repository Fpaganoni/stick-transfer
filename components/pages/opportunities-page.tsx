"use client";

import { Globe } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { JobOpportunities } from "@/components/opportunities/job-opportunities";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUIStore } from "@/stores/useUIStore";
import { useJobOpportunities } from "@/hooks/useJobOpportunities";
import { JobOpportunity } from "@/types/models/job-opportunity";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { LoginPage } from "@/components/pages/login-page";
import { RegisterPage } from "@/components/pages/register-page";

interface OpportunitiesPageProps {
  initialData?: { jobOpportunities: JobOpportunity[] };
}

export function OpportunitiesPage({ initialData }: OpportunitiesPageProps) {
  const t = useTranslations("opportunities");
  const { isLoggedIn, user } = useAuthStore();
  const {
    openRegisterModal,
    isLoginOpen,
    isRegisterOpen,
    closeLoginModal,
    closeRegisterModal,
  } = useUIStore();
  const { data } = useJobOpportunities(undefined, initialData);
  const total = data?.jobOpportunities?.length ?? 0;

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6 items-start">
        {/* Sidebar */}
        <aside className="hidden lg:block w-[260px] shrink-0">
          <div className="sticky top-20 bg-background border border-border rounded-xl p-6 flex flex-col items-center text-center gap-3">
            {isLoggedIn && user ? (
              <>
                {user.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={user.name}
                    width={80}
                    height={80}
                    className="rounded-full object-cover border-2 border-primary/30"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary border-2 border-primary/30">
                    {user.name?.charAt(0)?.toUpperCase() ?? "?"}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-foreground">{user.name}</p>
                  {user.username && (
                    <p className="text-sm text-foreground-muted">
                      @{user.username}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-foreground/10 border-2 border-border flex items-center justify-center text-3xl">
                  👤
                </div>
                <p className="text-sm font-medium text-foreground-muted">
                  {t("visitor")}
                </p>
                <Button
                  size="sm"
                  className="w-full text-white mt-1"
                  onClick={openRegisterModal}
                >
                  {t("createYourProfile")}
                </Button>
                <p className="text-xs font-bold tracking-widest text-foreground-muted">
                  {t("itsFree")}
                </p>
              </>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 pb-22">
          <div className="flex items-center gap-3 mb-5">
            <Globe className="text-foreground-muted shrink-0" size={20} />
            <h1 className="text-base font-semibold text-foreground">
              {t("allVacanciesLabel")}{" "}
              <span className="text-primary font-bold">({total})</span>
            </h1>
          </div>

          <JobOpportunities initialData={initialData} />
        </main>
      </div>

      {/* Auth modals — needed for unauthenticated actions on this page */}
      <Dialog
        open={isLoginOpen}
        onOpenChange={(open) => !open && closeLoginModal()}
      >
        <DialogContent
          className="sm:max-w-[680px] p-0 overflow-visible"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">Sign In</DialogTitle>
          <LoginPage />
        </DialogContent>
      </Dialog>

      <Dialog
        open={isRegisterOpen}
        onOpenChange={(open) => !open && closeRegisterModal()}
      >
        <DialogContent
          className="max-w-md p-0 max-h-[90vh] overflow-y-auto"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">Sign Up</DialogTitle>
          <RegisterPage />
        </DialogContent>
      </Dialog>
    </>
  );
}
