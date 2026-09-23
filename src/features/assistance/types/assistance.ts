export type AssistanceType = "AICS" | "Burial" | "Medical" | "Educational" | "Scholarship" | "Feeding" | "Livelihood";

export type AssistanceStatus = "Pending Review" | "Released" | "Held";
export type LiquidationStatus = "Unliquidated" | "Partially Liquidated" | "Liquidated";

export type AssistanceRecord = {
  id: string;
  referenceNumber: string;
  residentId: string;
  householdId: string;
  barangayId: string;
  assistanceType: AssistanceType;
  amount: number;
  assistanceDate: string;
  fundSource: string;
  releasingOffice: string;
  releasingOfficer: string;
  purpose: string;
  supportingDocuments: string[];
  status: AssistanceStatus;
  releasedAt: string;
  disbursementReference: string;
  paymentMode: "Cash" | "Check" | "Bank Transfer" | "";
  officialReceiptNumber: string;
  liquidationStatus: LiquidationStatus | "";
  liquidatedAmount: number;
  liquidationDate: string;
  liquidationDocuments: string[];
  coolingEndsAt: string;
  duplicateFlag: boolean;
  matchedRecordId: string;
  alertResolution: "Pending" | "Cleared" | "Confirmed";
  holdReason: string;
  reviewedAt: string;
  reviewedBy: string;
  reviewNote: string;
  createdAt: string;
};

export type AssistanceInput = Pick<
  AssistanceRecord,
  | "residentId"
  | "householdId"
  | "barangayId"
  | "assistanceType"
  | "amount"
  | "assistanceDate"
  | "fundSource"
  | "releasingOffice"
  | "purpose"
  | "supportingDocuments"
>;

export type EligibilityResult = {
  eligible: boolean;
  duplicateRecord?: AssistanceRecord;
  message: string;
  coolingDays: number;
};
