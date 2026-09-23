export type AccessRole =
  | "Barangay Staff"
  | "Barangay Official"
  | "Municipal Office"
  | "Municipal Administrator"
  | "Auditor";

export type AccountStatus = "Active" | "Invited" | "Locked" | "Suspended";

export type RoleName = AccessRole | "Public";

export type PermissionLevel = "No access" | "View" | "Create & update" | "Manage";

export type ModulePermission = {
  moduleId: string;
  moduleName: string;
  group: "Registry" | "Services" | "Safety & Planning" | "Governance";
  level: PermissionLevel;
  sensitiveFields: boolean;
};

export type RoleDefinition = {
  id: string;
  name: RoleName;
  description: string;
  scope: "Assigned barangay" | "Assigned municipal office" | "All barangays" | "Public records only";
  type: "System" | "Operational";
  permissions: ModulePermission[];
  lastUpdated: string;
  updatedBy: string;
};

export type SensitiveDomain = "Peace & Order" | "VAW Desk" | "BCPC" | "BADAC" | "Health" | "Sectoral";

export type SensitiveGrant = {
  id: string;
  accountId: string;
  domain: SensitiveDomain;
  access: "Read" | "Read & update" | "Case manager";
  status: "Active" | "Expiring" | "Revoked";
  requiresPurpose: boolean;
  approvedBy: string;
  approvedAt: string;
  expiresAt: string;
  lastUsedAt: string | null;
};

export type PurposeRule = {
  id: string;
  domain: SensitiveDomain;
  classification: "Restricted" | "Highly restricted" | "Confidential";
  description: string;
  promptTitle: string;
  purposes: string[];
  reasonRequired: boolean;
  acknowledgementRequired: boolean;
  logEveryRead: boolean;
  municipalVisibility: "Aggregate only" | "Authorized records";
  retentionDays: number;
};

export type AuditAction = "Viewed" | "Created" | "Updated" | "Approved" | "Exported" | "Access changed" | "Sign-in";
export type AuditResult = "Success" | "Denied" | "Failed";

export type AuditEvent = {
  id: string;
  sequence: number;
  occurredAt: string;
  actorId: string;
  action: AuditAction;
  module: string;
  recordType: string;
  recordId: string;
  barangayId: string | null;
  ipAddress: string;
  device: string;
  reason: string;
  result: AuditResult;
  sensitivity: "Standard" | "Confidential" | "Restricted" | "Highly restricted";
  changes: Array<{ field: string; before: string; after: string }>;
  integrityHash: string;
};

export type DataGovernanceCategory = {
  id: string;
  name: string;
  module: string;
  classification: "Public" | "Internal" | "Confidential" | "Restricted" | "Highly restricted";
  lawfulBasis: string;
  legalReference: string;
  processingPurpose: string;
  dataSubjects: string;
  dataOwner: string;
  consentRequired: boolean;
  consentCoverage: number;
  recordsCovered: number;
  reviewStatus: "Current" | "Review due" | "Action required";
  nextReview: string;
};

export type RetentionPolicy = {
  id: string;
  name: string;
  module: string;
  classification: DataGovernanceCategory["classification"];
  retentionPeriod: string;
  trigger: string;
  disposition: "Secure deletion" | "Anonymize" | "Permanent archive" | "Transfer to municipal archive";
  legalHold: boolean;
  eligibleRecords: number;
  protectedRecords: number;
  nextRun: string;
  lastRun: string;
  status: "Active" | "Paused" | "Review due";
};

export type SecurityEvent = {
  id: string;
  detectedAt: string;
  type: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  status: "Open" | "Investigating" | "Contained" | "Resolved";
  barangayId: string | null;
  accountId: string;
  ipAddress: string;
  summary: string;
  affectedRecords: number;
  personalDataInvolved: boolean;
  notificationRequired: boolean;
  assignedTo: string;
  evidence: string[];
  responseSteps: Array<{ label: string; completed: boolean; completedAt: string | null }>;
};

export type StaffAccount = {
  id: string;
  employeeNumber: string;
  name: string;
  initials: string;
  email: string;
  mobile: string;
  position: string;
  office: string;
  role: AccessRole;
  barangayId: string | null;
  status: AccountStatus;
  permissionGroups: string[];
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  createdAt: string;
  twoFactorEnabled: boolean;
};
