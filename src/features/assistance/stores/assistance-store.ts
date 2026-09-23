"use client";

import { create } from "zustand";

import { createHouseholdDummyData } from "@/features/household-registry/data/household-dummy-data";
import { createResidentDummyData } from "@/features/resident-registry/data/resident-dummy-data";

import { COOLING_DAYS, createAssistanceDummyData } from "../data/assistance-data";
import type { AssistanceInput, AssistanceRecord, EligibilityResult } from "../types/assistance";

type AssistanceState = {
  records: AssistanceRecord[];
  checkEligibility: (
    input: Pick<AssistanceInput, "residentId" | "householdId" | "assistanceType" | "assistanceDate">,
  ) => EligibilityResult;
  addAssistance: (input: AssistanceInput) => { record?: AssistanceRecord; eligibility: EligibilityResult };
  releaseAssistance: (id: string) => void;
  reviewDuplicate: (id: string, outcome: "Cleared" | "Confirmed", note: string) => void;
  markLiquidated: (id: string) => void;
};

const residents = createResidentDummyData(1200);
const households = createHouseholdDummyData(residents).households;

function eligibilityFor(
  records: AssistanceRecord[],
  input: Pick<AssistanceInput, "residentId" | "householdId" | "assistanceType" | "assistanceDate">,
): EligibilityResult {
  const coolingDays = COOLING_DAYS[input.assistanceType];
  const requestedAt = new Date(`${input.assistanceDate}T12:00:00.000Z`).getTime();
  const duplicateRecord = records
    .filter(
      (item) =>
        item.status === "Released" &&
        item.assistanceType === input.assistanceType &&
        (item.residentId === input.residentId || (!!input.householdId && item.householdId === input.householdId)),
    )
    .sort((a, b) => b.assistanceDate.localeCompare(a.assistanceDate))
    .find((item) => {
      const previousAt = new Date(`${item.assistanceDate}T12:00:00.000Z`).getTime();
      const elapsedDays = Math.floor((requestedAt - previousAt) / 86_400_000);
      return elapsedDays >= 0 && elapsedDays < coolingDays;
    });
  if (duplicateRecord) {
    return {
      eligible: false,
      duplicateRecord,
      message: `Cooling period active until ${new Date(`${duplicateRecord.coolingEndsAt}T00:00:00`).toLocaleDateString("en-PH")}. Existing release: ${duplicateRecord.referenceNumber}.`,
      coolingDays,
    };
  }
  return {
    eligible: true,
    message: `No ${input.assistanceType} duplicate found within the ${coolingDays}-day cooling period.`,
    coolingDays,
  };
}

export const useAssistanceStore = create<AssistanceState>((set, get) => ({
  records: createAssistanceDummyData(residents, households),
  checkEligibility: (input) => eligibilityFor(get().records, input),
  addAssistance: (input) => {
    const eligibility = eligibilityFor(get().records, input);
    if (!eligibility.eligible) return { eligibility };
    const sequence = get().records.length + 1;
    const now = new Date().toISOString();
    const coolingEndsAt = new Date(`${input.assistanceDate}T12:00:00.000Z`);
    coolingEndsAt.setUTCDate(coolingEndsAt.getUTCDate() + eligibility.coolingDays);
    const record: AssistanceRecord = {
      id: `assistance-session-${sequence}`,
      referenceNumber: `AST-26-${String(sequence).padStart(6, "0")}`,
      ...input,
      releasingOfficer: "",
      status: "Pending Review",
      releasedAt: "",
      disbursementReference: "",
      paymentMode: "",
      officialReceiptNumber: "",
      liquidationStatus: "",
      liquidatedAmount: 0,
      liquidationDate: "",
      liquidationDocuments: [],
      coolingEndsAt: coolingEndsAt.toISOString().slice(0, 10),
      duplicateFlag: false,
      matchedRecordId: "",
      alertResolution: "Pending",
      holdReason: "",
      reviewedAt: "",
      reviewedBy: "",
      reviewNote: "",
      createdAt: now,
    };
    set((state) => ({ records: [record, ...state.records] }));
    return { record, eligibility };
  },
  releaseAssistance: (id) =>
    set((state) => ({
      records: state.records.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "Released",
              releasedAt: new Date().toISOString(),
              releasingOfficer: "Assistance Desk Officer",
              disbursementReference: `DV-26-${item.referenceNumber.slice(-6)}`,
              paymentMode: "Cash",
              officialReceiptNumber: `OR-${item.referenceNumber.slice(-6)}`,
              liquidationStatus: "Unliquidated",
            }
          : item,
      ),
    })),
  reviewDuplicate: (id, outcome, note) =>
    set((state) => ({
      records: state.records.map((item) =>
        item.id === id
          ? {
              ...item,
              status: outcome === "Cleared" ? "Pending Review" : "Held",
              duplicateFlag: false,
              alertResolution: outcome,
              reviewedAt: new Date().toISOString(),
              reviewedBy: "Municipal Assistance Reviewer",
              reviewNote: note.trim() || (outcome === "Cleared" ? "No duplicate confirmed." : "Duplicate confirmed."),
            }
          : item,
      ),
    })),
  markLiquidated: (id) =>
    set((state) => ({
      records: state.records.map((item) =>
        item.id === id
          ? {
              ...item,
              liquidationStatus: "Liquidated",
              liquidatedAmount: item.amount,
              liquidationDate: new Date().toISOString().slice(0, 10),
              liquidationDocuments: ["Disbursement voucher", "Acknowledgement receipt", "Liquidation report"],
            }
          : item,
      ),
    })),
}));
