/**
 * Maps user role to entity type for follow queries
 * @param role - User role (PLAYER, COACH, etc.)
 * @returns Entity type (USER or CLUB)
 */
export function mapRoleToEntityType(role: string): "USER" | "CLUB" {
  const upperRole = role.toUpperCase();

  // Clubs are their own entity type
  if (upperRole === "CLUB") {
    return "CLUB";
  }

  // All user roles (PLAYER, COACH, etc.) map to USER entity
  return "USER";
}
