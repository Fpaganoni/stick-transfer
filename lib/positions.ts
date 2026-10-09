import { Position } from "@/types/enums";

/**
 * Playing positions the backend accepts (POSITION_INVALID otherwise), labelled
 * with `explore.positions.*`. The value is what gets sent: attacker reads
 * "Forward" but must never be sent as "forward"/"Forward".
 */
export const POSITION_OPTIONS = [
  { value: Position.GOALKEEPER, labelKey: "goalkeeper" },
  { value: Position.DEFENDER, labelKey: "defender" },
  { value: Position.MIDFIELDER, labelKey: "midfielder" },
  { value: Position.ATTACKER, labelKey: "forward" },
] as const;

const POSITION_VALUES: readonly string[] = Object.values(Position);

/** Legacy rows may hold free text ("Forward"); anything outside the enum becomes "". */
export function toKnownPosition(value: string | undefined): string {
  return value && POSITION_VALUES.includes(value) ? value : "";
}
