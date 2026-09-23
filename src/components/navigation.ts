import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  FileBadge2,
  HandHeart,
  House,
  LayoutDashboard,
  LifeBuoy,
  MapPinned,
  ShieldCheck,
  Siren,
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
          ["Resident Masterlist", "masterlist"],
          ["Register Resident", "register"],
          ["Transfers", "transfers"],
          ["Life Events", "life-events"],
          ["Duplicate Review", "duplicates"],
          ["Photo & Signature", "media"],
          ["Resident IDs", "ids"],
          ["Advanced Search", "search"],
        ]),
      },
      {
        label: "Households & Structures",
        icon: House,
        children: [
          ...pages("/barangay-affairs/households", [
            ["Dashboard", ""],
            ["Household Masterlist", "masterlist"],
          ]),
          { label: "Structures & Addresses", path: "/barangay-affairs/structures" },
          ...pages("/barangay-affairs/households", [
            ["Register Household", "register"],
            ["Household Surveys", "surveys"],
            ["Enumerator Assignments", "enumerators"],
            ["Survey Progress", "survey-progress"],
            ["Sync & Conflicts", "sync-conflicts"],
            ["Verification", "verification"],
            ["Household Map", "map"],
          ]),
        ],
      },
      {
        label: "Sectoral Registries",
        icon: ClipboardList,
        requiredPermission: "sectoral-data",
        children: pages("/barangay-affairs/sectors", [
          ["Dashboard", ""],
          ["Sectoral Masterlist", "masterlist"],
          ["Senior Citizens", "seniors"],
          ["PWD", "pwd"],
          ["Solo Parents", "solo-parents"],
          ["Children", "children"],
          ["Youth / SK", "youth"],
          ["Out-of-School Youth", "osy"],
          ["Indigent", "indigent"],
          ["Indigenous Peoples", "ip"],
          ["4Ps", "4ps"],
          ["Certification Requests", "certification-requests"],
          ["ID & Booklet Issuance", "id-booklets"],
          ["Eligibility Alerts", "eligibility-alerts"],
          ["Expiring IDs", "expiring-ids"],
        ]),
      },
    ],
  },
  {
    label: "Services & Transactions",
    items: [
      {
        label: "Certifications & Clearances",
        icon: FileBadge2,
        children: pages("/barangay-affairs/documents", [
          ["Dashboard", ""],
          ["New Document", "new"],
          ["Requests", "requests"],
          ["Pending Review", "pending-review"],
          ["For Approval", "for-approval"],
          ["For Release", "for-release"],
          ["Issued Documents", "issued"],
          ["Reprints", "reprints"],
          ["Revocations", "revocations"],
          ["Verification", "verification"],
        ]),
      },
      {
        label: "Assistance & Benefits",
        icon: HandHeart,
        children: pages("/barangay-affairs/assistance", [
          ["Dashboard", ""],
          ["New Assistance", "new"],
          ["Assistance Ledger", "ledger"],
          ["Resident History", "resident-history"],
          ["Household History", "household-history"],
          ["Duplicate / Cooling-Off Alerts", "alerts"],
          ["Disbursement & Liquidation", "disbursement"],
        ]),
      },
      {
        label: "Frontline Services",
        icon: LifeBuoy,
        children: pages("/barangay-affairs/frontline", [
          ["Dashboard", ""],
          ["Live Queue", "queue"],
          ["Issue Ticket", "tickets/new"],
          ["Service Requests", "requests"],
          ["Complaints & Feedback", "feedback"],
          ["Assignments", "assignments"],
          ["Turnaround Performance", "performance"],
        ]),
      },
      {
        label: "Business Registry",
        icon: BriefcaseBusiness,
        children: pages("/barangay-affairs/businesses", [
          ["Dashboard", ""],
          ["Business Masterlist", "masterlist"],
          ["Register Business", "register"],
          ["Barangay Clearances", "clearances"],
          ["Fee Assessment", "assessment"],
          ["Collections", "collections"],
          ["Renewals", "renewals"],
          ["Lapsed Businesses", "lapsed"],
          ["BPLS Integration", "bpls"],
        ]),
      },
    ],
  },
  {
    label: "Safety & Resilience",
    items: [
      {
        label: "Peace & Order",
        icon: ShieldCheck,
        requiredPermission: "peace-order",
        children: pages("/barangay-affairs/peace-order", [
          ["Dashboard", ""],
          ["Blotter", "blotter"],
          ["Barangay Justice", "justice"],
          ["Hearings & Summons", "hearings"],
          ["CFA Processing", "cfa"],
          ["VAW Desk", "vaw", "vaw"],
          ["BCPC Cases", "bcpc", "bcpc"],
          ["BADAC", "badac", "badac"],
          ["Aggregate Reports", "reports"],
        ]),
      },
      {
        label: "Disaster & Vulnerability",
        icon: Siren,
        children: pages("/barangay-affairs/disaster", [
          ["Dashboard", ""],
          ["Hazard & Exposure Map", "hazards"],
          ["Vulnerable Households", "vulnerable-households"],
          ["Pre-emptive Evacuation", "evacuation"],
          ["Evacuation Centres", "evacuation-centres"],
          ["Evacuation Manifest", "manifest"],
          ["Family Access Cards", "family-access-cards"],
          ["Relief Distribution", "relief"],
          ["Damage Assessment", "damage-assessment"],
          ["MDRRMO View", "mdrrmo"],
        ]),
      },
    ],
  },
  {
    label: "Planning & Development",
    hideLabel: true,
    items: [
      {
        label: "Planning & Development",
        icon: MapPinned,
        children: pages("/barangay-affairs/planning", [
          ["Dashboard", ""],
          ["BDC Composition", "bdc"],
          ["Meetings & Minutes", "meetings"],
          ["Barangay Development Plan", "bdp"],
          ["Priority Areas", "priorities"],
          ["Project Proposals", "projects"],
          ["Municipal Submissions", "submissions"],
          ["Status Feedback", "status"],
        ]),
      },
    ],
  },
  {
    label: "Reports & Analytics",
    hideLabel: true,
    items: [
      {
        label: "Reports & Analytics",
        icon: BarChart3,
        children: pages("/barangay-affairs/reports", [
          ["Dashboard", ""],
          ["Population & Demographics", "population"],
          ["Household Reports", "households"],
          ["Sectoral Reports", "sectors"],
          ["RBI Extract", "rbi"],
          ["CBMS / Household Extract", "cbms"],
          ["Custom Report Builder", "builder"],
          ["Scheduled Exports", "scheduled"],
          ["Export History", "export-history"],
        ]),
      },
    ],
  },
  {
    label: "Municipal Oversight",
    hideLabel: true,
    allowedRoles: ["municipalAdministrator", "municipalOfficeUser", "auditor"],
    requiredPermission: "municipal-oversight",
    items: [
      {
        label: "Municipal Oversight",
        icon: Building2,
        children: pages("/barangay-affairs/municipal", [
          ["Dashboard", ""],
          ["Barangay Overview", "barangays"],
          ["Registry Completeness", "registry-completeness"],
          ["Survey Coverage", "survey-coverage"],
          ["Service Performance", "service-performance"],
          ["BDP Submission Status", "bdp-status"],
          ["Budget Submission Tracking", "budget-submissions"],
          ["Comparative Views", "comparative"],
          ["Barangay Drill-down", "drilldown"],
          ["Capacity Gaps", "capacity-gaps"],
        ]),
      },
    ],
  },
  {
    label: "Administration",
    hideLabel: true,
    allowedRoles: ["municipalAdministrator", "auditor"],
    requiredPermission: "administration",
    items: [
      {
        label: "Administration",
        icon: ShieldCheck,
        children: pages("/barangay-affairs/admin", [
          ["Access Dashboard", ""],
          ["User Accounts", "users"],
          ["Roles & Permissions", "roles"],
          ["Barangay / Office Scopes", "scopes"],
          ["Sensitive Data Permissions", "sensitive-permissions"],
          ["Access Purpose Rules", "access-purposes"],
          ["Audit Logs", "audit-logs", "audit-logs"],
          ["Consent & Lawful Basis", "consent"],
          ["Retention Policies", "retention"],
          ["Security Events", "security"],
          ["System Configuration", "settings"],
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
