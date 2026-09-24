"use client";

import { create } from "zustand";

import { createResidentDummyData } from "@/features/resident-registry/data/resident-dummy-data";

import { createHouseholdDummyData } from "../data/household-dummy-data";
import type { Household, HouseholdInput, HouseholdStructure, HouseholdStructureInput } from "../types/household";

type HouseholdRegistryState = {
  households: Household[];
  structures: HouseholdStructure[];
  addHousehold: (input: HouseholdInput) => Household;
  updateHousehold: (id: string, input: HouseholdInput) => Household | undefined;
  addStructure: (input: HouseholdStructureInput) => HouseholdStructure;
  updateStructure: (id: string, input: HouseholdStructureInput) => HouseholdStructure | undefined;
  verifyHousehold: (id: string) => Household | undefined;
};

const initialData = createHouseholdDummyData(createResidentDummyData(1200));

export const useHouseholdRegistryStore = create<HouseholdRegistryState>((set, get) => ({
  ...initialData,
  addHousehold: (input) => {
    const sequence = get().households.length + 1;
    const now = new Date().toISOString();
    const household: Household = {
      id: `household-session-${sequence}`,
      householdNumber: `HH-${input.barangayId.toUpperCase()}-${String(sequence).padStart(6, "0")}`,
      ...input,
      vulnerabilities: {
        hasSenior: false,
        hasPwd: false,
        hasPregnantOrLactating: false,
        hasUnderFive: false,
        hasSoloParent: false,
        hasBedriddenOrOxygenDependent: false,
        hasIndigenousPeople: false,
      },
      lastVerifiedAt: now,
      verifiedBy: "Barangay Registration Staff",
      status: "Active",
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({ households: [household, ...state.households] }));
    return household;
  },
  updateHousehold: (id, input) => {
    const current = get().households.find((item) => item.id === id);
    if (!current) return undefined;
    const updated: Household = {
      ...current,
      ...input,
      id: current.id,
      householdNumber: current.householdNumber,
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({ households: state.households.map((item) => (item.id === id ? updated : item)) }));
    return updated;
  },
  addStructure: (input) => {
    const sequence = get().structures.length + 1;
    const structure: HouseholdStructure = {
      ...input,
      id: `structure-session-${sequence}`,
      structureCode: `STR-${input.barangayId.toUpperCase()}-${String(sequence).padStart(4, "0")}`,
    };
    set((state) => ({ structures: [structure, ...state.structures] }));
    return structure;
  },
  updateStructure: (id, input) => {
    const current = get().structures.find((item) => item.id === id);
    if (!current) return undefined;
    const updated = { ...current, ...input, id: current.id, structureCode: current.structureCode };
    set((state) => ({ structures: state.structures.map((item) => (item.id === id ? updated : item)) }));
    return updated;
  },
  verifyHousehold: (id) => {
    const household = get().households.find((item) => item.id === id);
    if (!household) return undefined;
    const now = new Date().toISOString();
    const updated = { ...household, lastVerifiedAt: now, verifiedBy: "Barangay Registration Staff", updatedAt: now };
    set((state) => ({ households: state.households.map((item) => (item.id === id ? updated : item)) }));
    return updated;
  },
}));
