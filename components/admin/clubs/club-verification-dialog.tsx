"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FileText, ShieldCheck, ShieldX } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAdminSetClubVerification } from "@/hooks/useAdminClubs";
import { AdminClubRow } from "@/types/models/admin";

interface ClubVerificationDialogProps {
  club: AdminClubRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type PendingAction = "approve" | "reject" | null;

export function ClubVerificationDialog({ club, open, onOpenChange }: ClubVerificationDialogProps) {
  const t = useTranslations("admin.clubs.verificationDialog");
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const setVerification = useAdminSetClubVerification();

  if (!club) return null;

  const handleConfirm = () => {
    if (!pendingAction) return;
    setVerification.mutate({
      clubId: club.id,
      status: pendingAction === "approve" ? "VERIFIED" : "REJECTED",
    });
    setPendingAction(null);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open && !pendingAction} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="size-12">
                <AvatarImage src={club.logo} alt={club.name} />
                <AvatarFallback>{club.name?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{club.name}</p>
                <p className="text-sm text-foreground-muted">
                  {[club.city, club.country].filter(Boolean).join(", ") || "—"}
                  {club.league ? ` · ${club.league}` : ""}
                </p>
              </div>
              <Badge variant="outline" className="ml-auto">
                {club.verificationStatus}
              </Badge>
            </div>

            <div className="rounded-lg border border-border p-3">
              <p className="mb-2 text-sm font-medium">{t("documentLabel")}</p>
              {club.verificationDoc ? (
                <Link
                  href={club.verificationDoc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <FileText className="size-4" />
                  {t("viewDocument")}
                </Link>
              ) : (
                <p className="text-sm text-foreground-muted">{t("noDocument")}</p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              className="border-error text-error hover:bg-error/10 hover:text-error"
              onClick={() => setPendingAction("reject")}
              disabled={club.verificationStatus === "REJECTED"}
            >
              <ShieldX className="size-4" />
              {t("reject")}
            </Button>
            <Button
              onClick={() => setPendingAction("approve")}
              disabled={club.verificationStatus === "VERIFIED"}
            >
              <ShieldCheck className="size-4" />
              {t("approve")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={pendingAction !== null} onOpenChange={(o) => !o && setPendingAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction === "approve" ? t("confirmApproveTitle") : t("confirmRejectTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction === "approve"
                ? t("confirmApproveDescription", { name: club.name })
                : t("confirmRejectDescription", { name: club.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={pendingAction === "reject" ? "bg-error text-white hover:bg-error/90" : undefined}
            >
              {t("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
