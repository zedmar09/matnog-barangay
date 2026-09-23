"use client";

import { create } from "zustand";

import { createResidentDummyData } from "@/features/resident-registry/data/resident-dummy-data";

import { createBcpcDummyData } from "../data/bcpc-dummy-data";
import type { BcpcCase, BcpcCaseInput, BcpcCaseStatus } from "../types/bcpc";

const audit = (action: string, reason: string) => ({
  id: `bcpc-audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  action,
  actor: "BCPC Caseworker",
  reason,
  occurredAt: new Date().toISOString(),
});
type BcpcState = {
  cases: BcpcCase[];
  createCase: (input: BcpcCaseInput) => BcpcCase;
  logAccess: (id: string, reason: string) => void;
  scheduleConference: (id: string, scheduledAt: string, venue: string) => void;
  updateStatus: (id: string, status: BcpcCaseStatus, reason: string) => void;
};

export const useBcpcStore = create<BcpcState>((set, get) => ({
  cases: createBcpcDummyData(createResidentDummyData(1200)),
  createCase: (input) => {
    const sequence = get().cases.length + 1;
    const value: BcpcCase = {
      ...input,
      id: `bcpc-session-${sequence}`,
      caseNumber: `BCPC-${input.barangayId.toUpperCase()}-${new Date().getFullYear()}-${String(sequence).padStart(4, "0")}`,
      status: "Intake",
      intakeAt: new Date().toISOString(),
      diversionPlan:
        input.classification === "Child in Conflict with the Law"
          ? "Diversion assessment pending case conference."
          : "",
      caseworker: "BCPC Caseworker",
      referrals: [],
      conferences: [],
      nextFollowUpAt: "",
      auditTrail: [audit("Confidential BCPC intake created", "Protective assessment and case management")],
    };
    set((state) => ({ cases: [value, ...state.cases] }));
    return value;
  },
  logAccess: (id, reason) =>
    set((state) => ({
      cases: state.cases.map((item) =>
        item.id === id
          ? { ...item, auditTrail: [...item.auditTrail, audit("Highest-confidentiality record viewed", reason)] }
          : item,
      ),
    })),
  scheduleConference: (id, scheduledAt, venue) =>
    set((state) => ({
      cases: state.cases.map((item) =>
        item.id !== id
          ? item
          : {
              ...item,
              status: "Assessment",
              conferences: [
                ...item.conferences,
                {
                  id: `conference-session-${Date.now()}`,
                  scheduledAt,
                  venue,
                  participants: ["Child and guardian", "BCPC caseworker", "Authorized social welfare representative"],
                  status: "Scheduled",
                  notes: "Private child-sensitive case conference scheduled.",
                },
              ],
              auditTrail: [
                ...item.auditTrail,
                audit("Case conference scheduled", `Authorized conference set at ${venue}.`),
              ],
            },
      ),
    })),
  updateStatus: (id, status, reason) =>
    set((state) => ({
      cases: state.cases.map((item) =>
        item.id === id ? { ...item, status, auditTrail: [...item.auditTrail, audit(status, reason)] } : item,
      ),
    })),
}));
