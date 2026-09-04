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

/** Single source of truth for the desktop sidebar and the mobile drawer. */
export function visibleSidebarItems(user: User | null | undefined) {
  return DASHBOARD_SIDEBAR_ITEMS.filter((item) => {
    if ("adminOnly" in item && !isSystemAdmin(user)) return false;
    if (item.key === "new" && !canDeposit(user)) return false;
    return true;
  });
}
