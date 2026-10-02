import { useMe } from "@/hooks/useUsers";
import { Role } from "@/types/enums";

export function useRole() {
  const { data, isLoading } = useMe();
  const role = data?.me?.role;

  return {
    role,
    isLoading,
    isPlayer: role === Role.PLAYER,
    isCoach: role === Role.COACH,
    isClub: role === Role.CLUB,
    isUmpire: role === Role.UMPIRE,
    isSuperAdmin: role === Role.SUPERADMIN,
    hasRole: (roles: Role[]) => !!role && roles.includes(role),
  };
}
