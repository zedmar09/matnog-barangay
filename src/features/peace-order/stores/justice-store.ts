"use client";

import { create } from "zustand";

import { createResidentDummyData } from "@/features/resident-registry/data/resident-dummy-data";

import { createBlotterDummyData } from "../data/blotter-dummy-data";
import { createJusticeDummyData } from "../data/justice-dummy-data";
import type { JusticeCase, JusticeCaseInput, JusticeStage, SummonsStatus } from "../types/justice";

type JusticeState = {
  cases: JusticeCase[];
  createCase: (input: JusticeCaseInput) => JusticeCase;
  advanceStage: (id: string, stage: JusticeStage, note: string) => void;
  scheduleHearing: (id: string, scheduledAt: string, venue: string) => void;
  updateSummons: (
    caseId: string,
    hearingId: string,
    party: "complainant" | "respondent",
    status: SummonsStatus,
  ) => void;
  recordOutcome: (id: string, outcome: "Settled" | "Failed", note: string) => void;
  issueCfa: (id: string) => void;
};

const seed = createJusticeDummyData(createBlotterDummyData(createResidentDummyData(1200)));
const audit = (action: string, note: string) => ({
  id: `justice-audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  action,
  actor: "Barangay Justice Desk Officer",
  note,
  occurredAt: new Date().toISOString(),
});

export const useJusticeStore = create<JusticeState>((set, get) => ({
  cases: seed,
  createCase: (input) => {
    const sequence = get().cases.length + 1;
    const now = new Date().toISOString();
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 15);
    const value: JusticeCase = {
      ...input,
      id: `justice-session-${sequence}`,
      caseNumber: `KP-${input.barangayId.toUpperCase()}-${new Date().getFullYear()}-${String(sequence).padStart(4, "0")}`,
      filedAt: now,
      stage: "For Summons",
      statutoryDeadline: deadline.toISOString(),
      pangkatMembers: [],
      hearings: [],
      outcome: "",
      settlementTerms: "",
      repudiationDeadline: "",
      cfaNumber: "",
      cfaIssuedAt: "",
      auditTrail: [audit("KP complaint filed", `Created from ${input.sourceBlotterNumber}.`)],
    };
    set((state) => ({ cases: [value, ...state.cases] }));
    return value;
  },
  advanceStage: (id, stage, note) =>
    set((state) => ({
      cases: state.cases.map((item) =>
        item.id === id
          ? { ...item, stage, auditTrail: [...item.auditTrail, audit(stage, note || "Case stage updated.")] }
          : item,
      ),
    })),
  scheduleHearing: (id, scheduledAt, venue) =>
    set((state) => ({
      cases: state.cases.map((item) => {
        if (item.id !== id) return item;
        const type = item.hearings.length === 0 ? "Lupon Conciliation" : "Pangkat Hearing";
        return {
          ...item,
          stage: type,
          hearings: [
            ...item.hearings,
            {
              id: `hearing-session-${Date.now()}`,
              type,
              scheduledAt,
              venue,
              status: "Scheduled",
              complainantSummons: "Pending",
              respondentSummons: "Pending",
              notes: "Hearing scheduled; summons pending service.",
            },
          ],
          auditTrail: [...item.auditTrail, audit("Hearing scheduled", `${type} set at ${venue}.`)],
        };
      }),
    })),
  updateSummons: (caseId, hearingId, party, summonsStatus) =>
    set((state) => ({
      cases: state.cases.map((item) =>
        item.id !== caseId
          ? item
          : {
              ...item,
              hearings: item.hearings.map((hearing) =>
                hearing.id !== hearingId
                  ? hearing
                  : {
                      ...hearing,
                      [party === "complainant" ? "complainantSummons" : "respondentSummons"]: summonsStatus,
                    },
              ),
              auditTrail: [...item.auditTrail, audit("Summons updated", `${party} summons marked ${summonsStatus}.`)],
            },
      ),
    })),
  recordOutcome: (id, outcome, note) =>
    set((state) => ({
      cases: state.cases.map((item) => {
        if (item.id !== id) return item;
        const repudiation = new Date();
        repudiation.setDate(repudiation.getDate() + 10);
        return {
          ...item,
          outcome,
          settlementTerms: outcome === "Settled" ? note : "",
          stage: outcome === "Settled" ? "Repudiation Period" : "For CFA",
          repudiationDeadline: outcome === "Settled" ? repudiation.toISOString() : "",
          auditTrail: [...item.auditTrail, audit(`${outcome} outcome recorded`, note)],
        };
      }),
    })),
  issueCfa: (id) =>
    set((state) => ({
      cases: state.cases.map((item, index) =>
        item.id !== id
          ? item
          : {
              ...item,
              stage: "CFA Issued",
              cfaNumber: `CFA-${item.barangayId.toUpperCase()}-${new Date().getFullYear()}-${String(index + 1).padStart(4, "0")}`,
              cfaIssuedAt: new Date().toISOString(),
              auditTrail: [
                ...item.auditTrail,
                audit("CFA issued", "Certificate to File Action generated and recorded."),
              ],
            },
      ),
    })),
}));
