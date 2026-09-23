import type { Household } from "@/features/household-registry/types/household";
import type { Resident } from "@/features/resident-registry/types/resident";

import type { AssistanceRecord, AssistanceType } from "../types/assistance";

export const ASSISTANCE_TYPES: AssistanceType[] = [
  "AICS",
  "Burial",
  "Medical",
  "Educational",
  "Scholarship",
  "Feeding",
  "Livelihood",
];

export const COOLING_DAYS: Record<AssistanceType, number> = {
  AICS: 90,
  Burial: 365,
  Medical: 30,
  Educational: 180,
  Scholarship: 365,
  Feeding: 7,
  Livelihood: 365,
};

const fundSources = [
  "Municipal General Fund",
  "Barangay General Fund",
  "Local Disaster Risk Reduction Fund",
  "GAD Fund",
  "Social Welfare Fund",
  "External Grant",
];
const offices = ["MSWDO", "Mayor's Office", "Barangay Council", "MDRRMO", "Municipal Health Office"];
const purposes: Record<AssistanceType, string> = {
  AICS: "Immediate financial assistance for a household emergency.",
  Burial: "Burial and funeral expense assistance.",
  Medical: "Medical consultation, medicine, or hospitalization support.",
  Educational: "School supplies, transportation, or educational expenses.",
  Scholarship: "Qualified learner scholarship assistance.",
  Feeding: "Supplemental feeding support for eligible household members.",
  Livelihood: "Starter materials and livelihood recovery assistance.",
};

export function createAssistanceDummyData(residents: Resident[], households: Household[]): AssistanceRecord[] {
  const records: AssistanceRecord[] = residents.slice(0, 420).map((resident, index) => {
    const household = households.find((item) => item.members.some((member) => member.residentId === resident.id));
    const assistanceType = ASSISTANCE_TYPES[index % ASSISTANCE_TYPES.length];
    const assistanceDate = new Date(Date.UTC(2026, 8 - (index % 7), 3 + (index % 22), 8 + (index % 8), 15));
    const coolingEndsAt = new Date(assistanceDate);
    coolingEndsAt.setUTCDate(coolingEndsAt.getUTCDate() + COOLING_DAYS[assistanceType]);
    const status: AssistanceRecord["status"] =
      index % 11 === 0 ? "Pending Review" : index % 37 === 0 ? "Held" : "Released";
    const liquidationStatus: AssistanceRecord["liquidationStatus"] =
      status !== "Released"
        ? ""
        : index % 4 === 0
          ? "Liquidated"
          : index % 4 === 1
            ? "Partially Liquidated"
            : "Unliquidated";
    const amount = 1500 + (index % 10) * 750;
    return {
      id: `assistance-${String(index + 1).padStart(6, "0")}`,
      referenceNumber: `AST-26-${String(index + 1).padStart(6, "0")}`,
      residentId: resident.id,
      householdId: household?.id ?? "",
      barangayId: resident.address.barangayId,
      assistanceType,
      amount,
      assistanceDate: assistanceDate.toISOString().slice(0, 10),
      fundSource: fundSources[index % fundSources.length],
      releasingOffice: offices[index % offices.length],
      releasingOfficer: status === "Released" ? `Assistance Officer ${(index % 9) + 1}` : "",
      purpose: purposes[assistanceType],
      supportingDocuments: ["Valid ID", "Barangay certification", index % 3 === 0 ? "Case assessment" : "Request form"],
      status,
      releasedAt: status === "Released" ? assistanceDate.toISOString() : "",
      disbursementReference: status === "Released" ? `DV-26-${String(index + 1).padStart(6, "0")}` : "",
      paymentMode: status === "Released" ? (["Cash", "Check", "Bank Transfer"] as const)[index % 3] : "",
      officialReceiptNumber: status === "Released" ? `OR-${String(260000 + index).padStart(7, "0")}` : "",
      liquidationStatus,
      liquidatedAmount:
        liquidationStatus === "Liquidated" ? amount : liquidationStatus === "Partially Liquidated" ? amount * 0.6 : 0,
      liquidationDate: liquidationStatus === "Liquidated" ? "2026-09-20" : "",
      liquidationDocuments:
        liquidationStatus === "Liquidated"
          ? ["Disbursement voucher", "Acknowledgement receipt", "Liquidation report"]
          : liquidationStatus === "Partially Liquidated"
            ? ["Disbursement voucher", "Partial acknowledgement"]
            : [],
      coolingEndsAt: coolingEndsAt.toISOString().slice(0, 10),
      duplicateFlag: status === "Held",
      matchedRecordId: "",
      alertResolution: "Pending" as const,
      holdReason: status === "Held" ? "Possible cross-office duplicate requires adjudication." : "",
      reviewedAt: "",
      reviewedBy: "",
      reviewNote: "",
      createdAt: assistanceDate.toISOString(),
    };
  });
  return records.map((record, index) => {
    if (record.status !== "Held") return record;
    const matched = records[index - 14];
    if (!matched) return record;
    return {
      ...record,
      residentId: matched.residentId,
      householdId: matched.householdId,
      barangayId: matched.barangayId,
      assistanceType: matched.assistanceType,
      matchedRecordId: matched.id,
      holdReason: `Possible duplicate of ${matched.referenceNumber} from another releasing office.`,
    };
  });
}
