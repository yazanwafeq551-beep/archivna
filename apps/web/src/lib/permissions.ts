import type { User } from "@/api/auth";
import { DASHBOARD_SIDEBAR_ITEMS } from "@/lib/constants";

export const DEPOSIT_ROLES = [
  "system_admin",
  "institution_admin",
  "depositor",
  "cataloger",
];

export function hasRole(user: User | null | undefined, roles: string[]): boolean {
  return !!user?.roleAssignments?.some((assignment) => roles.includes(assignment.role));
}

export function isSystemAdmin(user: User | null | undefined): boolean {
  return hasRole(user, ["system_admin"]);
}

export function canDeposit(user: User | null | undefined): boolean {
  return hasRole(user, DEPOSIT_ROLES);
}

/**
 * Mirrors the API's rule (owner, or a cataloguing role over the record's
 * institution) so the UI offers editing exactly where the server allows it.
 * The server remains the authority - this only decides what to render.
 */
export function canEditArchive(
  user: User | null | undefined,
  archive: { ownerId?: string; institutionId?: string | null }
): boolean {
  if (!user) return false;
  if (archive.ownerId && user.id === archive.ownerId) return true;

  return !!user.roleAssignments?.some(
    (assignment) =>
      ["system_admin", "institution_admin", "cataloger"].includes(assignment.role) &&
      (!assignment.institutionId ||
        !archive.institutionId ||
        assignment.institutionId === archive.institutionId)
  );
}

export const STAFF_ROLES = ["system_admin", "institution_admin", "reviewer"];

/** Anyone who handles other people's submissions. */
export function isStaff(user: User | null | undefined): boolean {
  return hasRole(user, STAFF_ROLES);
}

/** Single source of truth for the desktop sidebar and the mobile drawer. */
export function visibleSidebarItems(user: User | null | undefined) {
  return DASHBOARD_SIDEBAR_ITEMS.filter((item) => {
    if ("adminOnly" in item && !isSystemAdmin(user)) return false;
    if ("staffOnly" in item && !isStaff(user)) return false;
    if (item.key === "new" && !canDeposit(user)) return false;
    return true;
  });
}
