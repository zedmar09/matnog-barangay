"use client";

import { create } from "zustand";

import { createResidentDummyData } from "@/features/resident-registry/data/resident-dummy-data";

import { createBlotterDummyData } from "../data/blotter-dummy-data";
import type { BlotterInput, BlotterRecord, BlotterStatus } from "../types/blotter";

type PeaceOrderState = {
  blotterRecords: BlotterRecord[];
  createBlotter: (input: BlotterInput) => BlotterRecord;
  updateBlotterStatus: (id: string, status: BlotterStatus, note: string) => BlotterRecord | undefined;
};

export const usePeaceOrderStore = create<PeaceOrderState>((set, get) => ({
  blotterRecords: createBlotterDummyData(createResidentDummyData(1200)),
  createBlotter: (input) => {
    const sequence = get().blotterRecords.length + 1;
    const now = new Date().toISOString();
    const record: BlotterRecord = {
      ...input,
      id: `blotter-session-${sequence}`,
      caseNumber: `BLT-${input.barangayId.toUpperCase()}-${new Date().getFullYear()}-${String(sequence).padStart(5, "0")}`,
      reportedAt: now,
      status: "Filed",
      assignedOfficer: "Peace and Order Desk Officer",
      resolution: "",
      auditTrail: [
        {
          id: `blotter-audit-session-${sequence}-1`,
          action: "Incident filed",
          actor: "Peace and Order Desk Officer",
          note: "Initial complaint and party information recorded.",
          occurredAt: now,
        },
      ],
    };
    set((state) => ({ blotterRecords: [record, ...state.blotterRecords] }));
    return record;
  },
  updateBlotterStatus: (id, status, note) => {
    const current = get().blotterRecords.find((item) => item.id === id);
    if (!current || !note.trim()) return undefined;
    const now = new Date().toISOString();
    const updated: BlotterRecord = {
      ...current,
      status,
      resolution: status === "Closed" ? note.trim() : current.resolution,
      auditTrail: [
        ...current.auditTrail,
        {
          id: `blotter-audit-${Date.now()}`,
          action: status,
          actor: "Peace and Order Desk Officer",
          note: note.trim(),
          occurredAt: now,
        },
      ],
    };
    set((state) => ({ blotterRecords: state.blotterRecords.map((item) => (item.id === id ? updated : item)) }));
    return updated;
  },
}));
