export type SurveyStatus = "Not Started" | "In Progress" | "Submitted" | "Needs Review" | "Verified" | "Returned";
export type SurveySyncStatus = "Synced" | "Pending Upload" | "Conflict" | "Failed";

export type HouseholdSurvey = {
  id: string;
  referenceNumber: string;
  householdId: string;
  barangayId: string;
  enumeratorId: string;
  formVersion: string;
  status: SurveyStatus;
  syncStatus: SurveySyncStatus;
  completionPercent: number;
  deviceId: string;
  startedAt: string;
  savedOfflineAt: string;
  submittedAt: string;
  verifiedAt: string;
  verifiedBy: string;
  reviewNote: string;
  updatedAt: string;
};

export type Enumerator = {
  id: string;
  staffNumber: string;
  name: string;
  assignedBarangayIds: string[];
  deviceId: string;
  status: "Active" | "Offline" | "On Leave";
  lastSyncAt: string;
};

export type SyncConflict = {
  id: string;
  surveyId: string;
  householdId: string;
  fieldName: string;
  localValue: string;
  serverValue: string;
  status: "Open" | "Resolved";
  detectedAt: string;
  resolution: "" | "Keep Device" | "Keep Server";
  resolvedBy: string;
  resolvedAt: string;
};
