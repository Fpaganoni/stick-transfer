import { Role } from "@/types/enums";

/**
 * The social axis a viewer acts on. A club account follows on the CLUB axis, a
 * person on USER. Every follow call decides it here, so a club never leaves a
 * second USER-axis row behind.
 */
export function followerTypeFor(role: string | undefined): "USER" | "CLUB" {
  return role === Role.CLUB ? "CLUB" : "USER";
}
