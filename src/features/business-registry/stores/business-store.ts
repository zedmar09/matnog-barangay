"use client";

import { create } from "zustand";

import { createHouseholdDummyData } from "@/features/household-registry/data/household-dummy-data";
import { createResidentDummyData } from "@/features/resident-registry/data/resident-dummy-data";

import { createBusinessDummyData } from "../data/business-data";
import type { BusinessPayment, BusinessPaymentMethod, BusinessRecord, NewBusinessInput } from "../types/business";

type BusinessRegistryState = {
  businesses: BusinessRecord[];
  payments: BusinessPayment[];
  registerBusiness: (input: NewBusinessInput) => BusinessRecord;
  assessBusiness: (id: string, amount: number) => void;
  issueClearance: (id: string) => BusinessRecord | undefined;
  collectPayment: (
    id: string,
    amount: number,
    paymentMethod: BusinessPaymentMethod,
    referenceNumber: string,
  ) => BusinessPayment | undefined;
  startRenewal: (id: string) => BusinessRecord | undefined;
  syncWithBpls: (id: string) => BusinessRecord | undefined;
};

const residents = createResidentDummyData(1200);
const { structures } = createHouseholdDummyData(residents);
const initialData = createBusinessDummyData(residents, structures);

export const useBusinessRegistryStore = create<BusinessRegistryState>((set, get) => ({
  ...initialData,
  registerBusiness: (input) => {
    const sequence = get().businesses.length + 1;
    const now = new Date().toISOString();
    const business: BusinessRecord = {
      ...input,
      id: `business-session-${sequence}`,
      businessNumber: `BR-${input.barangayId.toUpperCase()}-${String(sequence).padStart(5, "0")}`,
      status: "Active",
      clearanceStatus: "Not issued",
      clearanceNumber: "",
      clearanceValidUntil: "",
      assessedFee: 0,
      amountPaid: 0,
      lastPaymentDate: "",
      registrationDate: now.slice(0, 10),
      renewalDueDate: "2027-01-20",
      bplsPermitNumber: "",
      bplsSyncStatus: "Pending",
      updatedAt: now,
    };
    set((state) => ({ businesses: [business, ...state.businesses] }));
    return business;
  },
  assessBusiness: (id, amount) => {
    const now = new Date().toISOString();
    set((state) => ({
      businesses: state.businesses.map((item) =>
        item.id === id ? { ...item, assessedFee: amount, clearanceStatus: "Pending", updatedAt: now } : item,
      ),
    }));
  },
  issueClearance: (id) => {
    const current = get().businesses.find((item) => item.id === id);
    if (
      !current ||
      current.clearanceStatus === "Valid" ||
      current.assessedFee <= 0 ||
      current.amountPaid < current.assessedFee
    )
      return undefined;
    const sequence = get().businesses.filter((item) => item.clearanceNumber).length + 1;
    const updated: BusinessRecord = {
      ...current,
      status: "Active",
      clearanceStatus: "Valid",
      clearanceNumber: `BC-${current.barangayId.toUpperCase()}-2026-${String(sequence).padStart(5, "0")}`,
      clearanceValidUntil: "2027-09-23",
      renewalDueDate: "2027-01-20",
      bplsSyncStatus: "Pending",
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({ businesses: state.businesses.map((item) => (item.id === id ? updated : item)) }));
    return updated;
  },
  collectPayment: (id, amount, paymentMethod, referenceNumber) => {
    const current = get().businesses.find((item) => item.id === id);
    if (!current || current.assessedFee <= 0) return undefined;
    const balance = Math.max(0, current.assessedFee - current.amountPaid);
    if (balance <= 0 || amount <= 0 || amount > balance) return undefined;
    const sequence = get().payments.length + 1001;
    const today = new Date().toISOString().slice(0, 10);
    const payment: BusinessPayment = {
      id: `business-payment-session-${sequence}`,
      receiptNumber: `OR-2026-${String(sequence).padStart(6, "0")}`,
      businessId: id,
      amount,
      paymentMethod,
      referenceNumber: referenceNumber.trim(),
      paymentDate: today,
      collector: "Barangay Cashier",
    };
    set((state) => ({
      payments: [payment, ...state.payments],
      businesses: state.businesses.map((item) =>
        item.id === id
          ? {
              ...item,
              amountPaid: item.amountPaid + amount,
              lastPaymentDate: today,
              clearanceStatus: "Pending",
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    }));
    return payment;
  },
  startRenewal: (id) => {
    const current = get().businesses.find((item) => item.id === id);
    if (!current || current.status === "Closed") return undefined;
    const updated: BusinessRecord = {
      ...current,
      status: "For renewal",
      clearanceStatus: "Pending",
      assessedFee: 0,
      amountPaid: 0,
      lastPaymentDate: "",
      renewalDueDate: "2027-01-20",
      bplsSyncStatus: "Pending",
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({ businesses: state.businesses.map((item) => (item.id === id ? updated : item)) }));
    return updated;
  },
  syncWithBpls: (id) => {
    const current = get().businesses.find((item) => item.id === id);
    if (!current || current.status === "Closed") return undefined;
    const numericId = Number(current.id.match(/\d+$/)?.[0] ?? get().businesses.length + 1300);
    const updated: BusinessRecord = {
      ...current,
      bplsPermitNumber: current.bplsPermitNumber || `BPLS-26-${String(numericId + 1300).padStart(6, "0")}`,
      bplsSyncStatus: "Synced",
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({ businesses: state.businesses.map((item) => (item.id === id ? updated : item)) }));
    return updated;
  },
}));
