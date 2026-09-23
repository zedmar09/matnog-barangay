"use client";

import { create } from "zustand";

import { createResidentDummyData } from "@/features/resident-registry/data/resident-dummy-data";

import { createBadacDummyData } from "../data/badac-dummy-data";
import type { BadacRecord, BadacRecordInput, BadacStatus } from "../types/badac";

const audit = (action: string, accessReason: string) => ({
  id: `badac-audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  action,
  actor: "BADAC Focal Person",
  accessReason,
  occurredAt: new Date().toISOString(),
});
type BadacState = {
  records: BadacRecord[];
  createRecord: (input: BadacRecordInput) => BadacRecord;
  logRead: (id: string, reason: string) => void;
  scheduleAction: (id: string, scheduledAt: string, venue: string) => void;
  updateStatus: (id: string, status: BadacStatus, reason: string) => void;
};

export const useBadacStore = create<BadacState>((set, get) => ({
  records: createBadacDummyData(createResidentDummyData(1200)),
  createRecord: (input) => {
    const sequence = get().records.length + 1;
    const value: BadacRecord = {
      ...input,
      id: `badac-session-${sequence}`,
      recordNumber: `BADAC-${input.barangayId.toUpperCase()}-${new Date().getFullYear()}-${String(sequence).padStart(4, "0")}`,
      status: "Restricted Intake",
      intakeAt: new Date().toISOString(),
      assignedOfficer: "BADAC Focal Person",
      agencyReferrals: [],
      actions: [],
      nextReviewAt: "",
      auditTrail: [audit("Restricted BADAC intake created", "Authorized intake and validation")],
    };
    set((state) => ({ records: [value, ...state.records] }));
    return value;
  },
  logRead: (id, reason) =>
    set((state) => ({
      records: state.records.map((item) =>
        item.id === id ? { ...item, auditTrail: [...item.auditTrail, audit("Restricted record read", reason)] } : item,
      ),
    })),
  scheduleAction: (id, scheduledAt, venue) =>
    set((state) => ({
      records: state.records.map((item) =>
        item.id !== id
          ? item
          : {
              ...item,
              status: "Validation Review",
              actions: [
                ...item.actions,
                {
                  id: `badac-action-session-${Date.now()}`,
                  type: "Validation Meeting",
                  scheduledAt,
                  venue,
                  status: "Scheduled",
                  notes: "Authorized validation review scheduled.",
                },
              ],
              auditTrail: [
                ...item.auditTrail,
                audit("Validation review scheduled", "Authorized BADAC case management"),
              ],
            },
      ),
    })),
  updateStatus: (id, status, reason) =>
    set((state) => ({
      records: state.records.map((item) =>
        item.id === id ? { ...item, status, auditTrail: [...item.auditTrail, audit(status, reason)] } : item,
      ),
    })),
}));
