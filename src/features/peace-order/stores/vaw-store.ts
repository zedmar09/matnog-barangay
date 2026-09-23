"use client";

import { create } from "zustand";

import { createResidentDummyData } from "@/features/resident-registry/data/resident-dummy-data";

import { createVawDummyData } from "../data/vaw-dummy-data";
import type { VawCase, VawCaseInput, VawCaseStatus } from "../types/vaw";

type VawState = {
  cases: VawCase[];
  createCase: (input: VawCaseInput) => VawCase;
  logAccess: (id: string, reason: string) => void;
  issueBpo: (id: string, conditions: string) => void;
  markBpoServed: (id: string, orderId: string) => void;
  updateStatus: (id: string, status: VawCaseStatus, reason: string) => void;
};

const event = (action: string, reason: string) => ({
  id: `vaw-audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  action,
  actor: "VAW Desk Officer",
  reason,
  occurredAt: new Date().toISOString(),
});

export const useVawStore = create<VawState>((set, get) => ({
  cases: createVawDummyData(createResidentDummyData(1200)),
  createCase: (input) => {
    const sequence = get().cases.length + 1;
    const now = new Date().toISOString();
    const value: VawCase = {
      ...input,
      id: `vaw-session-${sequence}`,
      caseNumber: `VAW-${input.barangayId.toUpperCase()}-${new Date().getFullYear()}-${String(sequence).padStart(4, "0")}`,
      status: "Intake Review",
      caseworker: "VAW Desk Officer",
      referrals: [],
      protectionOrders: [],
      lastContactAt: now,
      nextFollowUpAt: "",
      auditTrail: [event("Confidential intake created", "Direct survivor assistance")],
    };
    set((state) => ({ cases: [value, ...state.cases] }));
    return value;
  },
  logAccess: (id, reason) =>
    set((state) => ({
      cases: state.cases.map((item) =>
        item.id === id ? { ...item, auditTrail: [...item.auditTrail, event("Restricted case viewed", reason)] } : item,
      ),
    })),
  issueBpo: (id, conditions) =>
    set((state) => ({
      cases: state.cases.map((item, index) => {
        if (item.id !== id) return item;
        const now = new Date();
        const expiry = new Date(now);
        expiry.setDate(expiry.getDate() + 15);
        return {
          ...item,
          status: "BPO Active",
          protectionOrders: [
            ...item.protectionOrders,
            {
              id: `bpo-session-${Date.now()}`,
              number: `BPO-${item.barangayId.toUpperCase()}-${new Date().getFullYear()}-${String(index + 1).padStart(4, "0")}`,
              issuedAt: now.toISOString(),
              expiresAt: expiry.toISOString(),
              status: "Active",
              conditions,
              servedAt: "",
            },
          ],
          auditTrail: [
            ...item.auditTrail,
            event("Barangay Protection Order issued", "Protection requested after case assessment"),
          ],
        };
      }),
    })),
  markBpoServed: (id, orderId) =>
    set((state) => ({
      cases: state.cases.map((item) =>
        item.id !== id
          ? item
          : {
              ...item,
              protectionOrders: item.protectionOrders.map((order) =>
                order.id === orderId ? { ...order, servedAt: new Date().toISOString() } : order,
              ),
              auditTrail: [
                ...item.auditTrail,
                event("Protection order served", "Service confirmed by authorized officer"),
              ],
            },
      ),
    })),
  updateStatus: (id, status, reason) =>
    set((state) => ({
      cases: state.cases.map((item) =>
        item.id === id ? { ...item, status, auditTrail: [...item.auditTrail, event(status, reason)] } : item,
      ),
    })),
}));
