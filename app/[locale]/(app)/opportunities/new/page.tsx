import { RoleGuard } from "@/components/auth/role-guard";
import { CreateOpportunityForm } from "@/components/opportunities/create-opportunity-form";
import { Role } from "@/types/enums";

export default function NewOpportunityRoute() {
  return (
    <RoleGuard allowedRoles={[Role.CLUB]}>
      <div className="max-w-3xl mx-auto px-4 py-6">
        <CreateOpportunityForm />
      </div>
    </RoleGuard>
  );
}
