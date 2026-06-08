"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { MoreHorizontal, ShieldAlert } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  useAdminChangeUserRole,
  useAdminSetUserActive,
  useAdminSetUserVerified,
} from "@/hooks/useAdminUsers";
import { AdminUserRow } from "@/types/models/admin";
import { Role } from "@/types/enums";

const ROLE_OPTIONS = [Role.PLAYER, Role.COACH, Role.CLUB, Role.SUPERADMIN];

interface AdminUserRowActionsProps {
  user: AdminUserRow;
}

type ConfirmKind = "active" | "verified" | null;

export function AdminUserRowActions({ user }: AdminUserRowActionsProps) {
  const t = useTranslations("admin.users.actions");
  const [confirmKind, setConfirmKind] = useState<ConfirmKind>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [pendingRole, setPendingRole] = useState<Role | null>(null);

  const setActive = useAdminSetUserActive();
  const setVerified = useAdminSetUserVerified();
  const changeRole = useAdminChangeUserRole();

  const closeConfirm = () => setConfirmKind(null);

  const handleConfirm = () => {
    if (confirmKind === "active") {
      setActive.mutate({ userId: user.id, isActive: !user.isActive });
    } else if (confirmKind === "verified") {
      setVerified.mutate({ userId: user.id, isVerified: !user.isVerified });
    }
    closeConfirm();
  };

  const openRoleDialog = () => {
    setPendingRole(null);
    setRoleDialogOpen(true);
  };

  const handleRoleConfirm = () => {
    if (!pendingRole || pendingRole === user.role) return;
    changeRole.mutate({ userId: user.id, role: pendingRole });
    setRoleDialogOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8">
            <MoreHorizontal className="size-4" />
            <span className="sr-only">{t("openMenu")}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setConfirmKind("active")}>
            {user.isActive ? t("deactivate") : t("activate")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setConfirmKind("verified")}>
            {user.isVerified ? t("unverify") : t("verify")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={openRoleDialog}>{t("changeRole")}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Activate/Deactivate & Verify/Unverify confirm */}
      <AlertDialog open={confirmKind !== null} onOpenChange={(open) => !open && closeConfirm()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmKind === "active"
                ? user.isActive
                  ? t("confirmDeactivateTitle")
                  : t("confirmActivateTitle")
                : user.isVerified
                  ? t("confirmUnverifyTitle")
                  : t("confirmVerifyTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmKind === "active"
                ? user.isActive
                  ? t("confirmDeactivateDescription", { name: user.name })
                  : t("confirmActivateDescription", { name: user.name })
                : user.isVerified
                  ? t("confirmUnverifyDescription", { name: user.name })
                  : t("confirmVerifyDescription", { name: user.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>{t("confirm")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change role — sensitive: select + explicit warning + double confirmation */}
      <AlertDialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="size-4 text-error" />
              {t("changeRoleTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("changeRoleDescription", { name: user.name, currentRole: user.role })}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2 py-2">
            <Select value={pendingRole ?? undefined} onValueChange={(value) => setPendingRole(value as Role)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("selectNewRole")} />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((role) => (
                  <SelectItem key={role} value={role} disabled={role === user.role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm font-medium text-error">{t("changeRoleWarning")}</p>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRoleDialogOpen(false)}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRoleConfirm}
              disabled={!pendingRole || pendingRole === user.role}
              className="bg-error text-white hover:bg-error/90"
            >
              {t("confirmRoleChange")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
