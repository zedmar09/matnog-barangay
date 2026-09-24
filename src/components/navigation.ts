import type { LucideIcon } from "lucide-react";
import {
  BriefcaseBusiness,
  ClipboardList,
  FileBadge2,
  HandHeart,
  House,
  LayoutDashboard,
  UsersRound,
} from "lucide-react";

export type AppRole =
  | "barangayStaff"
  | "barangayOfficial"
  | "municipalOfficeUser"
  | "municipalAdministrator"
  | "auditor"
  | "publicUser";

export type NavChild = {
  label: string;
  path: string;
  requiredPermission?: string;
};

export type NavItem = {
  label: string;
  icon: LucideIcon;
  path?: string;
  children?: NavChild[];
  requiredPermission?: string;
  allowedRoles?: AppRole[];
};

export type NavSection = {
  label: string;
  items: NavItem[];
  hideLabel?: boolean;
  requiredPermission?: string;
  allowedRoles?: AppRole[];
};

const pages = (base: string, entries: Array<[string, string, string?]>): NavChild[] =>
  entries.map(([label, suffix, requiredPermission]) => ({
    label,
    path: suffix ? `${base}/${suffix}` : base,
    requiredPermission,
  }));

export const HOME_ITEM: NavItem = {
  label: "Home",
  icon: LayoutDashboard,
  path: "/barangay-affairs",
};

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Community Registry",
    items: [
      {
        label: "Residents",
        icon: UsersRound,
        children: pages("/barangay-affairs/residents", [
          ["Dashboard", ""],
          ["Masterlist", "masterlist"],
          ["Duplicate Matching", "duplicates"],
          ["Resident IDs", "ids"],
        ]),
      },
      {
        label: "Households & Structures",
        icon: House,
        children: [
          ...pages("/barangay-affairs/households", [
            ["Dashboard", ""],
            ["Masterlist", "masterlist"],
          ]),
          { label: "Structures", path: "/barangay-affairs/structures" },
        ],
      },
      {
        label: "Sectoral Registries",
        icon: ClipboardList,
        requiredPermission: "sectoral-data",
        children: pages("/barangay-affairs/sectors", [
          ["Dashboard", ""],
          ["Masterlist", "masterlist"],
          ["Eligibility Reviews", "certification-requests"],
        ]),
      },
    ],
  },
  {
    label: "Services & Transactions",
    items: [
      {
        label: "Barangay Documents",
        icon: FileBadge2,
        children: pages("/barangay-affairs/documents", [
          ["Dashboard", ""],
          ["Requests", "requests"],
        ]),
      },
      {
        label: "Assistance & Benefits",
        icon: HandHeart,
        children: pages("/barangay-affairs/assistance", [
          ["Dashboard", ""],
          ["Ledger", "ledger"],
          ["Disbursement", "disbursement"],
        ]),
      },
      {
        label: "Business Registry",
        icon: BriefcaseBusiness,
        children: pages("/barangay-affairs/businesses", [
          ["Dashboard", ""],
          ["Masterlist", "masterlist"],
          ["Clearances", "clearances"],
        ]),
      },
    ],
  },
];

export type NavUser = {
  role: AppRole;
  permissions: ReadonlySet<string>;
};

export const CURRENT_NAV_USER: NavUser = {
  role: "municipalAdministrator",
  permissions: new Set([
    "administration",
    "audit-logs",
    "badac",
    "bcpc",
    "municipal-oversight",
    "peace-order",
    "sectoral-data",
    "vaw",
  ]),
};

export function hasNavAccess(entry: { allowedRoles?: AppRole[]; requiredPermission?: string }, user: NavUser) {
  if (entry.allowedRoles && !entry.allowedRoles.includes(user.role)) return false;
  if (entry.requiredPermission && !user.permissions.has(entry.requiredPermission)) return false;
  return true;
}
