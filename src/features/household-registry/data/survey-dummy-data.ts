import { MATNOG_BARANGAYS } from "@/data/barangays";

import type { Household } from "../types/household";
import type { Enumerator, HouseholdSurvey, SyncConflict } from "../types/survey";

const firstNames = [
  "Maria",
  "Jose",
  "Angela",
  "Ramon",
  "Liza",
  "Carlo",
  "Grace",
  "Noel",
  "Rhea",
  "Dennis",
  "Mae",
  "Edwin",
  "Joy",
  "Allan",
  "Nina",
  "Paolo",
];
const lastNames = [
  "Dela Cruz",
  "Garcia",
  "Reyes",
  "Flores",
  "Mendoza",
  "Aquino",
  "Navarro",
  "Castillo",
  "Ramos",
  "Bautista",
  "Santos",
  "Villanueva",
  "Domingo",
  "Rivera",
  "Salazar",
  "Torres",
];

export function createSurveyDummyData(households: Household[]) {
  const enumerators: Enumerator[] = firstNames.map((firstName, index) => ({
    id: `enumerator-${String(index + 1).padStart(3, "0")}`,
    staffNumber: `ENUM-2026-${String(index + 1).padStart(3, "0")}`,
    name: `${firstName} ${lastNames[index]}`,
    assignedBarangayIds: MATNOG_BARANGAYS.filter(
      (_, barangayIndex) =>
        barangayIndex % firstNames.length === index || (barangayIndex + 5) % firstNames.length === index,
    ).map((barangay) => barangay.code),
    deviceId: `MAT-TAB-${String(index + 1).padStart(3, "0")}`,
    status: index % 11 === 0 ? "Offline" : index % 13 === 0 ? "On Leave" : "Active",
    lastSyncAt: `2026-09-${String(23 - (index % 4)).padStart(2, "0")}T${String(8 + (index % 8)).padStart(2, "0")}:15:00.000Z`,
  }));

  const statuses: HouseholdSurvey["status"][] = [
    "Verified",
    "Verified",
    "Submitted",
    "Needs Review",
    "In Progress",
    "Not Started",
    "Returned",
    "Verified",
  ];
  const syncStatuses: HouseholdSurvey["syncStatus"][] = [
    "Synced",
    "Synced",
    "Synced",
    "Conflict",
    "Pending Upload",
    "Synced",
    "Failed",
    "Synced",
  ];
  const surveys: HouseholdSurvey[] = households.map((household, index) => {
    const status = statuses[index % statuses.length];
    const syncStatus = syncStatuses[index % syncStatuses.length];
    const enumerator = enumerators[index % enumerators.length];
    const day = String((index % 22) + 1).padStart(2, "0");
    return {
      id: `survey-${String(index + 1).padStart(5, "0")}`,
      referenceNumber: `HHS-2026-${String(index + 1).padStart(6, "0")}`,
      householdId: household.id,
      barangayId: household.barangayId,
      enumeratorId: enumerator.id,
      formVersion: "A2-HH-2026.3",
      status,
      syncStatus,
      completionPercent: status === "Not Started" ? 0 : status === "In Progress" ? 55 + (index % 35) : 100,
      deviceId: enumerator.deviceId,
      startedAt: status === "Not Started" ? "" : `2026-09-${day}T08:30:00.000Z`,
      savedOfflineAt:
        syncStatus === "Pending Upload" || syncStatus === "Conflict" || syncStatus === "Failed"
          ? `2026-09-${day}T09:45:00.000Z`
          : "",
      submittedAt: ["Submitted", "Needs Review", "Verified", "Returned"].includes(status)
        ? `2026-09-${day}T11:00:00.000Z`
        : "",
      verifiedAt: status === "Verified" ? `2026-09-${day}T15:00:00.000Z` : "",
      verifiedBy: status === "Verified" ? "Barangay Verification Officer" : "",
      reviewNote:
        status === "Returned"
          ? "Confirm household income and water source before resubmission."
          : status === "Needs Review"
            ? "Automated validation found a household composition change."
            : "",
      updatedAt: `2026-09-${day}T15:00:00.000Z`,
    };
  });

  const conflictFields = [
    "Monthly income bracket",
    "Water source",
    "Household member count",
    "Tenure",
    "Food security",
  ];
  const conflicts: SyncConflict[] = surveys
    .filter((survey) => survey.syncStatus === "Conflict")
    .map((survey, index) => ({
      id: `sync-conflict-${String(index + 1).padStart(4, "0")}`,
      surveyId: survey.id,
      householdId: survey.householdId,
      fieldName: conflictFields[index % conflictFields.length],
      localValue: ["₱10,000–₱19,999", "Deep well", "5", "Owned", "Mild concern"][index % conflictFields.length],
      serverValue: ["Below ₱10,000", "Community faucet", "4", "Rented", "Food secure"][index % conflictFields.length],
      status: index % 4 === 0 ? "Resolved" : "Open",
      detectedAt: survey.savedOfflineAt,
      resolution: index % 4 === 0 ? "Keep Device" : "",
      resolvedBy: index % 4 === 0 ? "Municipal Data Reviewer" : "",
      resolvedAt: index % 4 === 0 ? "2026-09-23T10:30:00.000Z" : "",
    }));
  return { enumerators, surveys, conflicts };
}
