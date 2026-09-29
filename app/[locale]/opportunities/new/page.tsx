import { AppShell } from "@/components/layout/app-shell";
import { RoleGuard } from "@/components/auth/role-guard";
import { CreateOpportunityForm } from "@/components/opportunities/create-opportunity-form";
import { Role } from "@/types/enums";
import { getTranslations } from "next-intl/server";

export default async function NewOpportunityRoute() {
  const t = await getTranslations("opportunities");

  return (
    <AppShell title={t("create.title")}>
      <RoleGuard allowedRoles={[Role.CLUB]}>
        <div className="max-w-3xl mx-auto px-4 py-6">
          <CreateOpportunityForm />
        </div>
      </RoleGuard>
    </AppShell>
  );
}
